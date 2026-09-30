-- Phase ADS-B3: Meta publishing foundation -- write-safe machinery only.
-- No real Meta mutation exists anywhere in this migration or its
-- application layer. META_MARKETING_WRITES_ENABLED remains fail-closed;
-- this migration never references, sets, or overrides it.
--
-- PART 1 AUDIT (before designing anything): meta_marketing_connections,
-- meta_lead_form_mappings, meta_oauth_states, connect_meta_marketing_page,
-- disconnect_meta_marketing, create_meta_lead_form_mapping,
-- disable_meta_lead_form_mapping, process_meta_leadgen_event (M3-M8) are
-- all real, working, already-committed infrastructure -- none of it is
-- duplicated here. Critically: meta_marketing_connections already carries
-- canonical ad_account_id/ad_account_name/page_id/instagram_business_
-- account_id (no new destination-identity field needed -- Part 2 is
-- satisfied by reference, not by new columns), and
-- requireMetaMarketingWritesEnabled() (features/platform/integrations/
-- meta-marketing/providers/meta-graph.provider.ts) already IS the
-- centralized write guard Part 6 asks for -- gating createLeadForm today.
-- ADS-B3's application layer reuses that exact function rather than
-- inventing a second flag ("do not scatter checks"). The existing
-- MetaMarketingProvider interface is explicitly discovery/lead-form-only
-- (its own comment: "does NOT implement campaign/adset/ad/creative
-- creation") -- ADS-B3's new MetaAdsProvider interface is a deliberately
-- separate, additive concern, not a modification of that file.
--
-- TWO TABLES (Part 3/22, minimized from the four-near-identical-tables
-- shape the authorizing spec floated):
--   meta_campaign_publish_executions -- one row per (channel_execution)
--     publish ATTEMPT (the work order): the publish plan, prerequisite
--     approval state, worker claim lifecycle, overall outcome.
--   meta_provider_objects -- one row per actual Meta object (campaign/
--     ad_set/creative/ad) the worker creates, persisted progressively so
--     partial success survives an overall failure (Part 11).
-- Both reference campaign_channel_executions/creative_campaigns/
-- meta_marketing_connections by id; neither duplicates their columns.
--
-- STATUS VOCABULARY INDEPENDENCE (Part 19): meta_campaign_publish_
-- executions.status and meta_provider_objects.status are each their OWN
-- vocabulary -- neither reuses creative_evaluations' pending/evaluating/
-- passed/needs_review/rejected/failed, nor campaign_channel_executions'
-- draft/ready_for_review/approved/publishing/active/paused/completed/
-- failed/uncertain. A raw Meta provider string never becomes the
-- canonical VAYON campaign_channel_executions.status directly -- only the
-- existing, unmodified transition_campaign_channel_execution() (ADS-B1)
-- may ever change that column, and only a trusted worker explicitly
-- calling it after a genuinely succeeded publish does so (demonstrated,
-- not enforced in SQL here, by the mock end-to-end test).
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ============================================================================
-- PART A: meta_campaign_publish_executions
-- ============================================================================
create table if not exists public.meta_campaign_publish_executions(
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  campaign_id uuid not null references public.creative_campaigns(id) on delete cascade,
  channel_execution_id uuid not null references public.campaign_channel_executions(id) on delete cascade,
  connection_id uuid not null references public.meta_marketing_connections(id),

  -- Part 4: the deterministic publish plan, inspectable before any write.
  -- Structured but stored as JSONB (mirrors campaign_strategy_versions.
  -- output's own precedent) since its shape (objective/budget/schedule/
  -- targeting/creative mapping/lead-form destination/special-ad-category/
  -- placement/tracking) is read and written as one cohesive unit, never
  -- queried piecemeal across executions.
  plan jsonb not null,

  status text not null default 'pending'
    check (status in ('pending','claimed','publishing','succeeded','partial_failure','failed','uncertain')),

  attempts integer not null default 0,
  max_attempts integer not null default 3 check (max_attempts between 1 and 5),
  last_error_code text,
  last_error_message text,

  requested_by uuid not null references auth.users(id),
  requested_at timestamptz not null default now(),
  claimed_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),

  unique(channel_execution_id, id)
);
create index if not exists meta_publish_execution_tenant_idx
  on public.meta_campaign_publish_executions(organization_id, workspace_id, campaign_id);
