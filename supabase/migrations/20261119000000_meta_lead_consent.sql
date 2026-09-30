-- Phase M6: Meta lead consent provenance + governed WhatsApp outreach
-- eligibility policy. NO WHATSAPP SEND. This migration only records consent
-- evidence and the admin-configured rule that produced it; it never touches
-- whatsapp_messages, communications, or any send path.
--
-- EXISTING CONSENT MODEL: none. A repository-wide search (consent, opt_in,
-- opt_out, marketing_consent, whatsapp_consent, sms_consent, email_consent,
-- privacy, terms, legal_basis, communication_preferences) found no lead-level
-- consent table, no channel-scoped preference row, and no opt-in/opt-out
-- event log anywhere. The only pre-existing artifact is
-- features/platform/conversion-analytics/components/ConsentManager.tsx, a
-- client-only cookie-consent banner for the public marketing site
-- (localStorage, no DB table, no tenant/lead scope) -- unrelated to CRM
-- consent and not reused here. leads.do_not_contact exists as a bare,
-- unscoped, never-written boolean (no code path sets it) -- M6 reads it as
-- an additional safety check in the eligibility service but does not build
-- it into a writer; it remains a separate, coarser global signal alongside
-- the new per-channel consent model. Both prior M4 and M5 test suites
-- explicitly assert consent/opt_in absence from their own diffs, confirming
-- this gap is deliberate, not an oversight -- M6 is greenfield here.
--
-- WHY NOT REUSE leads.do_not_contact AS THE WHOLE MODEL: it cannot answer
-- the primary product goal ("what exact form/source produced consent, what
-- text did they agree to, when") -- it is a single global boolean with zero
-- provenance and no channel/purpose distinction. It is retained as a coarse
-- override, not superseded or removed.
--
-- CANONICAL MODEL CHOICE: communication_consents, an APPEND-ONLY event log
-- (never UPDATEd in place). "Current effective status" for a
-- (lead, channel, purpose) is always the row with the latest recorded_at --
-- this is what lets a later revocation event override an earlier grant
-- (Part 12) without destroying the grant's own historical record, and what
-- lets a completely different future source (e.g. a WhatsApp inbound STOP
-- keyword, not built in M6) add a revocation row without colliding with
-- Meta-sourced rows. unique(staging_id, channel, purpose) is the per-source
-- idempotency guard: the SAME Meta staging row can never produce two
-- consent rows on processor replay, but a different source producing a
-- revocation for the same lead is a different row entirely.
--
-- WHY META FORM CONSENT REQUIRES EXPLICIT ADMIN CONFIGURATION (Part 5):
-- M5 already established the precedent of never trusting Meta's
-- custom_answers as canonical (see 20261118000000's own Part 57 test). M6
-- does not scan field names for words like "whatsapp"/"consent"/"agree" and
-- auto-enable outreach -- meta_lead_form_consent_rules is a deliberate,
-- versioned, admin-authored mapping ("field X with values [Yes, I agree]
-- means WhatsApp marketing consent, and here is the exact disclosure text
-- they saw"). No rule -> no possible "granted" outcome, ever, for that form.
--
-- WHY RULES ARE VERSIONED, NEVER MUTATED IN PLACE (Part 27): editing a rule
-- inserts a NEW row (next version, active=true) and deactivates the old one
-- (partial unique index on (form_mapping_id) where active=true, the exact
-- same idiom meta_lead_form_mappings already uses for (form_id) where
-- status='active'). A historical communication_consents row snapshots
-- consent_text/consent_version at evaluation time, so it forever reflects
-- the disclosure the lead actually saw -- never retroactively reinterpreted
-- if an admin later changes the wording (Part 26/27).
--
-- WHY NO HISTORICAL RE-EVALUATION (Part 26): a staging row is evaluated
-- against whatever rule is active AT THE TIME its M6 processing runs, and
-- once consent_processing_status='processed' it is never picked up again by
-- claim_meta_lead_consent_batch, even after an admin later configures a new
-- rule for that form. Re-deriving "consent" for a person who was never shown
-- a disclosure that did not exist yet when they submitted would be
-- retroactively manufacturing consent, which Part 26 explicitly forbids.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ============================================================================
-- M6 processing state on the M4/M5 staging row -- deliberately separate from
-- M4's own `status` and M5's `crm_ingestion_status`, same layering
-- convention both of those already established. Two states only
-- (pending/processing/processed): unlike M4's Graph fetch, consent
-- evaluation is pure local DB logic with no external call and no genuine
-- failure mode distinct from "ran and produced an outcome" -- there is
-- nothing here that needs a richer failure taxonomy.
-- ============================================================================
alter table public.meta_lead_ingestion_staging
  add column if not exists consent_processing_status text not null default 'pending'
    check (consent_processing_status in ('pending', 'processing', 'processed')),
  add column if not exists consent_processed_at timestamptz;

create index if not exists meta_lead_ingestion_staging_consent_pending_idx
  on public.meta_lead_ingestion_staging (crm_ingestion_status, consent_processing_status, crm_ingested_at)
  where crm_ingestion_status = 'completed' and consent_processing_status = 'pending';

-- ============================================================================
-- meta_lead_form_consent_rules: the explicit, admin-authored, versioned
-- mapping from a Meta Lead Form's custom field -> WhatsApp marketing
-- consent. V1 is deliberately narrow (channel/purpose are constrained to
-- exactly 'whatsapp'/'marketing' -- Part 3's "implement only what is
-- required for M6 if broadening adds unnecessary scope"); the columns are
-- named generically so a future phase can widen the check constraints
-- without a schema change.
-- ============================================================================
create table public.meta_lead_form_consent_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  workspace_id uuid not null references public.workspaces(id),
  form_mapping_id uuid not null references public.meta_lead_form_mappings(id),

  channel text not null default 'whatsapp' check (channel = 'whatsapp'),
  purpose text not null default 'marketing' check (purpose = 'marketing'),

  consent_field_name text not null,
  accepted_values text[] not null,
  consent_statement text not null,
  version integer not null default 1,

  active boolean not null default true,

  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index meta_lead_form_consent_rules_active_idx
  on public.meta_lead_form_consent_rules (form_mapping_id)
  where active = true;

alter table public.meta_lead_form_consent_rules enable row level security;

-- Tenant-scoped read only (the settings UI needs to show the currently
-- configured rule) -- all writes go through the two SECURITY DEFINER RPCs
-- below, mirroring meta_lead_form_mappings' own exact policy shape.
create policy "meta_lead_form_consent_rules_tenant_read" on public.meta_lead_form_consent_rules
  for select to authenticated
  using (public.is_organization_member(organization_id) and public.current_workspace_role(workspace_id) is not null);

-- ============================================================================
-- communication_consents: the canonical, append-only consent event log.
-- Never duplicates lead email/name/phone/custom answers (Part 29) --
-- consent_text is legal provenance (what the customer configured as the
-- disclosure), not lead PII. No raw Meta payload is ever stored.
-- ============================================================================
create table public.communication_consents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  workspace_id uuid not null references public.workspaces(id),
  lead_id uuid not null references public.leads(id),

  channel text not null check (channel in ('whatsapp', 'email', 'sms')),
  purpose text not null check (purpose in ('marketing', 'transactional')),
  status text not null check (status in ('granted', 'not_granted', 'unknown', 'revoked')),

  source_type text not null check (source_type = 'meta_lead_form'),
  source_id uuid references public.meta_lead_form_consent_rules(id),
  source_provider text,
  source_form_id text,
  provider_lead_id text,
  staging_id uuid references public.meta_lead_ingestion_staging(id),

  consent_text text,
  consent_version integer,

  granted_at timestamptz,
  revoked_at timestamptz,

  recorded_at timestamptz not null default now(),
  recorded_by uuid references auth.users(id),

  created_at timestamptz not null default now(),

  -- Per-source idempotency (Part 10): the SAME staging row can never
  -- produce two consent rows on processor replay. A different source
  -- (e.g. a future WhatsApp-inbound revocation) is a different row by
  -- construction (staging_id is null for a non-Meta-form source), so it is
  -- never blocked by this constraint -- "current effective status" is
  -- always the latest recorded_at row, never a single mutated one.
  unique (staging_id, channel, purpose)
);

create index communication_consents_lead_idx
  on public.communication_consents (organization_id, workspace_id, lead_id, channel, purpose, recorded_at desc);

alter table public.communication_consents enable row level security;

-- Tenant-scoped read only (Part 22's optional lead-page consent badge) --
-- all writes go through complete_meta_lead_consent_processing (service-role
-- only, below). No client can ever insert/update a consent row directly.
create policy "communication_consents_tenant_read" on public.communication_consents
  for select to authenticated
  using (public.is_organization_member(organization_id) and public.current_workspace_role(workspace_id) is not null);

-- ============================================================================
-- configure_meta_lead_form_consent_rule: owner-gated (can_manage_integrations,
-- the same DB-layer gate every other Meta Marketing write RPC already uses).
-- "Editing" a rule never mutates the active row in place -- it deactivates
-- the current active rule (if any) and inserts a new, higher-versioned one,
-- so historical consent events keep pointing at the exact statement/version
-- that was active when they were recorded (Part 27).
-- ============================================================================
create or replace function public.configure_meta_lead_form_consent_rule(
  p_workspace_id uuid,
  p_form_mapping_id uuid,
  p_consent_field_name text,
  p_accepted_values text[],
  p_consent_statement text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_next_version integer;
  v_id uuid;
begin
  select organization_id into v_org from workspaces where id = p_workspace_id;
  if not public.can_manage_integrations(p_workspace_id) then
    raise exception 'insufficient integration permission';
  end if;

  if not exists (
    select 1 from meta_lead_form_mappings
     where id = p_form_mapping_id and organization_id = v_org and workspace_id = p_workspace_id and status = 'active'
  ) then
    raise exception 'FORM_MAPPING_NOT_ACTIVE: mapping does not belong to this workspace or is not active';
  end if;

  if p_consent_field_name is null or length(trim(p_consent_field_name)) = 0 then
    raise exception 'INVALID_RULE: consent_field_name is required';
  end if;
  if p_accepted_values is null or array_length(p_accepted_values, 1) is null or array_length(p_accepted_values, 1) = 0 then
    raise exception 'INVALID_RULE: at least one accepted value is required';
  end if;
  if p_consent_statement is null or length(trim(p_consent_statement)) = 0 then
    raise exception 'INVALID_RULE: consent_statement is required';
  end if;

  select coalesce(max(version), 0) + 1 into v_next_version
    from meta_lead_form_consent_rules where form_mapping_id = p_form_mapping_id;

  update meta_lead_form_consent_rules
     set active = false, updated_at = now()
   where form_mapping_id = p_form_mapping_id and active = true;

  insert into meta_lead_form_consent_rules (
    organization_id, workspace_id, form_mapping_id,
    consent_field_name, accepted_values, consent_statement, version, active, created_by
  ) values (
    v_org, p_workspace_id, p_form_mapping_id,
    trim(p_consent_field_name), p_accepted_values, trim(p_consent_statement), v_next_version, true, auth.uid()
  ) returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.configure_meta_lead_form_consent_rule(uuid, uuid, text, text[], text) from public;
grant execute on function public.configure_meta_lead_form_consent_rule(uuid, uuid, text, text[], text) to authenticated;

-- ============================================================================
-- disable_meta_lead_form_consent_rule: active -> inactive only. History
-- retained (never deleted), matching disable_meta_lead_form_mapping exactly.
-- ============================================================================
create or replace function public.disable_meta_lead_form_consent_rule(
  p_workspace_id uuid,
  p_rule_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organization_id into v_org from workspaces where id = p_workspace_id;
  if not public.can_manage_integrations(p_workspace_id) then
    raise exception 'insufficient integration permission';
  end if;

  if not exists (
    select 1 from meta_lead_form_consent_rules
     where id = p_rule_id and organization_id = v_org and workspace_id = p_workspace_id and active = true
  ) then
    raise exception 'RULE_NOT_ACTIVE: rule does not belong to this workspace or is not active';
  end if;

  update meta_lead_form_consent_rules set active = false, updated_at = now() where id = p_rule_id;
end;
$$;

revoke all on function public.disable_meta_lead_form_consent_rule(uuid, uuid) from public;
grant execute on function public.disable_meta_lead_form_consent_rule(uuid, uuid) to authenticated;

-- ============================================================================
-- claim_meta_lead_consent_batch: atomic pending->processing compare-and-swap,
-- mirroring claim_meta_lead_detail_batch (M4) and the M5 claim inside
-- ingest_meta_lead_to_crm exactly. Only M5-completed rows (crm_ingestion_
-- status='completed') are ever eligible -- M6 never evaluates consent before
-- a CRM lead exists (Part 24).
-- ============================================================================
create or replace function public.claim_meta_lead_consent_batch(
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

  return query
  update meta_lead_ingestion_staging
     set consent_processing_status = 'processing', updated_at = now()
   where id in (
     select id from meta_lead_ingestion_staging
      where crm_ingestion_status = 'completed' and consent_processing_status = 'pending'
      order by crm_ingested_at
      limit greatest(p_limit, 1)
   )
  returning *;
end;
$$;

revoke all on function public.claim_meta_lead_consent_batch(integer) from public;
grant execute on function public.claim_meta_lead_consent_batch(integer) to service_role;

-- ============================================================================
-- complete_meta_lead_consent_processing: the single atomic completion RPC.
-- The evaluation DECISION (no_rule / unverifiable / granted / not_granted)
-- is always computed in TypeScript by the pure evaluateMetaLeadConsent()
-- function BEFORE calling this RPC -- this function only persists that
-- already-made decision atomically, exactly mirroring
-- complete_meta_lead_detail_fetch's own division of labor (SQL = atomic
-- state transition only, TS = business/decision logic, genuinely
-- unit-testable without live Postgres).
--
-- 'no_rule' and 'unverifiable' never write a communication_consents row
-- (Part 9's "avoid unnecessary rows if absence itself safely means
-- blocked") -- only 'granted' and 'not_granted' are decision-bearing enough
-- to record. Either way the staging row is marked processed, so it is never
-- reprocessed even if a rule is configured later (Part 26).
-- ============================================================================
create or replace function public.complete_meta_lead_consent_processing(
  p_staging_id uuid,
  p_outcome text,
  p_rule_id uuid,
  p_consent_text text,
  p_consent_version integer
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_consent_id uuid;
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  if p_outcome not in ('no_rule', 'unverifiable', 'granted', 'not_granted') then
    raise exception 'INVALID_OUTCOME: % is not a recognized consent outcome', p_outcome;
  end if;

  select * into v_row from meta_lead_ingestion_staging
   where id = p_staging_id and crm_ingestion_status = 'completed' and consent_processing_status = 'processing';
  if not found then
    raise exception 'STAGING_NOT_CLAIMED: row is not in a processing state';
  end if;

  if p_outcome in ('granted', 'not_granted') then
    insert into communication_consents (
      organization_id, workspace_id, lead_id, channel, purpose, status,
      source_type, source_id, source_provider, source_form_id, provider_lead_id, staging_id,
      consent_text, consent_version, granted_at, recorded_by
    ) values (
      v_row.organization_id, v_row.workspace_id, v_row.crm_lead_id, 'whatsapp', 'marketing', p_outcome,
      'meta_lead_form', p_rule_id, 'meta_leadgen', v_row.form_id, v_row.leadgen_id, p_staging_id,
      p_consent_text, p_consent_version, case when p_outcome = 'granted' then now() else null end, null
    )
    on conflict (staging_id, channel, purpose) do nothing
    returning id into v_consent_id;
  end if;

  update meta_lead_ingestion_staging
     set consent_processing_status = 'processed', consent_processed_at = now(), updated_at = now()
   where id = p_staging_id;

  return v_consent_id;
end;
$$;

revoke all on function public.complete_meta_lead_consent_processing(uuid, text, uuid, text, integer) from public;
grant execute on function public.complete_meta_lead_consent_processing(uuid, text, uuid, text, integer) to service_role;

commit;
