-- Business+ Approval Workflows: tenant-safe persistent foundation.
--
-- Replaces the prior customer-facing GovernanceService, which used a
-- module-level in-memory repository with no organization_id/workspace_id
-- scoping and no live mutation path. This migration is additive only: it
-- creates two new tables and their supporting RPCs. No existing table is
-- altered, and no existing function is replaced.
--
-- Follows the same proven pattern already used for ai_approval_queue /
-- decide_ai_approval() (sprint22): organization_id + workspace_id on every
-- row, RLS restricted to SELECT only, all writes through SECURITY DEFINER
-- RPCs that perform their own membership/role/version checks, and a
-- corresponding audit trail insert on every transition.
--
-- Role taxonomy note: the legacy can_govern_ai()/create_property() style
-- functions check current_workspace_role() against a role set that includes
-- "branch_manager". That role does not exist in the workspace role catalog
-- seeded by sprint120a (20260919000000_sprint120a_workspace_role_catalog.sql)
-- or in features/platform/organization/config/workspace-role-catalog.ts --
-- it is stale/legacy drift predating that catalog. can_manage_approvals()
-- below intentionally uses only the current, authoritative role codes.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ============================================================================
-- Tables
-- ============================================================================

create table public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  workspace_id uuid not null references public.workspaces(id),
  source_type text not null,
  source_id uuid null,
  action_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired', 'cancelled')),
  requested_by uuid not null references auth.users(id),
  approver_id uuid null references auth.users(id),
  reason text null,
  requested_at timestamptz not null default now(),
  decided_at timestamptz null,
  version integer not null default 1
);

create index approval_requests_tenant_status_idx
  on public.approval_requests (organization_id, workspace_id, status, requested_at desc);

create table public.approval_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  workspace_id uuid not null references public.workspaces(id),
  approval_id uuid not null references public.approval_requests(id),
  event text not null,
  actor_id uuid not null references auth.users(id),
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index approval_events_approval_occurred_idx
  on public.approval_events (approval_id, occurred_at);

create index approval_events_tenant_idx
  on public.approval_events (organization_id, workspace_id, occurred_at desc);

-- ============================================================================
-- RLS: read-only for authenticated tenant members. All writes go through the
-- SECURITY DEFINER RPCs below -- no direct INSERT/UPDATE/DELETE policy exists,
-- matching the ai_approval_queue precedent.
-- ============================================================================

alter table public.approval_requests enable row level security;
alter table public.approval_events enable row level security;

create policy "approval_requests_workspace_read" on public.approval_requests
  for select to authenticated
  using (public.is_organization_member(organization_id) and public.current_workspace_role(workspace_id) is not null);

create policy "approval_events_workspace_read" on public.approval_events
  for select to authenticated
  using (public.is_organization_member(organization_id) and public.current_workspace_role(workspace_id) is not null);

-- ============================================================================
-- can_manage_approvals: mirrors can_govern_ai()'s exact shape. Deliberately a
-- new, separate function rather than reusing can_govern_ai() -- that function
-- is semantically AI-specific and already backs the free ai_workforce
-- recommendation-approval flow; reusing it here would conflate two different
-- products under one name. Conservative role set: only the organization-wide
-- roles (owner, admin, and the legacy broad "manager" role retained for
-- members who held it before the sprint120a catalog) can decide approvals.
-- Domain-specific manager roles (sales_manager, marketing_manager, etc.) can
-- view and request but not decide -- see the "approvals" permission module
-- grants for the application-layer counterpart of this decision.
-- ============================================================================

