-- VAYON Version 1 — core schema
-- Generated for manual review. Does not alter migration history.
-- Supabase SQL Editor compatible; no psql meta-commands.
begin;
set local lock_timeout='5s';
set local statement_timeout='120s';

create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null,
  avatar_url text,
  timezone text not null default 'UTC',
  language text not null default 'en',
  country char(2),
  phone text,
  job_title text,
  department text,
  notification_preferences jsonb not null default '{"email":true,"in_app":true,"security":true}'::jsonb,
  security_settings jsonb not null default '{"session_timeout_minutes":480,"login_alerts":true}'::jsonb,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create table if not exists public.identity_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  workspace_id uuid references public.workspaces(id),
  user_id uuid not null references auth.users(id),
  event_type text not null check (event_type in ('login','logout','workspace.created','organization.created','google.connected','profile.updated','invitation.created')),
  outcome text not null default 'success' check (outcome in ('success','failure')),
  correlation_id uuid not null default gen_random_uuid(),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists public.billing_customers(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),provider text not null default 'stripe',provider_customer_id text not null,livemode boolean not null default false,email text,tax_exempt text,tax_ids jsonb not null default '[]',address jsonb not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(workspace_id),unique(provider,provider_customer_id));

create table if not exists public.subscription_items(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),subscription_id uuid not null references public.subscriptions(id),provider_item_id text not null,provider_price_id text not null,quantity integer not null default 1 check(quantity>0),metered boolean not null default false,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(provider_item_id));

create table if not exists public.payment_methods(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),billing_customer_id uuid references public.billing_customers(id),provider_payment_method_id text not null,type text not null,brand text,last4 char(4),expiry_month integer,expiry_year integer,is_default boolean not null default false,created_at timestamptz not null default now(),detached_at timestamptz,unique(provider_payment_method_id));

create table if not exists public.billing_events(id uuid primary key default gen_random_uuid(),organization_id uuid references public.organizations(id),workspace_id uuid references public.workspaces(id),provider text not null default 'stripe',provider_event_id text not null,event_type text not null,status text not null check(status in('received','processed','ignored','failed')),payload jsonb not null default '{}',error_code text,created_at timestamptz not null default now(),processed_at timestamptz,unique(provider,provider_event_id));

create table if not exists public.usage_events(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),metric text not null check(metric in('ai_requests','tokens','storage_gb','users','whatsapp_messages','emails','calendar_events','api_calls','image_generations','creative_exports','video_projects','conversation_summaries','future_video_generation_credits')),quantity numeric(18,3) not null check(quantity>=0),idempotency_key text not null,provider_event_id text,occurred_at timestamptz not null default now(),created_at timestamptz not null default now(),unique(workspace_id,idempotency_key));

create table if not exists public.permissions(id uuid primary key default gen_random_uuid(),key text unique not null,name text not null,scope text not null,created_at timestamptz not null default now());

create table if not exists public.role_permissions(role_id uuid not null references public.roles(id)on delete cascade,permission_id uuid not null references public.permissions(id)on delete cascade,created_at timestamptz not null default now(),primary key(role_id,permission_id));

create table if not exists public.organization_audit_events(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),actor_id uuid not null references auth.users(id),event_type text not null check(event_type in('organization.updated','invitation.sent','invitation.resent','invitation.cancelled','invitation.accepted','member.role_changed','member.suspended','member.reactivated','member.removed','ownership.transferred')),subject_id uuid,metadata jsonb not null default '{}',occurred_at timestamptz not null default now());

create table if not exists public.ai_collaboration_runs(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),scenario text not null check(scenario in('lead-created','deal-at-risk','new-customer','custom')),requested_by text not null check(requested_by in('sales-ai','crm-ai','marketing-ai','whatsapp-ai','voice-ai','operations-ai','finance-ai','executive-ai')),objective text not null check(char_length(objective)between 1 and 2000),related_customer_id uuid,status text not null default'active' check(status in('active','completed','error')),recommendation_only boolean not null default true check(recommendation_only),approval_required boolean not null default true check(approval_required),created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),completed_at timestamptz);

create table if not exists public.ai_collaboration_events(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),run_id uuid not null references public.ai_collaboration_runs(id)on delete cascade,employee_code text not null check(employee_code in('sales-ai','crm-ai','marketing-ai','whatsapp-ai','voice-ai','operations-ai','finance-ai','executive-ai')),summary text not null check(char_length(summary)between 1 and 2000),created_by uuid not null references auth.users(id),created_at timestamptz not null default now());

