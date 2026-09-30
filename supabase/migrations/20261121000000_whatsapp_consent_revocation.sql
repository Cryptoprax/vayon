-- Phase M8: inbound WhatsApp opt-out -> canonical communication_consents
-- revocation. NO new consent table (Part 4 forbids one) -- this migration
-- only widens the EXISTING M6 communication_consents model to support a
-- second source_type, plus a service-role RPC to append a revocation event.
--
-- WHY ONE NEW COLUMN (source_message_id), NOT REUSING source_id/source_form_id:
-- source_id (uuid) already means "the meta_lead_form_consent_rules row that
-- was evaluated" for the meta_lead_form source_type -- many different leads
-- can legitimately share the SAME rule id, so it cannot double as a
-- per-event uniqueness key. source_form_id (text) is named for Meta's own
-- form id specifically. A WhatsApp inbound opt-out has no rule and no form
-- -- its only stable identity is Meta's own WhatsApp message id (a string
-- like "wamid.xxx", already the exact dedup key process_whatsapp_message
-- uses). source_message_id is a new, generically-named nullable text column
-- so this identity is never forced into a column whose existing name/type
-- implies something else.
--
-- WHY A PARTIAL UNIQUE INDEX SCOPED TO source_type = 'whatsapp_inbound':
-- Idempotency (Part 6) must hold for this source without constraining the
-- meta_lead_form source_type's own, already-correct
-- unique(staging_id, channel, purpose) guarantee at all -- a shared
-- constraint across both source types would either be meaningless (NULLs
-- never conflict) or, worse, incorrectly block legitimate distinct meta_lead_
-- form rows that happen to reference the same rule. Scoping the new index to
-- source_type = 'whatsapp_inbound' keeps the two idempotency guarantees
-- fully independent, additive, and semantically correct for each source.
--
-- WHY NO UPDATE OF ANY PRIOR ROW: communication_consents is append-only by
-- design since M6 (Part 4/12 of that phase). This migration adds no UPDATE
-- path whatsoever -- record_whatsapp_consent_revocation only ever INSERTs a
-- new 'revoked' row; a prior 'granted' row is never touched, matching Part
-- 10's "history stays immutable" requirement exactly.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

alter table public.communication_consents
  add column if not exists source_message_id text;

alter table public.communication_consents
  drop constraint if exists communication_consents_source_type_check;
alter table public.communication_consents
  add constraint communication_consents_source_type_check check (source_type in ('meta_lead_form', 'whatsapp_inbound'));

create unique index if not exists communication_consents_whatsapp_inbound_idx
  on public.communication_consents (source_message_id)
  where source_type = 'whatsapp_inbound';

-- ============================================================================
-- record_whatsapp_consent_revocation: the ONLY way to append a WhatsApp
-- inbound opt-out revocation. Service-role only (Part 12) -- no client may
-- ever submit a leadId + revoked=true directly; this is reachable only from
-- the trusted inbound webhook path, after signature verification, dedup,
-- and lead identity resolution have already happened (process_whatsapp_
-- message, unmodified by this migration).
--
-- Tenant isolation (Part 13): organization_id/workspace_id are accepted as
-- parameters here (unlike some prior phases' "derive from workspace_id
-- alone" pattern) because the caller (whatsapp.service.ts's receive()) has
-- ALREADY resolved them from the trusted whatsapp_connections row -- never
-- from the raw provider payload -- exactly mirroring how process_whatsapp_
-- message itself is already called with connection.organization_id/
-- workspace_id, not anything read off the webhook body. This function still
-- independently re-verifies the lead belongs to that exact org/workspace
-- before writing anything, so a caller cannot use it to write a revocation
-- for a lead in a different tenant even if it tried.
--
-- Idempotent by construction: ON CONFLICT on the partial unique index above
-- means a webhook retry delivering the SAME WhatsApp message id can never
-- create a second revocation row for it. Returns which case happened
-- (created vs. already-existed) so the TypeScript caller can skip writing a
-- second activity_events row on retry (Part 6/17) without needing its own
-- separate duplicate check.
-- ============================================================================
create or replace function public.record_whatsapp_consent_revocation(
  p_organization_id uuid,
  p_workspace_id uuid,
  p_lead_id uuid,
  p_source_message_id text
) returns table (consent_id uuid, created boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  if p_source_message_id is null or length(trim(p_source_message_id)) = 0 then
    raise exception 'INVALID_SOURCE: source_message_id is required';
  end if;

  if not exists (
    select 1 from leads
     where id = p_lead_id and organization_id = p_organization_id and workspace_id = p_workspace_id and deleted_at is null
  ) then
    raise exception 'NOT_ELIGIBLE: lead does not belong to this workspace';
  end if;

  insert into communication_consents (
    organization_id, workspace_id, lead_id, channel, purpose, status,
    source_type, source_message_id, source_provider, revoked_at
  ) values (
    p_organization_id, p_workspace_id, p_lead_id, 'whatsapp', 'marketing', 'revoked',
    'whatsapp_inbound', p_source_message_id, 'whatsapp', now()
  )
  on conflict (source_message_id) where source_type = 'whatsapp_inbound' do nothing
  returning id into v_id;

  if v_id is not null then
    return query select v_id, true;
    return;
  end if;

  select id into v_id from communication_consents
   where source_type = 'whatsapp_inbound' and source_message_id = p_source_message_id;

  return query select v_id, false;
end;
$$;

revoke all on function public.record_whatsapp_consent_revocation(uuid, uuid, uuid, text) from public;
grant execute on function public.record_whatsapp_consent_revocation(uuid, uuid, uuid, text) to service_role;

commit;
