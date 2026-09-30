-- Phase M7: governed first-contact WhatsApp outreach for a consent-eligible
-- Meta lead. HUMAN-INITIATED ONLY. No Graph API call happens inside
-- Postgres -- this migration only adds the atomic claim/outcome bookkeeping
-- the TypeScript executor (whatsapp-outreach-execution.service.ts) needs so
-- the same outreach attempt can never send twice, and a real send outcome
-- is recorded honestly (never fabricated), directly mirroring Phase E5/E6's
-- whatsapp_ai_send_executions/flag_stale_whatsapp_send_executions.
--
-- WHY A NEW TABLE, NOT whatsapp_ai_send_executions: that table's
-- draft_message_id is NOT NULL with no default, and every one of its RPCs
-- hard-joins through ai_workforce_messages/ai_workforce_conversations to
-- verify an approval_requests row with source_type='whatsapp_ai_draft'. A
-- Meta-lead first-contact template send has no AI draft and no approval
-- request to hang off of at all -- force-fitting it would require making
-- draft_message_id nullable and rewriting every RPC's join, which is a far
-- bigger and riskier change than an additive, structurally parallel table.
--
-- WHY THE PRIMARY KEY IS A CALLER-SUPPLIED "INTENT" ID, NOT
-- gen_random_uuid() keyed on draft_message_id: E5 can key its uniqueness on
-- draft_message_id because the draft already exists as a stable row before
-- any send is attempted. M7 has no equivalent pre-existing entity -- the
-- closest analogue to "one approved thing, sent once" is the outreach
-- attempt itself. The server therefore generates one uuid when it renders
-- the human's review/preview screen (never the browser) and threads it
-- through as an opaque, server-controlled "outreach intent id" all the way
-- to the explicit Send action. Re-submitting that SAME id (double-click, a
-- retried form POST) collides on this table's own primary key and is
-- naturally idempotent; a fresh "Prepare Outreach" click always gets a new
-- id, so a later, genuinely new outreach to the same lead is never
-- permanently blocked.
--
-- WHY AN ADDITIONAL "no other CLAIMED row for this lead" GUARD: a
-- caller-supplied intent id alone only protects against re-submitting the
-- IDENTICAL request (e.g. a double form submit). Two different browser
-- tabs each generating their OWN fresh intent id for the SAME lead is a
-- different race that id-based idempotency cannot catch. claim_whatsapp_
-- outreach_execution additionally refuses to claim while any OTHER
-- execution for the same lead_id is still 'claimed' (an outreach is
-- actively in flight this very moment) -- 'claimed' resolves to
-- sent/failed/uncertain quickly, so this never blocks a legitimate LATER
-- outreach to the same lead, only a genuinely concurrent duplicate attempt.
--
-- WHY THIS IS NOT EXACTLY-ONCE (disclosed, not hidden, identical to E5's
-- own disclosed limitation): if Meta accepts the template send but this
-- process crashes before mark_whatsapp_outreach_sent runs, the execution
-- row is left permanently 'claimed' with no automatic resolution --
-- flag_stale_whatsapp_outreach_executions (mirroring E6) reclassifies it as
-- 'uncertain' after a caller-supplied staleness threshold, which
-- claim_whatsapp_outreach_execution's own retry branch (only matches
-- status='failed') already refuses to auto-retry -- blind resend of an
-- unknown outcome is never possible.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create table public.whatsapp_outreach_executions (
  id uuid primary key,
  organization_id uuid not null references public.organizations(id),
  workspace_id uuid not null references public.workspaces(id),
  lead_id uuid not null references public.leads(id),
  consent_id uuid not null references public.communication_consents(id),
  connection_id uuid not null references public.whatsapp_connections(id),

  template_name text not null,
  template_language text not null,

  status text not null default 'claimed' check (status in ('claimed', 'sent', 'failed', 'uncertain')),
  attempt_count integer not null default 1 check (attempt_count >= 1),
  provider_message_id text null,

  claimed_at timestamptz not null default now(),
  sent_at timestamptz null,
  failed_at timestamptz null,
  failure_code text null check (failure_code is null or failure_code in (
    'consent_changed', 'phone_unavailable', 'connection_unavailable', 'template_unavailable', 'template_rejected',
    'authentication_failed', 'rate_limited', 'provider_unavailable', 'timeout', 'network_error', 'bad_request',
    'missing_provider_message_id', 'unknown_error'
  )),

  claimed_by uuid not null references auth.users(id)
);

create index whatsapp_outreach_executions_tenant_idx
  on public.whatsapp_outreach_executions (organization_id, workspace_id, status);
