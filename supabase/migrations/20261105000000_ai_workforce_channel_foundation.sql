-- Phase E2: channel-aware AI conversation foundation.
--
-- WHY ai_workforce_conversations / ai_workforce_messages (not a new table):
-- WorkforceRuntimeService.chat() (features/platform/openai/runtime/service.ts)
-- is the confirmed live persistence path -- its repository
-- (features/platform/openai/runtime/repository.ts) reads/writes exactly these
-- two tables. Phase E0 found ai_conversations / ai_runtime_outputs /
-- ai_response_cache to be a separate, non-live subsystem not reachable from
-- WorkforceRuntimeService.chat(). Extending the live table avoids inventing a
-- second AI chat system and keeps one AI conversation brain across channels.
--
-- This migration is additive only: every new column is nullable or has a
-- default that preserves every existing row's meaning unchanged (channel
-- defaults to 'web', exactly what every pre-existing row already is).
--
-- No RLS policy is added, changed, or weakened. The existing policies (see
-- 20260815000000_sprint49_live_ai_workforce.sql) remain the only way an
-- `authenticated` role can read or write these tables, so the interactive
-- web chat path is byte-for-byte as protected as before. The new
-- SECURITY DEFINER functions below are service_role-only (revoked from
-- public, granted only to service_role), mirroring the exact pattern already
-- used by resolve_whatsapp_lead_identity()/process_whatsapp_message() in
-- 20261104000000_whatsapp_crm_identity.sql (Phase E1) -- not a new pattern.

begin;

-- channel: free text (not a check-constrained enum), following the same
-- precedent already used by leads.source (see 20260813000000, no check
-- constraint) -- so adding a future channel (email, voice, instagram,
-- facebook_messenger) never requires a schema migration. Validity is
-- enforced in application/domain code (see trusted-context.ts), which is
-- also where the currently-supported channel list actually lives.
alter table public.ai_workforce_conversations
  add column if not exists channel text not null default 'web',
  add column if not exists lead_id uuid references public.leads(id),
  add column if not exists communication_thread_id uuid references public.communication_threads(id);

-- Deterministic reuse: the same WhatsApp business thread (or any future
-- non-web channel's thread) must resolve to the same AI conversation across
-- multiple inbound messages, never create a new one per message.
create index if not exists ai_workforce_conversation_channel_thread_idx
  on public.ai_workforce_conversations (organization_id, workspace_id, employee_code, communication_thread_id)
  where deleted_at is null and communication_thread_id is not null;

-- Supports retrieving a lead's AI conversation history from the CRM side
-- without a full table scan.
create index if not exists ai_workforce_conversation_lead_idx
  on public.ai_workforce_conversations (organization_id, workspace_id, lead_id)
  where deleted_at is null and lead_id is not null;

-- Trusted, service-role-only find-or-create for a channel-linked AI
-- conversation. organization_id and created_by are both derived server-side
-- from p_workspace_id -- never accepted as parameters -- so no caller can
-- point a conversation at another tenant or fabricate an actor. The
-- advisory-transaction-lock keyed by (org, workspace, employee, thread)
-- mirrors resolve_whatsapp_lead_identity()'s exact concurrency-safety
-- pattern (Phase E1), preventing two near-simultaneous inbound messages on a
-- brand-new thread from racing into two separate conversations.
create or replace function public.resolve_whatsapp_ai_conversation(
  p_workspace_id uuid,
  p_employee_code text,
  p_communication_thread_id uuid,
  p_lead_id uuid default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_actor uuid;
  v_conversation_id uuid;
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  select organization_id into v_org from workspaces where id = p_workspace_id;
  if v_org is null then
    raise exception 'TENANT_RESOLUTION_ERROR: unknown workspace';
  end if;

  if p_communication_thread_id is null then
    raise exception 'INVALID_THREAD: communication_thread_id is required for a trusted channel conversation';
  end if;

  if not exists (
    select 1 from communication_threads
    where id = p_communication_thread_id and organization_id = v_org and workspace_id = p_workspace_id
  ) then
    raise exception 'TENANT_RESOLUTION_ERROR: communication thread does not belong to this workspace';
  end if;

  perform pg_advisory_xact_lock(hashtext('whatsapp_ai_conv:' || v_org::text || ':' || p_workspace_id::text || ':' || p_employee_code || ':' || p_communication_thread_id::text));

  select id into v_conversation_id
  from ai_workforce_conversations
  where organization_id = v_org
    and workspace_id = p_workspace_id
    and employee_code = p_employee_code
    and communication_thread_id = p_communication_thread_id
    and deleted_at is null
  order by created_at asc
  limit 1;

  if v_conversation_id is not null then
    if p_lead_id is not null then
      update ai_workforce_conversations set lead_id = p_lead_id where id = v_conversation_id and lead_id is null;
    end if;
    return v_conversation_id;
  end if;

  select created_by into v_actor from workspaces where id = p_workspace_id;

  insert into ai_workforce_conversations (organization_id, workspace_id, employee_code, title, channel, lead_id, communication_thread_id, created_by)
  values (v_org, p_workspace_id, p_employee_code, 'WhatsApp conversation', 'whatsapp', p_lead_id, p_communication_thread_id, v_actor)
  returning id into v_conversation_id;

  return v_conversation_id;
end;
$$;

revoke all on function public.resolve_whatsapp_ai_conversation(uuid, text, uuid, uuid) from public;
grant execute on function public.resolve_whatsapp_ai_conversation(uuid, text, uuid, uuid) to service_role;

-- Trusted, service-role-only message append for the same channel-linked
-- conversations. Deliberately separate from the interactive append() path
-- (features/platform/openai/runtime/repository.ts), which requires an
-- authenticated auth.uid() and is left completely untouched -- a Meta
-- webhook has no browser session to authenticate.
create or replace function public.append_trusted_ai_message(
  p_conversation_id uuid,
  p_workspace_id uuid,
  p_role text,
  p_content text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_actor uuid;
  v_message_id uuid;
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  select organization_id into v_org from workspaces where id = p_workspace_id;
  if v_org is null then
    raise exception 'TENANT_RESOLUTION_ERROR: unknown workspace';
  end if;

  if p_role not in ('user', 'assistant') then
    raise exception 'INVALID_ROLE: role must be user or assistant';
  end if;

  if p_content is null or length(trim(p_content)) = 0 then
    raise exception 'INVALID_CONTENT: message content is required';
  end if;

  if not exists (
    select 1 from ai_workforce_conversations
    where id = p_conversation_id and organization_id = v_org and workspace_id = p_workspace_id and deleted_at is null
  ) then
    raise exception 'TENANT_RESOLUTION_ERROR: conversation does not belong to this workspace';
  end if;

  select created_by into v_actor from workspaces where id = p_workspace_id;

  insert into ai_workforce_messages (organization_id, workspace_id, conversation_id, role, content, recommendation_only, created_by)
  values (v_org, p_workspace_id, p_conversation_id, p_role, left(p_content, 100000), true, v_actor)
  returning id into v_message_id;

  update ai_workforce_conversations set updated_at = now() where id = p_conversation_id;

  return v_message_id;
end;
$$;

revoke all on function public.append_trusted_ai_message(uuid, uuid, text, text) from public;
grant execute on function public.append_trusted_ai_message(uuid, uuid, text, text) to service_role;

commit;
