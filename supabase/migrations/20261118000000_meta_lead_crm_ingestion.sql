-- Phase M5: Meta normalized lead -> CRM find/create + property interest attribution.
--
-- CANONICAL PERSON MODEL: public.leads (re-confirmed, not crm_contacts -- see
-- 20261104000000_whatsapp_crm_identity.sql's own header for the original
-- reasoning, which still holds: crm_contacts is a company-directory-scoped,
-- trigger-synced 1:1 projection of leads, not an independent identity model).
--
-- WHY A NEW meta_lead_crm_links TABLE (Part 4):
-- No existing "provider identity -> CRM lead" linking table exists anywhere
-- in this schema, for any provider. A Meta leadgen_id is the strongest
-- available identity for replay/idempotency (Meta guarantees it globally
-- unique, the same assumption meta_lead_ingestion_staging's own
-- unique(leadgen_id) already relies on) -- stronger than phone/email, which
-- this architecture deliberately tolerates as duplicate-prone (see below).
-- unique(provider, provider_lead_id) is therefore a correct GLOBAL (not
-- per-tenant) constraint: a single real-world Meta form submission can never
-- legitimately belong to more than one lead, in any tenant, by construction.
--
-- WHY NO UNIQUE CONSTRAINT ON leads.phone/email (still, per E1 precedent):
-- Confirmed unchanged: leads has no unique constraint on phone/whatsapp/email
-- today, and duplicates are tolerated by design (20261104000000's own header,
-- lines 24-36). M5 does not add one. Concurrency safety for identity
-- resolution instead uses pg_advisory_xact_lock, the same tool E1 already
-- uses for the identical "two concurrent first-contacts must not both miss
-- the lookup and both insert" problem.
--
-- WHY leads CANNOT BE CREATED VIA THE EXISTING create_lead RPC:
-- create_lead (sprint22 baseline) relies on auth.uid() and an
-- authenticated-role/workspace-membership check -- there is no human
-- session in a service-role background processor. M5 therefore needs its
-- own service-role-gated identity/creation function, following the exact
-- same shape as resolve_whatsapp_lead_identity (derive org from a trusted
-- row, never from client input; explicit safe defaults; workspace's
-- created_by used as the system actor for created_by/updated_by, matching
-- that same precedent exactly).
--
-- WHY CONSERVATIVE (fail-closed) AMBIGUITY HANDLING, UNLIKE WHATSAPP'S:
-- resolve_whatsapp_lead_identity picks the oldest-created lead silently on
-- a duplicate phone match. That is a deliberate, disclosed, accepted
-- limitation for WhatsApp specifically (an inbound message from a known
-- number is low-stakes to attribute conservatively). Meta Lead Ads
-- ingestion additionally correlates TWO independent identifiers (phone AND
-- email) and writes a permanent provider link plus a property interest --
-- higher-consequence, more attributable state. M5 therefore fails closed
-- (AMBIGUOUS_PHONE / AMBIGUOUS_EMAIL / IDENTITY_CONFLICT) rather than
-- guessing, matching K4's own "never guess among multiple interests"
-- philosophy instead of WhatsApp's "pick the oldest" philosophy. This is an
-- intentional, disclosed divergence between the two ingestion paths, not an
-- oversight.
--
-- WHY NO lead_property_interests SCHEMA CHANGE:
-- Its existing primary key (lead_id, property_id) already gives exact
-- idempotency for "the same lead + same property never duplicates," and
-- its complete absence of a status/active column means "active" is simply
-- row existence -- a second property for the same lead is naturally just a
-- second row (Part 14). M5 uses a plain
-- insert ... on conflict (lead_id, property_id) do nothing, never the
-- update_lead RPC's delete-then-reinsert pattern (which would destroy a
-- lead's OTHER pre-existing property interests -- not acceptable here).
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ============================================================================
-- M5 CRM-ingestion state on the M4 staging row. Deliberately separate from
-- M4's own `status` column (pending_fetch/fetching/fetched/...) -- M5 never
-- overloads Graph-fetch state with CRM state (Part 17).
-- ============================================================================
alter table public.meta_lead_ingestion_staging
  add column if not exists crm_ingestion_status text not null default 'pending'
    check (crm_ingestion_status in ('pending', 'processing', 'completed', 'identity_conflict', 'failed')),
  add column if not exists crm_ingested_at timestamptz,
  add column if not exists crm_lead_id uuid references public.leads(id),
  add column if not exists crm_error_code text
    check (crm_error_code is null or crm_error_code in (
      'PROPERTY_NOT_FOUND', 'IDENTITY_CONFLICT', 'AMBIGUOUS_PHONE', 'AMBIGUOUS_EMAIL',
      'CRM_WRITE_FAILED', 'PROPERTY_INTEREST_FAILED', 'INVALID_STAGING_STATE'
    )),
  add column if not exists crm_attempt_count integer not null default 0;

