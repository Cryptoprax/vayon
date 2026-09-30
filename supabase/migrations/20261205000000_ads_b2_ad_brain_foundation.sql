-- Phase ADS-B2: VAYON Ad Brain / creative-intelligence foundation. Evaluates,
-- scores and explains ad creative BEFORE it ever reaches a provider. Does
-- NOT publish anything -- no Meta/Google/OpenAI-vision call exists anywhere
-- in this migration or its application layer; every provider is an
-- interface with a deterministic mock implementation for now (Part 14).
--
-- PART 1 AUDIT (repo-wide, before designing anything): campaign_strategy_
-- versions, campaign_creative_packages, creative_assets, creative_timeline
-- (20260911000000/20261123000000/20261124000000) are real, working tables.
-- creative_briefs is NOT a table -- briefs live as JSONB inside
-- campaign_creative_packages.output->'creativeBriefs'. Real, working
-- factual grounding already exists: getAuthoritativePropertyFacts (K3,
-- features/vayon/property-facts/services/authoritative-property-facts.
-- service.ts) and retrievePropertyKnowledge (K4), already consumed by
-- Campaign Strategist -- Ad Brain reuses both directly rather than
-- rebuilding fact retrieval. creative_brand_kits (20260911000000) is a
-- real, working canonical brand profile (colors, typography, fonts, tone,
-- legal_disclaimer, rera_information, social_links) -- reused by reference,
-- not duplicated. GrowthStudioService.review() (features/vayon/
-- creative-studio/growth.service.ts) returns hardcoded dummy numbers
-- (86, 84, 86...) regardless of input -- it is UI-demo scaffolding, not a
-- working creative-critique engine; nothing there is reused as logic, only
-- its dimension vocabulary (pricingConsistency, legalDisclaimer,
-- reraInformation, offerAccuracy) informed Part 4's dimension list below.
-- No image/video/vision analysis implementation exists anywhere in the
-- repository. No structured policy-rule engine exists; the only precedent
-- is campaign-strategist's generic api.moderations.create() content-safety
-- call, which is provider-specific and unrelated to a versioned rule table.
--
-- CANONICAL MODEL (Part 2): two new tables, not the "likely" three the
-- authorizing spec floated -- creative_evaluation_dimensions and
-- creative_policy_flags would each only ever be read/written as a unit
-- together with their parent evaluation row (never queried independently
-- across evaluations), so both live as JSONB on creative_evaluations,
-- exactly like campaign_strategy_versions.output already does for its own
-- structured AI result. ad_policy_rules is a genuinely separate relational
-- concept -- rule DEFINITIONS exist independently of any evaluation, are
-- independently versioned/dated, and many evaluations reference the same
-- rule -- so it is a real second table, not a JSONB blob.
--
-- creative_evaluations references creative_assets, creative_campaigns and
-- (nullably) campaign_channel_executions by id; it never duplicates their
-- columns.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ============================================================================
-- PART A: ad_policy_rules -- versioned, provider-neutral policy rule
-- definitions. Global reference data (no organization_id/workspace_id),
-- exactly like subscription_plans -- readable by every authenticated user,
-- writable only by migration/service_role, never by a customer-facing RPC.
-- Housing/real-estate ads are policy-sensitive across every major ad
-- platform (fair-housing, pricing-transparency and misleading-claims rules
-- apply specifically to real-estate); the seed rows below are a structural
-- placeholder for that category, NOT a verified snapshot of current Meta/
-- Google policy text -- EXTERNAL POLICY VERIFICATION REQUIRED before any
-- provider-publishing phase relies on them for a real compliance decision.
-- ============================================================================
create table if not exists public.ad_policy_rules(
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('meta','google','general')),
  market text not null default 'global',
  category text not null check (category in (
    'housing_special_category','misleading_claims','pricing_transparency',
    'before_after_imagery','prohibited_content','discriminatory_targeting','general'
  )),
  severity text not null check (severity in ('info','warning','blocking')),
  rule_key text not null,
  description text not null,
  machine_checkable boolean not null default false,
  requires_manual_review boolean not null default true,
  policy_version text not null,
  effective_from date not null default current_date,
  effective_to date,
  created_at timestamptz not null default now(),

  unique(provider, market, rule_key, policy_version),
  check (effective_to is null or effective_to > effective_from)
);
create index if not exists ad_policy_rules_lookup_idx on public.ad_policy_rules(provider, market, category) where effective_to is null;

