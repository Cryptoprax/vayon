-- Sprint 86.5: governed tenant memory, incremental learning, and executive briefings.
create table if not exists public.intelligence_memory (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  scope text not null check (scope in ('organization','user')),
  memory_key text not null,
  memory_value jsonb not null check (jsonb_typeof(memory_value)='array'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((scope='organization' and user_id is null) or (scope='user' and user_id is not null))
);
create unique index if not exists intelligence_memory_org_key on public.intelligence_memory(workspace_id,memory_key) where scope='organization';
create unique index if not exists intelligence_memory_user_key on public.intelligence_memory(workspace_id,user_id,memory_key) where scope='user';

create table if not exists public.continuous_learning_aggregates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  period_start date not null,
  metric_key text not null,
  metric_value numeric not null default 0,
  evidence_count integer not null default 0,
  refreshed_at timestamptz not null default now(),
  unique(workspace_id,period_start,metric_key)
);
create index if not exists continuous_learning_period_idx on public.continuous_learning_aggregates(organization_id,workspace_id,period_start desc,metric_key);

create table if not exists public.executive_intelligence_briefings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  period text not null check (period in ('weekly','monthly','quarterly','customer_success','ai_adoption','knowledge_health')),
  summary text not null check (length(summary) between 1 and 12000),
  source text not null check (source in ('openai','deterministic-rules')),
  model text,
  ai_generated boolean not null default false,
  recommendation_only boolean not null default true check (recommendation_only=true),
  created_by uuid not null references auth.users(id),
  generated_at timestamptz not null default now()
);
create index if not exists executive_briefings_scope_idx on public.executive_intelligence_briefings(organization_id,workspace_id,generated_at desc);

create table if not exists public.continuous_learning_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  operation text not null check (operation in ('incremental_aggregation','knowledge_refresh','briefing_generation','recommendation_generation')),
  status text not null check (status in ('running','completed','failed')),
  latency_ms integer,
  failure_code text,
  evidence_count integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists continuous_learning_jobs_scope_idx on public.continuous_learning_jobs(organization_id,workspace_id,started_at desc);

alter table public.intelligence_memory enable row level security;
alter table public.continuous_learning_aggregates enable row level security;
alter table public.executive_intelligence_briefings enable row level security;
alter table public.continuous_learning_jobs enable row level security;
revoke all on public.intelligence_memory,public.continuous_learning_aggregates,public.executive_intelligence_briefings,public.continuous_learning_jobs from anon,authenticated;
create policy "intelligence memory tenant read" on public.intelligence_memory for select to authenticated using (public.current_workspace_role(workspace_id) is not null and (scope='organization' or user_id=auth.uid()));
create policy "learning aggregate admin read" on public.continuous_learning_aggregates for select to authenticated using (public.current_workspace_role(workspace_id) in ('organization_owner','organization_admin','manager'));
create policy "executive briefing admin read" on public.executive_intelligence_briefings for select to authenticated using (public.current_workspace_role(workspace_id) in ('organization_owner','organization_admin','manager'));
create policy "learning job admin read" on public.continuous_learning_jobs for select to authenticated using (public.current_workspace_role(workspace_id) in ('organization_owner','organization_admin','manager'));