create table if not exists public.ai_collaboration_recommendations(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),run_id uuid not null references public.ai_collaboration_runs(id)on delete cascade,employee_code text not null,request text not null,provider text not null,confidence numeric check(confidence between 0 and 1),approval_status text not null default'pending' check(approval_status in('pending','approved','rejected')),related_customer_id uuid,prompt_tokens integer not null default 0 check(prompt_tokens>=0),completion_tokens integer not null default 0 check(completion_tokens>=0),latency_ms integer check(latency_ms>=0),estimated_cost numeric(18,8)not null default 0 check(estimated_cost>=0),model text,recommendation_only boolean not null default true check(recommendation_only),created_by uuid not null references auth.users(id),created_at timestamptz not null default now());

create table if not exists public.identity_sessions(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id)on delete cascade,organization_id uuid references public.organizations(id),workspace_id uuid references public.workspaces(id),session_fingerprint text not null,device_name text not null default'Unknown device',ip_hash text,user_agent text,last_seen_at timestamptz not null default now(),expires_at timestamptz not null,revoked_at timestamptz,created_at timestamptz not null default now(),unique(user_id,session_fingerprint));

create table if not exists public.trusted_devices(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id)on delete cascade,organization_id uuid references public.organizations(id),workspace_id uuid references public.workspaces(id),device_fingerprint text not null,device_name text not null,trusted_at timestamptz not null default now(),last_seen_at timestamptz not null default now(),expires_at timestamptz not null,removed_at timestamptz,unique(user_id,device_fingerprint));

create table if not exists public.security_alerts(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id)on delete cascade,organization_id uuid references public.organizations(id),workspace_id uuid references public.workspaces(id),alert_type text not null,severity text not null check(severity in('low','medium','high','critical')),title text not null,details jsonb not null default'{}',resolved_at timestamptz,created_at timestamptz not null default now());

create table if not exists public.authentication_attempts(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id)on delete cascade,email_hash text not null,outcome text not null check(outcome in('success','failure','locked')),auth_method text not null,latency_ms integer not null check(latency_ms>=0),mfa_used boolean not null default false,ip_hash text,user_agent text,occurred_at timestamptz not null default now());

create table if not exists public.personal_access_tokens(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id)on delete cascade,organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),name text not null check(char_length(name)between 1 and 100),token_prefix text not null,token_hash text unique not null,scopes text[]not null default'{}',expires_at timestamptz,last_used_at timestamptz,revoked_at timestamptz,created_at timestamptz not null default now());

create table if not exists public.mfa_recovery_codes(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id)on delete cascade,code_hash text not null,used_at timestamptz,created_at timestamptz not null default now(),unique(user_id,code_hash));

create table if not exists public.user_organization_context(user_id uuid primary key references auth.users(id)on delete cascade,organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),switched_at timestamptz not null default now());

create table if not exists public.notification_reminders(
  id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,user_id uuid not null references auth.users(id)on delete cascade,
  kind text not null check(kind in('meeting','task','lead_follow_up','deal_deadline','subscription_renewal','trial_ending','workflow_approval','ai_recommendation','custom')),title text not null check(char_length(title)between 1 and 180),remind_at timestamptz not null,status text not null default 'scheduled' check(status in('scheduled','sent','cancelled')),source_type text,source_id uuid,notification_id uuid references public.notification_events(id)on delete set null,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);

create table if not exists public.email_templates(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,template_key text not null,name text not null,locale text not null default'en',subject_template text not null,html_template text not null,text_template text not null,is_active boolean not null default true,version integer not null default 1,created_by uuid not null references auth.users(id),updated_by uuid not null references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(workspace_id,template_key,locale));

create table if not exists public.email_messages(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,purpose text not null,recipients jsonb not null check(jsonb_typeof(recipients)='array'and jsonb_array_length(recipients)between 1 and 50),locale text not null default'en',variables_ciphertext text not null,subject text not null,provider text not null check(provider in('resend','sendgrid','postmark','smtp')),status text not null default'queued'check(status in('queued','processing','delivered','failed','bounced','cancelled')),attempts integer not null default 0,max_attempts integer not null default 5,scheduled_at timestamptz not null default now(),started_at timestamptz,delivered_at timestamptz,latency_ms integer,provider_message_id text,last_error text,dedupe_key text not null,source_type text,source_id uuid,created_by uuid references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(organization_id,dedupe_key));

create table if not exists public.email_delivery_attempts(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,message_id uuid not null references public.email_messages(id)on delete cascade,provider text not null,status text not null check(status in('processing','delivered','failed','bounced')),latency_ms integer,error_code text,started_at timestamptz not null default now(),completed_at timestamptz);

