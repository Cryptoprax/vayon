-- Phase E1: WhatsApp phone identity -> CRM lead resolution.
--
-- Additive only: adds one nullable column to the existing leads table, adds
-- one new SECURITY DEFINER function, and replaces exactly one existing
-- function (process_whatsapp_message, via create or replace -- the same
-- evolution pattern already used repeatedly in this schema, e.g. sprint120a
-- on invite_organization_member, or 20261103000000 on
-- accept_organization_invitation). No table is dropped, no existing column
-- is altered or removed, no data is backfilled.
--
-- WHY "leads" AND NOT crm_contacts:
-- leads (sprint22 baseline) already carries phone, whatsapp, and source
-- columns, already has "whatsapp" as a valid leadSources catalog value
-- (features/vayon/lead/config/catalogs.ts), and is the entity every other
-- real-estate workflow (deals, meetings, lead_property_interests) already
-- hangs off of. crm_contacts (sprint193) is a separate, company-directory-
-- scoped entity (company_id required conceptually, optionally references a
-- lead) built for B2B contact management, not for "a person messaging about
-- a property" -- using it here would require inventing a second, parallel
-- meaning for "contact" that the existing UI (ContactDirectory under
-- crm-company) does not share. leads is the canonical person+opportunity
-- identity for this product; this migration does not introduce a second one.
--
-- WHY NO UNIQUE CONSTRAINT ON PHONE:
-- leads has no existing unique constraint or index on phone/whatsapp, and
-- the write path (create_lead RPC, features/vayon/lead/repositories/
-- lead.repository.ts) never enforces one -- duplicate phone numbers across
-- separate leads are evidently tolerated by the existing architecture (e.g.
-- a person submitting more than one inbound form). Adding a hard unique
-- constraint now would be a retroactive assumption change with no
-- migration-time verification of existing data, and was explicitly out of
-- scope ("do not create a destructive uniqueness constraint" / "if
-- duplicates are legitimate, do not create one"). Race safety is achieved
-- instead via pg_advisory_xact_lock, the same tool already used for the
-- analogous "two concurrent requests must not both pass" problem in
-- 20261103000000_numeric_quota_enforcement.sql's accept_organization_invitation().
--
-- WHY A NEW normalized_phone COLUMN:
-- leads.phone/leads.whatsapp store raw, human-entered text with no
-- consistent format. Matching an incoming, already-normalized WhatsApp
-- sender id (always E.164 via the application-layer
-- normalizeWhatsAppSenderId()) against that raw text reliably requires a
-- canonical column. This column is nullable and populated only going
-- forward (by this migration's own function) -- no existing row is touched,
-- per "no migration-time mass mutation."
--
-- MATCH SEMANTICS AND ITS HONEST LIMITATION:
-- A lead matches when normalized_phone equals the incoming E.164 value, or
-- (for leads created before this migration, where normalized_phone is null)
-- when the digit-only form of its raw phone/whatsapp column equals the
-- digit-only form of the incoming value. The second form bridges formatting
-- differences (spaces, dashes, a missing "+") but NOT a missing country
-- code: a pre-existing lead stored as a bare local number (e.g.
-- "9876543210") will NOT match an incoming "+919876543210", because
-- bridging that gap would require guessing a country, which this phase is
-- explicitly forbidden from doing. In that case a new lead is created
-- instead of reusing the existing one. This is a disclosed, accepted
-- limitation, not an oversight.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

alter table public.leads add column if not exists normalized_phone text;

create index if not exists leads_normalized_phone_idx
  on public.leads (organization_id, workspace_id, normalized_phone)
  where deleted_at is null and normalized_phone is not null;

-- ============================================================================
-- resolve_whatsapp_lead_identity: tenant-safe find-or-create.
--
-- SECURITY: granted to service_role ONLY (see grants below), never to
-- authenticated. organization_id is derived exclusively from p_workspace_id
-- via the workspaces table itself -- never accepted as a parameter -- so an
-- authenticated caller could not use this function to probe or create leads
-- in an organization/workspace it does not belong to even if it were
-- granted access (which it is not). This mirrors the same "derive tenant
-- from a trusted row, never from client input" pattern already used by
-- create_property()/decide_ai_approval()/request_approval() elsewhere in
-- this schema.
--
-- CONCURRENCY: pg_advisory_xact_lock keyed by organization+workspace+phone
-- serializes two simultaneous first-contact messages from the same new
-- number so they cannot both miss the lookup and both insert a lead --
-- identical in shape to the org-seat lock in accept_organization_invitation().
--
-- NO DEAL, NO AI, NO OUTBOUND MESSAGE: this function touches only the leads
-- table (plus the advisory lock, which touches nothing persistent). It does
-- not call any AI provider, does not create a deal, and does not send
-- anything.
-- ============================================================================
create or replace function public.resolve_whatsapp_lead_identity(
  p_workspace_id uuid,
  p_phone text,
  p_display_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_lead_id uuid;
  v_actor uuid;
  v_currency text;
  v_digits text;
  v_name text;
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  select organization_id into v_org from workspaces where id = p_workspace_id;
  if v_org is null then
    raise exception 'TENANT_RESOLUTION_ERROR: unknown workspace';
  end if;

  if p_phone is null or left(p_phone, 1) <> '+' then
    raise exception 'INVALID_PHONE: phone must already be normalized to E.164';
  end if;

  v_digits := regexp_replace(p_phone, '[^0-9]', '', 'g');
  if length(v_digits) < 8 or length(v_digits) > 15 then
    raise exception 'INVALID_PHONE: phone digit length out of range';
  end if;

  perform pg_advisory_xact_lock(hashtext('whatsapp_lead:' || v_org::text || ':' || p_workspace_id::text || ':' || p_phone));

  select id into v_lead_id
    from leads
   where organization_id = v_org
     and workspace_id = p_workspace_id
     and deleted_at is null
     and (
       normalized_phone = p_phone
       or regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') = v_digits
       or regexp_replace(coalesce(whatsapp, ''), '[^0-9]', '', 'g') = v_digits
     )
   order by created_at asc
   limit 1;

  if v_lead_id is not null then
    -- Opportunistically fill the normalized column for a legacy match, but
    -- never touch any other field on an existing lead -- see the "existing
    -- contact update policy" in the E1 report for why.
    update leads set normalized_phone = p_phone where id = v_lead_id and normalized_phone is null;
    return v_lead_id;
  end if;

  select w.created_by, o.currency into v_actor, v_currency
    from workspaces w join organizations o on o.id = w.organization_id
   where w.id = p_workspace_id;

  v_name := nullif(trim(coalesce(p_display_name, '')), '');
  if v_name is not null and length(v_name) > 120 then
    v_name := left(v_name, 120);
  end if;

  insert into leads (
    organization_id, workspace_id, name, phone, whatsapp, normalized_phone,
    source, status, priority, currency, created_by, updated_by
  ) values (
    v_org, p_workspace_id, coalesce(v_name, 'WhatsApp contact'), p_phone, p_phone, p_phone,
    'whatsapp', 'new', 'low', coalesce(v_currency, 'USD'), v_actor, v_actor
  ) returning id into v_lead_id;

  return v_lead_id;
end;
$$;

revoke all on function public.resolve_whatsapp_lead_identity(uuid, text, text) from public;
grant execute on function public.resolve_whatsapp_lead_identity(uuid, text, text) to service_role;

-- ============================================================================
-- process_whatsapp_message: adds one new trailing parameter (p_sender_name).
-- Postgres treats a changed parameter list as a distinct function identity,
-- so "create or replace" alone would leave the old 5-argument overload in
-- place alongside a new 6-argument one rather than truly replacing it -- the
-- explicit drop below is required for this to be a real replacement, not an
-- accidental overload. This still is not a destructive migration in the
-- sense the safety rules care about: a function has no rows/data to lose,
-- and the caller (WhatsAppRepository.persist(), updated in this same phase)
-- is switched to the new 6-argument signature in the same change.
-- Ordering of the existing dedup/service-role guard is unchanged; CRM
-- identity resolution is inserted only after both, before thread creation.
-- ============================================================================
drop function if exists public.process_whatsapp_message(uuid, uuid, uuid, text, jsonb);

create or replace function public.process_whatsapp_message(
  p_connection_id uuid,
  p_organization_id uuid,
  p_workspace_id uuid,
  p_event_id text,
  p_message jsonb,
  p_sender_name text default null
)
returns void
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
  if not found then return; end if;

  v_from := p_message->>'from';

  -- CRM identity resolution happens only after signature verification (the
  -- webhook route), event dedup (immediately above), and tenant resolution
  -- (p_organization_id/p_workspace_id are already trusted -- they came from
  -- the phone_number_id -> whatsapp_connections lookup in
  -- WhatsAppRepository.connectionByPhoneNumber(), never from this payload).
  -- v_from is normalized to E.164 by the caller (normalizeWhatsAppSenderId in
  -- the TypeScript layer) before this function is invoked; a defensive
  -- format check is repeated inside resolve_whatsapp_lead_identity itself.
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
    -- Existing thread from before this migration (or a message that
    -- previously arrived before identity could be resolved) had no CRM
    -- link. Link it now, on the next inbound message -- never as a bulk
    -- migration-time update. An already-linked thread (v_related_id is not
    -- null) is left exactly as-is; this branch cannot overwrite it.
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
end;
$$;

revoke all on function public.process_whatsapp_message(uuid, uuid, uuid, text, jsonb, text) from public;
grant execute on function public.process_whatsapp_message(uuid, uuid, uuid, text, jsonb, text) to service_role;

commit;
