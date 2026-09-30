-- Phase E5: human-approved WhatsApp AI draft -> governed send execution.
--
-- NO Graph API call happens inside Postgres. This migration only adds the
-- atomic claim/outcome bookkeeping needed so the TypeScript executor
-- (features/platform/integrations/whatsapp/whatsapp-send-execution.service.ts)
-- can never send the same approved draft twice, and so a real send outcome
-- is recorded honestly (never fabricated).
--
-- WHY A NEW whatsapp_ai_send_executions TABLE (not overloading approval_requests
-- or delivery_state with a full state machine):
-- Phase D1's approval_requests is immutable DECISION history (pending ->
-- approved/rejected once) -- reusing it to also track claim/attempt/failure
-- bookkeeping for the SEND itself would conflate two different lifecycles
-- and force approval_requests' status enum to grow send-specific values it
-- has no business representing. ai_workforce_messages.delivery_state stays
-- exactly as Part 7 asks: additive, minimal, honest -- it gains exactly one
-- new value ('sent'), set only after a real provider success is recorded,
-- never 'send_in_progress'/'send_failed' (that in-flight bookkeeping lives
-- here instead, where attempt_count/claimed_at/failed_at/failure_code
-- naturally belong).
--
-- WHY INSERT ... ON CONFLICT DO NOTHING (not an advisory lock) FOR THE CLAIM:
-- Every prior phase's find-or-create used pg_advisory_xact_lock because the
-- goal was "reuse the same row across many calls." Here the goal is the
-- opposite: "exactly one of two concurrent callers may proceed to call
-- Meta." A unique constraint on (organization_id, workspace_id,
-- draft_message_id) plus INSERT ... ON CONFLICT DO NOTHING is the more
-- precise, provably atomic Postgres primitive for a compare-and-set claim --
-- Postgres itself guarantees only one of two concurrent inserts can win, no
-- advisory lock required. A losing caller falls through to a conditional
-- UPDATE that only succeeds against a previously FAILED row (safe retry);
-- against a 'claimed' or 'sent' row it matches nothing and the function
-- raises ALREADY_CLAIMED_OR_SENT.
--
-- WHY THIS IS NOT EXACTLY-ONCE (disclosed, not hidden): if the Meta API
-- accepts the send but this process crashes before mark_whatsapp_send_succeeded
-- runs, the execution row is left permanently in 'claimed' with no automatic
-- resolution -- Meta was told to deliver a message this system can no longer
-- prove happened. This migration does not attempt to solve that (it would
-- require a reconciliation job polling Meta by provider_message_id, which
-- Phase E5 does not build). See the Phase E5 report's
-- EXACTLY-ONCE GUARANTEED section for the full analysis and disclosed risk.

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

alter table public.ai_workforce_messages
  drop constraint if exists ai_workforce_messages_delivery_state_check;
alter table public.ai_workforce_messages
  add constraint ai_workforce_messages_delivery_state_check check (delivery_state in ('not_applicable', 'draft', 'sent'));

create table public.whatsapp_ai_send_executions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  workspace_id uuid not null references public.workspaces(id),
  draft_message_id uuid not null,
  approval_id uuid not null references public.approval_requests(id),
  status text not null default 'claimed' check (status in ('claimed', 'sent', 'failed')),
  attempt_count integer not null default 1 check (attempt_count >= 1),
  provider_message_id text null,
  claimed_at timestamptz not null default now(),
  sent_at timestamptz null,
  failed_at timestamptz null,
  failure_code text null,
  claimed_by uuid not null references auth.users(id),
  unique (organization_id, workspace_id, draft_message_id)
);

create index whatsapp_ai_send_executions_tenant_idx
  on public.whatsapp_ai_send_executions (organization_id, workspace_id, status);

alter table public.whatsapp_ai_send_executions enable row level security;

create policy "whatsapp_ai_send_executions_workspace_read" on public.whatsapp_ai_send_executions
  for select to authenticated
  using (public.is_organization_member(organization_id) and public.current_workspace_role(workspace_id) is not null);