create table if not exists public.workflow_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text not null default '',
  version integer not null default 1 check (version > 0),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  definition jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id), updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  published_at timestamptz, deleted_at timestamptz,
  unique(workspace_id,id)
);

create table if not exists public.workflow_instances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  workflow_id uuid not null references public.workflow_definitions(id) on delete cascade,
  workflow_version integer not null,
  trigger_kind text not null, trigger_payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check(status in ('queued','running','waiting','approval_pending','completed','failed','cancelled','timed_out')),
  started_at timestamptz not null default now(), completed_at timestamptz,
  duration_ms integer, step_count integer not null default 0,
  ai_participation boolean not null default false,
  estimated_cost numeric(18,8) not null default 0,
  retry_count integer not null default 0,
  failure_reason text, approval_status text,
  runtime_snapshot jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.workflow_step_executions (
  id uuid primary key default gen_random_uuid(), instance_id uuid not null references public.workflow_instances(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  node_id text not null, action_kind text not null, status text not null,
  attempt integer not null default 1, duration_ms integer, provider text, model text,
  prompt_tokens integer not null default 0, completion_tokens integer not null default 0,
  estimated_cost numeric(18,8) not null default 0, sanitized_error text,
  output_metadata jsonb not null default '{}'::jsonb, started_at timestamptz not null default now(), completed_at timestamptz
);

create table if not exists public.workflow_trigger_events (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  trigger_kind text not null, source_type text not null, source_id text not null,
  idempotency_key text not null, payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check(status in ('pending','processing','processed','failed')),
  attempts integer not null default 0, available_at timestamptz not null default now(), processed_at timestamptz,
  failure_reason text, created_at timestamptz not null default now(), unique(workspace_id,idempotency_key)
);

create table if not exists public.workflow_automation_approvals (
  id uuid primary key default gen_random_uuid(), instance_id uuid not null references public.workflow_instances(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  node_id text not null, status text not null default 'pending' check(status in ('pending','approved','rejected','expired')),
  requested_by uuid references auth.users(id), decided_by uuid references auth.users(id), reason text,
  requested_at timestamptz not null default now(), decided_at timestamptz, expires_at timestamptz,
  unique(instance_id,node_id)
);

create table if not exists public.onboarding_sessions(
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade unique,
  organization_id uuid references public.organizations(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  current_step integer not null default 1 check(current_step between 1 and 15),
  completed_steps integer[] not null default '{}', configuration jsonb not null default '{}',
  demo_mode boolean not null default false, started_at timestamptz not null default now(),
  completed_at timestamptz, updated_at timestamptz not null default now()
);

create table if not exists public.onboarding_step_events(
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade, workspace_id uuid references public.workspaces(id) on delete cascade,
  step integer not null check(step between 1 and 15), event_type text not null check(event_type in('started','completed','resumed','abandoned')),
  duration_ms integer, metadata jsonb not null default '{}', created_at timestamptz not null default now()
);

create table if not exists public.onboarding_import_jobs(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade, created_by uuid not null references auth.users(id),
  import_kind text not null check(import_kind in('contacts','companies','leads','deals','properties')),
  file_path text not null, status text not null default 'preview' check(status in('preview','validated','approval_pending','queued','processing','completed','failed')),
  total_rows integer not null default 0, valid_rows integer not null default 0, duplicate_rows integer not null default 0,
  error_rows integer not null default 0, validation_report jsonb not null default '{}', demo_data boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.onboarding_tour_progress(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  tour_key text not null, completed boolean not null default false, completed_at timestamptz, updated_at timestamptz not null default now(),
  unique(user_id,workspace_id,tour_key)
);

create table if not exists public.onboarding_connection_events(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check(provider in('gmail','google_calendar','whatsapp','openai','email','stripe')),
  success boolean not null, latency_ms integer, sanitized_error text, created_at timestamptz not null default now()
);

create table if not exists public.onboarding_demo_seed_requests(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade, requested_by uuid not null references auth.users(id),
  status text not null default 'approval_pending' check(status in('approval_pending','approved','processing','completed','failed')),
  dataset_version text not null default 'aurora-v1', demo_data boolean not null default true,
  includes text[] not null default array['contacts','leads','deals','properties','activities','ai_recommendations','dashboards','workflows','executive_reports'],
  created_at timestamptz not null default now(), completed_at timestamptz
);

create table if not exists public.knowledge_articles(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,title text not null,slug text not null,summary text not null default'',content text not null,category text not null,tags text[]not null default'{}',status text not null default'draft'check(status in('draft','review','approved','published','archived')),version integer not null default 1,author_id uuid references auth.users(id),author_name text not null,last_reviewed_at timestamptz,view_count integer not null default 0,helpful_count integer not null default 0,not_helpful_count integer not null default 0,published_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),deleted_at timestamptz,unique(workspace_id,slug,version));

create table if not exists public.knowledge_article_versions(id uuid primary key default gen_random_uuid(),article_id uuid not null references public.knowledge_articles(id)on delete cascade,organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,version integer not null,title text not null,summary text not null,content text not null,tags text[]not null,created_by uuid references auth.users(id),created_at timestamptz not null default now(),unique(article_id,version));

create table if not exists public.knowledge_documents(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,file_name text not null,storage_path text not null,mime_type text not null,category text not null,tags text[]not null default'{}',status text not null default'draft'check(status in('draft','published','archived')),version integer not null default 1,author_id uuid references auth.users(id),author_name text not null,last_reviewed_at timestamptz,created_at timestamptz not null default now(),deleted_at timestamptz,unique(workspace_id,storage_path));

create table if not exists public.knowledge_analytics(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,user_id uuid references auth.users(id),event_type text not null check(event_type in('search','search_failed','view','ai_help','feedback_helpful','feedback_not_helpful','upload','support_escalation')),article_id uuid references public.knowledge_articles(id)on delete set null,query text,latency_ms integer,success boolean,metadata jsonb not null default'{}',created_at timestamptz not null default now());

create table if not exists public.deployment_migration_history(migration text primary key,checksum text,applied_at timestamptz not null default now(),applied_by text not null default'controlled-release');

create table if not exists public.deployment_releases(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,environment text not null check(environment in('development','staging','production')),version text not null,build_id text not null,commit_sha text not null,deployed_at timestamptz not null default now(),status text not null check(status in('started','healthy','degraded','failed')),metadata jsonb not null default'{}');

create table if not exists public.security_review_events(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,user_id uuid references auth.users(id),event_type text not null check(event_type in('permission_denied','authorization_failed','rate_limited','suspicious_request','security_review')),resource text not null,metadata jsonb not null default'{}',created_at timestamptz not null default now());

create table if not exists public.marketing_leads(id uuid primary key default gen_random_uuid(),kind text not null check(kind in('demo','trial','sales','newsletter')),name text,email text not null,company text,message text,plan text,source text not null default'public_website',status text not null default'new',created_at timestamptz not null default now());

create table if not exists public.marketing_events(id bigint generated always as identity primary key,event_type text not null,path text not null,session_hash text not null,metadata jsonb not null default'{}',created_at timestamptz not null default now());

create table if not exists public.documentation_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('view','search','failed_search','feedback','bookmark')),
  article_slug text check (char_length(article_slug) <= 120),
  search_query text check (char_length(search_query) <= 120),
  helpful boolean,
  session_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_analytics_events(
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id),
  workspace_id uuid not null references public.workspaces(id),
  event_name text not null,
  path text not null check(char_length(path)<=300),
  duration_ms integer check(duration_ms between 0 and 86400000),
  metadata jsonb not null default'{}',
  occurred_at timestamptz not null default now()
);

create table if not exists public.launch_readiness_audit_runs(id bigint generated always as identity primary key,organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),actor_id uuid not null references auth.users(id),score integer not null check(score between 0 and 100),state text not null check(state in('ready','needs_attention','blocked')),summary jsonb not null default'{}',created_at timestamptz not null default now());

