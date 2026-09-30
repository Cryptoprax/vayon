-- Phase M3: Meta Lead Ads webhook event processing.
--
-- Reuses public.provider_webhook_events (Sprint 21/22) exactly as-is -- no new
-- table, no new column, no ALTER of any existing table. That table's
-- organization_id/workspace_id are already nullable (there was no prior
-- caller relying on them being non-null), which is exactly what an
-- unresolved-tenant Lead Ads event needs, and its status column has no CHECK
-- constraint, so 'unresolved' is a safe addition alongside the existing
-- 'processed' value with no widening required. This migration adds exactly
-- one new SECURITY DEFINER function; it does not touch M1/M2's connection or
-- form-mapping tables/functions in any way.
--
-- WHY THE PAYLOAD IS IDENTIFIERS ONLY: leadgen_id/page_id/form_id/ad_id/
-- adgroup_id/created_time are stored in the jsonb payload -- never the raw
-- Meta webhook body, never a token, never lead field_data (name/email/phone/
-- custom answers). M3 does not fetch or store any of that; M4 owns it.
--
-- WHY leadgen_id IS THE DEDUP KEY: Meta's Lead Ads webhook delivers
-- at-least-once per lead submission, and leadgen_id already uniquely
-- identifies that one submission -- a redelivery carries the identical
-- leadgen_id, so unique(provider, event_id) on ('meta_leadgen', leadgen_id)
-- is the correct, deterministic dedup boundary. A random UUID would defeat
-- dedup entirely; a compound key is unnecessary because Meta does not reuse
-- a leadgen_id for a semantically different event.

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ============================================================================
-- process_meta_leadgen_event: the only way a leadgen webhook event is
-- recorded. Mirrors process_whatsapp_message()'s exact atomic dedup idiom
-- (insert ... on conflict (provider, event_id) do nothing; if not found then
-- return) -- a duplicate delivery is claimed by nobody a second time. Like
-- process_whatsapp_message()/resolve_whatsapp_ai_conversation(), this is
-- service-role-only: it is never granted to `authenticated`, so no ordinary
-- customer session can call it, and it raises if invoked outside a
-- service-role connection even if somehow reachable.
--
-- Tenant/property/campaign identifiers are accepted as already-resolved
-- input (from resolveMetaLeadTenant(), called by the webhook route before
-- this RPC) rather than re-resolved here -- this function only records the
-- outcome atomically; it does not itself decide tenant ownership.
-- ============================================================================
create or replace function public.process_meta_leadgen_event(
  p_event_id text,
  p_page_id text,
  p_form_id text,
  p_ad_id text,
  p_ad_group_id text,
  p_created_time timestamptz,
  p_organization_id uuid,
  p_workspace_id uuid,
  p_connection_id uuid,
  p_property_id uuid,
  p_campaign_id uuid
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payload jsonb;
  v_status text;
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  v_status := case when p_organization_id is null then 'unresolved' else 'processed' end;

  v_payload := jsonb_build_object(
    'leadgenId', p_event_id,
    'pageId', p_page_id,
    'formId', p_form_id,
    'adId', p_ad_id,
    'adGroupId', p_ad_group_id,
    'createdTime', p_created_time,
    'connectionId', p_connection_id,
    'propertyId', p_property_id,
    'campaignId', p_campaign_id
  );

  insert into provider_webhook_events (provider, event_id, event_type, organization_id, workspace_id, payload, status, processed_at)
  values ('meta_leadgen', p_event_id, 'leadgen', p_organization_id, p_workspace_id, v_payload, v_status, now())
  on conflict (provider, event_id) do nothing;

  if not found then
    return 'duplicate';
  end if;

  return v_status;
end;
$$;

revoke all on function public.process_meta_leadgen_event(text, text, text, text, text, timestamptz, uuid, uuid, uuid, uuid, uuid) from public;
grant execute on function public.process_meta_leadgen_event(text, text, text, text, text, timestamptz, uuid, uuid, uuid, uuid, uuid) to service_role;

commit;
