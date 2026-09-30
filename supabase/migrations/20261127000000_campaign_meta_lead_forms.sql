-- Phase C6: VAYON-created Meta Lead Form -- draft/review -> explicit Create
-- on Meta -> automatic property mapping -> automatic M6 consent rule.
--
-- REUSE, NOT DUPLICATION (Part 17): `campaign_lead_forms` is VAYON's own
-- campaign/form object (draft specification, creation lifecycle, provenance
-- back to the campaign/property that requested it). `meta_lead_form_mappings`
-- (M1/M2) remains exactly what it always was -- the provider-form ->
-- tenant/workspace/property resolver the M3 webhook and M5 CRM ingestion
-- already depend on. This migration never touches that table's shape or its
-- RPCs; a VAYON-created form becomes usable by M3-M8 the EXACT SAME way a
-- manually-created, manually-mapped form always was: by having a row in
-- meta_lead_form_mappings. C6 only automates creating that row (Part 22) by
-- calling the existing create_meta_lead_form_mapping RPC (via
-- MetaMarketingService.createFormMapping(), unmodified) after Meta confirms
-- the form exists -- no second resolver, no second consent system
-- (meta_lead_form_consent_rules and configure_meta_lead_form_consent_rule
-- are likewise unmodified and reused via MetaMarketingService.
-- configureConsentRule()).
--
-- STATUS MODEL (Part 18/23/25/26): draft -> creating -> created is the happy
-- path; created only means Meta acknowledged the form's existence, never
-- that the campaign is live or spending. form_mapping_id and consent_rule_id
-- are separate nullable facts recorded ON TOP of 'created', not separate
-- statuses -- a form can be 'created' with a null form_mapping_id (mapping
-- still pending/failed) or a null consent_rule_id (consent still pending/
-- failed). "Outreach ready" (Part 26) is computed in the application layer
-- as created AND form_mapping_id is not null AND consent_rule_id is not
-- null -- deliberately never collapsed into one column here, so the UI can
-- show exactly which of the three governance facts is still missing.
-- created_mapping_failed / created_consent_failed record that Meta's form
-- genuinely exists but a LOCAL step failed after it -- these states exist
-- specifically so a retry only repeats the failed local step, never
-- recreates the Meta form (Part 23/25).
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create table public.campaign_lead_forms(
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  campaign_id uuid not null references public.creative_campaigns(id) on delete cascade,
  property_id uuid not null references public.properties(id),
  connection_id uuid not null references public.meta_marketing_connections(id),
  page_id text not null,
  version integer not null check(version > 0),

  provider_form_id text,
  form_name text not null check(char_length(form_name) between 1 and 160),
  status text not null default 'draft' check(status in('draft','creating','created','created_mapping_failed','created_consent_failed','uncertain','failed','archived')),
  specification jsonb not null,
  form_mapping_id uuid references public.meta_lead_form_mappings(id),
  consent_rule_id uuid references public.meta_lead_form_consent_rules(id),
  diagnostic text,

  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  claimed_at timestamptz,

  unique(campaign_id, version)
);
create index campaign_lead_form_tenant_idx on public.campaign_lead_forms(organization_id,workspace_id,campaign_id,version desc);
create unique index campaign_lead_form_one_active_creation_idx on public.campaign_lead_forms(campaign_id) where status in('creating');

alter table public.campaign_lead_forms enable row level security;
create policy "campaign_lead_form_read" on public.campaign_lead_forms for select to authenticated using(public.creative_studio_member(organization_id,workspace_id));
create policy "campaign_lead_form_write" on public.campaign_lead_forms for all to authenticated using(public.creative_studio_member(organization_id,workspace_id) and public.can_manage_integrations(workspace_id)) with check(public.creative_studio_member(organization_id,workspace_id) and public.can_manage_integrations(workspace_id));

