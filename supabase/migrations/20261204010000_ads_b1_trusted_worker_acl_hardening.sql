-- Phase ADS-B1A: caller-model audit + hardening for the six ADS-B1 RPCs.
-- Additive follow-up; the original ADS-B1 migration
-- (20261204000000_ads_b1_cross_channel_campaign_domain.sql) is unmodified --
-- its checksum is required to still be
-- 552deeadc923be6a2912f7c97aa74ee9b9b3aee486fe1c665c0a27f45d0aaed9. No
-- historical file is edited.
--
-- FINDING 1 (real, proven on disposable local Postgres): is_source_approved
-- performed zero caller-tenant verification for authenticated callers -- it
-- is a pure filter over approval_requests by caller-SUPPLIED
-- organization_id/workspace_id, with no is_organization_member/
-- current_workspace_role check. A completely unrelated authenticated user
-- (no membership in the target org/workspace at all) could call it with
-- another tenant's organization_id/workspace_id/source_id and receive the
-- real approval boolean for that tenant. Proven: an "authenticated outsider"
-- test user querying tenant A's exact (org, workspace, source) triple
-- received `true` -- the correct, real answer for a tenant they have no
-- relationship to. This is a genuine cross-tenant information-disclosure
-- gap, not merely an ACL/body mismatch. Fixed below by requiring, for
-- non-service_role callers only, that the caller actually be a member of
-- BOTH p_organization_id and p_workspace_id before any row is examined.
-- service_role is unaffected (Part 3: a trusted worker calling this always
-- derives org/workspace from the target row it already re-derived itself --
-- see transition_campaign_channel_execution -- never from a caller-supplied,
-- unverified pair from an external boundary).
--
-- FINDING 2 (hygiene, not independently exploitable -- proven safe today
-- because every one of these four functions unconditionally requires
-- auth.uid()-derived membership before doing anything, so a service_role
-- caller with no user JWT always hits "insufficient ... permission" -- but
-- explicitly revoked anyway per this phase's own least-privilege
-- requirement, and as defense-in-depth against a future body edit that
-- forgets to re-audit the ACL): create_campaign_channel_execution,
-- save_campaign_budget_intent, accept_campaign_budget_intent and
-- save_campaign_targeting_intent all carry an EXECUTE grant to service_role
-- via this project's own default privileges (never altered by ADS-B1 or
-- this migration) rather than an explicit grant in the original migration.
-- Traced actual/expected callers for all four: every one is invoked only
-- from features/vayon/campaign-channels/actions.ts, itself only reachable
-- from an authenticated "use server" form action using the caller's own
-- session-bound Supabase client (features/vayon/creative-studio/
-- access.service.ts's creativeStudioAccess()) -- never from a background
-- job, webhook or queue worker. Channel *selection*, budget *drafting*,
-- budget *activation* and targeting *intent* are all human decisions by
-- design (ADS-B1's own migration: "material budget changes must be
-- approval-governed" implies a human sets the number; targeting intent is
-- "descriptive campaign-audience data" a human enters). MODEL A confirmed
-- for all four; service_role explicitly revoked below.
--
-- FINDING 3 (state-spoofing risk, Part 7): transition_campaign_channel_
-- execution currently lets ANY authenticated creative_studio_manage() user
-- set an execution directly to 'active', 'completed', 'failed', 'paused' or
-- 'uncertain' -- outcomes that are supposed to reflect what the real
-- provider actually confirmed, once C7 exists. Today no provider is ever
-- called, so this cannot mislead spend, but it lets a user's own campaign
-- dashboard claim a provider-confirmed fact ("this ad is live") that no
-- provider ever confirmed. Fixed below: only service_role (the future C7
-- sync worker) may set those five provider-confirmed-outcome statuses.
-- Authenticated users retain draft/ready_for_review/approved/publishing --
-- the pre-flight sequence a human legitimately drives, each already (and,
-- for 'approved', now additionally) gated by is_source_approved(). This is
-- a body change to an ADS-B1 function; the signature is unchanged, so every
-- existing caller (TypeScript repository/service/actions, already-passing
-- ADS-B1 tests) continues to work without modification.
--
-- SCOPE: no Meta/Google API call, no OAuth change, no provider write, no
-- pricing/commercial-quota change, no ALTER DEFAULT PRIVILEGES, no
-- historical migration edited, no ADS-B1 table altered.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ============================================================================
-- FINDING 1 FIX: is_source_approved requires the caller to actually be a
-- member of both p_organization_id and p_workspace_id when not service_role.
-- Converted from `language sql` to `language plpgsql` to express the
-- role-conditional guard; return type/signature/read-only semantics
-- (still effectively STABLE) are unchanged, so every existing caller
-- (transition_campaign_channel_execution, accept_campaign_budget_intent,
-- CampaignChannelsRepository.isSourceApproved) is unaffected -- each of
-- those already only ever passes the target row's OWN organization_id/
-- workspace_id, which the caller is, by construction, already a verified
-- member of at that point in its own control flow.
-- ============================================================================
create or replace function public.is_source_approved(
  p_organization_id uuid,
  p_workspace_id uuid,
  p_source_type text,
  p_source_id uuid,
  p_action_type text
) returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if current_setting('role', true) <> 'service_role' then
    if not public.is_organization_member(p_organization_id) or public.current_workspace_role(p_workspace_id) is null then
      raise exception 'insufficient approval visibility permission';
    end if;
  end if;

  return coalesce(
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
  );
end;
$$;

-- ============================================================================
-- FINDING 3 FIX: only service_role may set a provider-confirmed-outcome
-- status. 'approved' now also requires is_source_approved() (previously
-- only 'publishing'/'active' did), closing the gap where a user could mark
-- an execution "approved" with no real D1 approval behind it.
-- ============================================================================
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

  if not v_is_service and p_status in ('active', 'completed', 'failed', 'paused', 'uncertain') then
    raise exception 'TRUSTED_WORKER_ONLY: status % may only be recorded by a trusted provider-sync process', p_status;
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

  if p_status in ('approved', 'publishing', 'active') then
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

-- ============================================================================
-- FINDING 2 FIX: explicit least-privilege ACL. Model A functions lose the
-- incidental default-privilege service_role grant; Model C functions keep
-- (and re-affirm) service_role explicitly.
-- ============================================================================
revoke execute on function public.create_campaign_channel_execution(uuid, text) from service_role;
revoke execute on function public.save_campaign_budget_intent(uuid, text, numeric, numeric, timestamptz, timestamptz) from service_role;
revoke execute on function public.accept_campaign_budget_intent(uuid) from service_role;
revoke execute on function public.save_campaign_targeting_intent(uuid, text, text, text, text, text, text, numeric, numeric, text) from service_role;

grant execute on function public.is_source_approved(uuid, uuid, text, uuid, text) to authenticated;
grant execute on function public.is_source_approved(uuid, uuid, text, uuid, text) to service_role;
grant execute on function public.transition_campaign_channel_execution(uuid, text, text, text) to authenticated;
grant execute on function public.transition_campaign_channel_execution(uuid, text, text, text) to service_role;

commit;
