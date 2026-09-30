-- Phase E3: WhatsApp inbound -> trusted AI runtime -> DRAFT response.
--
-- Additive only. Three changes:
--
-- 1) Two new nullable/defaulted columns on the existing, live
--    ai_workforce_messages table (the same table traced as authoritative in
--    20261105000000_ai_workforce_channel_foundation.sql -- no new AI table
--    is introduced):
--      delivery_state: distinguishes an AI-generated WhatsApp DRAFT from an
--      interactive web-chat message, for which "sending" has no meaning.
--      Values are deliberately limited to what THIS phase actually produces
--      -- 'not_applicable' (default; every pre-existing row, and every future
--      interactive web message, is this) and 'draft' (an assistant reply
--      generated for a channel that supports outbound send, not yet sent by
--      anything). Phase E8 (approvals -> send) is expected to extend this
--      check constraint with further values (e.g. 'approved', 'sent') when
--      that governed sending phase actually exists -- this migration does
--      not invent those states now, per "do not fake delivery state."
--      source_message_id: the originating WhatsApp provider message id
--      (whatsapp_messages.provider_message_id / p_message->>'id'), stored so
--      the orchestration below can prove idempotency independently of the
--      upstream webhook-event dedup, not merely infer it.
--
-- 2) append_trusted_ai_message (Phase E2) gains two optional trailing
--    parameters (p_source_message_id, p_delivery_state) and a dedup check:
--    appending the same (conversation, source_message_id, role) twice
--    returns the existing row instead of inserting a duplicate. The 4-arg
--    E2 signature is replaced via drop+create, the same technique E1 used
--    for process_whatsapp_message's 5-arg -> 6-arg change, for the same
--    reason (Postgres does not replace a function whose parameter list
--    changed). Every check E2 already enforced (service_role only, role in
--    ('user','assistant'), conversation tenant ownership) is unchanged.
--
-- 3) process_whatsapp_message (Phase E1) changes its RETURN TYPE from void
--    to jsonb, returning {is_new, lead_id, communication_thread_id} instead
--    of discarding them. This is the "webhook return value" change Phase E3
--    was explicitly told it may make ("If E1 code must change for webhook
--    return values: keep it minimal and explicitly report"). The function
--    body is otherwise byte-for-byte identical: same dedup guard, same
--    identity-resolution call, same thread/communication/message inserts,
--    same ordering. No normalization or CRM identity semantics change.
--    Without this, the TypeScript webhook layer has no way to know whether
--    a message was genuinely new (and only genuinely-new text messages may
--    ever reach the AI orchestrator -- see whatsapp-ai-orchestrator.service.ts).

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

alter table public.ai_workforce_messages
  add column if not exists delivery_state text not null default 'not_applicable',
  add column if not exists source_message_id text;

alter table public.ai_workforce_messages
  drop constraint if exists ai_workforce_messages_delivery_state_check;
alter table public.ai_workforce_messages
  add constraint ai_workforce_messages_delivery_state_check check (delivery_state in ('not_applicable', 'draft'));

-- Idempotency lookup: is a draft/user-copy already recorded for this
-- (conversation, provider message, role)? Partial on source_message_id not
-- null so interactive web rows (which never set it) never appear here.
create index if not exists ai_workforce_message_source_idx
  on public.ai_workforce_messages (organization_id, workspace_id, conversation_id, source_message_id, role)
  where source_message_id is not null;

-- ============================================================================
-- append_trusted_ai_message: +p_source_message_id, +p_delivery_state.
-- ============================================================================
drop function if exists public.append_trusted_ai_message(uuid, uuid, text, text);

create or replace function public.append_trusted_ai_message(
  p_conversation_id uuid,
  p_workspace_id uuid,
  p_role text,
  p_content text,
  p_source_message_id text default null,
  p_delivery_state text default 'not_applicable'
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

  if p_delivery_state not in ('not_applicable', 'draft') then
    raise exception 'INVALID_DELIVERY_STATE: unsupported delivery_state';
  end if;

  if not exists (
    select 1 from ai_workforce_conversations
    where id = p_conversation_id and organization_id = v_org and workspace_id = p_workspace_id and deleted_at is null
  ) then
    raise exception 'TENANT_RESOLUTION_ERROR: conversation does not belong to this workspace';
  end if;

  -- Idempotent append: a retried call for the same provider message and
  -- role (e.g. a safe re-invocation after a failed generation attempt)
  -- returns the row already written instead of creating a duplicate.
  if p_source_message_id is not null then
    select id into v_message_id
      from ai_workforce_messages
     where organization_id = v_org
       and workspace_id = p_workspace_id
       and conversation_id = p_conversation_id
       and source_message_id = p_source_message_id
       and role = p_role
     limit 1;
    if v_message_id is not null then
      return v_message_id;
    end if;
  end if;

  select created_by into v_actor from workspaces where id = p_workspace_id;

  insert into ai_workforce_messages (organization_id, workspace_id, conversation_id, role, content, recommendation_only, source_message_id, delivery_state, created_by)
  values (v_org, p_workspace_id, p_conversation_id, p_role, left(p_content, 100000), true, p_source_message_id, p_delivery_state, v_actor)
  returning id into v_message_id;

  update ai_workforce_conversations set updated_at = now() where id = p_conversation_id;

  return v_message_id;
end;
$$;

revoke all on function public.append_trusted_ai_message(uuid, uuid, text, text, text, text) from public;
grant execute on function public.append_trusted_ai_message(uuid, uuid, text, text, text, text) to service_role;

-- ============================================================================
-- process_whatsapp_message: returns jsonb instead of void. Body unchanged.
-- ============================================================================
drop function if exists public.process_whatsapp_message(uuid, uuid, uuid, text, jsonb, text);

create or replace function public.process_whatsapp_message(
  p_connection_id uuid,
  p_organization_id uuid,
  p_workspace_id uuid,
  p_event_id text,
  p_message jsonb,
  p_sender_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_thread uuid;
  v_comm uuid;
  v_from text;
  v_normalized_phone text;
  v_lead_id uuid;
  v_related_type text;
  v_related_id uuid;
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  insert into provider_webhook_events (provider, event_id, event_type, organization_id, workspace_id, payload, status, processed_at)
  values ('whatsapp', p_event_id, 'message', p_organization_id, p_workspace_id, p_message, 'processed', now())
  on conflict (provider, event_id) do nothing;
  if not found then return jsonb_build_object('is_new', false); end if;

  v_from := p_message->>'from';

  if v_from is not null and left(v_from, 1) = '+' then
    v_normalized_phone := v_from;
    v_lead_id := public.resolve_whatsapp_lead_identity(p_workspace_id, v_normalized_phone, p_sender_name);
  end if;

  select id, related_type, related_id into v_thread, v_related_type, v_related_id
    from communication_threads
   where workspace_id = p_workspace_id
     and metadata->>'whatsapp_phone' = v_from
     and deleted_at is null
   limit 1;

  if v_thread is null then
    insert into communication_threads (
      organization_id, workspace_id, subject, related_type, related_id, status,
      unread_count, last_activity_at, created_by, updated_by, metadata
    ) values (
      p_organization_id, p_workspace_id, 'WhatsApp · ' || v_from,
      case when v_lead_id is not null then 'lead' else 'customer' end,
      v_lead_id, 'open', 1, now(),
      (select created_by from workspaces where id = p_workspace_id),
      (select created_by from workspaces where id = p_workspace_id),
      jsonb_build_object('whatsapp_phone', v_from)
    ) returning id into v_thread;
  elsif v_related_id is null and v_lead_id is not null then
    update communication_threads
       set related_type = 'lead', related_id = v_lead_id, updated_at = now(), version = version + 1
     where id = v_thread;
  end if;

  insert into communications (organization_id, workspace_id, thread_id, channel, direction, status, body, external_id, metadata, occurred_at)
  values (p_organization_id, p_workspace_id, v_thread, 'whatsapp', 'inbound', 'received',
    coalesce(p_message->>'text', '[' || (p_message->>'type') || ']'), p_message->>'id', p_message, to_timestamp((p_message->>'timestamp')::bigint))
  returning id into v_comm;

  insert into whatsapp_messages (organization_id, workspace_id, connection_id, provider_message_id, communication_id, direction, sender, recipient, message_type, text_body, media_metadata, status, provider_timestamp)
  values (p_organization_id, p_workspace_id, p_connection_id, p_message->>'id', v_comm, 'inbound', v_from, p_message->>'to', p_message->>'type', p_message->>'text', coalesce(p_message->'media', '{}'), 'received', to_timestamp((p_message->>'timestamp')::bigint));

  update communication_threads set unread_count = unread_count + 1, last_activity_at = now(), updated_at = now(), version = version + 1 where id = v_thread;

  return jsonb_build_object('is_new', true, 'lead_id', v_lead_id, 'communication_thread_id', v_thread);
end;
$$;

revoke all on function public.process_whatsapp_message(uuid, uuid, uuid, text, jsonb, text) from public;
grant execute on function public.process_whatsapp_message(uuid, uuid, uuid, text, jsonb, text) to service_role;

commit;