create or replace function public.can_manage_approvals(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_workspace_role(p_workspace_id) in ('organization_owner', 'organization_admin', 'manager')
$$;

-- ============================================================================
-- request_approval: any active workspace member may request. organization_id
-- is derived exclusively from the caller's own active workspace_members row
-- (never client-supplied), which also structurally guarantees the workspace
-- belongs to that organization -- the same derivation used by
-- create_property()/decide_ai_approval() elsewhere in this schema.
-- ============================================================================

create or replace function public.request_approval(p_workspace_id uuid, p_input jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
  v_source_type text := nullif(trim(p_input->>'sourceType'), '');
  v_action_type text := nullif(trim(p_input->>'actionType'), '');
  v_source_id uuid;
  v_payload jsonb := coalesce(p_input->'payload', '{}'::jsonb);
  v_id uuid;
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;

  select organization_id into v_org
    from workspace_members
   where workspace_id = p_workspace_id
     and user_id = v_user
     and status = 'active';

  if v_org is null then
    raise exception 'insufficient approval permission';
  end if;

  if v_source_type is null or v_action_type is null then
    raise exception 'sourceType and actionType are required';
  end if;

  begin
    v_source_id := nullif(p_input->>'sourceId', '')::uuid;
  exception when invalid_text_representation then
    raise exception 'sourceId must be a valid uuid';
  end;

  if jsonb_typeof(v_payload) <> 'object' then
    raise exception 'payload must be a JSON object';
  end if;

  insert into approval_requests (
    organization_id, workspace_id, source_type, source_id, action_type, payload, requested_by
  ) values (
    v_org, p_workspace_id, v_source_type, v_source_id, v_action_type, v_payload, v_user
  ) returning id into v_id;

  insert into approval_events (organization_id, workspace_id, approval_id, event, actor_id, metadata)
  values (v_org, p_workspace_id, v_id, 'approval.requested', v_user, jsonb_build_object('sourceType', v_source_type, 'actionType', v_action_type));

  insert into activity_events (organization_id, workspace_id, event_type, title, actor_id, related_type, related_id)
  values (v_org, p_workspace_id, 'approval.requested', 'Approval requested: ' || v_action_type, v_user, 'approval', v_id);

  return v_id;
end;
$$;

-- ============================================================================
-- decide_approval: row-locked, version-checked, pending-only transition.
-- can_manage_approvals() gates who may decide; self-approval is forbidden
-- regardless of role. Mirrors decide_ai_approval()'s exact shape.
-- ============================================================================

create or replace function public.decide_approval(
  p_approval_id uuid,
  p_expected_version integer,
  p_decision text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  a approval_requests%rowtype;
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'invalid approval decision';
  end if;

  select * into a from approval_requests where id = p_approval_id for update;

  if not found or not public.can_manage_approvals(a.workspace_id) then
    raise exception 'insufficient approval permission';
  end if;

  if a.requested_by = v_user then
    raise exception 'approval policy forbids self approval';
  end if;

  if a.version <> p_expected_version then
    raise exception 'approval changed by another user';
  end if;

  if a.status <> 'pending' then
    raise exception 'approval is not pending';
  end if;

  update approval_requests
     set status = p_decision,
         approver_id = v_user,
         reason = p_reason,
         decided_at = now(),
         version = version + 1
   where id = p_approval_id;

  insert into approval_events (organization_id, workspace_id, approval_id, event, actor_id, metadata)
  values (a.organization_id, a.workspace_id, a.id, 'approval.' || p_decision, v_user, jsonb_build_object('reason', p_reason));

  insert into activity_events (organization_id, workspace_id, event_type, title, actor_id, related_type, related_id)
  values (a.organization_id, a.workspace_id, 'approval.' || p_decision, 'Approval ' || p_decision || ': ' || a.action_type, v_user, 'approval', a.id);
end;
$$;

-- ============================================================================
-- cancel_approval: requester or a manage-capable role, pending only.
-- ============================================================================

create or replace function public.cancel_approval(p_approval_id uuid, p_expected_version integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  a approval_requests%rowtype;
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;

  select * into a from approval_requests where id = p_approval_id for update;

  if not found or (a.requested_by <> v_user and not public.can_manage_approvals(a.workspace_id)) then
    raise exception 'insufficient approval permission';
  end if;

  if a.version <> p_expected_version then
    raise exception 'approval changed by another user';
  end if;

  if a.status <> 'pending' then
    raise exception 'approval is not pending';
  end if;

  update approval_requests
     set status = 'cancelled',
         version = version + 1
   where id = p_approval_id;

  insert into approval_events (organization_id, workspace_id, approval_id, event, actor_id)
  values (a.organization_id, a.workspace_id, a.id, 'approval.cancelled', v_user);

  insert into activity_events (organization_id, workspace_id, event_type, title, actor_id, related_type, related_id)
  values (a.organization_id, a.workspace_id, 'approval.cancelled', 'Approval cancelled: ' || a.action_type, v_user, 'approval', a.id);
end;
$$;

-- ============================================================================
-- Grants: revoke default PUBLIC execute, grant only to authenticated.
-- ============================================================================

revoke all on function public.can_manage_approvals(uuid) from public;
revoke all on function public.request_approval(uuid, jsonb) from public;
revoke all on function public.decide_approval(uuid, integer, text, text) from public;
revoke all on function public.cancel_approval(uuid, integer) from public;

grant execute on function public.can_manage_approvals(uuid) to authenticated;
grant execute on function public.request_approval(uuid, jsonb) to authenticated;
grant execute on function public.decide_approval(uuid, integer, text, text) to authenticated;
grant execute on function public.cancel_approval(uuid, integer) to authenticated;

commit;
