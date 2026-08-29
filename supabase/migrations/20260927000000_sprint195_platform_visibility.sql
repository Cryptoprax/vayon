-- Sprint 195: additive platform visibility registry and workspace industry lock.
create table if not exists public.workspace_industry(
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  industry text not null default 'REAL_ESTATE' check(industry in('REAL_ESTATE','HEALTHCARE','LEGAL','FINANCE','CONSTRUCTION','HOSPITALITY','ECOMMERCE','GENERAL')),
  created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.platform_features(
  id text primary key,path_prefix text not null unique,description text not null,founder_only boolean not null default false,enabled boolean not null default true,created_at timestamptz not null default now()
);
create table if not exists public.industry_visibility(
  feature_id text not null references public.platform_features(id) on delete cascade,industry text not null check(industry in('REAL_ESTATE','HEALTHCARE','LEGAL','FINANCE','CONSTRUCTION','HOSPITALITY','ECOMMERCE','GENERAL')),visible boolean not null default true,primary key(feature_id,industry)
);
create table if not exists public.role_visibility(
  feature_id text not null references public.platform_features(id) on delete cascade,role_code text not null,visible boolean not null default true,primary key(feature_id,role_code)
);
insert into public.workspace_industry(workspace_id,organization_id,industry)select id,organization_id,'REAL_ESTATE' from public.workspaces on conflict(workspace_id)do nothing;
alter table public.workspace_industry enable row level security;alter table public.platform_features enable row level security;alter table public.industry_visibility enable row level security;alter table public.role_visibility enable row level security;
create policy "workspace industry member read" on public.workspace_industry for select to authenticated using(public.current_workspace_role(workspace_id)is not null or(auth.jwt()->'app_metadata'->>'role')in('founder','super_admin'));
create policy "platform feature authenticated read" on public.platform_features for select to authenticated using(true);
create policy "industry visibility authenticated read" on public.industry_visibility for select to authenticated using(true);
create policy "role visibility authenticated read" on public.role_visibility for select to authenticated using(true);
insert into public.platform_features(id,path_prefix,description,founder_only)values
('platform','/platform','Platform administration and global operations',true),('developer-brain','/vayon/brain','Internal AI brain diagnostics',true),('developer-runtime','/vayon/runtime','Internal AI runtime diagnostics',true),('developer-cognitive','/vayon/cognitive','Internal cognitive engine',true),('developer-context','/vayon/context','Internal context engine',true),('developer-objects','/vayon/objects','Internal universal object architecture',true),('system-diagnostics','/vayon/system','Internal system diagnostics',true),('real-estate-workspace','/vayon','Real Estate Edition workspace',false)on conflict(id)do update set path_prefix=excluded.path_prefix,description=excluded.description,founder_only=excluded.founder_only;