alter table public.ad_policy_rules enable row level security;
drop policy if exists "ad_policy_rules_authenticated_read" on public.ad_policy_rules;
create policy "ad_policy_rules_authenticated_read" on public.ad_policy_rules
  for select to authenticated
  using (true);

-- Structural placeholder rows -- category/severity/shape only, not a
-- verified snapshot of live Meta/Google policy text (see header comment).
insert into public.ad_policy_rules(provider, market, category, severity, rule_key, description, machine_checkable, requires_manual_review, policy_version)
values
  ('general', 'global', 'housing_special_category', 'blocking', 'housing_no_discriminatory_targeting', 'Housing ads must not target or exclude an audience by protected characteristics (structural placeholder -- verify current platform special-ad-category rules before publishing).', false, true, 'placeholder-2026'),
  ('general', 'global', 'pricing_transparency', 'warning', 'housing_price_must_match_listing', 'Any price stated in ad copy must match the authoritative current listing price (checkable against property-facts).', true, true, 'placeholder-2026'),
  ('general', 'global', 'misleading_claims', 'warning', 'no_unverifiable_superlatives', 'Superlative claims ("best", "guaranteed") that cannot be checked against authoritative facts should be flagged for review.', true, false, 'placeholder-2026'),
  ('general', 'global', 'before_after_imagery', 'warning', 'no_misleading_generated_render', 'AI-generated or rendered imagery must not be presented as an actual photo of current property condition without disclosure.', false, true, 'placeholder-2026')
on conflict (provider, market, rule_key, policy_version) do nothing;

-- ============================================================================
-- PART B: creative_evaluations -- one evaluation per (creative_asset,
-- channel_execution, version). Dimension scores / blocking issues /
-- warnings / recommendations / evidence / policy flags / extracted claims
-- are JSONB (Part 11's result shape) since they are always read and written
-- together with their parent row, mirroring campaign_strategy_versions.
-- output's own precedent. channel_execution_id is nullable: an evaluation
-- can exist before any channel is selected (property/creative-level checks
-- like factual accuracy do not depend on a channel), but placement/
-- aspect-ratio dimensions are only meaningful once one is.
-- ============================================================================
create table if not exists public.creative_evaluations(
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  campaign_id uuid not null references public.creative_campaigns(id) on delete cascade,
  creative_asset_id uuid not null references public.creative_assets(id) on delete cascade,
  channel_execution_id uuid references public.campaign_channel_executions(id),
  version integer not null check (version > 0),

  status text not null default 'pending'
    check (status in ('pending','evaluating','passed','needs_review','rejected','failed')),

  claims jsonb not null default '[]'::jsonb,
  dimension_scores jsonb not null default '{}'::jsonb,
  blocking_issues jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  evidence_refs jsonb not null default '[]'::jsonb,
  policy_flags jsonb not null default '[]'::jsonb,

  provider text,
  model text,
  evaluation_version text,
  diagnostic text,

  attempts integer not null default 0,
  max_attempts integer not null default 3 check (max_attempts between 1 and 5),

  requested_by uuid not null references auth.users(id),
  requested_at timestamptz not null default now(),
  claimed_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),

  unique(creative_asset_id, channel_execution_id, version)
);
create index if not exists creative_evaluation_tenant_idx
  on public.creative_evaluations(organization_id, workspace_id, campaign_id, creative_asset_id, version desc);
