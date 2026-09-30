-- Phase ADS-B1: cross-channel campaign domain foundation. No provider
-- publishing. Meta/Google adapters remain absent -- this migration only
-- creates the shared, provider-neutral state a future C7 publish worker will
-- read and write.
--
-- CANONICAL CAMPAIGN MODEL (Part 1 of the authorizing spec): public.
-- creative_campaigns remains the single customer-facing campaign row. No
-- parallel "ads_campaigns" table is introduced. campaign_strategy_versions,
-- campaign_creative_packages and campaign_lead_forms already reference
-- creative_campaigns(id) as campaign_id and are left untouched. ADS-B1 adds
-- exactly the objects those four do not already provide: a campaign-level
-- publishing lifecycle state, a normalized per-channel provider execution
-- record, budget intent, targeting intent, and the creative/attribution
-- linkage from a variant to the channel it was made for.
--
-- WHY publishing_status IS A NEW COLUMN, NOT A REUSE OF creative_campaigns.
-- status: that column is a CHECK-constrained creative-workflow state
-- ('draft'..'ready-to-publish', 20260911000000) tracking asset review/
-- approval, unrelated to whether any channel execution has actually been
-- published. Reusing it would conflate two independent lifecycles. The new
-- publishing_status column is the "SHARED VAYON CAMPAIGN" state from the
-- authorizing spec's diagram; campaign_channel_executions.status (below) is
-- the separate per-provider state the spec requires to remain distinct.
--
-- WHY CHANNEL SELECTION AND PROVIDER EXECUTION ARE ONE TABLE, NOT TWO:
-- selecting a channel for a campaign and creating that channel's execution
-- record are the same event -- there is no meaningful state in which a
-- channel is "selected" but has no execution row, and a normalized
-- campaign_id/provider join table with nothing else in it would immediately
-- need every column Part 4 already requires. campaign_channel_executions is
-- both the join table (Part 3) and the provider execution model (Part 4).
--
-- WHY provider_account_id IS A BARE TEXT COLUMN, NOT A FOREIGN KEY: it holds
-- the provider's own native account identifier (e.g. a Meta ad_account_id,
-- exactly as already stored unciphered on meta_marketing_connections.
-- ad_account_id). It cannot be a single FK to meta_marketing_connections,
-- because a 'google' row must be able to populate the same column once a
-- Google-equivalent connections table exists, and building that table now
-- would be OAuth/provider work explicitly out of scope for this phase. No
-- secret or token is ever stored here or anywhere else in this migration.
--
-- WHY THE APPROVAL INVARIANT IS ENFORCED IN THE DATABASE, NOT ONLY IN THE
-- APPLICATION: transition_campaign_channel_execution() is the single
-- function through which an execution's status can change. It hard-blocks
-- any transition into 'publishing' or 'active' unless a matching
-- approval_requests row (source_type='campaign_channel_execution',
-- action_type='campaign_channel_publish') is status='approved' -- reusing
-- D1's existing request_approval()/decide_approval() RPCs unmodified. This
-- makes "no provider publishing operation may proceed unless approved" a
-- structural fact a future C7 worker cannot bypass by skipping an
-- application-layer check, mirroring why claim_creative_generation_quota
-- (ADS-B0) enforces its invariant in SQL rather than trusting every caller.
--
-- WHY BUDGET INTENT IS VERSIONED WITH ONE ACCEPTED ROW AT A TIME: this is
-- the exact shape campaign_strategy_versions and campaign_creative_packages
-- already use (draft rows accumulate, exactly one accepted at a time via a
-- partial unique index) -- reusing a proven pattern rather than inventing a
-- new versioning shape. accept_campaign_budget_intent() additionally
-- requires an approved approval_requests row (action_type=
-- 'campaign_budget_change'), which is what makes "material budget changes
-- must be approval-governed" true.
--
-- WHY TARGETING INTENT IS A SINGLE UNVERSIONED ROW, NOT APPROVAL-GATED:
-- unlike budget, targeting intent carries no direct spend commitment -- it
-- is descriptive campaign-audience data a provider adapter will translate
-- later (Part 8 explicitly defers policy-specific encoding to that future
-- adapter). One row per campaign, upsertable, is the minimum needed now;
-- versioning/approval can be added later if a real commercial reason
-- emerges.
--
-- WHY creative_assets GETS TWO NEW NULLABLE COLUMNS INSTEAD OF A NEW TABLE:
-- channel_execution_id links a specific creative variant to the channel
-- execution it was produced for (Part 7's "multiple creative variants per
-- channel", Part 9's attribution chain), and provider_ad_id is the future
-- ad-level identifier a real publish would receive. Both are nullable and
-- additive; creative_assets remains the single owner of asset data, so no
-- ownership is duplicated.
--
-- SCOPE: no Meta/Google API call, no OAuth change, no provider write, no
-- pricing/commercial-quota change, no ALTER DEFAULT PRIVILEGES, no
-- historical migration edited.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ============================================================================
-- PART A: shared campaign publishing lifecycle state.
-- ============================================================================
alter table public.creative_campaigns
  add column if not exists publishing_status text not null default 'draft'
    check (publishing_status in (
      'draft','ready_for_review','approved','publishing','active','paused','completed','failed','uncertain'
    ));

-- ============================================================================
-- PART B: campaign_channel_executions -- channel selection + provider
-- execution model, one row per (campaign_id, provider).
-- ============================================================================
create table if not exists public.campaign_channel_executions(
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  campaign_id uuid not null references public.creative_campaigns(id) on delete cascade,
  provider text not null check (provider in ('meta','google')),

  provider_account_id text,
  provider_campaign_id text,

  status text not null default 'draft'
    check (status in (
      'draft','ready_for_review','approved','publishing','active','paused','completed','failed','uncertain'
    )),
  publish_attempt_count integer not null default 0 check (publish_attempt_count >= 0),
  last_error_code text,
  last_error_message text,
  last_synced_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,

  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(campaign_id, provider)
);
create index if not exists campaign_channel_execution_tenant_idx
  on public.campaign_channel_executions(organization_id, workspace_id, campaign_id);

alter table public.campaign_channel_executions enable row level security;
drop policy if exists "campaign_channel_execution_read" on public.campaign_channel_executions;
create policy "campaign_channel_execution_read" on public.campaign_channel_executions
  for select to authenticated
  using (public.creative_studio_member(organization_id, workspace_id));
drop policy if exists "campaign_channel_execution_write" on public.campaign_channel_executions;
create policy "campaign_channel_execution_write" on public.campaign_channel_executions
  for all to authenticated
  using (public.creative_studio_member(organization_id, workspace_id) and public.creative_studio_manage(workspace_id))
  with check (public.creative_studio_member(organization_id, workspace_id) and public.creative_studio_manage(workspace_id));

-- create_campaign_channel_execution: idempotent channel selection. Returns
-- the existing row's id if this campaign/provider pair already has one
-- (mirrors enqueue_campaign_image_generation's existing-job dedup shape),
-- rather than raising a unique-violation the caller must handle specially.
create or replace function public.create_campaign_channel_execution(
  p_campaign_id uuid,
  p_provider text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  w uuid; o uuid; c public.creative_campaigns%rowtype; v_id uuid;
begin
  select wm.workspace_id, wm.organization_id into w, o
    from public.workspace_members wm
   where wm.user_id = auth.uid() and wm.status = 'active'
   order by wm.created_at limit 1;
  if w is null or not public.creative_studio_manage(w) then
    raise exception 'insufficient campaign channel permission';
  end if;

  if p_provider not in ('meta', 'google') then
    raise exception 'unsupported channel provider %', p_provider;
  end if;

  select * into c from public.creative_campaigns where id = p_campaign_id and organization_id = o and workspace_id = w for update;
  if not found then
    raise exception 'invalid campaign';
  end if;

  select id into v_id from public.campaign_channel_executions
   where campaign_id = p_campaign_id and provider = p_provider;
  if v_id is not null then
    return v_id;
  end if;

  insert into public.campaign_channel_executions(organization_id, workspace_id, campaign_id, provider, status, created_by)
  values (o, w, p_campaign_id, p_provider, 'draft', auth.uid())
  returning id into v_id;

  insert into public.creative_timeline(organization_id, workspace_id, campaign_id, event_type, ai_employee, metadata, actor_id)
  values (o, w, p_campaign_id, 'campaign.channel.selected', 'Campaign Strategist',
    jsonb_build_object('execution_id', v_id, 'provider', p_provider, 'recommendation_only', true, 'live_publishing', false), auth.uid());

  return v_id;
end;
$$;

-- is_source_approved: reusable approval-invariant checker against D1's
-- existing approval_requests table. A source is approved only if its most
-- recent request_approval() call for that exact (source_type, source_id,
-- action_type) triple was decided 'approved' -- an older approval does not
-- retroactively cover a newer request for the same source/action.
create or replace function public.is_source_approved(
  p_organization_id uuid,
  p_workspace_id uuid,
  p_source_type text,
  p_source_id uuid,
  p_action_type text
) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select status = 'approved'
       from public.approval_requests
      where organization_id = p_organization_id
        and workspace_id = p_workspace_id
        and source_type = p_source_type
        and source_id = p_source_id
        and action_type = p_action_type
      order by requested_at desc
      limit 1),
    false
  )
$$;

-- transition_campaign_channel_execution: the single function through which
-- an execution's status may change. Enforces the required invariant --
-- "no provider publishing operation may proceed unless approved" -- as a
-- hard, non-bypassable check for the 'publishing'/'active' transitions.
-- Callable by authenticated (user-driven review transitions) and
-- service_role (a future C7 provider-sync worker updating status from a
-- webhook/poll with no user session) -- no provider is called here in
-- either case; this function only records status, never invokes one.
create or replace function public.transition_campaign_channel_execution(
  p_execution_id uuid,
  p_status text,
  p_error_code text default null,
  p_error_message text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  w uuid; o uuid; e public.campaign_channel_executions%rowtype; v_is_service boolean;
begin
  v_is_service := current_setting('role', true) = 'service_role';

  if p_status not in ('draft','ready_for_review','approved','publishing','active','paused','completed','failed','uncertain') then
    raise exception 'EXECUTION_CONFIGURATION_ERROR: unsupported execution status %', p_status;
  end if;

  if v_is_service then
    select * into e from public.campaign_channel_executions where id = p_execution_id for update;
  else
    select wm.workspace_id, wm.organization_id into w, o
      from public.workspace_members wm
     where wm.user_id = auth.uid() and wm.status = 'active'
     order by wm.created_at limit 1;
    if w is null or not public.creative_studio_manage(w) then
      raise exception 'insufficient campaign channel permission';
    end if;
    select * into e from public.campaign_channel_executions where id = p_execution_id and organization_id = o and workspace_id = w for update;
  end if;

  if not found then
    raise exception 'invalid campaign channel execution';
  end if;

  if p_status in ('publishing', 'active') then
    if not public.is_source_approved(e.organization_id, e.workspace_id, 'campaign_channel_execution', e.id, 'campaign_channel_publish') then
      raise exception 'APPROVAL_REQUIRED: campaign channel execution % is not approved for publishing', e.id;
    end if;
  end if;

  update public.campaign_channel_executions
     set status = p_status,
         publish_attempt_count = case when p_status = 'publishing' then publish_attempt_count + 1 else publish_attempt_count end,
         last_error_code = case when p_status = 'failed' then p_error_code else last_error_code end,
         last_error_message = case when p_status = 'failed' then p_error_message else last_error_message end,
         last_synced_at = case when v_is_service then now() else last_synced_at end,
         updated_at = now()
   where id = e.id;

  insert into public.creative_timeline(organization_id, workspace_id, campaign_id, event_type, ai_employee, metadata, actor_id)
  values (e.organization_id, e.workspace_id, e.campaign_id, 'campaign.channel.status_changed', 'Campaign Strategist',
    jsonb_build_object('execution_id', e.id, 'provider', e.provider, 'from_status', e.status, 'to_status', p_status, 'recommendation_only', true, 'live_publishing', false),
    coalesce(auth.uid(), e.created_by));
end;
$$;

revoke all on function public.create_campaign_channel_execution(uuid, text) from public;
revoke all on function public.create_campaign_channel_execution(uuid, text) from anon;
grant execute on function public.create_campaign_channel_execution(uuid, text) to authenticated;

revoke all on function public.is_source_approved(uuid, uuid, text, uuid, text) from public;
revoke all on function public.is_source_approved(uuid, uuid, text, uuid, text) from anon;
grant execute on function public.is_source_approved(uuid, uuid, text, uuid, text) to authenticated;
grant execute on function public.is_source_approved(uuid, uuid, text, uuid, text) to service_role;

revoke all on function public.transition_campaign_channel_execution(uuid, text, text, text) from public;
revoke all on function public.transition_campaign_channel_execution(uuid, text, text, text) from anon;
grant execute on function public.transition_campaign_channel_execution(uuid, text, text, text) to authenticated;
grant execute on function public.transition_campaign_channel_execution(uuid, text, text, text) to service_role;

-- ============================================================================
-- PART C: campaign_budget_intents -- provider-neutral budget intent,
-- versioned exactly like campaign_strategy_versions/campaign_creative_
-- packages, with material changes (activation) gated on a D1 approval.
-- ============================================================================
create table if not exists public.campaign_budget_intents(
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  campaign_id uuid not null references public.creative_campaigns(id) on delete cascade,
  version integer not null check (version > 0),
  status text not null default 'draft' check (status in ('draft','approved')),

  currency text not null check (currency ~ '^[A-Z]{3}$'),
  daily_budget numeric(14,2) check (daily_budget is null or daily_budget > 0),
  lifetime_budget numeric(14,2) check (lifetime_budget is null or lifetime_budget > 0),
  start_at timestamptz,
  end_at timestamptz,

  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id),

  unique(campaign_id, version),
  check (daily_budget is not null or lifetime_budget is not null),
  check (end_at is null or start_at is null or end_at > start_at)
);
create index if not exists campaign_budget_intent_tenant_idx
  on public.campaign_budget_intents(organization_id, workspace_id, campaign_id, version desc);
create unique index if not exists campaign_budget_intent_one_approved_idx
  on public.campaign_budget_intents(campaign_id) where status = 'approved';

alter table public.campaign_budget_intents enable row level security;
drop policy if exists "campaign_budget_intent_read" on public.campaign_budget_intents;
create policy "campaign_budget_intent_read" on public.campaign_budget_intents
  for select to authenticated
  using (public.creative_studio_member(organization_id, workspace_id));
drop policy if exists "campaign_budget_intent_write" on public.campaign_budget_intents;
create policy "campaign_budget_intent_write" on public.campaign_budget_intents
  for all to authenticated
  using (public.creative_studio_member(organization_id, workspace_id) and public.creative_studio_manage(workspace_id))
  with check (public.creative_studio_member(organization_id, workspace_id) and public.creative_studio_manage(workspace_id));

create or replace function public.save_campaign_budget_intent(
  p_campaign_id uuid,
  p_currency text,
  p_daily_budget numeric,
  p_lifetime_budget numeric,
  p_start_at timestamptz,
  p_end_at timestamptz
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  w uuid; o uuid; c public.creative_campaigns%rowtype; v_version integer; v_id uuid;
begin
  select wm.workspace_id, wm.organization_id into w, o
    from public.workspace_members wm
   where wm.user_id = auth.uid() and wm.status = 'active'
   order by wm.created_at limit 1;
  if w is null or not public.creative_studio_manage(w) then
    raise exception 'insufficient campaign budget permission';
  end if;

  select * into c from public.creative_campaigns where id = p_campaign_id and organization_id = o and workspace_id = w for update;
  if not found then
    raise exception 'invalid campaign';
  end if;

  if p_daily_budget is null and p_lifetime_budget is null then
    raise exception 'BUDGET_CONFIGURATION_ERROR: at least one of daily_budget or lifetime_budget is required';
  end if;

  select coalesce(max(version), 0) + 1 into v_version from public.campaign_budget_intents where campaign_id = p_campaign_id;

  insert into public.campaign_budget_intents(
    organization_id, workspace_id, campaign_id, version, status,
    currency, daily_budget, lifetime_budget, start_at, end_at, created_by
  ) values (
    o, w, p_campaign_id, v_version, 'draft',
    upper(p_currency), p_daily_budget, p_lifetime_budget, p_start_at, p_end_at, auth.uid()
  ) returning id into v_id;

  insert into public.creative_timeline(organization_id, workspace_id, campaign_id, event_type, ai_employee, metadata, actor_id)
  values (o, w, p_campaign_id, 'campaign.budget.drafted', 'Campaign Strategist',
    jsonb_build_object('budget_intent_id', v_id, 'version', v_version, 'recommendation_only', true, 'live_publishing', false), auth.uid());

  return v_id;
end;
$$;

-- accept_campaign_budget_intent: requires a decided-'approved' D1 approval
-- for this exact intent (source_type='campaign_budget_intent',
-- action_type='campaign_budget_change') before it may become the campaign's
-- one active budget intent. This is what makes budget activation
-- approval-governed rather than a bare self-service status flip.
create or replace function public.accept_campaign_budget_intent(p_intent_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare w uuid; o uuid; b public.campaign_budget_intents%rowtype;
begin
  select wm.workspace_id, wm.organization_id into w, o
    from public.workspace_members wm
   where wm.user_id = auth.uid() and wm.status = 'active'
   order by wm.created_at limit 1;
  if w is null or not public.creative_studio_manage(w) then
    raise exception 'insufficient campaign budget permission';
  end if;

  select * into b from public.campaign_budget_intents where id = p_intent_id and organization_id = o and workspace_id = w for update;
  if not found then
    raise exception 'invalid budget intent';
  end if;

  if not public.is_source_approved(o, w, 'campaign_budget_intent', b.id, 'campaign_budget_change') then
    raise exception 'APPROVAL_REQUIRED: campaign budget intent % is not approved', b.id;
  end if;

  update public.campaign_budget_intents set status = 'draft', approved_at = null, approved_by = null
   where campaign_id = b.campaign_id and status = 'approved' and id <> b.id;
  update public.campaign_budget_intents set status = 'approved', approved_at = now(), approved_by = auth.uid()
   where id = b.id;

  insert into public.creative_timeline(organization_id, workspace_id, campaign_id, event_type, ai_employee, metadata, actor_id)
  values (o, w, b.campaign_id, 'campaign.budget.approved', 'Campaign Strategist',
    jsonb_build_object('budget_intent_id', b.id, 'version', b.version, 'recommendation_only', true, 'live_publishing', false), auth.uid());
end;
$$;

revoke all on function public.save_campaign_budget_intent(uuid, text, numeric, numeric, timestamptz, timestamptz) from public;
revoke all on function public.save_campaign_budget_intent(uuid, text, numeric, numeric, timestamptz, timestamptz) from anon;
grant execute on function public.save_campaign_budget_intent(uuid, text, numeric, numeric, timestamptz, timestamptz) to authenticated;

revoke all on function public.accept_campaign_budget_intent(uuid) from public;
revoke all on function public.accept_campaign_budget_intent(uuid) from anon;
grant execute on function public.accept_campaign_budget_intent(uuid) to authenticated;

-- ============================================================================
-- PART D: campaign_targeting_intents -- provider-neutral targeting intent,
-- one unversioned row per campaign. Not approval-gated (descriptive
-- audience data, no direct spend commitment); provider adapters translate
-- this later without any Meta/Google policy assumption encoded here.
-- ============================================================================
create table if not exists public.campaign_targeting_intents(
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  campaign_id uuid not null references public.creative_campaigns(id) on delete cascade,

  country text,
  region text,
  city text,
  language text,
  buyer_persona text,
  property_type text,
  budget_range_low numeric(14,2) check (budget_range_low is null or budget_range_low >= 0),
  budget_range_high numeric(14,2) check (budget_range_high is null or budget_range_high >= 0),
  objective text,

  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(campaign_id),
  check (budget_range_high is null or budget_range_low is null or budget_range_high >= budget_range_low)
);

alter table public.campaign_targeting_intents enable row level security;
drop policy if exists "campaign_targeting_intent_read" on public.campaign_targeting_intents;
create policy "campaign_targeting_intent_read" on public.campaign_targeting_intents
  for select to authenticated
  using (public.creative_studio_member(organization_id, workspace_id));
drop policy if exists "campaign_targeting_intent_write" on public.campaign_targeting_intents;
create policy "campaign_targeting_intent_write" on public.campaign_targeting_intents
  for all to authenticated
  using (public.creative_studio_member(organization_id, workspace_id) and public.creative_studio_manage(workspace_id))
  with check (public.creative_studio_member(organization_id, workspace_id) and public.creative_studio_manage(workspace_id));

create or replace function public.save_campaign_targeting_intent(
  p_campaign_id uuid,
  p_country text,
  p_region text,
  p_city text,
  p_language text,
  p_buyer_persona text,
  p_property_type text,
  p_budget_range_low numeric,
  p_budget_range_high numeric,
  p_objective text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare w uuid; o uuid; v_id uuid;
begin
  select wm.workspace_id, wm.organization_id into w, o
    from public.workspace_members wm
   where wm.user_id = auth.uid() and wm.status = 'active'
   order by wm.created_at limit 1;
  if w is null or not public.creative_studio_manage(w) then
    raise exception 'insufficient campaign targeting permission';
  end if;

  if not exists (select 1 from public.creative_campaigns where id = p_campaign_id and organization_id = o and workspace_id = w) then
    raise exception 'invalid campaign';
  end if;

  insert into public.campaign_targeting_intents(
    organization_id, workspace_id, campaign_id, country, region, city, language,
    buyer_persona, property_type, budget_range_low, budget_range_high, objective, created_by
  ) values (
    o, w, p_campaign_id, p_country, p_region, p_city, p_language,
    p_buyer_persona, p_property_type, p_budget_range_low, p_budget_range_high, p_objective, auth.uid()
  )
  on conflict (campaign_id) do update set
    country = excluded.country, region = excluded.region, city = excluded.city, language = excluded.language,
    buyer_persona = excluded.buyer_persona, property_type = excluded.property_type,
    budget_range_low = excluded.budget_range_low, budget_range_high = excluded.budget_range_high,
    objective = excluded.objective, updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.save_campaign_targeting_intent(uuid, text, text, text, text, text, text, numeric, numeric, text) from public;
revoke all on function public.save_campaign_targeting_intent(uuid, text, text, text, text, text, text, numeric, numeric, text) from anon;
grant execute on function public.save_campaign_targeting_intent(uuid, text, text, text, text, text, text, numeric, numeric, text) to authenticated;

-- ============================================================================
-- PART E: creative/attribution linkage -- a creative variant can record
-- which channel execution it was produced for, and the future ad-level
-- provider id it is attributed to. Both nullable/additive; no ownership
-- moves off creative_assets.
-- ============================================================================
alter table public.creative_assets
  add column if not exists channel_execution_id uuid references public.campaign_channel_executions(id);
alter table public.creative_assets
  add column if not exists provider_ad_id text;

create index if not exists creative_asset_channel_execution_idx
  on public.creative_assets(channel_execution_id) where channel_execution_id is not null;

commit;