-- ============================================================================
-- save_campaign_lead_form_draft: Part 6/7/8 -- requires the campaign's own
-- property, an ACCEPTED C2 strategy and an ACCEPTED C3 creative package
-- (never actual generated media -- a Lead Form is campaign infrastructure,
-- not creative output), and a connected Meta Marketing connection whose
-- page_id becomes this draft's page (Part 5 -- never a client-supplied page
-- token, never a client-supplied organization/workspace id). Always creates
-- a NEW version row (Part 16 -- material changes get a new form version,
-- never an in-place edit of a draft that might already be mid-creation).
-- ============================================================================
create or replace function public.save_campaign_lead_form_draft(
  p_campaign_id uuid,
  p_form_name text,
  p_specification jsonb
) returns uuid language plpgsql security definer set search_path=public as $$
declare
  w uuid; o uuid; c public.creative_campaigns%rowtype; conn public.meta_marketing_connections%rowtype;
  v_version integer; v_id uuid;
begin
  select wm.workspace_id,wm.organization_id into w,o from public.workspace_members wm where wm.user_id=auth.uid() and wm.status='active' order by wm.created_at limit 1;
  if w is null or not public.can_manage_integrations(w) then
    raise exception 'insufficient integration permission';
  end if;

  select * into c from public.creative_campaigns where id=p_campaign_id and organization_id=o and workspace_id=w for update;
  if not found then
    raise exception 'invalid campaign';
  end if;
  if c.property_id is null then
    raise exception 'campaign has no property to ground a lead form on';
  end if;

  if not exists(select 1 from public.campaign_strategy_versions where campaign_id=p_campaign_id and organization_id=o and workspace_id=w and status='accepted') then
    raise exception 'an accepted campaign strategy is required';
  end if;
  if not exists(select 1 from public.campaign_creative_packages where campaign_id=p_campaign_id and organization_id=o and workspace_id=w and status='accepted') then
    raise exception 'an accepted creative package is required';
  end if;

  select * into conn from public.meta_marketing_connections where organization_id=o and workspace_id=w and status='connected' and deleted_at is null;
  if not found then
    raise exception 'a connected Meta Marketing Page is required';
  end if;

  select coalesce(max(version),0)+1 into v_version from public.campaign_lead_forms where campaign_id=p_campaign_id;

  insert into public.campaign_lead_forms(organization_id,workspace_id,campaign_id,property_id,connection_id,page_id,version,form_name,status,specification,created_by)
  values(o,w,p_campaign_id,c.property_id,conn.id,conn.page_id,v_version,left(trim(p_form_name),160),'draft',p_specification,auth.uid())
  returning id into v_id;

  insert into public.creative_timeline(organization_id,workspace_id,campaign_id,event_type,ai_employee,property_id,property_project_id,metadata,actor_id)
  values(o,w,p_campaign_id,'campaign.lead_form.prepared','Creative AI',c.property_id,c.property_project_id,jsonb_build_object('local_form_id',v_id,'version',v_version,'recommendation_only',true,'live_publishing',false),auth.uid());

  return v_id;
end$$;