-- ============================================================================
-- claim_whatsapp_draft_send: the sole atomic gate before any Graph API call
-- may be attempted. Human-triggered (to authenticated, not service_role) --
-- unlike E1-E4's webhook-triggered functions, the caller here is an
-- interactive, authenticated "Send Approved Reply" action, so auth.uid() is
-- available and is the correct authorization boundary, exactly like
-- decide_approval(). Re-derives and re-verifies the FULL eligibility chain
-- itself (never trusts an earlier check performed in a separate round trip):
-- draft belongs to this org/workspace, its conversation is channel='whatsapp',
-- a matching approval exists with source_type/action_type/source_id
-- pointing at exactly this draft and status='approved', and the draft has
-- not already been marked sent.
-- ============================================================================
create or replace function public.claim_whatsapp_draft_send(
  p_workspace_id uuid,
  p_draft_message_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
  v_approval_id uuid;
  v_execution_id uuid;
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;

  select organization_id into v_org from workspaces where id = p_workspace_id;
  if v_org is null then
    raise exception 'TENANT_RESOLUTION_ERROR: unknown workspace';
  end if;

  if not public.is_organization_member(v_org) then
    raise exception 'insufficient messaging permission';
  end if;

  if not public.can_manage_approvals(p_workspace_id) then
    raise exception 'insufficient approval permission';
  end if;

  select a.id into v_approval_id
    from approval_requests a
    join ai_workforce_messages m on m.id = a.source_id
    join ai_workforce_conversations c on c.id = m.conversation_id
   where a.organization_id = v_org
     and a.workspace_id = p_workspace_id
     and a.source_type = 'whatsapp_ai_draft'
     and a.action_type = 'whatsapp.message.send'
     and a.source_id = p_draft_message_id
     and a.status = 'approved'
     and m.role = 'assistant'
     and m.delivery_state = 'draft'
     and c.channel = 'whatsapp';

  if v_approval_id is null then
    raise exception 'NOT_ELIGIBLE: draft is not an approved, unsent WhatsApp AI draft in this workspace';
  end if;

  insert into whatsapp_ai_send_executions (organization_id, workspace_id, draft_message_id, approval_id, status, attempt_count, claimed_by)
  values (v_org, p_workspace_id, p_draft_message_id, v_approval_id, 'claimed', 1, v_user)
  on conflict (organization_id, workspace_id, draft_message_id) do nothing
  returning id into v_execution_id;

  if v_execution_id is not null then
    return v_execution_id;
  end if;

  -- An execution row already exists. Only a previously FAILED attempt may
  -- be safely retried; a 'claimed' (another send in flight) or 'sent'
  -- (already delivered) row matches nothing here and falls through.
  update whatsapp_ai_send_executions
     set status = 'claimed', attempt_count = attempt_count + 1, claimed_at = now(), claimed_by = v_user
   where organization_id = v_org and workspace_id = p_workspace_id and draft_message_id = p_draft_message_id and status = 'failed'
  returning id into v_execution_id;

  if v_execution_id is null then
    raise exception 'ALREADY_CLAIMED_OR_SENT: a send for this draft is already in progress or has already completed';
  end if;

  return v_execution_id;
end;
$$;

revoke all on function public.claim_whatsapp_draft_send(uuid, uuid) from public;
grant execute on function public.claim_whatsapp_draft_send(uuid, uuid) to authenticated;

-- ============================================================================
-- mark_whatsapp_send_succeeded: called only after a real Meta API success.
-- Persists the actual outbound communications/whatsapp_messages rows (so the
-- customer-visible conversation shows the real sent message, not a second
-- copy of the draft), marks the draft delivery_state='sent', and closes the
-- execution as 'sent'. Rejects if the execution is not currently 'claimed'
-- (defense against being called twice for one execution).
-- ============================================================================
create or replace function public.mark_whatsapp_send_succeeded(
  p_workspace_id uuid,
  p_execution_id uuid,
  p_provider_message_id text,
  p_recipient text,
  p_message_text text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
  v_execution whatsapp_ai_send_executions%rowtype;
  v_thread uuid;
  v_connection_id uuid;
  v_sender text;
  v_comm uuid;
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;

  select organization_id into v_org from workspaces where id = p_workspace_id;
  if v_org is null then
    raise exception 'TENANT_RESOLUTION_ERROR: unknown workspace';
  end if;

  if not public.is_organization_member(v_org) then
    raise exception 'insufficient messaging permission';
  end if;

  select * into v_execution
    from whatsapp_ai_send_executions
   where id = p_execution_id and organization_id = v_org and workspace_id = p_workspace_id
   for update;

  if not found or v_execution.status <> 'claimed' then
    raise exception 'INVALID_EXECUTION_STATE: execution is not in a claimed state';
  end if;

  select c.communication_thread_id into v_thread
    from ai_workforce_messages m
    join ai_workforce_conversations c on c.id = m.conversation_id
   where m.id = v_execution.draft_message_id;

  select id, phone_number_id into v_connection_id, v_sender
    from whatsapp_connections
   where workspace_id = p_workspace_id and status = 'connected' and deleted_at is null
   limit 1;

  if v_connection_id is null then
    raise exception 'CONNECTION_UNAVAILABLE: no connected WhatsApp connection for this workspace';
  end if;

  insert into communications (organization_id, workspace_id, thread_id, channel, direction, status, body, external_id, occurred_at)
  values (v_org, p_workspace_id, v_thread, 'whatsapp', 'outbound', 'sent', p_message_text, p_provider_message_id, now())
  returning id into v_comm;

  insert into whatsapp_messages (organization_id, workspace_id, connection_id, provider_message_id, communication_id, direction, sender, recipient, message_type, text_body, status, provider_timestamp)
  values (v_org, p_workspace_id, v_connection_id, p_provider_message_id, v_comm, 'outbound', v_sender, p_recipient, 'text', p_message_text, 'sent', now());

  update ai_workforce_messages set delivery_state = 'sent' where id = v_execution.draft_message_id;

  update whatsapp_ai_send_executions
     set status = 'sent', sent_at = now(), provider_message_id = p_provider_message_id
   where id = p_execution_id;

  update communication_threads set last_activity_at = now(), updated_at = now(), version = version + 1 where id = v_thread;
end;
$$;

revoke all on function public.mark_whatsapp_send_succeeded(uuid, uuid, text, text, text) from public;
grant execute on function public.mark_whatsapp_send_succeeded(uuid, uuid, text, text, text) to authenticated;

-- ============================================================================
-- mark_whatsapp_send_failed: called after a real Meta API failure (or a
-- classified provider/network error). Never marks anything sent; only
-- records a safe, non-secret failure_code and reopens the execution for a
-- future deliberate retry via claim_whatsapp_draft_send's 'failed' branch.
-- ============================================================================
create or replace function public.mark_whatsapp_send_failed(
  p_workspace_id uuid,
  p_execution_id uuid,
  p_failure_code text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;

  select organization_id into v_org from workspaces where id = p_workspace_id;
  if v_org is null then
    raise exception 'TENANT_RESOLUTION_ERROR: unknown workspace';
  end if;

  if not public.is_organization_member(v_org) then
    raise exception 'insufficient messaging permission';
  end if;

  update whatsapp_ai_send_executions
     set status = 'failed', failed_at = now(), failure_code = left(coalesce(p_failure_code, 'unknown_error'), 100)
   where id = p_execution_id and organization_id = v_org and workspace_id = p_workspace_id and status = 'claimed';

  if not found then
    raise exception 'INVALID_EXECUTION_STATE: execution is not in a claimed state';
  end if;
end;
$$;

revoke all on function public.mark_whatsapp_send_failed(uuid, uuid, text) from public;
grant execute on function public.mark_whatsapp_send_failed(uuid, uuid, text) to authenticated;

commit;