create or replace function public.upsert_intelligence_memory(p_workspace_id uuid,p_scope text,p_key text,p_value jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare v_org uuid;v_role text;v_id uuid;v_user uuid:=auth.uid();
begin
  select organization_id,public.current_workspace_role(p_workspace_id) into v_org,v_role from public.workspace_members where workspace_id=p_workspace_id and user_id=v_user and status='active';
  if v_org is null then raise exception 'workspace access required';end if;
  if p_scope not in('organization','user') or jsonb_typeof(p_value)<>'array' or jsonb_array_length(p_value)>50 or length(p_value::text)>4000 then raise exception 'invalid memory preference';end if;
  if p_scope='organization' and v_role not in('organization_owner','organization_admin','manager') then raise exception 'organization memory permission required';end if;
  if (p_scope='organization' and p_key not in('preferred_terminology','frequent_workflows','favorite_reports','frequent_questions','pinned_knowledge','frequent_campaigns','preferred_proposal_templates','default_property_filters','saved_ai_prompt_templates','support_language')) or (p_scope='user' and p_key not in('favorite_dashboards','recent_searches','pinned_projects','frequent_ai_prompts','preferred_layouts','notification_preferences','assistant_preferences')) then raise exception 'unsupported memory key';end if;
  if p_scope='organization' then
    insert into public.intelligence_memory(organization_id,workspace_id,user_id,scope,memory_key,memory_value,created_by) values(v_org,p_workspace_id,null,p_scope,p_key,p_value,v_user)
    on conflict (workspace_id,memory_key) where scope='organization' do update set memory_value=excluded.memory_value,updated_at=now(),created_by=v_user returning id into v_id;
  else
    insert into public.intelligence_memory(organization_id,workspace_id,user_id,scope,memory_key,memory_value,created_by) values(v_org,p_workspace_id,v_user,p_scope,p_key,p_value,v_user)
    on conflict (workspace_id,user_id,memory_key) where scope='user' do update set memory_value=excluded.memory_value,updated_at=now(),created_by=v_user returning id into v_id;
  end if;
  insert into public.organization_audit_events(organization_id,workspace_id,actor_id,event_type,subject_id,metadata) values(v_org,p_workspace_id,v_user,'intelligence_memory.updated',v_id,jsonb_build_object('scope',p_scope,'key',p_key,'value_count',jsonb_array_length(p_value)));
  return v_id;
end$$;

create or replace function public.store_executive_intelligence_briefing(p_workspace_id uuid,p_briefing jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare v_org uuid;v_role text;v_id uuid;v_job uuid;v_started timestamptz:=clock_timestamp();
begin
  select organization_id,public.current_workspace_role(p_workspace_id) into v_org,v_role from public.workspace_members where workspace_id=p_workspace_id and user_id=auth.uid() and status='active';
  if v_org is null or v_role not in('organization_owner','organization_admin','manager') then raise exception 'executive intelligence permission required';end if;
  if p_briefing->>'period' not in('weekly','monthly','quarterly','customer_success','ai_adoption','knowledge_health') or p_briefing->>'source' not in('openai','deterministic-rules') or length(p_briefing->>'summary') not between 1 and 12000 then raise exception 'invalid executive briefing';end if;
  insert into public.continuous_learning_jobs(organization_id,workspace_id,operation,status) values(v_org,p_workspace_id,'briefing_generation','running') returning id into v_job;
  insert into public.executive_intelligence_briefings(organization_id,workspace_id,period,summary,source,model,ai_generated,created_by) values(v_org,p_workspace_id,p_briefing->>'period',p_briefing->>'summary',p_briefing->>'source',nullif(p_briefing->>'model',''),coalesce((p_briefing->>'aiGenerated')::boolean,false),auth.uid()) returning id into v_id;
  update public.continuous_learning_jobs set status='completed',latency_ms=greatest(0,extract(milliseconds from clock_timestamp()-v_started)::integer),evidence_count=1,completed_at=clock_timestamp() where id=v_job;
  insert into public.organization_audit_events(organization_id,workspace_id,actor_id,event_type,subject_id,metadata) values(v_org,p_workspace_id,auth.uid(),'executive_intelligence.briefing_generated',v_id,jsonb_build_object('period',p_briefing->>'period','source',p_briefing->>'source','recommendation_only',true));
  return v_id;
end$$;

create or replace function public.refresh_continuous_learning_aggregates(p_workspace_id uuid,p_period_start date default current_date) returns integer language plpgsql security definer set search_path=public as $$
declare v_org uuid;v_count integer;v_started timestamptz:=clock_timestamp();v_job uuid;
begin
  select organization_id into v_org from public.workspaces where id=p_workspace_id;
  if v_org is null then raise exception 'workspace required';end if;
  if auth.role()<>'service_role' and public.current_workspace_role(p_workspace_id) not in('organization_owner','organization_admin') then raise exception 'aggregation permission required';end if;
  insert into public.continuous_learning_jobs(organization_id,workspace_id,operation,status) values(v_org,p_workspace_id,'incremental_aggregation','running') returning id into v_job;
  insert into public.continuous_learning_aggregates(organization_id,workspace_id,period_start,metric_key,metric_value,evidence_count)
  select v_org,p_workspace_id,p_period_start,event_name,count(*),count(*) from public.product_intelligence_events where workspace_id=p_workspace_id and occurred_at>=p_period_start and occurred_at<p_period_start+1 group by event_name
  on conflict(workspace_id,period_start,metric_key) do update set metric_value=excluded.metric_value,evidence_count=excluded.evidence_count,refreshed_at=now();
  get diagnostics v_count=row_count;
  update public.continuous_learning_jobs set status='completed',latency_ms=greatest(0,extract(milliseconds from clock_timestamp()-v_started)::integer),evidence_count=v_count,completed_at=clock_timestamp() where id=v_job;
  return v_count;
end$$;
revoke all on function public.upsert_intelligence_memory(uuid,text,text,jsonb),public.store_executive_intelligence_briefing(uuid,jsonb),public.refresh_continuous_learning_aggregates(uuid,date) from public;
grant execute on function public.upsert_intelligence_memory(uuid,text,text,jsonb),public.store_executive_intelligence_briefing(uuid,jsonb) to authenticated;
grant execute on function public.refresh_continuous_learning_aggregates(uuid,date) to service_role;
