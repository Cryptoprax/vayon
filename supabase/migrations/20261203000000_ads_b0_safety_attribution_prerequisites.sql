-- Phase ADS-B0: three narrow, unrelated prerequisite fixes identified by the
-- V1 Ads Phase A architecture audit, closed BEFORE any ads-specific work
-- begins. This migration does not touch Meta, Google, OpenAI/Sora, or
-- WhatsApp integration code, and does not create any campaign/ad object.
--
-- ============================================================================
-- PART 1: Numeric quota enforcement for expensive AI creative generation
-- (image/video). Mirrors D2's proven atomic-enforcement principles exactly:
-- a SECURITY DEFINER function, an advisory lock (organization_usage has no
-- natural single row to lock before the first usage row for a given
-- workspace/metric/period exists -- same reasoning D2 documents for seats),
-- and hardcoded authoritative numbers sourced verbatim from
-- features/vayon/billing/config/entitlements.ts (subscriptionEntitlementCatalog),
-- not read from organization_limits/subscription_plans.limits (D2 already
-- found both stale for this exact purpose).
--
-- WHY image_generations AND video_generations SHARE ONE LIMIT (the existing
-- creative_assets ceiling) RATHER THAN EACH HAVING ITS OWN NUMBER:
-- features/vayon/billing/types/index.ts's BillingMetric type already
-- anticipates image_generations and video_projects as distinct metric
-- names, but no authoritative per-plan NUMERIC LIMIT was ever assigned to
-- either -- only to the combined creative_assets bucket in
-- subscriptionEntitlementCatalog. Usage is tracked as two SEPARATE metrics
-- below (image_generations, video_generations) for future analytics/billing
-- granularity, but the enforcement check sums both metrics' current-period
-- usage and compares that sum against the one number that has actually been
-- commercially approved (creative_assets). Do not read this as a permanent
-- design preference for combining them -- split the check the moment
-- product defines separate authoritative numbers for each. This is a
-- documented repository constraint (no invented commercial number), not an
-- oversight.
--
-- WHY THE RPC ACCEPTS BOTH authenticated AND service_role CALLERS:
-- C4's expensive provider call happens inside CreativeGenerationWorker
-- (features/vayon/creative-studio/generation.service.ts), which runs with a
-- service-role client (no user session, no auth.uid()) -- it must pass an
-- explicit workspace/organization id, which is safe because service_role is
-- already the trusted, non-customer-facing caller throughout this
-- repository (see claim_creative_generation/complete_creative_generation in
-- 20260912000000_sprint82_5_ai_creative_generation.sql for the identical
-- pattern). C5's expensive provider call happens inside a synchronous,
-- user-authenticated server action (features/vayon/video-studio/actions.ts)
-- -- here the function is called by authenticated, and internally verifies
-- the calling user is actually an active member of the passed workspace
-- (current_workspace_role(...) is not null) before ever touching that
-- workspace's usage row, the same ownership-check shape used throughout
-- (e.g. organization_seat_usage's is_organization_member(p_organization_id)
-- check). Skipped only for service_role, which has no session identity to
-- check against and is already trusted.
--
-- IDEMPOTENCY/RETRY BEHAVIOR (explicit, deliberate): this function is
-- called, and quota is claimed, on EVERY worker attempt for a job --
-- including a retry of the same job after a transient provider failure
-- (creative_generation_jobs.attempts increments on each retry, bounded by
-- its own small max_attempts ceiling, so this can never become an
-- unbounded loop). This is a conservative choice: it means a job that fails
-- for a reason unrelated to quota (e.g. a transient provider timeout) and
-- is retried consumes one additional quota unit per retry. The alternative
-- (claim only on the job's first attempt) would require tracking, per job,
-- whether a claim already succeeded -- and get it wrong in exactly the
-- case that matters most: a job whose FIRST attempt fails the quota check
-- itself (no usage was incremented, since the check-then-insert happens
-- atomically before the increment and rolls back on exception) must still
-- be able to claim quota on its next retry, not be waved through the
-- provider call unchecked because "attempt 1 already tried." Given the
-- explicit, non-negotiable requirement that quota enforcement must never
-- fail open, "occasionally over-charge a rare transient-failure retry" is
-- accepted as the safer trade-off over "ever let a job reach the provider
-- without a checked, current claim." Revisit only if real-world retry
-- volume makes this commercially unfair in practice.
--
-- BEHAVIOR WHEN THE PROVIDER FAILS AFTER INVOCATION BEGINS: quota is NOT
-- refunded. Once this function has incremented usage and returned
-- successfully, the calling code proceeds to the real provider call
-- immediately afterward with nothing else that can fail in between; if that
-- provider call itself then fails, the attempt is still considered
-- consumed (matching real provider billing risk, and avoiding a
-- retry-a-failing-prompt-for-free loophole). This function is called only
-- once the caller is certain it is about to invoke the provider -- it must
-- never be called speculatively or earlier in a request than that.
--
-- FAIL-CLOSED, NOT FAIL-OPEN: an unrecognized plan code, a missing
-- subscription, or an unrecognized metric name all raise an exception
-- (blocking generation) rather than silently allowing it.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create or replace function public.claim_creative_generation_quota(
  p_workspace_id uuid,
  p_organization_id uuid,
  p_metric text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_code text;
  v_limit integer;
  v_period_start date := date_trunc('month', now())::date;
  v_period_end date := (date_trunc('month', now()) + interval '1 month' - interval '1 day')::date;
  v_current_usage numeric;
  v_new_quantity numeric;
begin
  if p_metric not in ('image_generations', 'video_generations') then
    raise exception 'QUOTA_CONFIGURATION_ERROR: unsupported metric %', p_metric;
  end if;

  if current_setting('role', true) <> 'service_role' then
    if public.current_workspace_role(p_workspace_id) is null then
      raise exception 'insufficient workspace permission';
    end if;
    if not exists (
      select 1 from public.workspaces w
       where w.id = p_workspace_id and w.organization_id = p_organization_id
    ) then
      raise exception 'insufficient workspace permission';
    end if;
  end if;

  -- Serialize concurrent claims for the same workspace/period so two
  -- concurrent requests cannot both observe usage = limit - 1 and both
  -- proceed -- the same tool (and reasoning) as D2's
  -- pg_advisory_xact_lock(hashtext('org_seats:' || organization_id::text)).
  perform pg_advisory_xact_lock(hashtext('creative_quota:' || p_workspace_id::text || ':' || v_period_start::text));

  select p.code into v_plan_code
    from public.subscriptions s
    join public.subscription_plans p on p.id = s.plan_id
   where s.organization_id = p_organization_id
     and s.workspace_id = p_workspace_id
     and s.deleted_at is null
   order by s.created_at desc
   limit 1;

  if v_plan_code is null then
    raise exception 'SUBSCRIPTION_STATE_ERROR: no active subscription found for this workspace';
  end if;

  -- Same authoritative matrix as entitlements.ts's
  -- subscriptionEntitlementCatalog.quotas.creative_assets. See the header
  -- comment above for why image_generations/video_generations share it.
  v_limit := case v_plan_code
    when 'starter' then 25
    when 'professional' then 500
    when 'business' then 2500
    when 'business_plus' then 7500
    when 'enterprise' then null
    else -1
  end;

  if v_limit = -1 then
    raise exception 'QUOTA_CONFIGURATION_ERROR: unrecognized subscription plan %', v_plan_code;
  end if;

  if v_limit is not null then
    select coalesce(sum(quantity), 0) into v_current_usage
      from public.organization_usage
     where workspace_id = p_workspace_id
       and metric in ('image_generations', 'video_generations')
       and period_start = v_period_start;

    if v_current_usage >= v_limit then
      raise exception 'QUOTA_EXCEEDED: creative generation limit reached for the % plan (% of % used this period)', v_plan_code, v_current_usage, v_limit;
    end if;
  end if;

  insert into public.organization_usage(organization_id, workspace_id, metric, quantity, period_start, period_end)
  values (p_organization_id, p_workspace_id, p_metric, 1, v_period_start, v_period_end)
  on conflict (workspace_id, metric, period_start)
  do update set quantity = public.organization_usage.quantity + 1, updated_at = now()
  returning quantity into v_new_quantity;

  return jsonb_build_object(
    'metric', p_metric,
    'planCode', v_plan_code,
    'usage', v_new_quantity,
    'limit', v_limit,
    'periodStart', v_period_start
  );
end;
$$;

revoke all on function public.claim_creative_generation_quota(uuid, uuid, text) from public;
revoke all on function public.claim_creative_generation_quota(uuid, uuid, text) from anon;
grant execute on function public.claim_creative_generation_quota(uuid, uuid, text) to authenticated;
grant execute on function public.claim_creative_generation_quota(uuid, uuid, text) to service_role;

-- ============================================================================
-- PART 2: meta_lead_crm_links tenant-safe read access.
--
-- The table has carried RLS enabled with zero policies since its own
-- migration (20261118000000_meta_lead_crm_ingestion.sql), by explicit
-- design ("only service-role (RPC-mediated) access, no direct customer
-- read"). The audit found this over-broad: a workspace member cannot see
-- which Meta campaign/ad their own leads came from, at all, through any
-- application code path. This adds exactly one SELECT policy, scoped
-- identically to the established lead_property_interests pattern
-- (20260813000000_sprint22_production_baseline.sql), and changes nothing
-- else -- INSERT/UPDATE/DELETE remain service-role-only (no policy is added
-- for those operations), preserving the ingestion pipeline's existing
-- write boundary exactly.
-- ============================================================================
create policy "meta_lead_crm_links_workspace_read"
  on public.meta_lead_crm_links
  for select
  to authenticated
  using (
    public.is_organization_member(organization_id)
    and exists (
      select 1 from public.workspace_members wm
       where wm.workspace_id = meta_lead_crm_links.workspace_id
         and wm.user_id = auth.uid()
         and wm.status = 'active'
    )
  );

-- ============================================================================
-- PART 3: minimum campaign attribution key on deals, for eventual revenue
-- reporting (campaign -> lead attribution -> deal -> deal.value/status).
-- Nullable, additive only. No column is added to invoices in this phase --
-- the audit found no repository evidence requiring it now, and revenue can
-- be derived through deals alone for V1.
--
-- CROSS-TENANT INTEGRITY: a raw FK alone would let a deal in workspace A
-- reference a creative_campaigns row belonging to workspace B (deals and
-- creative_campaigns are both organization_id/workspace_id-scoped tables
-- with no shared parent constraint enforcing them to match). This adds a
-- trigger, mirroring this repository's established
-- raise-exception-on-violated-invariant trigger pattern (e.g.
-- prevent_crm_duplicates in 20260926000000_sprint194_real_estate_crm_
-- automation.sql), rather than a bare FK.
-- ============================================================================
alter table public.deals
  add column if not exists campaign_id uuid references public.creative_campaigns(id);

create or replace function public.enforce_deal_campaign_tenant_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.campaign_id is not null then
    if not exists (
      select 1 from public.creative_campaigns c
       where c.id = new.campaign_id
         and c.organization_id = new.organization_id
         and c.workspace_id = new.workspace_id
    ) then
      raise exception 'CROSS_TENANT_ATTRIBUTION_BLOCKED: campaign_id does not belong to this deal''s organization/workspace';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists deal_campaign_tenant_match on public.deals;
create trigger deal_campaign_tenant_match
  before insert or update of campaign_id, organization_id, workspace_id
  on public.deals
  for each row
  execute function public.enforce_deal_campaign_tenant_match();

-- ============================================================================
-- PART 4: attribution write path -- create_deal now auto-populates
-- campaign_id when (and only when) the deal's lead has exactly one
-- distinct campaign attribution in meta_lead_crm_links. This is the same
-- create-or-replace-in-place evolution pattern D2 itself used to evolve
-- accept_organization_invitation. No other behavior of create_deal changes;
-- the WHERE/exists property check, the permission check, and every other
-- column are unchanged from the sprint22 baseline definition.
--
-- ONE campaign: auto-populated (unambiguous, safe to attribute automatically).
-- MULTIPLE distinct campaigns for the same lead: left null (ambiguous origin
--   -- never fabricated by picking one arbitrarily).
-- NO campaign (organic/manual/other-channel lead, or no lead at all):
--   left null.
-- campaign_id is never settable by the client directly -- p_input is not
-- consulted for it at all, so this cannot be spoofed by a caller supplying
-- their own campaign_id in the JSONB payload.
-- ============================================================================
create or replace function public.create_deal(p_workspace_id uuid, p_input jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_id uuid;
  v_lead_id uuid := nullif(p_input->>'leadId', '')::uuid;
  v_campaign_id uuid;
begin
  select organization_id into v_org from workspace_members where workspace_id = p_workspace_id and user_id = auth.uid() and status = 'active';
  if v_org is null or not can_manage_deal(p_workspace_id) then
    raise exception 'insufficient deal permission';
  end if;

  if v_lead_id is not null then
    -- uuid has no built-in min()/max() aggregate, so the single unambiguous
    -- value (when exactly one distinct campaign_id exists) is taken via
    -- array_agg(distinct ...)[1] rather than min(campaign_id).
    select case when count(distinct campaign_id) = 1 then (array_agg(distinct campaign_id))[1] else null end
      into v_campaign_id
      from meta_lead_crm_links
     where lead_id = v_lead_id
       and campaign_id is not null;
  end if;

  insert into deals(organization_id, workspace_id, reference, name, lead_id, property_id, stage_id, value, currency, probability, expected_closing, assigned_agent_id, campaign_id, created_by, updated_by)
  select v_org, p_workspace_id, p_input->>'reference', p_input->>'name', v_lead_id, (p_input->>'propertyId')::uuid, p_input->>'stageId', (p_input->>'value')::numeric, upper(p_input->>'currency'), (p_input->>'probability')::integer, nullif(p_input->>'expectedClosing', '')::date, nullif(p_input->>'assignedAgentId', '')::uuid, v_campaign_id, auth.uid(), auth.uid()
   where exists (select 1 from properties p where p.id = (p_input->>'propertyId')::uuid and p.organization_id = v_org and p.workspace_id = p_workspace_id and p.deleted_at is null)
  returning id into v_id;

  if v_id is null then
    raise exception 'invalid property';
  end if;
  return v_id;
end;
$$;

commit;