create index whatsapp_outreach_executions_lead_idx
  on public.whatsapp_outreach_executions (lead_id, status);

alter table public.whatsapp_outreach_executions enable row level security;

create policy "whatsapp_outreach_executions_workspace_read" on public.whatsapp_outreach_executions
  for select to authenticated
  using (public.is_organization_member(organization_id) and public.current_workspace_role(workspace_id) is not null);

-- ============================================================================
-- claim_whatsapp_outreach_execution: the sole atomic gate before any Graph
-- API call may be attempted. Human-triggered (to authenticated, not
-- service_role), mirroring claim_whatsapp_draft_send exactly. Re-derives and
-- re-verifies lead/consent/connection tenancy and validity itself, inside
-- this one transaction -- never trusts an earlier round trip's eligibility
-- check (that check, resolveWhatsAppOutreachEligibility, is still run
-- first in TypeScript for a fast, user-friendly failure -- this RPC is the
-- actual security boundary, exactly as Part 12 requires).
-- ============================================================================
create or replace function public.claim_whatsapp_outreach_execution(
  p_workspace_id uuid,
  p_execution_id uuid,
  p_lead_id uuid,
  p_consent_id uuid,
  p_connection_id uuid,
  p_template_name text,
  p_template_language text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
  v_result_id uuid;
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

  if not exists (
    select 1 from leads
     where id = p_lead_id and organization_id = v_org and workspace_id = p_workspace_id and deleted_at is null
  ) then
    raise exception 'NOT_ELIGIBLE: lead does not belong to this workspace';
  end if;

  if not exists (
    select 1 from communication_consents
     where id = p_consent_id and organization_id = v_org and workspace_id = p_workspace_id
       and lead_id = p_lead_id and channel = 'whatsapp' and purpose = 'marketing' and status = 'granted'
  ) then
    raise exception 'NOT_ELIGIBLE: consent is not a valid granted WhatsApp marketing consent for this lead';
  end if;

  if not exists (
    select 1 from whatsapp_connections
     where id = p_connection_id and organization_id = v_org and workspace_id = p_workspace_id
       and status = 'connected' and deleted_at is null
  ) then
    raise exception 'NOT_ELIGIBLE: WhatsApp connection is not active for this workspace';
  end if;

  if exists (select 1 from whatsapp_outreach_executions where lead_id = p_lead_id and status = 'claimed') then
    raise exception 'OUTREACH_IN_PROGRESS: another outreach attempt for this lead is already in flight';
  end if;

  insert into whatsapp_outreach_executions (
    id, organization_id, workspace_id, lead_id, consent_id, connection_id,
    template_name, template_language, status, attempt_count, claimed_by
  ) values (
    p_execution_id, v_org, p_workspace_id, p_lead_id, p_consent_id, p_connection_id,
    p_template_name, p_template_language, 'claimed', 1, v_user
  )
  on conflict (id) do nothing
  returning id into v_result_id;

  if v_result_id is not null then
    return v_result_id;
  end if;

  -- Same intent id already exists. Only a previously FAILED attempt may be
  -- safely retried; a 'claimed'/'sent'/'uncertain' row matches nothing here.
  update whatsapp_outreach_executions
     set status = 'claimed', attempt_count = attempt_count + 1, claimed_at = now(), claimed_by = v_user
   where id = p_execution_id and status = 'failed'
  returning id into v_result_id;

  if v_result_id is null then
    raise exception 'ALREADY_CLAIMED_OR_SENT: this outreach attempt is already in progress or has already completed';
  end if;

  return v_result_id;
end;
$$;

revoke all on function public.claim_whatsapp_outreach_execution(uuid, uuid, uuid, uuid, uuid, text, text) from public;
grant execute on function public.claim_whatsapp_outreach_execution(uuid, uuid, uuid, uuid, uuid, text, text) to authenticated;

-- ============================================================================
-- mark_whatsapp_outreach_sent: called only after a real Meta API success.
-- Finds the lead's existing WhatsApp thread or creates it now (Part 18 --
-- never earlier, only at the moment of an actual confirmed send), persists
-- the real outbound communications/whatsapp_messages rows, and closes the
-- execution as 'sent'. Rejects if the execution is not currently 'claimed'.
-- ============================================================================
create or replace function public.mark_whatsapp_outreach_sent(
  p_workspace_id uuid,
  p_execution_id uuid,
  p_provider_message_id text,
  p_recipient text,
  p_rendered_text text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
  v_execution whatsapp_outreach_executions%rowtype;
  v_thread uuid;
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
    from whatsapp_outreach_executions
   where id = p_execution_id and organization_id = v_org and workspace_id = p_workspace_id
   for update;

  if not found or v_execution.status <> 'claimed' then
    raise exception 'INVALID_EXECUTION_STATE: execution is not in a claimed state';
  end if;

  select id into v_thread from communication_threads
   where organization_id = v_org and workspace_id = p_workspace_id
     and related_type = 'lead' and related_id = v_execution.lead_id and deleted_at is null
   limit 1;

  if v_thread is null then
    insert into communication_threads (organization_id, workspace_id, subject, related_type, related_id, status, created_by, updated_by)
    values (v_org, p_workspace_id, 'WhatsApp', 'lead', v_execution.lead_id, 'open', v_user, v_user)
    returning id into v_thread;
  end if;

  select phone_number_id into v_sender
    from whatsapp_connections
   where id = v_execution.connection_id and workspace_id = p_workspace_id and status = 'connected' and deleted_at is null;
  if v_sender is null then
    raise exception 'CONNECTION_UNAVAILABLE: no connected WhatsApp connection for this workspace';
  end if;

  insert into communications (organization_id, workspace_id, thread_id, channel, direction, status, body, external_id, occurred_at)
  values (v_org, p_workspace_id, v_thread, 'whatsapp', 'outbound', 'sent', p_rendered_text, p_provider_message_id, now())
  returning id into v_comm;

  insert into whatsapp_messages (organization_id, workspace_id, connection_id, provider_message_id, communication_id, direction, sender, recipient, message_type, text_body, status, provider_timestamp)
  values (v_org, p_workspace_id, v_execution.connection_id, p_provider_message_id, v_comm, 'outbound', v_sender, p_recipient, 'template', p_rendered_text, 'sent', now());

  update whatsapp_outreach_executions
     set status = 'sent', sent_at = now(), provider_message_id = p_provider_message_id
   where id = p_execution_id;

  update communication_threads set last_activity_at = now(), updated_at = now(), version = version + 1 where id = v_thread;
end;
$$;

revoke all on function public.mark_whatsapp_outreach_sent(uuid, uuid, text, text, text) from public;
grant execute on function public.mark_whatsapp_outreach_sent(uuid, uuid, text, text, text) to authenticated;

-- ============================================================================
-- mark_whatsapp_outreach_failed: never marks anything sent; only records a
-- safe, closed failure_code and reopens the execution for a future
-- deliberate retry via claim_whatsapp_outreach_execution's 'failed' branch.
-- ============================================================================
create or replace function public.mark_whatsapp_outreach_failed(
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

  update whatsapp_outreach_executions
     set status = 'failed', failed_at = now(), failure_code = left(coalesce(p_failure_code, 'unknown_error'), 100)
   where id = p_execution_id and organization_id = v_org and workspace_id = p_workspace_id and status = 'claimed';

  if not found then
    raise exception 'INVALID_EXECUTION_STATE: execution is not in a claimed state';
  end if;
end;
$$;

revoke all on function public.mark_whatsapp_outreach_failed(uuid, uuid, text) from public;
grant execute on function public.mark_whatsapp_outreach_failed(uuid, uuid, text) to authenticated;

-- ============================================================================
-- flag_stale_whatsapp_outreach_executions: mirrors flag_stale_whatsapp_
-- send_executions (E6) exactly, applied to this table. service_role-only,
-- intended for the same scheduled/cron-triggered route pattern -- no new
-- scheduler. The staleness threshold stays a caller-supplied parameter, not
-- a SQL constant (the actual duration is defined once in TypeScript).
-- ============================================================================
create or replace function public.flag_stale_whatsapp_outreach_executions(p_stale_before timestamptz)
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  for r in
    update whatsapp_outreach_executions
       set status = 'uncertain'
     where status = 'claimed' and claimed_at < p_stale_before
    returning id, organization_id, workspace_id, lead_id
  loop
    insert into activity_events (organization_id, workspace_id, event_type, title, related_type, related_id, metadata)
    values (r.organization_id, r.workspace_id, 'meta.lead.whatsapp_outreach_uncertain', 'WhatsApp outreach outcome could not be confirmed', 'lead', r.lead_id, jsonb_build_object('executionId', r.id));
    return next r.id;
  end loop;

  return;
end;
$$;

revoke all on function public.flag_stale_whatsapp_outreach_executions(timestamptz) from public;
grant execute on function public.flag_stale_whatsapp_outreach_executions(timestamptz) to service_role;

commit;
