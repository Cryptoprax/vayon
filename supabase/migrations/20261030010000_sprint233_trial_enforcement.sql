-- One commercial policy, shared by application preflights and transactional row guards.
-- No grants to write business records, no RLS changes, and no existing-data deletion.
create or replace function public.workspace_subscription_write_policy(p_workspace_id uuid, p_resource text default 'write', p_email text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s subscriptions%rowtype; used integer := 0; cap integer; delta integer := 1;
begin
  if p_resource not in ('write','properties','leads','companies','members') then raise exception 'invalid subscription resource'; end if;
  -- Existing trusted founder entitlement exemption; never accept a caller-supplied bypass flag.
  if coalesce(auth.jwt()->'app_metadata'->>'role','') in ('founder','super_admin') then return jsonb_build_object('allowed',true); end if;
  select * into s from subscriptions where workspace_id=p_workspace_id and deleted_at is null;
  if not found then return jsonb_build_object('allowed',false,'code','SUBSCRIPTION_UNVERIFIED','resource',p_resource); end if;
  if s.status <> 'trialing' then return jsonb_build_object('allowed',true); end if;
  -- Serialize trial mutations per workspace. Re-read after the lock, including upgrade races.
  select * into s from subscriptions where workspace_id=p_workspace_id and deleted_at is null for update;
  if not found then return jsonb_build_object('allowed',false,'code','SUBSCRIPTION_UNVERIFIED','resource',p_resource); end if;
  if s.status <> 'trialing' then return jsonb_build_object('allowed',true); end if;
  if s.trial_ends_at is null then return jsonb_build_object('allowed',false,'code','SUBSCRIPTION_UNVERIFIED','resource',p_resource); end if;
  if s.trial_ends_at <= clock_timestamp() then return jsonb_build_object('allowed',false,'code','TRIAL_EXPIRED','resource',p_resource); end if;
  if p_resource='write' then return jsonb_build_object('allowed',true); end if;
  if p_resource='properties' then cap:=1; select count(*) into used from properties where workspace_id=p_workspace_id and deleted_at is null;
  elsif p_resource='leads' then cap:=2; select count(*) into used from leads where workspace_id=p_workspace_id and deleted_at is null;
  elsif p_resource='companies' then cap:=1; select count(*) into used from crm_companies where workspace_id=p_workspace_id and deleted_at is null;
  else
    cap:=2; -- Initial owner plus one additional member. Pending invites reserve the same seat.
    select count(*) into used from (
      select lower(u.email) email from workspace_members wm join auth.users u on u.id=wm.user_id where wm.workspace_id=p_workspace_id and wm.status='active'
      union
      select lower(i.email) from invitations i where i.workspace_id=p_workspace_id and i.status='pending' and i.expires_at>clock_timestamp()
    ) seats;
    if p_email is not null and (
      exists(select 1 from invitations where workspace_id=p_workspace_id and status='pending' and expires_at>clock_timestamp() and lower(email)=lower(p_email))
      or exists(select 1 from workspace_members wm join auth.users u on u.id=wm.user_id where wm.workspace_id=p_workspace_id and wm.status='active' and lower(u.email)=lower(p_email))
    ) then delta:=0; end if;
  end if;
  return jsonb_build_object('allowed',used+delta<=cap,'code',case when used+delta>cap then 'TRIAL_LIMIT_REACHED' else null end,'resource',p_resource,'usage',used,'limit',cap);
end;
$$;
revoke all on function public.workspace_subscription_write_policy(uuid,text,text) from public;

create or replace function public.check_workspace_subscription_write(p_workspace_id uuid,p_resource text default 'write',p_email text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
begin
  -- Reuse the existing active-workspace membership function. This never grants mutation permission.
  if coalesce(auth.role(),'') <> 'service_role' and (auth.uid() is null or public.current_workspace_role(p_workspace_id) is null) then raise exception 'workspace membership required' using errcode='42501'; end if;
  return public.workspace_subscription_write_policy(p_workspace_id,p_resource,p_email);
end;
$$;
revoke all on function public.check_workspace_subscription_write(uuid,text,text) from public;
grant execute on function public.check_workspace_subscription_write(uuid,text,text) to authenticated;
grant execute on function public.check_workspace_subscription_write(uuid,text,text) to service_role;

create or replace function public.enforce_workspace_subscription_write()
returns trigger language plpgsql security definer set search_path=public as $$
declare row_new jsonb; row_old jsonb; workspace uuid; resource text:='write'; email text; decision jsonb;
begin
  if tg_op <> 'DELETE' then row_new:=to_jsonb(new); end if;
  if tg_op <> 'INSERT' then row_old:=to_jsonb(old); end if;
  workspace:=coalesce(row_new->>'workspace_id',row_old->>'workspace_id')::uuid;
  if workspace is null then
    -- Some legacy invitations are organization-scoped; acceptance is guarded on workspace_members.
    if tg_op='DELETE' then return old; else return new; end if;
  end if;
  -- A move must respect the old workspace too; it cannot extract records from an expired trial.
  if tg_op='UPDATE' and row_old->>'workspace_id' is distinct from row_new->>'workspace_id' then
    decision:=public.workspace_subscription_write_policy((row_old->>'workspace_id')::uuid);
    if not (decision->>'allowed')::boolean then raise exception '%',decision->>'code'||':write' using errcode='P0001'; end if;
  end if;
  if tg_op <> 'DELETE' and tg_table_name in ('properties','leads','crm_companies') and row_new->>'deleted_at' is null and (tg_op='INSERT' or row_old->>'deleted_at' is not null or row_old->>'workspace_id' is distinct from row_new->>'workspace_id') then
    resource:=case tg_table_name when 'crm_companies' then 'companies' else tg_table_name end;
  elsif tg_table_name='invitations' and row_new->>'status'='pending' and (tg_op='INSERT' or row_old->>'status'<>'pending' or row_old->>'expires_at' is distinct from row_new->>'expires_at' or row_old->>'email' is distinct from row_new->>'email') then
    resource:='members'; email:=row_new->>'email';
  elsif tg_table_name='workspace_members' and row_new->>'status'='active' and (tg_op='INSERT' or row_old->>'status'<>'active' or row_old->>'workspace_id' is distinct from row_new->>'workspace_id') then
    resource:='members'; select u.email into email from auth.users u where u.id=(row_new->>'user_id')::uuid;
  end if;
  decision:=public.workspace_subscription_write_policy(workspace,resource,email);
  if not (decision->>'allowed')::boolean then raise exception '%',decision->>'code'||':'||resource using errcode='P0001'; end if;
  if tg_op='DELETE' then return old; else return new; end if;
end;
$$;
revoke all on function public.enforce_workspace_subscription_write() from public;

-- Explicit operational tables only: billing, authentication, search history, audit logs,
-- telemetry and notification read receipts are deliberately outside this trigger set.
do $$ declare tab text; begin
  foreach tab in array array[
    'properties','property_saved_views','leads','lead_property_interests','lead_tags','lead_saved_views',
    'crm_companies','crm_contacts','deals','deal_site_visits','deal_offers','deal_payments',
    'deal_commissions','deal_notes','deal_saved_views','tasks','meetings','site_visits',
    'calendar_entries','task_saved_views','communication_threads','communications','call_logs',
    'calls','follow_ups','communication_notes','communication_saved_views',
    'workspace_members','invitations','organization_departments','organization_teams',
    'property_projects','property_units','inventory_units','property_media','property_documents',
    'creative_projects','creative_campaigns','creative_assets','creative_generation_jobs',
    'creative_campaign_packs','creative_campaign_schedule','creative_editor_documents',
    'ai_tasks','ai_recommendations','ai_approval_queue','ai_knowledge','ai_conversations',
    'ai_runtime_outputs','knowledge_entries','integration_connections','whatsapp_connections',
    'workflows','workflow_runs','workflow_executions','marketing_campaigns','campaigns'
  ] loop
    if exists(select 1 from information_schema.columns where table_schema='public' and table_name=tab and column_name='workspace_id') then
      execute format('create trigger subscription_write_guard before insert or update or delete on public.%I for each row execute function public.enforce_workspace_subscription_write()',tab);
    end if;
  end loop;
end $$;
