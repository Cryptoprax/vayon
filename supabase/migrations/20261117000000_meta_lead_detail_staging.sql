-- Phase M4: Meta Lead Ads detail fetch + field normalization staging.
--
-- WHY A DEDICATED TABLE (not extending provider_webhook_events.payload):
-- M3 deliberately kept provider_webhook_events.payload identifiers-only ("M3
-- handles identifiers only" -- see 20261116000000's own header comment). M4
-- introduces genuine PII (name/email/phone/custom answers); mixing that into
-- a table whose documented discipline is "no PII" would silently break that
-- guarantee for every future reader of provider_webhook_events. A separate,
-- narrowly-scoped, tenant-isolated staging table keeps the PII boundary
-- explicit and lets this table alone carry stricter handling later (e.g. a
-- future retention/redaction policy) without touching the generic webhook
-- ledger every other provider (Stripe/Paddle/WhatsApp) also writes to.
--
-- WHY NO SELECT RLS POLICY: unlike K1-K6/M1-M3's tenant-member-read tables,
-- this table holds real third-party PII pending CRM ingestion that M7 (not
-- M4) owns showing to a customer. Enabling RLS with zero policies makes the
-- table unreadable to every authenticated role -- only service-role
-- processing (which bypasses RLS entirely) and the narrow, aggregate-only
-- get_meta_lead_ingestion_summary() RPC below can touch it.

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create table public.meta_lead_ingestion_staging (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  workspace_id uuid not null references public.workspaces(id),
  connection_id uuid not null references public.meta_marketing_connections(id),
  property_id uuid not null references public.properties(id),
  campaign_id uuid references public.creative_campaigns(id),

  leadgen_id text not null,
  page_id text not null,
  form_id text not null,
  ad_id text,
  ad_group_id text,
  provider_created_time timestamptz,

  status text not null default 'pending_fetch'
    check (status in ('pending_fetch', 'fetching', 'fetched', 'fetch_failed', 'invalid_payload', 'unresolved_connection')),
  fetch_error_code text
    check (fetch_error_code is null or fetch_error_code in (
      'INVALID_LEAD_ID', 'TOKEN_INVALID', 'LEAD_NOT_FOUND', 'RATE_LIMITED',
      'PROVIDER_ERROR', 'TIMEOUT', 'NETWORK_ERROR', 'MALFORMED_RESPONSE', 'RESPONSE_ID_MISMATCH'
    )),
  attempt_count integer not null default 0,
  fetch_started_at timestamptz,
  fetched_at timestamptz,

  -- Normalized fields only -- never the raw Graph response, never the access token.
  normalized_full_name text,
  normalized_first_name text,
  normalized_last_name text,
  normalized_email text,
  normalized_phone_raw text,
  normalized_phone text,
  normalized_city text,
  custom_answers jsonb not null default '[]',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (leadgen_id)
);

create index meta_lead_ingestion_staging_tenant_idx
  on public.meta_lead_ingestion_staging (organization_id, workspace_id, status);

alter table public.meta_lead_ingestion_staging enable row level security;
-- Deliberately no select/insert/update policy -- see header comment.

-- ============================================================================
-- claim_meta_lead_detail_batch: atomically stages and claims up to p_limit
-- unstaged, resolved (organization_id is not null) M3 events in one
-- transaction. The unique(leadgen_id) constraint plus ON CONFLICT DO NOTHING
-- means two concurrent processor invocations can never both stage/claim the
-- same event (Part 11 -- "two simultaneous fetch workers do not both persist
-- conflicting rows"). Once a leadgen_id exists in staging with ANY status,
-- it is never re-staged by this function -- a fetch_failed row requires a
-- deliberate, separate action to retry (not built in M4; see final report).
-- Service-role only, mirroring every other webhook-adjacent RPC in this
-- schema.
-- ============================================================================
-- PHASE DBV1D CORRECTION: the original single-statement
-- "WITH staged AS (INSERT ... RETURNING id) UPDATE ... WHERE id IN (SELECT id
-- FROM staged)" never actually applied its UPDATE -- newly staged rows stayed
-- at 'pending_fetch' with attempt_count untouched, and the function returned
-- zero rows to its caller regardless of how many rows were staged (proven by
-- real local Postgres execution in DBV1B-R2). This is rewritten as two
-- separate statements: STEP 1 stages any newly-resolved webhook events
-- (identical WHERE/dedup/limit logic, unchanged), STEP 2 claims up to
-- p_limit rows currently sitting at 'pending_fetch' using
-- FOR UPDATE SKIP LOCKED so two concurrent callers can never claim the same
-- row. The claim step intentionally covers ANY pending row, not only ones
-- this exact call just staged -- this also self-heals rows left stranded by
-- the original bug (or by a crashed prior worker), which matches the
-- function's own caller-facing contract ("returns the batch of rows now
-- claimed for fetching") without changing any status value, column, or the
-- staging/dedup semantics.
create or replace function public.claim_meta_lead_detail_batch(
  p_limit integer default 20
) returns setof public.meta_lead_ingestion_staging
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  insert into meta_lead_ingestion_staging (
    organization_id, workspace_id, connection_id, property_id, campaign_id,
    leadgen_id, page_id, form_id, ad_id, ad_group_id, provider_created_time, status
  )
  select
    w.organization_id, w.workspace_id,
    (w.payload->>'connectionId')::uuid,
    (w.payload->>'propertyId')::uuid,
    nullif(w.payload->>'campaignId', '')::uuid,
    w.event_id,
    w.payload->>'pageId',
    w.payload->>'formId',
    w.payload->>'adId',
    w.payload->>'adGroupId',
    nullif(w.payload->>'createdTime', '')::timestamptz,
    'pending_fetch'
  from provider_webhook_events w
  where w.provider = 'meta_leadgen'
    and w.status = 'processed'
    and w.organization_id is not null
    and not exists (select 1 from meta_lead_ingestion_staging s where s.leadgen_id = w.event_id)
  order by w.received_at
  limit greatest(p_limit, 1)
  on conflict (leadgen_id) do nothing;

  return query
  update meta_lead_ingestion_staging m
     set status = 'fetching', fetch_started_at = now(), attempt_count = m.attempt_count + 1, updated_at = now()
   where m.id in (
     select s.id from meta_lead_ingestion_staging s
      where s.status = 'pending_fetch'
      order by s.created_at
      limit greatest(p_limit, 1)
      for update skip locked
   )
  returning m.*;
end;
$$;

revoke all on function public.claim_meta_lead_detail_batch(integer) from public;
grant execute on function public.claim_meta_lead_detail_batch(integer) to service_role;

-- ============================================================================
-- complete_meta_lead_detail_fetch: 'fetching' -> 'fetched'. Only normalized
-- fields are accepted as parameters -- there is no parameter for a raw
-- response, a token, or any value this function does not explicitly model.
-- ============================================================================
create or replace function public.complete_meta_lead_detail_fetch(
  p_staging_id uuid,
  p_full_name text,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone_raw text,
  p_phone text,
  p_city text,
  p_custom_answers jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  update meta_lead_ingestion_staging
     set status = 'fetched',
         fetched_at = now(),
         updated_at = now(),
         fetch_error_code = null,
         normalized_full_name = p_full_name,
         normalized_first_name = p_first_name,
         normalized_last_name = p_last_name,
         normalized_email = p_email,
         normalized_phone_raw = p_phone_raw,
         normalized_phone = p_phone,
         normalized_city = p_city,
         custom_answers = coalesce(p_custom_answers, '[]'::jsonb)
   where id = p_staging_id and status = 'fetching';

  if not found then
    raise exception 'STAGING_NOT_CLAIMED: row is not in a fetching state';
  end if;
end;
$$;

revoke all on function public.complete_meta_lead_detail_fetch(uuid, text, text, text, text, text, text, text, jsonb) from public;
grant execute on function public.complete_meta_lead_detail_fetch(uuid, text, text, text, text, text, text, text, jsonb) to service_role;

-- ============================================================================
-- fail_meta_lead_detail_fetch: 'fetching' -> 'fetch_failed' / 'invalid_payload'
-- / 'unresolved_connection'. Never accepts a raw error message/body -- only
-- one of the closed error codes.
-- ============================================================================
create or replace function public.fail_meta_lead_detail_fetch(
  p_staging_id uuid,
  p_status text,
  p_error_code text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  if p_status not in ('fetch_failed', 'invalid_payload', 'unresolved_connection') then
    raise exception 'INVALID_STATUS: % is not a valid failure status', p_status;
  end if;

  update meta_lead_ingestion_staging
     set status = p_status, fetch_error_code = p_error_code, updated_at = now()
   where id = p_staging_id and status = 'fetching';

  if not found then
    raise exception 'STAGING_NOT_CLAIMED: row is not in a fetching state';
  end if;
end;
$$;

revoke all on function public.fail_meta_lead_detail_fetch(uuid, text, text) from public;
grant execute on function public.fail_meta_lead_detail_fetch(uuid, text, text) to service_role;

-- ============================================================================
-- mark_meta_connection_token_invalid: narrow, reliable-signal-only status
-- update (Part 13). Only called when Graph itself classifies the token as
-- invalid/revoked (401/403) -- never guessed from an ambiguous failure. Does
-- NOT disable form mappings; a token becoming invalid does not necessarily
-- mean the customer's mapping intent is wrong, only that reconnection is
-- needed.
-- ============================================================================
create or replace function public.mark_meta_connection_token_invalid(
  p_connection_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  update meta_marketing_connections
     set status = 'error', updated_at = now(), version = version + 1
   where id = p_connection_id and status = 'connected';
end;
$$;

revoke all on function public.mark_meta_connection_token_invalid(uuid) from public;
grant execute on function public.mark_meta_connection_token_invalid(uuid) to service_role;

-- ============================================================================
-- get_meta_lead_ingestion_summary: the ONLY interactive read of this table --
-- aggregate counts per status, never a PII column, gated by ordinary tenant
-- membership (viewing a count is not a credential-management action, unlike
-- M1/M2's can_manage_integrations()-gated writes).
-- ============================================================================
create or replace function public.get_meta_lead_ingestion_summary(
  p_workspace_id uuid
) returns table (status text, count bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organization_id into v_org
    from workspace_members
   where workspace_id = p_workspace_id and user_id = auth.uid() and status = 'active';

  if v_org is null then
    raise exception 'insufficient workspace access';
  end if;

  return query
  select m.status, count(*)::bigint
    from meta_lead_ingestion_staging m
   where m.organization_id = v_org and m.workspace_id = p_workspace_id
   group by m.status;
end;
$$;

revoke all on function public.get_meta_lead_ingestion_summary(uuid) from public;
grant execute on function public.get_meta_lead_ingestion_summary(uuid) to authenticated;

commit;
