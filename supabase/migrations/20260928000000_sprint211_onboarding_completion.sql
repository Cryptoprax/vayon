-- Sprint 211: completion must not fail after the required tenant already exists.
-- Root cause: organization_audit_events does not allow `onboarding.completed`.
create or replace function public.complete_enterprise_onboarding() returns void
language plpgsql security definer set search_path=public as $$
declare s onboarding_sessions%rowtype; v_org uuid; v_workspace uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select * into s from onboarding_sessions where user_id=auth.uid() for update;
  if not found then raise exception 'onboarding session unavailable'; end if;
  select wm.organization_id,wm.workspace_id into v_org,v_workspace
  from workspace_members wm join workspaces w on w.id=wm.workspace_id
  where wm.user_id=auth.uid() and wm.status='active' and w.status='active'
  order by wm.created_at limit 1;
  if v_org is null or v_workspace is null then raise exception 'workspace must be created before launch'; end if;

  update onboarding_sessions set organization_id=v_org,workspace_id=v_workspace,current_step=15,
    completed_steps=array[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],completed_at=now(),updated_at=now()
  where id=s.id;
  if not found then raise exception 'onboarding completion was not persisted'; end if;

  begin
    if s.demo_mode then insert into onboarding_demo_seed_requests(organization_id,workspace_id,requested_by)
      values(v_org,v_workspace,auth.uid()) on conflict do nothing; end if;
  exception when others then raise warning 'optional demo provisioning deferred: %',sqlerrm; end;
  begin
    insert into organization_audit_events(organization_id,workspace_id,actor_id,event_type,subject_id,metadata)
      values(v_org,v_workspace,auth.uid(),'organization.updated',s.id,jsonb_build_object('action','onboarding.completed','demo_mode',s.demo_mode));
  exception when others then raise warning 'optional onboarding audit deferred: %',sqlerrm; end;
  begin
    insert into onboarding_step_events(user_id,organization_id,workspace_id,step,event_type,duration_ms)
      values(auth.uid(),v_org,v_workspace,15,'completed',(extract(epoch from(now()-s.started_at))*1000)::integer);
  exception when others then raise warning 'optional onboarding telemetry deferred: %',sqlerrm; end;
end$$;

revoke all on function public.complete_enterprise_onboarding() from public;
grant execute on function public.complete_enterprise_onboarding() to authenticated;

-- AI setup is optional. A provider/catalog failure must not roll back the tenant.
create or replace function public.provision_ai_workforce_on_workspace() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  begin
    perform public.provision_ai_workforce(new.id,new.organization_id,new.created_by);
  exception when others then
    begin
      insert into public.tasks(organization_id,workspace_id,title,description,status,priority,assigned_user_id,created_by,updated_by)
      values(new.organization_id,new.id,'Retry AI employee provisioning',left('Deferred during workspace creation: '||sqlerrm,1000),'pending','high',new.created_by,new.created_by,new.created_by);
    exception when others then
      raise warning 'AI provisioning and retry task creation deferred for workspace %: %',new.id,sqlerrm;
    end;
  end;
  return new;
end$$;