-- Idempotency (Part 10): at most one in-flight publish attempt per channel
-- execution at a time -- exactly the same pattern as creative_evaluations'
-- one-inflight partial index.
create unique index if not exists meta_publish_execution_one_inflight_idx
  on public.meta_campaign_publish_executions(channel_execution_id)
  where status in ('pending','claimed','publishing');

alter table public.meta_campaign_publish_executions enable row level security;
drop policy if exists "meta_publish_execution_read" on public.meta_campaign_publish_executions;
create policy "meta_publish_execution_read" on public.meta_campaign_publish_executions
  for select to authenticated
  using (public.creative_studio_member(organization_id, workspace_id));
-- No direct INSERT/UPDATE/DELETE policy -- every write goes through the
-- SECURITY DEFINER RPCs below.

-- ============================================================================
-- PART B: meta_provider_objects -- one row per actual Meta object.
-- parent_object_id lets an ad_set point at its campaign row, and a
-- creative/ad point at their ad_set row, without a separate join table.
-- creative_asset_id (nullable -- only meaningful for 'creative'/'ad' rows)
-- is the idempotency key that lets multiple creative variants under one
-- campaign each get their own Meta creative/ad without collision (Part 10).
-- ============================================================================
create table if not exists public.meta_provider_objects(
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  campaign_id uuid not null references public.creative_campaigns(id) on delete cascade,
  channel_execution_id uuid not null references public.campaign_channel_executions(id) on delete cascade,
  publish_execution_id uuid not null references public.meta_campaign_publish_executions(id) on delete cascade,

  object_type text not null check (object_type in ('campaign','ad_set','creative','ad')),
  parent_object_id uuid references public.meta_provider_objects(id),
  creative_asset_id uuid references public.creative_assets(id),

  provider_object_id text,
  status text not null default 'pending' check (status in ('pending','creating','created','failed','uncertain')),

  attempts integer not null default 0,
  last_error_code text,
  last_error_message text,
  -- Safe subset only (e.g. {"reviewFeedback": "..."}) -- never a raw token
  -- or full Graph payload; the worker is responsible for redaction before
  -- calling upsert_meta_provider_object (Part 20/21).
  last_response_metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_synced_at timestamptz
);
create index if not exists meta_provider_object_tenant_idx
  on public.meta_provider_objects(organization_id, workspace_id, campaign_id, channel_execution_id);
create index if not exists meta_provider_object_execution_idx
  on public.meta_provider_objects(publish_execution_id);
-- Idempotency key (Part 10): a table-level UNIQUE constraint cannot contain
-- an expression like coalesce(), so this is a unique EXPRESSION INDEX
-- instead -- functionally identical, and the same technique already used
-- by creative_evaluation_one_inflight_idx (ADS-B2).
create unique index if not exists meta_provider_object_idempotency_idx
  on public.meta_provider_objects(publish_execution_id, object_type, coalesce(creative_asset_id, '00000000-0000-0000-0000-000000000000'::uuid));

alter table public.meta_provider_objects enable row level security;
drop policy if exists "meta_provider_object_read" on public.meta_provider_objects;
create policy "meta_provider_object_read" on public.meta_provider_objects
  for select to authenticated
  using (public.creative_studio_member(organization_id, workspace_id));
-- No direct write policy -- provider_object_id and every status field are
-- trusted-worker-only (Part 18): an authenticated customer can read but
-- never write or spoof a provider id.