create table if not exists public.organization_departments(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), workspace_id uuid not null references public.workspaces(id),
  name text not null check(char_length(trim(name)) between 2 and 100), manager_member_id uuid references public.workspace_members(id), kpis jsonb not null default '[]', permissions text[] not null default '{}',
  status text not null default 'active' check(status in('active','archived')), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1
);

create table if not exists public.organization_teams(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), workspace_id uuid not null references public.workspaces(id), department_id uuid not null references public.organization_departments(id),
  name text not null check(char_length(trim(name)) between 2 and 100), manager_member_id uuid references public.workspace_members(id), capacity integer not null default 10 check(capacity between 1 and 10000),
  status text not null default 'active' check(status in('active','archived')), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1
);

create table if not exists public.organization_team_members(
  organization_id uuid not null references public.organizations(id), workspace_id uuid not null references public.workspaces(id), team_id uuid not null references public.organization_teams(id) on delete cascade, member_id uuid not null references public.workspace_members(id) on delete cascade, assigned_at timestamptz not null default now(), primary key(team_id,member_id)
);

create table if not exists public.property_projects (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), workspace_id uuid not null references public.workspaces(id),
  code text not null, name text not null, developer text not null, status text not null check(status in('upcoming','launching','active','sold-out','completed')),
  description text not null default'', address text not null, city text not null, state text not null, country text not null, zip_code text not null,
  latitude numeric, longitude numeric, launch_date date, possession_date date, project_type text not null, cover_image text, gallery jsonb not null default'[]',
  assigned_sales_team text[] not null default'{}', construction_progress numeric not null default 0 check(construction_progress between 0 and 100),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(workspace_id,code)
);

