-- Sprint 236: explicit, one-time promotional access. Existing trials remain unchanged.
create table if not exists public.workspace_promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null check (code = 'VAYON3DAY'),
  user_id uuid not null references auth.users(id),
  organization_id uuid not null references public.organizations(id),
  workspace_id uuid not null references public.workspaces(id),
  redeemed_at timestamptz not null default clock_timestamp(),
  access_ends_at timestamptz not null,
  unique (code, user_id),
  unique (code, organization_id),
  unique (code, workspace_id),
  check (access_ends_at > redeemed_at)
);

alter table public.workspace_promo_redemptions enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='workspace_promo_redemptions' and policyname='workspace_promo_redemptions_owner_read') then
    create policy "workspace_promo_redemptions_owner_read" on public.workspace_promo_redemptions
      for select to authenticated using (user_id = auth.uid());
  end if;
end $$;

create or replace function public.redeem_vayon3day(p_code text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_user uuid := auth.uid();
  v_organization uuid;
  v_workspace uuid;
  v_subscription public.subscriptions%rowtype;
  v_now timestamptz := clock_timestamp();
  v_ends timestamptz := v_now + interval '3 days';
begin
  if v_user is null then raise exception 'authentication required' using errcode='42501'; end if;
  if upper(btrim(coalesce(p_code,''))) <> 'VAYON3DAY' then
    return jsonb_build_object('ok',false,'code','INVALID_CODE');
  end if;
  select organization_id, workspace_id into v_organization, v_workspace
    from public.user_organization_context where user_id=v_user;
  if v_workspace is null or public.current_workspace_role(v_workspace) not in ('organization_owner','organization_admin','billing_admin') then
    raise exception 'billing permission required' using errcode='42501';
  end if;
  select * into v_subscription from public.subscriptions
    where workspace_id=v_workspace and organization_id=v_organization and deleted_at is null for update;
  if not found then return jsonb_build_object('ok',false,'code','SUBSCRIPTION_UNVERIFIED'); end if;
  if v_subscription.status='active' then return jsonb_build_object('ok',false,'code','PAID_SUBSCRIPTION'); end if;
  -- A historical automatic trial has an immutable non-null end date. Never reset it.
  if v_subscription.trial_ends_at is not null then return jsonb_build_object('ok',false,'code','LEGACY_TRIAL_USED'); end if;
  if exists(select 1 from public.workspace_promo_redemptions where code='VAYON3DAY' and (workspace_id=v_workspace or organization_id=v_organization or user_id=v_user)) then
    return jsonb_build_object('ok',false,'code','ALREADY_USED');
  end if;
  insert into public.workspace_promo_redemptions(code,user_id,organization_id,workspace_id,redeemed_at,access_ends_at)
    values('VAYON3DAY',v_user,v_organization,v_workspace,v_now,v_ends);
  update public.subscriptions set status='trialing',trial_ends_at=v_ends,current_period_ends_at=v_ends,
    updated_by=v_user,updated_at=v_now,version=version+1
    where id=v_subscription.id;
  return jsonb_build_object('ok',true,'code','REDEEMED','access_ends_at',v_ends);
exception when unique_violation then
  return jsonb_build_object('ok',false,'code','ALREADY_USED');
end;
$$;
revoke all on function public.redeem_vayon3day(text) from public;
grant execute on function public.redeem_vayon3day(text) to authenticated;

-- Preserve the required subscription row and limits for new workspaces, but do
-- not start a trial until the authenticated owner explicitly redeems access.
create or replace function public.provision_workspace_billing(p_workspace uuid, p_organization uuid, p_actor uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_plan subscription_plans%rowtype; v_start date=date_trunc('month',now())::date; v_end date=(date_trunc('month',now())+interval '1 month'-interval '1 day')::date;
begin
  select * into v_plan from subscription_plans where code='starter';
  insert into subscriptions(organization_id,workspace_id,plan_id,trial_ends_at,current_period_ends_at,seat_quantity,created_by,updated_by)
  values(p_organization,p_workspace,v_plan.id,null,null,greatest(1,(select count(*) from workspace_members where workspace_id=p_workspace and status='active')),p_actor,p_actor)
  on conflict(workspace_id) do nothing;
  insert into organization_limits(organization_id,workspace_id,metric,limit_value)
  select p_organization,p_workspace,key,(value#>>'{}')::numeric from jsonb_each(v_plan.limits) where jsonb_typeof(value)='number' on conflict(workspace_id,metric) do nothing;
  insert into organization_usage(organization_id,workspace_id,metric,quantity,period_start,period_end) values
  (p_organization,p_workspace,'users',(select count(*) from workspace_members where workspace_id=p_workspace and status='active'),v_start,v_end),(p_organization,p_workspace,'properties',(select count(*) from properties where workspace_id=p_workspace and deleted_at is null),v_start,v_end),(p_organization,p_workspace,'leads',(select count(*) from leads where workspace_id=p_workspace and deleted_at is null),v_start,v_end),(p_organization,p_workspace,'deals',(select count(*) from deals where workspace_id=p_workspace and deleted_at is null),v_start,v_end),(p_organization,p_workspace,'storage_gb',0,v_start,v_end),(p_organization,p_workspace,'ai_requests',0,v_start,v_end),(p_organization,p_workspace,'messages',0,v_start,v_end),(p_organization,p_workspace,'calls',0,v_start,v_end),(p_organization,p_workspace,'exports',0,v_start,v_end) on conflict(workspace_id,metric,period_start) do nothing;
end$$;