create index if not exists meta_lead_ingestion_staging_crm_pending_idx
  on public.meta_lead_ingestion_staging (status, crm_ingestion_status, fetched_at)
  where status = 'fetched' and crm_ingestion_status = 'pending';

-- ============================================================================
-- meta_lead_crm_links: permanent "Meta leadgen_id -> CRM lead" attribution.
-- RLS enabled with NO policies -- same posture as meta_lead_ingestion_staging
-- (Part 4): only service-role (RPC-mediated) access, no direct customer read.
-- Campaign/ad identifiers are carried forward for later analytics (Part 27)
-- but never looked up against Meta Graph -- they are copied verbatim from
-- the already-trusted M3/M4 staging row.
-- ============================================================================
create table public.meta_lead_crm_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  workspace_id uuid not null references public.workspaces(id),
  lead_id uuid not null references public.leads(id),
  provider text not null check (provider = 'meta_leadgen'),
  provider_lead_id text not null,
  connection_id uuid references public.meta_marketing_connections(id),
  page_id text,
  form_id text,
  campaign_id uuid references public.creative_campaigns(id),
  ad_id text,
  ad_group_id text,
  created_at timestamptz not null default now(),
  unique (provider, provider_lead_id)
);

create index meta_lead_crm_links_lead_idx
  on public.meta_lead_crm_links (organization_id, workspace_id, lead_id);

alter table public.meta_lead_crm_links enable row level security;
-- Deliberately no select/insert/update policy -- see header comment.

-- ============================================================================
-- Functional index supporting exact normalized-email matching (Part 6). No
-- new column on leads: unlike phone (which needs both an E.164-normalized
-- comparison AND a legacy digit-only fallback -- see E1's own normalized_phone
-- rationale), email matching is a single deterministic trim+lowercase
-- transform, so a computed index is sufficient and avoids an unnecessary
-- schema addition.
-- ============================================================================
create index if not exists leads_normalized_email_idx
  on public.leads (organization_id, workspace_id, (lower(trim(email))))
  where deleted_at is null and email is not null;