create table if not exists public.property_towers (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), workspace_id uuid not null references public.workspaces(id), project_id uuid not null references public.property_projects(id) on delete cascade,
  name text not null, floors integer not null check(floors>0), total_units integer not null check(total_units>=0), status text not null, construction_progress numeric not null default 0 check(construction_progress between 0 and 100), notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(project_id,name)
);

create table if not exists public.property_units (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), workspace_id uuid not null references public.workspaces(id), project_id uuid not null references public.property_projects(id) on delete cascade, tower_id uuid not null references public.property_towers(id) on delete cascade,
  unit_number text not null, floor integer not null, bhk_type text not null, bedrooms integer not null default 0, bathrooms integer not null default 0, area numeric not null check(area>0), area_unit text not null check(area_unit in('sqft','sqm')), balcony boolean not null default false, parking integer not null default 0, facing text, view_name text,
  price numeric not null check(price>=0), offer_price numeric check(offer_price>=0), booking_amount numeric not null default 0 check(booking_amount>=0), currency char(3) not null, status text not null check(status in('available','reserved','booked','sold','blocked','cancelled')), buyer_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tower_id,unit_number)
);

create table if not exists public.property_price_revisions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), workspace_id uuid not null references public.workspaces(id), project_id uuid not null references public.property_projects(id) on delete cascade, unit_id uuid references public.property_units(id) on delete cascade,
  effective_from date not null, base_price numeric not null check(base_price>=0), offer_price numeric check(offer_price>=0), currency char(3) not null, discount_rule text, override_approval_id uuid,
  created_by uuid not null default auth.uid(), created_at timestamptz not null default now()
);

create table if not exists public.property_documents (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), workspace_id uuid not null references public.workspaces(id), project_id uuid not null references public.property_projects(id) on delete cascade,
  title text not null, kind text not null check(kind in('floor-plan','master-plan','brochure','elevation','construction','image','video')), storage_path text, placeholder boolean not null default false,
  created_by uuid not null default auth.uid(), created_at timestamptz not null default now()
);

create table if not exists public.property_inventory_audit (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), workspace_id uuid not null references public.workspaces(id), project_id uuid not null references public.property_projects(id), unit_id uuid references public.property_units(id),
  action text not null, actor_id uuid default auth.uid(), actor_label text not null, metadata jsonb not null default'{}', occurred_at timestamptz not null default now()
);

create table if not exists public.property_inventory_opportunity_requests (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), workspace_id uuid not null references public.workspaces(id), project_id uuid not null references public.property_projects(id), unit_id uuid not null references public.property_units(id), buyer_id uuid not null,
  status text not null default'pending' check(status in('pending','completed','cancelled')), created_by uuid not null default auth.uid(), created_at timestamptz not null default now()
);

create table if not exists public.site_visit_feedback(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),visit_id uuid not null references public.site_visits(id) on delete cascade,rating integer not null check(rating between 1 and 5),agent_notes text,interested_unit_ids uuid[] not null default'{}',budget_update numeric,currency char(3),preferred_configuration text,objections text[] not null default'{}',competitor_projects text[] not null default'{}',probability_change integer check(probability_change between -100 and 100),created_by uuid not null default auth.uid(),created_at timestamptz not null default now());

create table if not exists public.site_visit_audit(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),visit_id uuid not null references public.site_visits(id),action text not null,actor_id uuid default auth.uid(),actor_label text not null default'Authorized user',metadata jsonb not null default'{}',occurred_at timestamptz not null default now());

create table if not exists public.site_visit_follow_up_requests(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),visit_id uuid not null references public.site_visits(id),kind text not null check(kind in('task','reminder','summary','next-property','opportunity-stage','second-visit','email-draft','whatsapp-draft')),status text not null default'pending',recommendation_only boolean not null default false,created_by uuid not null default auth.uid(),created_at timestamptz not null default now());

