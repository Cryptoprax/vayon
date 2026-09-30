-- Phase E4: WhatsApp AI draft -> human approval, reusing Phase D1's generic
-- approval engine as-is. NO Graph API send exists anywhere in this phase.
--
-- WHY approval_requests/approval_events (not a new whatsapp_approvals table):
-- 20261102000000_business_approval_workflows.sql's own domain-model comment
-- already anticipates this: "source_type/source_id/action_type/payload are
-- deliberately generic ... so a future producer -- an AI employee, ...
-- WhatsApp AI ... -- can create an approval request without a schema
-- change." This migration takes that at face value: it adds ONE new
-- SECURITY DEFINER function (request_whatsapp_draft_approval) and ONE
-- partial unique index. request_approval()/decide_approval()/cancel_approval()
-- /can_manage_approvals() are not modified in any way.
--
-- WHY A NEW FUNCTION INSTEAD OF CALLING request_approval() DIRECTLY:
-- request_approval() requires auth.uid() (`to authenticated` only) because a
-- human, interactively, requests it. The WhatsApp orchestrator that creates
-- this approval runs from a verified webhook with no browser session --
-- exactly the same authentication gap Phase E1/E2/E3 already solved for
-- resolve_whatsapp_lead_identity()/resolve_whatsapp_ai_conversation()/
-- append_trusted_ai_message(). request_whatsapp_draft_approval() is the same
-- pattern applied here: service_role-only, derives organization_id and the
-- requested_by actor server-side from workspace_id, and performs the exact
-- same two inserts (approval_requests + approval_events 'approval.requested'
-- + activity_events) that request_approval() itself performs, so the
-- resulting row is indistinguishable in shape from a human-requested one --
-- only requested_by (the workspace's own system actor) differs.
--
-- decide_approval() itself is NOT modified and IS reused directly by E4's
-- new (human, interactive, authenticated) approve/reject actions -- see the
-- Phase E4 report for why that is safe without an entitlement change.
--
-- IDEMPOTENCY (Part 4): an advisory-transaction-lock (same tool as every
-- prior phase's find-or-create) plus a partial unique index on
-- (organization_id, workspace_id, source_id) where source_type =
-- 'whatsapp_ai_draft' guarantee at most one approval ever exists per AI
-- draft, closing the race a bare SELECT-then-INSERT would leave open. This
-- index is scoped to source_type = 'whatsapp_ai_draft' only -- it cannot
-- constrain or interact with any other approval producer's source_id values,
-- so the general Business+ approval workflows are entirely unaffected.

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create unique index if not exists approval_requests_whatsapp_draft_unique_idx
  on public.approval_requests (organization_id, workspace_id, source_id)
  where source_type = 'whatsapp_ai_draft' and action_type = 'whatsapp.message.send';

-- ============================================================================
-- request_whatsapp_draft_approval: trusted, service-role-only find-or-create.
-- Verifies the draft message actually belongs to the resolved tenant, to the
-- given conversation, to a channel='whatsapp' conversation, and to the given
-- communication thread and lead -- before ever writing an approval row, so a
-- caller cannot request approval for a draft it does not actually own.
-- ============================================================================
create or replace function public.request_whatsapp_draft_approval(
  p_workspace_id uuid,
  p_draft_message_id uuid,
  p_conversation_id uuid,
  p_communication_thread_id uuid,
  p_lead_id uuid,
  p_preview_text text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_actor uuid;
  v_approval_id uuid;
  v_preview text;
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  select organization_id into v_org from workspaces where id = p_workspace_id;
  if v_org is null then
    raise exception 'TENANT_RESOLUTION_ERROR: unknown workspace';
  end if;

  if p_draft_message_id is null or p_conversation_id is null or p_communication_thread_id is null then
    raise exception 'INVALID_DRAFT: draft_message_id, conversation_id, and communication_thread_id are all required';
  end if;

  if not exists (
    select 1
      from ai_workforce_messages m
      join ai_workforce_conversations c on c.id = m.conversation_id
     where m.id = p_draft_message_id
       and m.organization_id = v_org
       and m.workspace_id = p_workspace_id
       and m.role = 'assistant'
       and m.conversation_id = p_conversation_id
       and c.channel = 'whatsapp'
       and c.communication_thread_id = p_communication_thread_id
       and c.lead_id is not distinct from p_lead_id
  ) then
    raise exception 'TENANT_RESOLUTION_ERROR: draft does not belong to this workspace/conversation/thread/lead';
  end if;

  perform pg_advisory_xact_lock(hashtext('whatsapp_draft_approval:' || v_org::text || ':' || p_workspace_id::text || ':' || p_draft_message_id::text));

  select id into v_approval_id
    from approval_requests
   where organization_id = v_org
     and workspace_id = p_workspace_id
     and source_type = 'whatsapp_ai_draft'
     and source_id = p_draft_message_id
     and action_type = 'whatsapp.message.send'
   limit 1;

  if v_approval_id is not null then
    return v_approval_id;
  end if;

  select created_by into v_actor from workspaces where id = p_workspace_id;
  v_preview := left(coalesce(p_preview_text, ''), 300);

  insert into approval_requests (organization_id, workspace_id, source_type, source_id, action_type, payload, requested_by)
  values (
    v_org, p_workspace_id, 'whatsapp_ai_draft', p_draft_message_id, 'whatsapp.message.send',
    jsonb_build_object(
      'leadId', p_lead_id,
      'communicationThreadId', p_communication_thread_id,
      'conversationId', p_conversation_id,
      'draftMessageId', p_draft_message_id,
      'previewText', v_preview,
      'channel', 'whatsapp',
      'employeeCode', 'whatsapp-ai'
    ),
    v_actor
  )
  returning id into v_approval_id;

  insert into approval_events (organization_id, workspace_id, approval_id, event, actor_id, metadata)
  values (v_org, p_workspace_id, v_approval_id, 'approval.requested', v_actor, jsonb_build_object('sourceType', 'whatsapp_ai_draft', 'actionType', 'whatsapp.message.send'));

  insert into activity_events (organization_id, workspace_id, event_type, title, actor_id, related_type, related_id)
  values (v_org, p_workspace_id, 'approval.requested', 'Approval requested: whatsapp.message.send', v_actor, 'approval', v_approval_id);

  return v_approval_id;
exception
  when unique_violation then
    select id into v_approval_id
      from approval_requests
     where organization_id = v_org
       and workspace_id = p_workspace_id
       and source_type = 'whatsapp_ai_draft'
       and source_id = p_draft_message_id
       and action_type = 'whatsapp.message.send'
     limit 1;
    return v_approval_id;
end;
$$;

revoke all on function public.request_whatsapp_draft_approval(uuid, uuid, uuid, uuid, uuid, text) from public;
grant execute on function public.request_whatsapp_draft_approval(uuid, uuid, uuid, uuid, uuid, text) to service_role;

commit;