-- ============================================================================
-- resolve_or_create_meta_lead_crm_identity: tenant-safe find-or-create,
-- conservative on ambiguity (Part 3/7/8), provider-identity-wins on replay
-- (Part 20), deterministic fixed-order advisory locks for concurrency safety
-- (Part 18/19). Returns (lead_id, null) on success, or
-- (null, 'AMBIGUOUS_PHONE' | 'AMBIGUOUS_EMAIL' | 'IDENTITY_CONFLICT') on a
-- fail-closed case -- these are ordinary return values, not exceptions, so
-- the caller (ingest_meta_lead_to_crm) can classify them without any
-- rollback-of-partial-work ambiguity.
--
-- SECURITY: granted to service_role only. organization_id is derived
-- exclusively from p_workspace_id via the workspaces table -- never accepted
-- as a parameter -- mirroring resolve_whatsapp_lead_identity exactly.
-- ============================================================================
create or replace function public.resolve_or_create_meta_lead_crm_identity(
  p_workspace_id uuid,
  p_provider_lead_id text,
  p_normalized_phone text,
  p_phone_raw text,
  p_normalized_email text,
  p_full_name text,
  p_connection_id uuid,
  p_page_id text,
  p_form_id text,
  p_campaign_id uuid,
  p_ad_id text,
  p_ad_group_id text
) returns table (lead_id uuid, error_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_actor uuid;
  v_currency text;
  v_name text;
  v_phone_ids uuid[];
  v_email_ids uuid[];
  v_phone_lead_id uuid;
  v_email_lead_id uuid;
  v_lead_id uuid;
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  select organization_id into v_org from workspaces where id = p_workspace_id;
  if v_org is null then
    raise exception 'TENANT_RESOLUTION_ERROR: unknown workspace';
  end if;

  -- Provider identity replay wins outright (Part 20) -- never rerun
  -- phone/email matching once a leadgen_id is already linked.
  select ml.lead_id into v_lead_id
    from meta_lead_crm_links ml
   where ml.provider = 'meta_leadgen' and ml.provider_lead_id = p_provider_lead_id;
  if v_lead_id is not null then
    return query select v_lead_id, null::text;
    return;
  end if;

  -- Deterministic, fixed-order advisory locks (Part 18/19): provider id is
  -- always locked first, then phone, then email -- the exact same sequence
  -- on every single invocation regardless of which identifiers are present,
  -- so two concurrent transactions can never acquire this lock set in
  -- different orders. This serializes: (a) two workers processing the same
  -- staging row [also independently guarded by ingest_meta_lead_to_crm's own
  -- atomic claim], and (b) two DIFFERENT leadgen_ids belonging to the same
  -- human arriving concurrently, which is the race this locking specifically
  -- exists to close.
  perform pg_advisory_xact_lock(hashtext('meta_lead_identity:provider:' || v_org::text || ':' || p_workspace_id::text || ':' || p_provider_lead_id));
  if p_normalized_phone is not null then
    perform pg_advisory_xact_lock(hashtext('meta_lead_identity:phone:' || v_org::text || ':' || p_workspace_id::text || ':' || p_normalized_phone));
  end if;
  if p_normalized_email is not null then
    perform pg_advisory_xact_lock(hashtext('meta_lead_identity:email:' || v_org::text || ':' || p_workspace_id::text || ':' || p_normalized_email));
  end if;

  -- Re-check after acquiring locks -- a concurrent worker for a different
  -- leadgen_id belonging to the same person may have just linked/created.
  select ml.lead_id into v_lead_id
    from meta_lead_crm_links ml
   where ml.provider = 'meta_leadgen' and ml.provider_lead_id = p_provider_lead_id;
  if v_lead_id is not null then
    return query select v_lead_id, null::text;
    return;
  end if;

  -- Ambiguous phone (Part 8): DO NOT use a phone that could not be safely
  -- normalized (p_normalized_phone is null when Meta's number had no country
  -- signal -- Part 5) for cross-record identity matching at all.
  if p_normalized_phone is not null then
    select array_agg(id) into v_phone_ids from (
      select id from leads
       where organization_id = v_org and workspace_id = p_workspace_id and deleted_at is null
         and normalized_phone = p_normalized_phone
       limit 2
    ) s;
  end if;
  if p_normalized_email is not null then
    select array_agg(id) into v_email_ids from (
      select id from leads
       where organization_id = v_org and workspace_id = p_workspace_id and deleted_at is null
         and lower(trim(email)) = p_normalized_email
       limit 2
    ) s;
  end if;

  if coalesce(array_length(v_phone_ids, 1), 0) > 1 then
    return query select null::uuid, 'AMBIGUOUS_PHONE'::text;
    return;
  end if;
  if coalesce(array_length(v_email_ids, 1), 0) > 1 then
    return query select null::uuid, 'AMBIGUOUS_EMAIL'::text;
    return;
  end if;

  v_phone_lead_id := case when array_length(v_phone_ids, 1) = 1 then v_phone_ids[1] else null end;
  v_email_lead_id := case when array_length(v_email_ids, 1) = 1 then v_email_ids[1] else null end;

  -- Identity conflict (Part 7 Case B): phone and email each resolve to
  -- exactly one lead, but not the SAME lead. Fail closed rather than
  -- arbitrarily preferring one identifier.
  if v_phone_lead_id is not null and v_email_lead_id is not null and v_phone_lead_id <> v_email_lead_id then
    return query select null::uuid, 'IDENTITY_CONFLICT'::text;
    return;
  end if;

  v_lead_id := coalesce(v_phone_lead_id, v_email_lead_id);

  if v_lead_id is null then
    -- Case D: create. Only defensible fields are set -- no company, budget,
    -- owner, qualification, or score is ever fabricated (Part 9).
    select w.created_by, o.currency into v_actor, v_currency
      from workspaces w join organizations o on o.id = w.organization_id
     where w.id = p_workspace_id;

    v_name := nullif(trim(coalesce(p_full_name, '')), '');
    if v_name is not null and length(v_name) > 120 then
      v_name := left(v_name, 120);
    end if;

    insert into leads (
      organization_id, workspace_id, name, phone, email, normalized_phone,
      source, status, priority, currency, created_by, updated_by
    ) values (
      v_org, p_workspace_id, coalesce(v_name, 'Meta Lead Ads contact'), p_phone_raw, p_normalized_email, p_normalized_phone,
      'facebook', 'new', 'low', coalesce(v_currency, 'USD'), v_actor, v_actor
    ) returning id into v_lead_id;
  else
    -- Case A/C: reuse. Conservative backfill only (Part 10) -- a NULL/empty
    -- identity field MAY be filled from a validated Meta value; an existing
    -- non-null value is NEVER overwritten. company/status/priority/owner/
    -- budget/qualification/score are not referenced here at all, so they are
    -- structurally untouched. leads.name is NOT NULL, so there is no
    -- reliable "missing name" signal -- name is intentionally never
    -- backfilled on an existing lead.
    update leads set
      email = case when email is null and p_normalized_email is not null then p_normalized_email else email end,
      phone = case when (phone is null or phone = '') and p_phone_raw is not null then p_phone_raw else phone end,
      normalized_phone = case when normalized_phone is null and p_normalized_phone is not null then p_normalized_phone else normalized_phone end
     where id = v_lead_id;
  end if;

  insert into meta_lead_crm_links (
    organization_id, workspace_id, lead_id, provider, provider_lead_id,
    connection_id, page_id, form_id, campaign_id, ad_id, ad_group_id
  ) values (
    v_org, p_workspace_id, v_lead_id, 'meta_leadgen', p_provider_lead_id,
    p_connection_id, p_page_id, p_form_id, p_campaign_id, p_ad_id, p_ad_group_id
  )
  on conflict (provider, provider_lead_id) do nothing;

  return query select v_lead_id, null::text;
end;
$$;

revoke all on function public.resolve_or_create_meta_lead_crm_identity(uuid, text, text, text, text, text, uuid, text, text, uuid, text, text) from public;
grant execute on function public.resolve_or_create_meta_lead_crm_identity(uuid, text, text, text, text, text, uuid, text, text, uuid, text, text) to service_role;

-- ============================================================================
-- ingest_meta_lead_to_crm: the single atomic per-row transaction (Part 16).
-- 1. locks/claims the staging row (atomic pending->processing compare-and-
--    swap -- two concurrent callers for the SAME row can never both succeed)
-- 2. validates tenant/property ownership at the mutation boundary
-- 3-7. resolves provider identity / CRM identity / creates-or-reuses lead /
--    creates-or-reuses property interest / creates the provider link, all via
--    resolve_or_create_meta_lead_crm_identity in the SAME transaction
-- 8. marks the staging row's terminal CRM state
-- 9. returns (outcome, error_code, lead_id, property_interest_created,
--    organization_id, workspace_id) -- the tenant ids are returned only so
--    the TS caller can attach a correctly-scoped activity_events row without
--    a second round trip; they carry no PII.
--
-- Never leaves partial state silently: a failure at any step marks the
-- staging row failed/identity_conflict with a closed error code in the SAME
-- transaction as the (rolled-back) attempted mutation, via a nested
-- begin/exception block acting as a savepoint -- the attempted lead/interest
-- writes roll back, but the failure record write (which runs AFTER that
-- rollback, inside the exception handler) persists normally. No exception is
-- ever re-raised out of this function, so the failure record is guaranteed to
-- commit rather than being undone by a further error.
-- ============================================================================
create or replace function public.ingest_meta_lead_to_crm(
  p_staging_id uuid
) returns table (
  outcome text,
  error_code text,
  lead_id uuid,
  property_interest_created boolean,
  organization_id uuid,
  workspace_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_property_ok boolean;
  v_lead_id uuid;
  v_identity_error text;
  v_interest_rows integer;
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  update meta_lead_ingestion_staging
     set crm_ingestion_status = 'processing', crm_attempt_count = crm_attempt_count + 1, updated_at = now()
   where id = p_staging_id and status = 'fetched' and crm_ingestion_status = 'pending'
  returning * into v_row;

  if not found then
    return query select 'skipped'::text, 'INVALID_STAGING_STATE'::text, null::uuid, false, null::uuid, null::uuid;
    return;
  end if;

  begin
    -- Property ownership is revalidated here, not merely trusted from
    -- staging (Part 15/34): must exist, belong to the SAME organization and
    -- workspace as the staging row, and not be soft-deleted.
    --
    -- PHASE DBV1D CORRECTION: this function's own RETURNS TABLE(...) clause
    -- declares organization_id/workspace_id OUT parameters, which are in
    -- scope for the entire function body. The bare organization_id/
    -- workspace_id below were ambiguous against those OUT parameters
    -- (confirmed via real local Postgres execution: SQLSTATE 42702). Only
    -- the two genuinely ambiguous references are qualified to the
    -- properties table; "id" has no colliding OUT parameter and is
    -- unchanged.
    select exists(
      select 1 from properties
       where id = v_row.property_id
         and properties.organization_id = v_row.organization_id
         and properties.workspace_id = v_row.workspace_id
         and deleted_at is null
    ) into v_property_ok;

    if v_row.property_id is null or not v_property_ok then
      update meta_lead_ingestion_staging
         set crm_ingestion_status = 'failed', crm_error_code = 'PROPERTY_NOT_FOUND', updated_at = now()
       where id = p_staging_id;
      return query select 'failed'::text, 'PROPERTY_NOT_FOUND'::text, null::uuid, false, v_row.organization_id, v_row.workspace_id;
      return;
    end if;

    select r.lead_id, r.error_code into v_lead_id, v_identity_error
      from resolve_or_create_meta_lead_crm_identity(
        v_row.workspace_id, v_row.leadgen_id, v_row.normalized_phone, v_row.normalized_phone_raw,
        v_row.normalized_email, v_row.normalized_full_name,
        v_row.connection_id, v_row.page_id, v_row.form_id, v_row.campaign_id, v_row.ad_id, v_row.ad_group_id
      ) r;

    if v_identity_error is not null then
      update meta_lead_ingestion_staging
         set crm_ingestion_status = 'identity_conflict', crm_error_code = v_identity_error, updated_at = now()
       where id = p_staging_id;
      return query select 'identity_conflict'::text, v_identity_error, null::uuid, false, v_row.organization_id, v_row.workspace_id;
      return;
    end if;

    begin
      -- Idempotent on the existing (lead_id, property_id) primary key (Part
      -- 13) -- never the update_lead RPC's delete-then-reinsert pattern,
      -- which would destroy this lead's OTHER pre-existing interests.
      --
      -- PHASE DBV1D CORRECTION: "on conflict (lead_id, property_id)" is
      -- ALSO ambiguous against this function's own RETURNS TABLE(...)
      -- lead_id OUT parameter (confirmed via real local Postgres execution:
      -- SQLSTATE 42702, same root cause as the property-ownership check
      -- above). A conflict target's column list cannot be table-aliased in
      -- standard SQL, so this targets the same primary key by name instead
      -- -- lead_property_interests_pkey, the deterministic default name for
      -- "primary key(lead_id,property_id)" declared in
      -- 20260813000000_sprint22_production_baseline.sql, unchanged since.
      insert into lead_property_interests (lead_id, property_id, organization_id, workspace_id)
      values (v_lead_id, v_row.property_id, v_row.organization_id, v_row.workspace_id)
      on conflict on constraint lead_property_interests_pkey do nothing;
      get diagnostics v_interest_rows = row_count;
    exception when others then
      update meta_lead_ingestion_staging
         set crm_ingestion_status = 'failed', crm_error_code = 'PROPERTY_INTEREST_FAILED', updated_at = now()
       where id = p_staging_id;
      return query select 'failed'::text, 'PROPERTY_INTEREST_FAILED'::text, v_lead_id, false, v_row.organization_id, v_row.workspace_id;
      return;
    end;

    update meta_lead_ingestion_staging
       set crm_ingestion_status = 'completed', crm_ingested_at = now(), crm_lead_id = v_lead_id,
           crm_error_code = null, updated_at = now()
     where id = p_staging_id;

    return query select 'completed'::text, null::text, v_lead_id, (v_interest_rows > 0), v_row.organization_id, v_row.workspace_id;
    return;
  exception when others then
    -- Any other unexpected error (e.g. inside identity resolution) -- never
    -- leaks a raw SQL error/PII, always a closed code, never re-raised.
    update meta_lead_ingestion_staging
       set crm_ingestion_status = 'failed', crm_error_code = 'CRM_WRITE_FAILED', updated_at = now()
     where id = p_staging_id;
    return query select 'failed'::text, 'CRM_WRITE_FAILED'::text, null::uuid, false, v_row.organization_id, v_row.workspace_id;
    return;
  end;
end;
$$;

revoke all on function public.ingest_meta_lead_to_crm(uuid) from public;
grant execute on function public.ingest_meta_lead_to_crm(uuid) to service_role;

-- ============================================================================
-- list_meta_lead_crm_pending_batch: read-only batch listing for the TS
-- processor loop. Does NOT claim -- true concurrency safety comes from
-- ingest_meta_lead_to_crm's own atomic pending->processing compare-and-swap,
-- so two processor invocations listing the same id is harmless (the second
-- call's claim simply affects 0 rows and returns 'skipped').
-- ============================================================================
create or replace function public.list_meta_lead_crm_pending_batch(
  p_limit integer default 20
) returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  return query
    select id from meta_lead_ingestion_staging
     where status = 'fetched' and crm_ingestion_status = 'pending'
     order by fetched_at
     limit greatest(p_limit, 1);
end;
$$;

revoke all on function public.list_meta_lead_crm_pending_batch(integer) from public;
grant execute on function public.list_meta_lead_crm_pending_batch(integer) to service_role;

-- ============================================================================
-- get_meta_lead_crm_ingestion_summary: counts-only diagnostic (Part 30),
-- mirroring get_meta_lead_ingestion_summary's exact shape -- never a PII
-- column, gated by ordinary tenant membership. Only counts rows that have
-- reached M4's 'fetched' state (crm_ingestion_status is meaningless before
-- that).
-- ============================================================================
create or replace function public.get_meta_lead_crm_ingestion_summary(
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
  select m.crm_ingestion_status, count(*)::bigint
    from meta_lead_ingestion_staging m
   where m.organization_id = v_org and m.workspace_id = p_workspace_id and m.status = 'fetched'
   group by m.crm_ingestion_status;
end;
$$;

revoke all on function public.get_meta_lead_crm_ingestion_summary(uuid) from public;
grant execute on function public.get_meta_lead_crm_ingestion_summary(uuid) to authenticated;

commit;