create table if not exists public.buyer_property_profiles(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),customer_id uuid not null,lead_id uuid,opportunity_id uuid,budget_min numeric,budget_max numeric,currency char(3) not null default'USD',cities text[] not null default'{}',localities text[] not null default'{}',project_ids uuid[] not null default'{}',developers text[] not null default'{}',property_types text[] not null default'{}',bedrooms integer,bathrooms integer,area_min numeric,area_max numeric,floor_preference text,facing text[] not null default'{}',parking integer,furnishing text check(furnishing in('furnished','semi-furnished','unfurnished')),intent text check(intent in('investment','self-use')),possession_timeline date,construction_preference text check(construction_preference in('ready-to-move','under-construction','either')),amenities text[] not null default'{}',proximity jsonb not null default'{}',lifestyle text[] not null default'{}',notes text,created_by uuid not null default auth.uid(),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),version integer not null default 1,check(budget_min is null or budget_max is null or budget_min<=budget_max),check(area_min is null or area_max is null or area_min<=area_max));

create table if not exists public.property_match_signals(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),profile_id uuid not null references public.buyer_property_profiles(id)on delete cascade,project_id uuid,unit_id uuid,recommendation_id text,signal_type text not null check(signal_type in('viewed','rejected','accepted','favorited','shortlisted','visit-completed')),popularity_score integer check(popularity_score between 0 and 100),source_type text not null check(source_type in('crm','site-visit','inventory','user')),source_id uuid,created_by uuid not null default auth.uid(),created_at timestamptz not null default now());

create table if not exists public.property_match_runs(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),profile_id uuid not null references public.buyer_property_profiles(id),provider_id text not null,provider_version text not null,inventory_version text not null,weights jsonb not null,generated_count integer not null,created_by uuid not null default auth.uid(),created_at timestamptz not null default now());

create table if not exists public.property_match_results(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),run_id uuid not null references public.property_match_runs(id)on delete cascade,profile_id uuid not null references public.buyer_property_profiles(id),project_id uuid not null,unit_id uuid not null,score integer not null check(score between 0 and 100),confidence integer not null check(confidence between 0 and 100),factors jsonb not null,reasons jsonb not null,strengths jsonb not null,tradeoffs jsonb not null,availability text not null,recommendation_only boolean not null default true,created_at timestamptz not null default now());

create table if not exists public.property_shortlists(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),profile_id uuid not null references public.buyer_property_profiles(id)on delete cascade,name text not null,unit_ids uuid[] not null default'{}',favorite_unit_ids uuid[] not null default'{}',shared_internally boolean not null default false,export_status text not null default'placeholder',created_by uuid not null default auth.uid(),created_at timestamptz not null default now(),updated_at timestamptz not null default now());

create table if not exists public.property_match_audit(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),profile_id uuid,recommendation_id text,action text not null,actor_id uuid default auth.uid(),metadata jsonb not null default'{}',occurred_at timestamptz not null default now());

create table if not exists public.communication_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  thread_id uuid not null references public.communication_threads(id) on delete cascade,
  communication_id uuid references public.communications(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 240),
  kind text not null check (kind in ('image','pdf','brochure','floor-plan','contract','video-placeholder')),
  content_type text not null check (content_type in ('image/jpeg','image/png','image/webp','application/pdf','video/placeholder')),
  size_bytes bigint not null check (size_bytes between 1 and 26214400),
  storage_path text,
  permission_scope text not null default 'conversation-members' check (permission_scope='conversation-members'),
  metadata jsonb not null default '{}',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.communication_ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  thread_id uuid not null references public.communication_threads(id) on delete cascade,
  employee text not null,
  recommendation_type text not null check (recommendation_type in ('summary','reply-draft','response-recommendation','intent','action-items','urgency','follow-up-task')),
  content text not null check (char_length(content) between 1 and 12000),
  confidence numeric(5,2) check (confidence between 0 and 100),
  recommendation_only boolean not null default true check (recommendation_only),
  approval_status text not null default 'pending' check (approval_status in ('pending','approved','rejected','expired')),
  trace_id uuid not null default gen_random_uuid(),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.communication_audit (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  thread_id uuid references public.communication_threads(id) on delete set null,
  event_type text not null,
  actor_id uuid not null references auth.users(id),
  metadata jsonb not null default '{}',
  occurred_at timestamptz not null default now()
);