-- ============================================================================
-- request_meta_campaign_publish: Model A (authenticated only -- Part 23's
-- own reasoning, applied conservatively: unlike request_creative_evaluation
-- there is no current automated trigger point that should ever initiate a
-- real-money publish attempt on a human's behalf, so the narrower model is
-- the safer default; revisit only when a concrete automated caller exists).
--
-- Fail-closed prerequisite gate (Part 5), ALL of which must hold before a
-- pending execution row is even created:
--   - channel_execution.provider = 'meta'
--   - channel_execution belongs to this campaign/tenant
--   - the channel execution's own campaign_channel_publish approval exists
--     (is_source_approved, reused verbatim from ADS-B1A)
--   - an APPROVED campaign_budget_intents row exists for this campaign
--   - that budget intent's own campaign_budget_change approval exists
--   - are_required_creatives_evaluated shows allPassed and not anyRejected
--     (reused verbatim from ADS-B1)
--   - the Meta connection is active (status='connected', not deleted) and
--     has an ad_account_id configured
--   - a campaign_targeting_intents row exists for this campaign
-- This function does NOT check META_MARKETING_WRITES_ENABLED -- that is an
-- application-layer environment variable, invisible to SQL, and is instead
-- enforced by the trusted worker/provider layer immediately before any
-- network call (Part 6) -- SQL only enforces what SQL can see.
-- ============================================================================
create or replace function public.request_meta_campaign_publish(
  p_channel_execution_id uuid,
  p_plan jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  w uuid; o uuid; e public.campaign_channel_executions%rowtype;
  v_budget public.campaign_budget_intents%rowtype;
  v_connection public.meta_marketing_connections%rowtype;
  v_readiness jsonb;
  v_existing uuid; v_id uuid;
begin
  select wm.workspace_id, wm.organization_id into w, o
    from public.workspace_members wm
   where wm.user_id = auth.uid() and wm.status = 'active'
   order by wm.created_at limit 1;
  if w is null or not public.creative_studio_manage(w) then
    raise exception 'insufficient meta publish permission';
  end if;

  select * into e from public.campaign_channel_executions
   where id = p_channel_execution_id and organization_id = o and workspace_id = w for update;
  if not found then
    raise exception 'invalid campaign channel execution';
  end if;
  if e.provider <> 'meta' then
    raise exception 'PUBLISH_PREREQUISITE_FAILED: channel execution is not a meta channel';
  end if;

  if not public.is_source_approved(o, w, 'campaign_channel_execution', e.id, 'campaign_channel_publish') then
    raise exception 'PUBLISH_PREREQUISITE_FAILED: channel execution publish approval is missing';
  end if;

  select * into v_budget from public.campaign_budget_intents
   where campaign_id = e.campaign_id and organization_id = o and workspace_id = w and status = 'approved'
   order by version desc limit 1;
  if not found then
    raise exception 'PUBLISH_PREREQUISITE_FAILED: no approved budget intent exists for this campaign';
  end if;
  if not public.is_source_approved(o, w, 'campaign_budget_intent', v_budget.id, 'campaign_budget_change') then
    raise exception 'PUBLISH_PREREQUISITE_FAILED: budget intent approval is missing';
  end if;

  v_readiness := public.are_required_creatives_evaluated(e.campaign_id, e.id);
  if not coalesce((v_readiness->>'allPassed')::boolean, false) or coalesce((v_readiness->>'anyRejected')::boolean, true) then
    raise exception 'PUBLISH_PREREQUISITE_FAILED: required creatives are not all passed, or at least one is rejected';
  end if;

  select * into v_connection from public.meta_marketing_connections
   where organization_id = o and workspace_id = w and status = 'connected' and deleted_at is null;
  if not found then
    raise exception 'PUBLISH_PREREQUISITE_FAILED: no active meta connection exists';
  end if;
  if v_connection.ad_account_id is null then
    raise exception 'PUBLISH_PREREQUISITE_FAILED: connected meta account has no ad account configured';
  end if;

  if not exists (select 1 from public.campaign_targeting_intents where campaign_id = e.campaign_id and organization_id = o and workspace_id = w) then
    raise exception 'PUBLISH_PREREQUISITE_FAILED: no targeting intent exists for this campaign';
  end if;

  select id into v_existing from public.meta_campaign_publish_executions
   where channel_execution_id = p_channel_execution_id and status in ('pending', 'claimed', 'publishing');
  if v_existing is not null then
    return v_existing;
  end if;

  insert into public.meta_campaign_publish_executions(
    organization_id, workspace_id, campaign_id, channel_execution_id, connection_id, plan, status, requested_by
  ) values (
    o, w, e.campaign_id, p_channel_execution_id, v_connection.id, coalesce(p_plan, '{}'::jsonb), 'pending', auth.uid()
  ) returning id into v_id;

  insert into public.creative_timeline(organization_id, workspace_id, campaign_id, event_type, ai_employee, metadata, actor_id)
  values (o, w, e.campaign_id, 'campaign.meta_publish.requested', 'Meta Publisher',
    jsonb_build_object('publish_execution_id', v_id, 'channel_execution_id', p_channel_execution_id, 'recommendation_only', true, 'live_publishing', false), auth.uid());

  return v_id;
end;
$$;

-- ============================================================================
-- claim_meta_campaign_publish: Model B (service_role only). Re-verifies
-- (Part 7: "no service_role bypass") the exact same three spend-gating
-- conditions request_meta_campaign_publish already checked -- approval,
-- budget approval, creative readiness -- immediately before claiming, since
-- state may have changed between request and claim (e.g. an approval was
-- revoked). FOR UPDATE SKIP LOCKED mirrors claim_creative_evaluation.
-- ============================================================================
create or replace function public.claim_meta_campaign_publish(p_publish_execution_id uuid) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare x public.meta_campaign_publish_executions%rowtype; v_readiness jsonb;
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  select * into x from public.meta_campaign_publish_executions
   where id = p_publish_execution_id and (status = 'pending' or (status = 'failed' and attempts < max_attempts))
   for update skip locked;
  if not found then
    return null;
  end if;

  if not public.is_source_approved(x.organization_id, x.workspace_id, 'campaign_channel_execution', x.channel_execution_id, 'campaign_channel_publish') then
    raise exception 'APPROVAL_REQUIRED: channel execution publish approval no longer holds';
  end if;

  if not exists (
    select 1 from public.campaign_budget_intents b
     where b.campaign_id = x.campaign_id and b.status = 'approved'
       and public.is_source_approved(x.organization_id, x.workspace_id, 'campaign_budget_intent', b.id, 'campaign_budget_change')
  ) then
    raise exception 'APPROVAL_REQUIRED: budget approval no longer holds';
  end if;

  -- are_required_creatives_evaluated (ADS-B1) is Model A only -- it has no
  -- service_role branch and unconditionally requires auth.uid(), so it
  -- cannot be called from this Model B function (auth.uid() is null under
  -- service_role). Rather than modify that already-Production ADS-B1
  -- function, the identical read-only aggregation is inlined here, scoped
  -- to this execution's own already-verified tenant/campaign/channel
  -- fields -- not a second, divergent implementation of the readiness
  -- rule, the same query, just without the wrapper's caller-auth
  -- preamble that only makes sense for an authenticated caller.
  select jsonb_build_object(
    'allPassed', bool_and(ce.status = 'passed'),
    'anyRejected', bool_or(ce.status = 'rejected')
  ) into v_readiness
  from (
    select distinct on (creative_asset_id) *
      from public.creative_evaluations
     where campaign_id = x.campaign_id
       and organization_id = x.organization_id and workspace_id = x.workspace_id
       and channel_execution_id = x.channel_execution_id
     order by creative_asset_id, version desc
  ) ce;
  if not coalesce((v_readiness->>'allPassed')::boolean, false) or coalesce((v_readiness->>'anyRejected')::boolean, true) then
    raise exception 'CREATIVE_NOT_READY: required creatives are no longer all passed';
  end if;

  update public.meta_campaign_publish_executions
     set status = 'claimed', attempts = attempts + 1, claimed_at = now(), last_error_code = null, last_error_message = null, updated_at = now()
   where id = x.id;

  return to_jsonb(x) || jsonb_build_object('status', 'claimed', 'attempts', x.attempts + 1);
end;
$$;

-- ============================================================================
-- upsert_meta_provider_object: Model B (service_role only). Called by the
-- worker after EACH individual Meta object create attempt so partial
-- progress (Part 11) is durably persisted even if a later object in the
-- same execution fails. Idempotent on (publish_execution_id, object_type,
-- creative_asset_id) via ON CONFLICT.
-- ============================================================================
create or replace function public.upsert_meta_provider_object(
  p_publish_execution_id uuid,
  p_object_type text,
  p_parent_object_id uuid,
  p_creative_asset_id uuid,
  p_provider_object_id text,
  p_status text,
  p_error_code text,
  p_error_message text,
  p_response_metadata jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare x public.meta_campaign_publish_executions%rowtype; v_id uuid;
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  select * into x from public.meta_campaign_publish_executions where id = p_publish_execution_id;
  if not found then
    raise exception 'invalid publish execution';
  end if;
  if p_object_type not in ('campaign','ad_set','creative','ad') then
    raise exception 'PROVIDER_OBJECT_CONFIGURATION_ERROR: unsupported object type %', p_object_type;
  end if;
  if p_status not in ('pending','creating','created','failed','uncertain') then
    raise exception 'PROVIDER_OBJECT_CONFIGURATION_ERROR: unsupported object status %', p_status;
  end if;

  insert into public.meta_provider_objects(
    organization_id, workspace_id, campaign_id, channel_execution_id, publish_execution_id,
    object_type, parent_object_id, creative_asset_id, provider_object_id, status,
    attempts, last_error_code, last_error_message, last_response_metadata, last_synced_at
  ) values (
    x.organization_id, x.workspace_id, x.campaign_id, x.channel_execution_id, x.id,
    p_object_type, p_parent_object_id, p_creative_asset_id, p_provider_object_id, p_status,
    1, p_error_code, p_error_message, coalesce(p_response_metadata, '{}'::jsonb), now()
  )
  on conflict (publish_execution_id, object_type, coalesce(creative_asset_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do update set
    parent_object_id = excluded.parent_object_id,
    provider_object_id = coalesce(excluded.provider_object_id, meta_provider_objects.provider_object_id),
    status = excluded.status,
    attempts = meta_provider_objects.attempts + 1,
    last_error_code = excluded.last_error_code,
    last_error_message = excluded.last_error_message,
    last_response_metadata = excluded.last_response_metadata,
    updated_at = now(),
    last_synced_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

-- ============================================================================
-- complete_meta_campaign_publish: Model B (service_role only). Handles both
-- the clean-success and the ordinary-retryable-failure path, exactly
-- mirroring complete_creative_evaluation's shape. p_success=false never
-- reads any caller-supplied outcome text for its branch (fail-closed by
-- construction, same as ADS-B2).
-- ============================================================================
create or replace function public.complete_meta_campaign_publish(
  p_publish_execution_id uuid,
  p_success boolean,
  p_status text,
  p_error_code text,
  p_error_message text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare x public.meta_campaign_publish_executions%rowtype;
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  select * into x from public.meta_campaign_publish_executions where id = p_publish_execution_id and status in ('claimed', 'publishing') for update;
  if not found then
    raise exception 'publish execution is not awaiting completion';
  end if;

  if not p_success then
    update public.meta_campaign_publish_executions
       set status = case when x.attempts < x.max_attempts then 'pending' else 'failed' end,
           last_error_code = p_error_code,
           last_error_message = left(coalesce(p_error_message, 'provider_exception'), 200),
           updated_at = now()
     where id = x.id;

    insert into public.creative_timeline(organization_id, workspace_id, campaign_id, event_type, ai_employee, metadata, actor_id)
    values (x.organization_id, x.workspace_id, x.campaign_id, 'campaign.meta_publish.failed', 'Meta Publisher',
      jsonb_build_object('publish_execution_id', x.id, 'diagnostic', left(coalesce(p_error_message, 'provider_exception'), 200), 'retry_available', x.attempts < x.max_attempts), x.requested_by);
    return;
  end if;

  if p_status not in ('succeeded', 'partial_failure') then
    raise exception 'PUBLISH_CONFIGURATION_ERROR: unsupported terminal status %', p_status;
  end if;

  update public.meta_campaign_publish_executions
     set status = p_status, last_error_code = p_error_code, last_error_message = p_error_message, completed_at = now(), updated_at = now()
   where id = x.id;

  insert into public.creative_timeline(organization_id, workspace_id, campaign_id, event_type, ai_employee, metadata, actor_id)
  values (x.organization_id, x.workspace_id, x.campaign_id, 'campaign.meta_publish.completed', 'Meta Publisher',
    jsonb_build_object('publish_execution_id', x.id, 'status', p_status, 'recommendation_only', true, 'live_publishing', false), x.requested_by);
end;
$$;

-- ============================================================================
-- mark_meta_campaign_publish_uncertain: Model B (service_role only), kept
-- deliberately SEPARATE from complete_meta_campaign_publish's failure path
-- (Part 12). Uncertain means the provider request may have succeeded but
-- the response was lost (e.g. a timeout after the HTTP call was sent) --
-- never automatically retried; the row sits in 'uncertain' until a future
-- reconciliation worker resolves it.
-- ============================================================================
create or replace function public.mark_meta_campaign_publish_uncertain(
  p_publish_execution_id uuid,
  p_diagnostic text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare x public.meta_campaign_publish_executions%rowtype;
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  select * into x from public.meta_campaign_publish_executions where id = p_publish_execution_id and status in ('claimed', 'publishing') for update;
  if not found then
    raise exception 'publish execution is not awaiting completion';
  end if;

  update public.meta_campaign_publish_executions
     set status = 'uncertain', last_error_message = left(coalesce(p_diagnostic, 'provider_response_lost'), 200), updated_at = now()
   where id = x.id;

  insert into public.creative_timeline(organization_id, workspace_id, campaign_id, event_type, ai_employee, metadata, actor_id)
  values (x.organization_id, x.workspace_id, x.campaign_id, 'campaign.meta_publish.uncertain', 'Meta Publisher',
    jsonb_build_object('publish_execution_id', x.id, 'diagnostic', left(coalesce(p_diagnostic, 'provider_response_lost'), 200), 'requires_reconciliation', true), x.requested_by);
end;
$$;

revoke all on function public.request_meta_campaign_publish(uuid, jsonb) from public;
revoke all on function public.request_meta_campaign_publish(uuid, jsonb) from anon;
revoke all on function public.request_meta_campaign_publish(uuid, jsonb) from service_role;
grant execute on function public.request_meta_campaign_publish(uuid, jsonb) to authenticated;

revoke all on function public.claim_meta_campaign_publish(uuid) from public;
revoke all on function public.claim_meta_campaign_publish(uuid) from anon;
revoke all on function public.claim_meta_campaign_publish(uuid) from authenticated;
grant execute on function public.claim_meta_campaign_publish(uuid) to service_role;

revoke all on function public.upsert_meta_provider_object(uuid, text, uuid, uuid, text, text, text, text, jsonb) from public;
revoke all on function public.upsert_meta_provider_object(uuid, text, uuid, uuid, text, text, text, text, jsonb) from anon;
revoke all on function public.upsert_meta_provider_object(uuid, text, uuid, uuid, text, text, text, text, jsonb) from authenticated;
grant execute on function public.upsert_meta_provider_object(uuid, text, uuid, uuid, text, text, text, text, jsonb) to service_role;

revoke all on function public.complete_meta_campaign_publish(uuid, boolean, text, text, text) from public;
revoke all on function public.complete_meta_campaign_publish(uuid, boolean, text, text, text) from anon;
revoke all on function public.complete_meta_campaign_publish(uuid, boolean, text, text, text) from authenticated;
grant execute on function public.complete_meta_campaign_publish(uuid, boolean, text, text, text) to service_role;

revoke all on function public.mark_meta_campaign_publish_uncertain(uuid, text) from public;
revoke all on function public.mark_meta_campaign_publish_uncertain(uuid, text) from anon;
revoke all on function public.mark_meta_campaign_publish_uncertain(uuid, text) from authenticated;
grant execute on function public.mark_meta_campaign_publish_uncertain(uuid, text) to service_role;

commit;
