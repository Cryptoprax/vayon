-- Sprint 120A: Enterprise Workspace Role Catalog
-- Additive only. Existing role IDs, assignments, and invitations are preserved.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

insert into public.roles (code, name, scope)
values
  ('organization_owner', 'Organization Owner', 'organization'),
  ('organization_admin', 'Organization Admin', 'organization'),
  ('manager', 'Manager', 'workspace'),
  ('sales', 'Sales', 'workspace'),
  ('marketing', 'Marketing', 'workspace'),
  ('operations', 'Operations', 'workspace'),
  ('finance', 'Finance', 'workspace'),
  ('support', 'Support', 'workspace'),
  ('read_only', 'Read-only', 'organization'),
  ('operations_manager', 'Operations Manager', 'workspace'),
  ('sales_manager', 'Sales Manager', 'workspace'),
  ('sales_representative', 'Sales Representative', 'workspace'),
  ('marketing_manager', 'Marketing Manager', 'workspace'),
  ('marketing_specialist', 'Marketing Specialist', 'workspace'),
  ('customer_success_manager', 'Customer Success Manager', 'workspace'),
  ('support_agent', 'Support Agent', 'workspace'),
  ('finance_manager', 'Finance Manager', 'workspace'),
  ('hr_manager', 'HR Manager', 'workspace'),
  ('knowledge_manager', 'Knowledge Manager', 'workspace'),
  ('product_manager', 'Product Manager', 'workspace'),
  ('ai_manager', 'AI Manager', 'workspace'),
  ('analyst', 'Analyst', 'workspace'),
  ('standard_member', 'Standard Member', 'workspace'),
  ('viewer', 'Viewer', 'workspace'),
  ('guest', 'Guest', 'workspace')
on conflict (code) do nothing;

create or replace function public.invite_organization_member(
  p_workspace_id uuid,
  p_name text,
  p_email text,
  p_role text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := public.enterprise_org_context(p_workspace_id);
  v_role uuid;
  v_id uuid;
begin
  select r.id
    into v_role
    from public.roles r
   where r.code = p_role
     and r.code in (
       'organization_admin',
       'manager', 'sales', 'marketing', 'operations', 'finance', 'support', 'read_only',
       'operations_manager',
       'sales_manager', 'sales_representative',
       'marketing_manager', 'marketing_specialist',
       'customer_success_manager', 'support_agent', 'finance_manager', 'hr_manager',
       'knowledge_manager', 'product_manager', 'ai_manager', 'analyst',
       'standard_member', 'viewer', 'guest'
     );

  if v_role is null then
    raise exception 'invalid role';
  end if;

  if exists (
    select 1
      from auth.users u
      join public.organization_members om on om.user_id = u.id
     where om.organization_id = v_org
       and lower(u.email) = lower(p_email)
       and om.status <> 'removed'
  ) then
    raise exception 'user is already a member';
  end if;

  update public.invitations
     set status = 'cancelled', cancelled_at = now()
   where organization_id = v_org
     and lower(email) = lower(p_email)
     and status = 'pending';

  insert into public.invitations (
    organization_id, workspace_id, email, name, role_id, status, expires_at, invited_by
  ) values (
    v_org, p_workspace_id, lower(trim(p_email)), trim(p_name), v_role,
    'pending', now() + interval '7 days', auth.uid()
  ) returning id into v_id;

  insert into public.organization_audit_events (
    organization_id, workspace_id, actor_id, event_type, subject_id, metadata
  ) values (
    v_org, p_workspace_id, auth.uid(), 'invitation.sent', v_id,
    jsonb_build_object('role', p_role)
  );

  return v_id;
end;
$$;

create or replace function public.change_organization_member_role(
  p_workspace_id uuid,
  p_member_id uuid,
  p_role text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := public.enterprise_org_context(p_workspace_id);
  v_role uuid;
  v_user uuid;
begin
  select r.id
    into v_role
    from public.roles r
   where r.code = p_role
     and r.code in (
       'organization_admin',
       'manager', 'sales', 'marketing', 'operations', 'finance', 'support', 'read_only',
       'operations_manager',
       'sales_manager', 'sales_representative',
       'marketing_manager', 'marketing_specialist',
       'customer_success_manager', 'support_agent', 'finance_manager', 'hr_manager',
       'knowledge_manager', 'product_manager', 'ai_manager', 'analyst',
       'standard_member', 'viewer', 'guest'
     );

  select wm.user_id
    into v_user
    from public.workspace_members wm
   where wm.id = p_member_id
     and wm.organization_id = v_org
     and wm.workspace_id = p_workspace_id
     and wm.status <> 'removed';

  if v_role is null or v_user is null then
    raise exception 'invalid member or role';
  end if;

  if exists (
    select 1
      from public.workspace_members wm
      join public.roles r on r.id = wm.role_id
     where wm.id = p_member_id
       and r.code = 'organization_owner'
  ) then
    raise exception 'owner role cannot be changed';
  end if;

  update public.workspace_members
     set role_id = v_role, updated_at = now()
   where id = p_member_id;

  update public.organization_members
     set role_id = v_role, updated_at = now()
   where organization_id = v_org
     and user_id = v_user;

  insert into public.organization_audit_events (
    organization_id, workspace_id, actor_id, event_type, subject_id, metadata
  ) values (
    v_org, p_workspace_id, auth.uid(), 'member.role_changed', v_user,
    jsonb_build_object('role', p_role)
  );
end;
$$;

revoke all on function public.invite_organization_member(uuid, text, text, text) from public;
revoke all on function public.change_organization_member_role(uuid, uuid, text) from public;
grant execute on function public.invite_organization_member(uuid, text, text, text) to authenticated;
grant execute on function public.change_organization_member_role(uuid, uuid, text) to authenticated;

commit;