create table if not exists public.creative_brand_kits(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,workspace_id uuid not null references public.workspaces(id) on delete cascade,name text not null,logo_path text,secondary_logo_path text,colors text[] not null default '{}',typography text[] not null default '{}',fonts text[] not null default '{}',icons text[] not null default '{}',watermarks text[] not null default '{}',email_signature text,phone text,address text,website text,social_links jsonb not null default '{}',legal_disclaimer text,rera_information text,tone text not null default 'Professional real estate',created_by uuid not null references auth.users(id),updated_by uuid not null references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),version integer not null default 1,unique(workspace_id,name)
);

create table if not exists public.creative_campaigns(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,workspace_id uuid not null references public.workspaces(id) on delete cascade,project_id uuid not null references public.property_projects(id),name text not null check(char_length(name) between 1 and 160),status text not null default 'draft' check(status in('draft','marketing-review','sales-review','management-approval','approved','ready-to-publish')),brief jsonb not null,payload jsonb not null default '{}',selected_variation text check(selected_variation in('Version A','Version B','Version C','Version D','Version E')),created_by uuid not null references auth.users(id),updated_by uuid not null references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),version integer not null default 1
);

create table if not exists public.creative_assets(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,workspace_id uuid not null references public.workspaces(id) on delete cascade,campaign_id uuid not null references public.creative_campaigns(id) on delete cascade,project_id uuid not null references public.property_projects(id),name text not null,category text not null check(category in('flyer','video','brochure','image','social-post','presentation')),format text not null,platform text not null,language text not null,status text not null default 'draft' check(status in('draft','marketing-review','sales-review','management-approval','approved','ready-to-publish')),prompt text not null,ai_employee text not null,approver uuid references auth.users(id),edits text[] not null default '{}',exports text[] not null default '{}',publishing_history text[] not null default '{}',storyboard jsonb,generated_at timestamptz not null default now(),created_by uuid not null references auth.users(id),version integer not null default 1
);

create table if not exists public.creative_timeline(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,workspace_id uuid not null references public.workspaces(id) on delete cascade,campaign_id uuid references public.creative_campaigns(id) on delete cascade,asset_id uuid references public.creative_assets(id) on delete cascade,event_type text not null,prompt_reference text,ai_employee text,project_id uuid references public.property_projects(id),approver uuid references auth.users(id),metadata jsonb not null default '{}',actor_id uuid not null references auth.users(id),occurred_at timestamptz not null default now(),check(campaign_id is not null or asset_id is not null)
);

create table if not exists public.creative_generation_jobs(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,project_id uuid not null references public.property_projects(id),campaign_id uuid not null references public.creative_campaigns(id)on delete cascade,prompt text not null check(char_length(prompt)between 1 and 2000),format text not null,layout_style text not null check(layout_style in('Luxury','Modern','Minimal','Corporate','Festival','Offer','Investment','Premium','Dark','Light')),cache_key text not null,status text not null default'queued'check(status in('queued','processing','completed','failed')),progress integer not null default 0 check(progress between 0 and 100),attempts integer not null default 0,max_attempts integer not null default 3 check(max_attempts between 1 and 5),asset_id uuid references public.creative_assets(id),diagnostic text,claimed_at timestamptz,completed_at timestamptz,created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);

create table if not exists public.creative_editor_documents(
 asset_id uuid primary key references public.creative_assets(id)on delete cascade,organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,width integer not null check(width between 320 and 4096),height integer not null check(height between 320 and 4096),elements jsonb not null default'[]',revision integer not null default 1,updated_by uuid not null references auth.users(id),updated_at timestamptz not null default now()
);

create table if not exists public.creative_campaign_packs(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, workspace_id uuid not null references public.workspaces(id) on delete cascade, campaign_id uuid not null references public.creative_campaigns(id) on delete cascade, project_id uuid not null references public.property_projects(id), name text not null check(char_length(name) between 1 and 180), language text not null check(language in('English','Hindi','Arabic','Thai','Japanese','Spanish','German','French')), status text not null default 'draft' check(status in('draft','marketing-review','sales-review','management-approval','approved','ready-to-publish')), formats text[] not null, asset_count integer not null default 0 check(asset_count>=0), created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(campaign_id,language)
);

create table if not exists public.creative_campaign_schedule(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, workspace_id uuid not null references public.workspaces(id) on delete cascade, campaign_id uuid not null references public.creative_campaigns(id) on delete cascade, channel text not null check(channel in('Instagram','Facebook','LinkedIn','Email','WhatsApp','Website','Internal approvals')), scheduled_for timestamptz not null, state text not null default 'draft' check(state in('draft','approval-pending','ready')), publishing_enabled boolean not null default false check(publishing_enabled=false), created_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);