-- ============================================================================
-- claim_campaign_lead_form_creation: Part 19/38-41 -- atomic claim, draft ->
-- creating. Only a 'draft' row can ever be claimed; a second call while
-- already 'creating' (double-click) or once 'created'/'uncertain'/'failed'
-- returns null rather than claiming again -- 'failed' is deliberately NOT
-- reclaimable here either (a customer must prepare an explicit new draft/
-- version to retry, never a silent auto-retry of a row whose outcome on
-- Meta's side is unknown).
-- ============================================================================
create or replace function public.claim_campaign_lead_form_creation(p_local_form_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare w uuid; o uuid; f public.campaign_lead_forms%rowtype;
begin
  select wm.workspace_id,wm.organization_id into w,o from public.workspace_members wm where wm.user_id=auth.uid() and wm.status='active' order by wm.created_at limit 1;
  if w is null or not public.can_manage_integrations(w) then
    raise exception 'insufficient integration permission';
  end if;

  update public.campaign_lead_forms set status='creating',claimed_at=now(),updated_at=now()
    where id=p_local_form_id and organization_id=o and workspace_id=w and status='draft'
    returning * into f;
  if not found then
    return null;
  end if;

  insert into public.creative_timeline(organization_id,workspace_id,campaign_id,event_type,ai_employee,property_id,metadata,actor_id)
  values(o,w,f.campaign_id,'campaign.lead_form.creation_started','Creative AI',f.property_id,jsonb_build_object('local_form_id',f.id,'version',f.version,'recommendation_only',true,'live_publishing',false),auth.uid());

  return to_jsonb(f);
end$$;

-- ============================================================================
-- complete_campaign_lead_form_creation: Part 20/21 -- creating -> created
-- (persists provider_form_id ONLY -- no token, no raw Graph payload) or
-- creating -> failed. A row that never resolves (process crash between
-- Meta's response and this call) stays 'creating' until the separate
-- reconciliation function below reclassifies it -- this function never
-- guesses.
-- ============================================================================
create or replace function public.complete_campaign_lead_form_creation(
  p_local_form_id uuid,
  p_success boolean,
  p_provider_form_id text,
  p_diagnostic text
) returns void language plpgsql security definer set search_path=public as $$
declare w uuid; o uuid; f public.campaign_lead_forms%rowtype;
begin
  select wm.workspace_id,wm.organization_id into w,o from public.workspace_members wm where wm.user_id=auth.uid() and wm.status='active' order by wm.created_at limit 1;
  if w is null or not public.can_manage_integrations(w) then
    raise exception 'insufficient integration permission';
  end if;

  select * into f from public.campaign_lead_forms where id=p_local_form_id and organization_id=o and workspace_id=w and status='creating' for update;
  if not found then
    raise exception 'lead form is not awaiting creation';
  end if;

  if p_success then
    update public.campaign_lead_forms set status='created',provider_form_id=p_provider_form_id,diagnostic=null,updated_at=now() where id=f.id;
    insert into public.creative_timeline(organization_id,workspace_id,campaign_id,event_type,ai_employee,property_id,metadata,actor_id)
    values(o,w,f.campaign_id,'campaign.lead_form.created','Creative AI',f.property_id,jsonb_build_object('local_form_id',f.id,'provider_form_id',p_provider_form_id,'recommendation_only',true,'live_publishing',false),auth.uid());
  else
    update public.campaign_lead_forms set status='failed',diagnostic=left(coalesce(p_diagnostic,'provider_exception'),200),updated_at=now() where id=f.id;
    insert into public.creative_timeline(organization_id,workspace_id,campaign_id,event_type,ai_employee,property_id,metadata,actor_id)
    values(o,w,f.campaign_id,'campaign.lead_form.creation_failed','Creative AI',f.property_id,jsonb_build_object('local_form_id',f.id,'diagnostic',left(coalesce(p_diagnostic,'provider_exception'),200),'recommendation_only',true,'live_publishing',false),auth.uid());
  end if;
end$$;

-- ============================================================================
-- mark_campaign_lead_form_mapped / mark_campaign_lead_form_mapping_failed:
-- Part 22/23 -- recorded on top of 'created', never re-triggers Meta form
-- creation. A mapping failure moves status to 'created_mapping_failed' so a
-- retry (mapping is local-only, per Part 23) is obviously scoped to mapping
-- alone.
-- ============================================================================
create or replace function public.mark_campaign_lead_form_mapped(p_local_form_id uuid, p_form_mapping_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare w uuid; o uuid; f public.campaign_lead_forms%rowtype;
begin
  select wm.workspace_id,wm.organization_id into w,o from public.workspace_members wm where wm.user_id=auth.uid() and wm.status='active' order by wm.created_at limit 1;
  if w is null or not public.can_manage_integrations(w) then
    raise exception 'insufficient integration permission';
  end if;
  select * into f from public.campaign_lead_forms where id=p_local_form_id and organization_id=o and workspace_id=w and status in('created','created_mapping_failed') for update;
  if not found then
    raise exception 'lead form is not awaiting mapping';
  end if;
  update public.campaign_lead_forms set status='created',form_mapping_id=p_form_mapping_id,diagnostic=null,updated_at=now() where id=f.id;
  insert into public.creative_timeline(organization_id,workspace_id,campaign_id,event_type,ai_employee,property_id,metadata,actor_id)
  values(o,w,f.campaign_id,'campaign.lead_form.mapping_completed','Creative AI',f.property_id,jsonb_build_object('local_form_id',f.id,'form_mapping_id',p_form_mapping_id,'recommendation_only',true,'live_publishing',false),auth.uid());
end$$;

create or replace function public.mark_campaign_lead_form_mapping_failed(p_local_form_id uuid, p_diagnostic text) returns void language plpgsql security definer set search_path=public as $$
declare w uuid; o uuid; f public.campaign_lead_forms%rowtype;
begin
  select wm.workspace_id,wm.organization_id into w,o from public.workspace_members wm where wm.user_id=auth.uid() and wm.status='active' order by wm.created_at limit 1;
  if w is null or not public.can_manage_integrations(w) then
    raise exception 'insufficient integration permission';
  end if;
  select * into f from public.campaign_lead_forms where id=p_local_form_id and organization_id=o and workspace_id=w and status in('created','created_mapping_failed') for update;
  if not found then
    raise exception 'lead form is not awaiting mapping';
  end if;
  update public.campaign_lead_forms set status='created_mapping_failed',diagnostic=left(coalesce(p_diagnostic,'mapping_exception'),200),updated_at=now() where id=f.id;
end$$;

-- ============================================================================
-- mark_campaign_lead_form_consent_configured / _consent_failed: Part 24/25/26
-- -- outreach readiness requires this to succeed too; a consent failure
-- never blocks the mapping already recorded, and never touches the Meta
-- form.
-- ============================================================================
create or replace function public.mark_campaign_lead_form_consent_configured(p_local_form_id uuid, p_consent_rule_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare w uuid; o uuid; f public.campaign_lead_forms%rowtype;
begin
  select wm.workspace_id,wm.organization_id into w,o from public.workspace_members wm where wm.user_id=auth.uid() and wm.status='active' order by wm.created_at limit 1;
  if w is null or not public.can_manage_integrations(w) then
    raise exception 'insufficient integration permission';
  end if;
  select * into f from public.campaign_lead_forms where id=p_local_form_id and organization_id=o and workspace_id=w and status in('created','created_consent_failed') for update;
  if not found then
    raise exception 'lead form is not awaiting consent configuration';
  end if;
  update public.campaign_lead_forms set status='created',consent_rule_id=p_consent_rule_id,diagnostic=null,updated_at=now() where id=f.id;
  insert into public.creative_timeline(organization_id,workspace_id,campaign_id,event_type,ai_employee,property_id,metadata,actor_id)
  values(o,w,f.campaign_id,'campaign.lead_form.consent_rule_configured','Creative AI',f.property_id,jsonb_build_object('local_form_id',f.id,'consent_rule_id',p_consent_rule_id,'recommendation_only',true,'live_publishing',false),auth.uid());
end$$;

create or replace function public.mark_campaign_lead_form_consent_failed(p_local_form_id uuid, p_diagnostic text) returns void language plpgsql security definer set search_path=public as $$
declare w uuid; o uuid; f public.campaign_lead_forms%rowtype;
begin
  select wm.workspace_id,wm.organization_id into w,o from public.workspace_members wm where wm.user_id=auth.uid() and wm.status='active' order by wm.created_at limit 1;
  if w is null or not public.can_manage_integrations(w) then
    raise exception 'insufficient integration permission';
  end if;
  select * into f from public.campaign_lead_forms where id=p_local_form_id and organization_id=o and workspace_id=w and status in('created','created_consent_failed') for update;
  if not found then
    raise exception 'lead form is not awaiting consent configuration';
  end if;
  update public.campaign_lead_forms set status='created_consent_failed',diagnostic=left(coalesce(p_diagnostic,'consent_exception'),200),updated_at=now() where id=f.id;
end$$;

-- ============================================================================
-- flag_stale_campaign_lead_form_creations: mirrors M7's flag_stale_whatsapp_
-- outreach_executions exactly (Part 20). service_role-only, intended for the
-- same scheduled/cron-triggered route pattern -- no new scheduler. Never
-- auto-recreates: claim_campaign_lead_form_creation only ever matches
-- status='draft', so an 'uncertain' row can never be silently reclaimed.
-- ============================================================================
create or replace function public.flag_stale_campaign_lead_form_creations(p_stale_before timestamptz) returns setof uuid language plpgsql security definer set search_path=public as $$
declare r record;
begin
  if current_setting('role',true)<>'service_role' then
    raise exception 'service role required';
  end if;
  for r in
    update public.campaign_lead_forms set status='uncertain',updated_at=now()
      where status='creating' and claimed_at is not null and claimed_at<p_stale_before
      returning id
  loop
    return next r.id;
  end loop;
  return;
end$$;

commit;
