-- Existing workspace provisioning remains authoritative. No backfill or trial reset.
-- This migration changes the duration only for newly provisioned workspaces.
create or replace function public.provision_workspace_billing(p_workspace uuid, p_organization uuid, p_actor uuid)
returns void language plpgsql security definer set search_path=public as $$
declare
  v_plan subscription_plans%rowtype;
  v_start date = date_trunc('month', now())::date;
  v_end date = (date_trunc('month', now()) + interval '1 month' - interval '1 day')::date;
begin
  select * into v_plan from subscription_plans where code = 'starter';
  insert into subscriptions(organization_id, workspace_id, plan_id, trial_ends_at, current_period_ends_at, seat_quantity, created_by, updated_by)
  values(p_organization, p_workspace, v_plan.id, now() + interval '3 days', now() + interval '3 days',
    greatest(1, (select count(*) from workspace_members where workspace_id=p_workspace and status='active')), p_actor, p_actor)
  on conflict(workspace_id) do nothing;
  insert into organization_limits(organization_id, workspace_id, metric, limit_value)
  select p_organization, p_workspace, key, (value#>>'{}')::numeric from jsonb_each(v_plan.limits)
  where jsonb_typeof(value)='number' on conflict(workspace_id,metric) do nothing;
  insert into organization_usage(organization_id,workspace_id,metric,quantity,period_start,period_end) values
    (p_organization,p_workspace,'users',(select count(*) from workspace_members where workspace_id=p_workspace and status='active'),v_start,v_end),
    (p_organization,p_workspace,'properties',(select count(*) from properties where workspace_id=p_workspace and deleted_at is null),v_start,v_end),
    (p_organization,p_workspace,'leads',(select count(*) from leads where workspace_id=p_workspace and deleted_at is null),v_start,v_end),
    (p_organization,p_workspace,'deals',(select count(*) from deals where workspace_id=p_workspace and deleted_at is null),v_start,v_end),
    (p_organization,p_workspace,'storage_gb',0,v_start,v_end),
    (p_organization,p_workspace,'ai_requests',0,v_start,v_end),
    (p_organization,p_workspace,'messages',0,v_start,v_end),
    (p_organization,p_workspace,'calls',0,v_start,v_end),
    (p_organization,p_workspace,'exports',0,v_start,v_end)
  on conflict(workspace_id,metric,period_start) do nothing;
end;
$$;
-- Preserve the original privileged-only provisioning boundary.
revoke all on function public.provision_workspace_billing(uuid,uuid,uuid) from public;