create table if not exists public.creative_growth_reviews(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, workspace_id uuid not null references public.workspaces(id) on delete cascade, campaign_id uuid not null references public.creative_campaigns(id) on delete cascade, brand_compliance_score integer not null check(brand_compliance_score between 0 and 100), creative_quality_score integer not null check(creative_quality_score between 0 and 100), checks jsonb not null, suggestions text[] not null default '{}', recommendation_only boolean not null default true check(recommendation_only=true), created_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);

create table if not exists public.commercial_provider_customers(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,workspace_id uuid not null references public.workspaces(id) on delete cascade,provider text not null check(provider in('stripe','razorpay')),provider_customer_id text not null,livemode boolean not null default false,metadata jsonb not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(workspace_id,provider),unique(provider,provider_customer_id)
);

create table if not exists public.workspace_feature_licenses(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,workspace_id uuid not null references public.workspaces(id) on delete cascade,feature text not null check(feature in('creative_studio_beta','marketing_studio','growth_studio','ai_workforce','property_matching','communications','inventory','reports')),enabled boolean not null default false,source text not null check(source in('subscription','trial','enterprise-contract','administrator')),starts_at timestamptz not null default now(),ends_at timestamptz,updated_by uuid references auth.users(id),updated_at timestamptz not null default now(),unique(workspace_id,feature),check(ends_at is null or ends_at>starts_at)
);

create table if not exists public.commercial_webhook_events(
 id uuid primary key default gen_random_uuid(),organization_id uuid references public.organizations(id),workspace_id uuid references public.workspaces(id),provider text not null check(provider in('stripe','razorpay')),provider_event_id text not null,event_type text not null,status text not null check(status in('received','processed','ignored','failed')),error_code text,payload jsonb not null default '{}',received_at timestamptz not null default now(),processed_at timestamptz,unique(provider,provider_event_id)
);

create table if not exists public.marketing_leads(
  id uuid primary key default gen_random_uuid(),
  kind text not null check(kind in('demo','trial','sales','newsletter')),
  name text,
  email text not null,
  company text,
  message text,
  plan text,
  source text not null default 'public_website',
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.marketing_events(
  id bigint generated always as identity primary key,
  event_type text not null,
  path text not null,
  session_hash text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_article_relations(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,article_id uuid not null references public.knowledge_articles(id)on delete cascade,related_article_id uuid not null references public.knowledge_articles(id)on delete cascade,relation text not null check(relation in('related','supersedes','prerequisite')),created_by uuid references auth.users(id),created_at timestamptz not null default now(),unique(article_id,related_article_id,relation),check(article_id<>related_article_id));

create table if not exists public.knowledge_videos(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,title text not null,summary text not null default'',video_url text not null,transcript text not null default'',video_kind text not null check(video_kind in('walkthrough','short_tutorial','feature_introduction','release_highlight')),module text,tags text[]not null default'{}',product_version text,status text not null default'draft'check(status in('draft','review','approved','archived')),created_by uuid references auth.users(id),approved_by uuid references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),deleted_at timestamptz);

create table if not exists public.knowledge_quality_feedback(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,source_reference text not null,rating text not null check(rating in('helpful','not_helpful','needs_update','report_problem')),session_hash text,user_id uuid references auth.users(id),created_at timestamptz not null default now());

create table if not exists public.product_intelligence_events(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,event_name text not null check(event_name in('page_viewed','feature_opened','lead_created','inventory_imported','campaign_generated','proposal_exported','site_visit_booked','report_exported','knowledge_article_opened','quick_action_used','ai_suggestion_accepted','ai_suggestion_dismissed','search_performed','feedback_submitted','error_recovered','retry_completed')),module text not null,path text not null,duration_ms integer,outcome text check(outcome in('success','failure','abandoned')),session_hash text not null,metadata jsonb not null default'{}',occurred_at timestamptz not null default now());

create table if not exists public.product_feedback(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,user_id uuid references auth.users(id),kind text not null check(kind in('bug_report','feature_request','improvement_idea','ux_issue','knowledge_correction','general_feedback')),title text not null,description text not null,priority text not null check(priority in('low','medium','high','critical')),rating integer check(rating between 1 and 5),resolution_quality integer check(resolution_quality between 1 and 5),screenshot_path text,status text not null default'open'check(status in('open','reviewing','planned','resolved','closed')),created_at timestamptz not null default now(),updated_at timestamptz not null default now());

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

commit;