-- Idempotency (Part 17): at most one in-flight (pending/evaluating)
-- evaluation per (creative_asset, channel_execution) pair at a time --
-- mirrors campaign_lead_forms' campaign_lead_form_one_active_creation_idx
-- exactly. A NULL channel_execution_id is a single value for uniqueness
-- purposes (Postgres partial-index semantics), so a channel-less and a
-- channel-scoped evaluation for the same creative never collide.
create unique index if not exists creative_evaluation_one_inflight_idx
  on public.creative_evaluations(creative_asset_id, coalesce(channel_execution_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status in ('pending','evaluating');

alter table public.creative_evaluations enable row level security;
drop policy if exists "creative_evaluation_read" on public.creative_evaluations;
create policy "creative_evaluation_read" on public.creative_evaluations
  for select to authenticated
  using (public.creative_studio_member(organization_id, workspace_id));
-- No direct INSERT/UPDATE/DELETE policy: every write goes through the
-- SECURITY DEFINER RPCs below, exactly like campaign_lead_forms/
-- campaign_channel_executions.

-- ============================================================================
-- request_creative_evaluation: idempotent evaluation request. Model C --
-- both a human re-requesting evaluation on an existing asset AND a future
-- automated pipeline (e.g. immediately after complete_creative_generation)
-- are legitimate callers, mirroring transition_campaign_channel_execution's
-- dual-caller justification. Returns the existing in-flight row's id if one
-- already exists (idempotent, never a unique-violation the caller must
-- handle), or starts a new version if the latest version for this creative/
-- channel pair is 'failed' or 'rejected' (retryable) -- but never if the
-- latest is 'passed' or 'needs_review' (a human must act on those first,
-- not silently get a second competing evaluation).
-- ============================================================================
create or replace function public.request_creative_evaluation(
  p_creative_asset_id uuid,
  p_channel_execution_id uuid default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  w uuid; o uuid; a public.creative_assets%rowtype; v_existing uuid; v_latest_status text; v_version integer;
begin
  if current_setting('role', true) = 'service_role' then
    select * into a from public.creative_assets where id = p_creative_asset_id for update;
    if not found then
      raise exception 'invalid creative asset';
    end if;
    o := a.organization_id;
    w := a.workspace_id;
  else
    select wm.workspace_id, wm.organization_id into w, o
      from public.workspace_members wm
     where wm.user_id = auth.uid() and wm.status = 'active'
     order by wm.created_at limit 1;
    if w is null or not public.creative_studio_manage(w) then
      raise exception 'insufficient creative evaluation permission';
    end if;
    select * into a from public.creative_assets where id = p_creative_asset_id and organization_id = o and workspace_id = w for update;
    if not found then
      raise exception 'invalid creative asset';
    end if;
  end if;

  if p_channel_execution_id is not null then
    if not exists (
      select 1 from public.campaign_channel_executions
       where id = p_channel_execution_id and organization_id = o and workspace_id = w and campaign_id = a.campaign_id
    ) then
      raise exception 'invalid campaign channel execution';
    end if;
  end if;

  select id into v_existing from public.creative_evaluations
   where creative_asset_id = p_creative_asset_id
     and coalesce(channel_execution_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(p_channel_execution_id, '00000000-0000-0000-0000-000000000000'::uuid)
     and status in ('pending', 'evaluating');
  if v_existing is not null then
    return v_existing;
  end if;

  select status, version into v_latest_status, v_version from public.creative_evaluations
   where creative_asset_id = p_creative_asset_id
     and coalesce(channel_execution_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(p_channel_execution_id, '00000000-0000-0000-0000-000000000000'::uuid)
   order by version desc limit 1;

  if v_latest_status in ('passed', 'needs_review') then
    raise exception 'EVALUATION_ALREADY_DECIDED: latest evaluation is % -- act on it before requesting another', v_latest_status;
  end if;

  v_version := coalesce(v_version, 0) + 1;

  insert into public.creative_evaluations(organization_id, workspace_id, campaign_id, creative_asset_id, channel_execution_id, version, status, requested_by)
  values (o, w, a.campaign_id, p_creative_asset_id, p_channel_execution_id, v_version, 'pending', coalesce(auth.uid(), a.created_by))
  returning id into v_existing;

  insert into public.creative_timeline(organization_id, workspace_id, campaign_id, asset_id, event_type, ai_employee, metadata, actor_id)
  values (o, w, a.campaign_id, a.id, 'creative.evaluation.requested', 'Ad Brain',
    jsonb_build_object('evaluation_id', v_existing, 'version', v_version, 'channel_execution_id', p_channel_execution_id, 'recommendation_only', true, 'live_publishing', false),
    coalesce(auth.uid(), a.created_by));

  return v_existing;
end;
$$;

-- ============================================================================
-- claim_creative_evaluation: atomic trusted-worker claim. Model B
-- (service_role only) -- mirrors claim_creative_generation exactly,
-- including `for update skip locked` so concurrent workers never claim the
-- same row twice.
-- ============================================================================
create or replace function public.claim_creative_evaluation(p_evaluation_id uuid) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare e public.creative_evaluations%rowtype;
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  select * into e from public.creative_evaluations
   where id = p_evaluation_id and (status = 'pending' or (status = 'failed' and attempts < max_attempts))
   for update skip locked;
  if not found then
    return null;
  end if;

  update public.creative_evaluations
     set status = 'evaluating', attempts = attempts + 1, claimed_at = now(), diagnostic = null, updated_at = now()
   where id = e.id;

  return to_jsonb(e) || jsonb_build_object('status', 'evaluating', 'attempts', e.attempts + 1);
end;
$$;

-- ============================================================================
-- complete_creative_evaluation: trusted-worker completion. Model B
-- (service_role only). FAIL-CLOSED BY CONSTRUCTION (Part 17's "uncertain
-- provider outcome cannot silently mark PASS"): when p_success is false,
-- status becomes 'failed' unconditionally -- the function never reads a
-- caller-supplied status/overall_status out of p_result for the failure
-- path, so a provider payload that happens to contain the string "passed"
-- cannot leak into a passed evaluation. On success, p_overall_status must
-- itself be one of the three genuine terminal outcomes (fail-closed against
-- a provider bug sending 'pending'/'evaluating' as if it were a result).
-- ============================================================================
create or replace function public.complete_creative_evaluation(
  p_evaluation_id uuid,
  p_success boolean,
  p_overall_status text,
  p_claims jsonb,
  p_dimension_scores jsonb,
  p_blocking_issues jsonb,
  p_warnings jsonb,
  p_recommendations jsonb,
  p_evidence_refs jsonb,
  p_policy_flags jsonb,
  p_provider text,
  p_model text,
  p_evaluation_version text,
  p_diagnostic text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare e public.creative_evaluations%rowtype;
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  select * into e from public.creative_evaluations where id = p_evaluation_id and status = 'evaluating' for update;
  if not found then
    raise exception 'evaluation is not awaiting completion';
  end if;

  if not p_success then
    update public.creative_evaluations
       set status = case when e.attempts < e.max_attempts then 'pending' else 'failed' end,
           diagnostic = left(coalesce(p_diagnostic, 'provider_exception'), 200),
           updated_at = now()
     where id = e.id;

    insert into public.creative_timeline(organization_id, workspace_id, campaign_id, asset_id, event_type, ai_employee, metadata, actor_id)
    values (e.organization_id, e.workspace_id, e.campaign_id, e.creative_asset_id, 'creative.evaluation.failed', 'Ad Brain',
      jsonb_build_object('evaluation_id', e.id, 'diagnostic', left(coalesce(p_diagnostic, 'provider_exception'), 200), 'retry_available', e.attempts < e.max_attempts),
      e.requested_by);
    return;
  end if;

  if p_overall_status not in ('passed', 'needs_review', 'rejected') then
    raise exception 'EVALUATION_CONFIGURATION_ERROR: unsupported terminal status %', p_overall_status;
  end if;

  -- Blocking-overrides-score invariant (Part 11): a caller sending
  -- overall_status='passed' alongside a non-empty blocking_issues array or
  -- any policy_flags entry with severity='blocking' is a provider/caller
  -- bug, not a valid result -- reject rather than silently downgrade or
  -- silently trust the caller's own status claim.
  if p_overall_status = 'passed' and (
    jsonb_array_length(coalesce(p_blocking_issues, '[]'::jsonb)) > 0
    or exists (select 1 from jsonb_array_elements(coalesce(p_policy_flags, '[]'::jsonb)) f where f->>'severity' = 'blocking')
  ) then
    raise exception 'EVALUATION_CONFIGURATION_ERROR: overall_status cannot be passed while a blocking issue or blocking policy flag is present';
  end if;

  update public.creative_evaluations
     set status = p_overall_status,
         claims = coalesce(p_claims, '[]'::jsonb),
         dimension_scores = coalesce(p_dimension_scores, '{}'::jsonb),
         blocking_issues = coalesce(p_blocking_issues, '[]'::jsonb),
         warnings = coalesce(p_warnings, '[]'::jsonb),
         recommendations = coalesce(p_recommendations, '[]'::jsonb),
         evidence_refs = coalesce(p_evidence_refs, '[]'::jsonb),
         policy_flags = coalesce(p_policy_flags, '[]'::jsonb),
         provider = p_provider,
         model = p_model,
         evaluation_version = p_evaluation_version,
         diagnostic = null,
         completed_at = now(),
         updated_at = now()
   where id = e.id;

  insert into public.creative_timeline(organization_id, workspace_id, campaign_id, asset_id, event_type, ai_employee, metadata, actor_id)
  values (e.organization_id, e.workspace_id, e.campaign_id, e.creative_asset_id, 'creative.evaluation.completed', 'Ad Brain',
    jsonb_build_object('evaluation_id', e.id, 'overall_status', p_overall_status, 'recommendation_only', true, 'live_publishing', false),
    e.requested_by);
end;
$$;

-- ============================================================================
-- are_required_creatives_evaluated: Part 21's ADS-B1 integration read.
-- Read-only, tenant-scoped, does not touch campaign_channel_executions.
-- status or transition_campaign_channel_execution in any way -- it only
-- reports counts so a future UI/approval step can ask the question; it
-- never gates or performs a transition itself.
-- ============================================================================
create or replace function public.are_required_creatives_evaluated(
  p_campaign_id uuid,
  p_channel_execution_id uuid default null
) returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare w uuid; o uuid; v_result jsonb;
begin
  select wm.workspace_id, wm.organization_id into w, o
    from public.workspace_members wm
   where wm.user_id = auth.uid() and wm.status = 'active'
   order by wm.created_at limit 1;
  if w is null or public.current_workspace_role(w) is null then
    raise exception 'insufficient campaign channel permission';
  end if;

  if not exists (select 1 from public.creative_campaigns where id = p_campaign_id and organization_id = o and workspace_id = w) then
    raise exception 'invalid campaign';
  end if;

  select jsonb_build_object(
    'passed', count(*) filter (where ce.status = 'passed'),
    'needsReview', count(*) filter (where ce.status = 'needs_review'),
    'rejected', count(*) filter (where ce.status = 'rejected'),
    'pendingOrEvaluating', count(*) filter (where ce.status in ('pending', 'evaluating')),
    'failed', count(*) filter (where ce.status = 'failed'),
    'allPassed', bool_and(ce.status = 'passed'),
    'anyRejected', bool_or(ce.status = 'rejected')
  ) into v_result
  from (
    select distinct on (creative_asset_id) *
      from public.creative_evaluations
     where campaign_id = p_campaign_id
       and organization_id = o and workspace_id = w
       and (p_channel_execution_id is null or channel_execution_id = p_channel_execution_id)
     order by creative_asset_id, version desc
  ) ce;

  return coalesce(v_result, jsonb_build_object('passed', 0, 'needsReview', 0, 'rejected', 0, 'pendingOrEvaluating', 0, 'failed', 0, 'allPassed', false, 'anyRejected', false));
end;
$$;

revoke all on function public.request_creative_evaluation(uuid, uuid) from public;
revoke all on function public.request_creative_evaluation(uuid, uuid) from anon;
grant execute on function public.request_creative_evaluation(uuid, uuid) to authenticated;
grant execute on function public.request_creative_evaluation(uuid, uuid) to service_role;

revoke all on function public.claim_creative_evaluation(uuid) from public;
revoke all on function public.claim_creative_evaluation(uuid) from anon;
revoke all on function public.claim_creative_evaluation(uuid) from authenticated;
grant execute on function public.claim_creative_evaluation(uuid) to service_role;

revoke all on function public.complete_creative_evaluation(uuid, boolean, text, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text, text, text, text) from public;
revoke all on function public.complete_creative_evaluation(uuid, boolean, text, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text, text, text, text) from anon;
revoke all on function public.complete_creative_evaluation(uuid, boolean, text, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text, text, text, text) from authenticated;
grant execute on function public.complete_creative_evaluation(uuid, boolean, text, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text, text, text, text) to service_role;

revoke all on function public.are_required_creatives_evaluated(uuid, uuid) from public;
revoke all on function public.are_required_creatives_evaluated(uuid, uuid) from anon;
revoke all on function public.are_required_creatives_evaluated(uuid, uuid) from service_role;
grant execute on function public.are_required_creatives_evaluated(uuid, uuid) to authenticated;

commit;
