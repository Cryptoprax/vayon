-- VAYON Version 1 production synchronization package
-- Generated from the verified read-only catalog for aanonopiylqpfvpoqvdc.
-- Apply only after the runbook preflight and backup verification. Does not alter migration history.
\set ON_ERROR_STOP on
begin;
set local lock_timeout='5s';
set local statement_timeout='120s';

-- SCHEMA (final Version 1 definitions)
-- Source: 20260814000000_sprint43_google_identity_workspace.sql
-- Additive only. Review and apply through the normal Supabase deployment process.

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
-- Source: 20260814000000_sprint43_google_identity_workspace.sql
alter table public.user_profiles enable row level security;
-- Source: 20260814000000_sprint43_google_identity_workspace.sql
alter table public.organizations add column if not exists business_type text;
-- Source: 20260814000000_sprint43_google_identity_workspace.sql
alter table public.organizations add column if not exists company_size text;
-- Source: 20260814000000_sprint43_google_identity_workspace.sql
alter table public.organizations add column if not exists phone text;
-- Source: 20260814000000_sprint43_google_identity_workspace.sql
alter table public.organizations add column if not exists website text;
-- Source: 20260814000000_sprint43_google_identity_workspace.sql
alter table public.organizations add column if not exists industry text;
-- Source: 20260814000000_sprint43_google_identity_workspace.sql
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
-- Source: 20260814000000_sprint43_google_identity_workspace.sql
create index if not exists identity_audit_user_time_idx on public.identity_audit_events(user_id, occurred_at desc);
-- Source: 20260814000000_sprint43_google_identity_workspace.sql
create index if not exists identity_audit_workspace_time_idx on public.identity_audit_events(workspace_id, occurred_at desc) where workspace_id is not null;
-- Source: 20260814000000_sprint43_google_identity_workspace.sql
alter table public.identity_audit_events enable row level security;
-- Source: 20260814000000_sprint43_google_identity_workspace.sql
-- Omitted historical DROP; the replacement is guarded below.;
-- Source: 20260814000000_sprint43_google_identity_workspace.sql
-- Omitted non-schema data statement from the historical source.;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
-- Omitted non-schema data statement from the historical source.;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
-- Omitted non-schema data statement from the historical source.;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
-- Omitted non-schema data statement from the historical source.;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
-- Omitted non-schema data statement from the historical source.;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
alter table public.subscriptions add column if not exists provider_price_id text;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
alter table public.invoices add column if not exists payment_intent_id text;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
create unique index if not exists subscriptions_provider_id_idx on public.subscriptions(provider_subscription_id) where provider_subscription_id is not null;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
create unique index if not exists invoices_provider_id_idx on public.invoices(provider_invoice_id) where provider_invoice_id is not null;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
create table if not exists public.billing_customers(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),provider text not null default 'stripe',provider_customer_id text not null,livemode boolean not null default false,email text,tax_exempt text,tax_ids jsonb not null default '[]',address jsonb not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(workspace_id),unique(provider,provider_customer_id));
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
create table if not exists public.subscription_items(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),subscription_id uuid not null references public.subscriptions(id),provider_item_id text not null,provider_price_id text not null,quantity integer not null default 1 check(quantity>0),metered boolean not null default false,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(provider_item_id));
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
create table if not exists public.payment_methods(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),billing_customer_id uuid references public.billing_customers(id),provider_payment_method_id text not null,type text not null,brand text,last4 char(4),expiry_month integer,expiry_year integer,is_default boolean not null default false,created_at timestamptz not null default now(),detached_at timestamptz,unique(provider_payment_method_id));
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
create table if not exists public.billing_events(id uuid primary key default gen_random_uuid(),organization_id uuid references public.organizations(id),workspace_id uuid references public.workspaces(id),provider text not null default 'stripe',provider_event_id text not null,event_type text not null,status text not null check(status in('received','processed','ignored','failed')),payload jsonb not null default '{}',error_code text,created_at timestamptz not null default now(),processed_at timestamptz,unique(provider,provider_event_id));
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
create table if not exists public.usage_events(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),metric text not null check(metric in('ai_requests','tokens','storage_gb','users','whatsapp_messages','emails','calendar_events','api_calls','image_generations','creative_exports','video_projects','conversation_summaries','future_video_generation_credits')),quantity numeric(18,3) not null check(quantity>=0),idempotency_key text not null,provider_event_id text,occurred_at timestamptz not null default now(),created_at timestamptz not null default now(),unique(workspace_id,idempotency_key));
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
alter table public.billing_customers enable row level security;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
alter table public.subscription_items enable row level security;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
alter table public.payment_methods enable row level security;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
alter table public.billing_events enable row level security;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
alter table public.usage_events enable row level security;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
-- Omitted historical DROP; the replacement is guarded below.;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
-- Omitted historical DROP; the replacement is guarded below.;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
-- Omitted historical DROP; the replacement is guarded below.;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
-- Omitted historical DROP; the replacement is guarded below.;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
-- Omitted historical DROP; the replacement is guarded below.;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
alter table public.organizations add column if not exists business_email text;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
alter table public.organizations add column if not exists locale text not null default 'en-IN';
-- Source: 20260820000000_sprint51_enterprise_organization.sql
alter table public.organizations add column if not exists address jsonb not null default '{}';
-- Source: 20260820000000_sprint51_enterprise_organization.sql
alter table public.organizations add column if not exists branding jsonb not null default '{}';
-- Source: 20260820000000_sprint51_enterprise_organization.sql
alter table public.organizations add column if not exists version integer not null default 1;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
alter table public.invitations add column if not exists resent_at timestamptz;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
alter table public.invitations add column if not exists accepted_at timestamptz;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
alter table public.invitations add column if not exists cancelled_at timestamptz;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
-- Constraint evolution is handled by the reviewed Version 1 constraint section.;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
create unique index if not exists invitations_one_pending_email_idx on public.invitations(organization_id,lower(email))where status='pending';
-- Source: 20260820000000_sprint51_enterprise_organization.sql
alter table public.organization_members add column if not exists updated_at timestamptz not null default now();
-- Source: 20260820000000_sprint51_enterprise_organization.sql
alter table public.workspace_members add column if not exists updated_at timestamptz not null default now();
-- Source: 20260820000000_sprint51_enterprise_organization.sql
-- Omitted non-schema data statement from the historical source.;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
create table if not exists public.permissions(id uuid primary key default gen_random_uuid(),key text unique not null,name text not null,scope text not null,created_at timestamptz not null default now());
-- Source: 20260820000000_sprint51_enterprise_organization.sql
create table if not exists public.role_permissions(role_id uuid not null references public.roles(id)on delete cascade,permission_id uuid not null references public.permissions(id)on delete cascade,created_at timestamptz not null default now(),primary key(role_id,permission_id));
-- Source: 20260820000000_sprint51_enterprise_organization.sql
-- Omitted non-schema data statement from the historical source.;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
-- Omitted non-schema data statement from the historical source.;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
create table if not exists public.organization_audit_events(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),actor_id uuid not null references auth.users(id),event_type text not null check(event_type in('organization.updated','invitation.sent','invitation.resent','invitation.cancelled','invitation.accepted','member.role_changed','member.suspended','member.reactivated','member.removed','ownership.transferred')),subject_id uuid,metadata jsonb not null default '{}',occurred_at timestamptz not null default now());
-- Source: 20260820000000_sprint51_enterprise_organization.sql
create index if not exists organization_audit_tenant_time_idx on public.organization_audit_events(organization_id,workspace_id,occurred_at desc);
-- Source: 20260820000000_sprint51_enterprise_organization.sql
alter table public.permissions enable row level security;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
alter table public.role_permissions enable row level security;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
alter table public.organization_audit_events enable row level security;
-- Source: 20260821000000_sprint57_ai_collaboration.sql
begin;
-- Source: 20260821000000_sprint57_ai_collaboration.sql
create table if not exists public.ai_collaboration_runs(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),scenario text not null check(scenario in('lead-created','deal-at-risk','new-customer','custom')),requested_by text not null check(requested_by in('sales-ai','crm-ai','marketing-ai','whatsapp-ai','voice-ai','operations-ai','finance-ai','executive-ai')),objective text not null check(char_length(objective)between 1 and 2000),related_customer_id uuid,status text not null default'active' check(status in('active','completed','error')),recommendation_only boolean not null default true check(recommendation_only),approval_required boolean not null default true check(approval_required),created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),completed_at timestamptz);
-- Source: 20260821000000_sprint57_ai_collaboration.sql
create table if not exists public.ai_collaboration_events(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),run_id uuid not null references public.ai_collaboration_runs(id)on delete cascade,employee_code text not null check(employee_code in('sales-ai','crm-ai','marketing-ai','whatsapp-ai','voice-ai','operations-ai','finance-ai','executive-ai')),summary text not null check(char_length(summary)between 1 and 2000),created_by uuid not null references auth.users(id),created_at timestamptz not null default now());
-- Source: 20260821000000_sprint57_ai_collaboration.sql
create table if not exists public.ai_collaboration_recommendations(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),run_id uuid not null references public.ai_collaboration_runs(id)on delete cascade,employee_code text not null,request text not null,provider text not null,confidence numeric check(confidence between 0 and 1),approval_status text not null default'pending' check(approval_status in('pending','approved','rejected')),related_customer_id uuid,prompt_tokens integer not null default 0 check(prompt_tokens>=0),completion_tokens integer not null default 0 check(completion_tokens>=0),latency_ms integer check(latency_ms>=0),estimated_cost numeric(18,8)not null default 0 check(estimated_cost>=0),model text,recommendation_only boolean not null default true check(recommendation_only),created_by uuid not null references auth.users(id),created_at timestamptz not null default now());
-- Source: 20260821000000_sprint57_ai_collaboration.sql
create index if not exists ai_collaboration_run_scope_idx on public.ai_collaboration_runs(organization_id,workspace_id,created_at desc);
-- Source: 20260821000000_sprint57_ai_collaboration.sql
create index if not exists ai_collaboration_event_timeline_idx on public.ai_collaboration_events(organization_id,workspace_id,created_at desc);
-- Source: 20260821000000_sprint57_ai_collaboration.sql
create index if not exists ai_collaboration_recommendation_graph_idx on public.ai_collaboration_recommendations(organization_id,workspace_id,run_id,created_at);
-- Source: 20260821000000_sprint57_ai_collaboration.sql
alter table public.ai_collaboration_runs enable row level security;
-- Source: 20260821000000_sprint57_ai_collaboration.sql
alter table public.ai_collaboration_events enable row level security;
-- Source: 20260821000000_sprint57_ai_collaboration.sql
alter table public.ai_collaboration_recommendations enable row level security;
-- Source: 20260821000000_sprint57_ai_collaboration.sql
-- Omitted historical DROP; the replacement is guarded below.;
-- Source: 20260821000000_sprint57_ai_collaboration.sql
-- Omitted historical DROP; the replacement is guarded below.;
-- Source: 20260821000000_sprint57_ai_collaboration.sql
commit;
-- Source: 20260822000000_sprint58_enterprise_security.sql
begin;
-- Source: 20260822000000_sprint58_enterprise_security.sql
-- Constraint evolution is handled by the reviewed Version 1 constraint section.;
-- Source: 20260822000000_sprint58_enterprise_security.sql
-- Constraint evolution is handled by the reviewed Version 1 constraint section.;
-- Source: 20260822000000_sprint58_enterprise_security.sql
create table if not exists public.identity_sessions(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id)on delete cascade,organization_id uuid references public.organizations(id),workspace_id uuid references public.workspaces(id),session_fingerprint text not null,device_name text not null default'Unknown device',ip_hash text,user_agent text,last_seen_at timestamptz not null default now(),expires_at timestamptz not null,revoked_at timestamptz,created_at timestamptz not null default now(),unique(user_id,session_fingerprint));
-- Source: 20260822000000_sprint58_enterprise_security.sql
create table if not exists public.trusted_devices(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id)on delete cascade,organization_id uuid references public.organizations(id),workspace_id uuid references public.workspaces(id),device_fingerprint text not null,device_name text not null,trusted_at timestamptz not null default now(),last_seen_at timestamptz not null default now(),expires_at timestamptz not null,removed_at timestamptz,unique(user_id,device_fingerprint));
-- Source: 20260822000000_sprint58_enterprise_security.sql
create table if not exists public.security_alerts(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id)on delete cascade,organization_id uuid references public.organizations(id),workspace_id uuid references public.workspaces(id),alert_type text not null,severity text not null check(severity in('low','medium','high','critical')),title text not null,details jsonb not null default'{}',resolved_at timestamptz,created_at timestamptz not null default now());
-- Source: 20260822000000_sprint58_enterprise_security.sql
create table if not exists public.authentication_attempts(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id)on delete cascade,email_hash text not null,outcome text not null check(outcome in('success','failure','locked')),auth_method text not null,latency_ms integer not null check(latency_ms>=0),mfa_used boolean not null default false,ip_hash text,user_agent text,occurred_at timestamptz not null default now());
-- Source: 20260822000000_sprint58_enterprise_security.sql
create table if not exists public.personal_access_tokens(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id)on delete cascade,organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),name text not null check(char_length(name)between 1 and 100),token_prefix text not null,token_hash text unique not null,scopes text[]not null default'{}',expires_at timestamptz,last_used_at timestamptz,revoked_at timestamptz,created_at timestamptz not null default now());
-- Source: 20260822000000_sprint58_enterprise_security.sql
create table if not exists public.mfa_recovery_codes(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id)on delete cascade,code_hash text not null,used_at timestamptz,created_at timestamptz not null default now(),unique(user_id,code_hash));
-- Source: 20260822000000_sprint58_enterprise_security.sql
create table if not exists public.user_organization_context(user_id uuid primary key references auth.users(id)on delete cascade,organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),switched_at timestamptz not null default now());
-- Source: 20260822000000_sprint58_enterprise_security.sql
create index if not exists identity_sessions_active_idx on public.identity_sessions(user_id,last_seen_at desc)where revoked_at is null;
-- Source: 20260822000000_sprint58_enterprise_security.sql
create index if not exists auth_attempts_user_time_idx on public.authentication_attempts(user_id,occurred_at desc);
-- Source: 20260822000000_sprint58_enterprise_security.sql
create index if not exists pat_scope_idx on public.personal_access_tokens(user_id,organization_id,workspace_id)where revoked_at is null;
-- Source: 20260822000000_sprint58_enterprise_security.sql
create index if not exists security_alert_user_time_idx on public.security_alerts(user_id,created_at desc)where resolved_at is null;
-- Source: 20260822000000_sprint58_enterprise_security.sql
alter table public.identity_sessions enable row level security;
-- Source: 20260822000000_sprint58_enterprise_security.sql
alter table public.trusted_devices enable row level security;
-- Source: 20260822000000_sprint58_enterprise_security.sql
alter table public.security_alerts enable row level security;
-- Source: 20260822000000_sprint58_enterprise_security.sql
alter table public.authentication_attempts enable row level security;
-- Source: 20260822000000_sprint58_enterprise_security.sql
alter table public.personal_access_tokens enable row level security;
-- Source: 20260822000000_sprint58_enterprise_security.sql
alter table public.mfa_recovery_codes enable row level security;
-- Source: 20260822000000_sprint58_enterprise_security.sql
alter table public.user_organization_context enable row level security;
-- Source: 20260822000000_sprint58_enterprise_security.sql
commit;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
alter table public.notification_events add column if not exists source_type text;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
alter table public.notification_events add column if not exists source_id uuid;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
alter table public.notification_events add column if not exists archived_at timestamptz;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
alter table public.notification_events add column if not exists snoozed_until timestamptz;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
alter table public.notification_events add column if not exists starred boolean not null default false;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
alter table public.notification_events add column if not exists mentioned boolean not null default false;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
alter table public.notification_preferences add column if not exists browser_push_enabled boolean not null default false;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
alter table public.notification_preferences add column if not exists whatsapp_enabled boolean not null default false;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
alter table public.notification_preferences add column if not exists muted boolean not null default false;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
alter table public.notification_preferences add column if not exists digest_frequency text not null default 'instant' check(digest_frequency in('instant','daily','weekly','off'));
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
alter table public.notification_queue add column if not exists started_at timestamptz;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
alter table public.notification_queue add column if not exists delivered_at timestamptz;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
alter table public.notification_queue add column if not exists provider text;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
create table if not exists public.notification_reminders(
  id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,user_id uuid not null references auth.users(id)on delete cascade,
  kind text not null check(kind in('meeting','task','lead_follow_up','deal_deadline','subscription_renewal','trial_ending','workflow_approval','ai_recommendation','custom')),title text not null check(char_length(title)between 1 and 180),remind_at timestamptz not null,status text not null default 'scheduled' check(status in('scheduled','sent','cancelled')),source_type text,source_id uuid,notification_id uuid references public.notification_events(id)on delete set null,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
create index if not exists notification_events_center_idx on public.notification_events(workspace_id,user_id,created_at desc);
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
create index if not exists notification_events_unread_idx on public.notification_events(workspace_id,user_id)where read_at is null and archived_at is null;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
create index if not exists notification_reminders_due_idx on public.notification_reminders(status,remind_at)where status='scheduled';
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
alter table public.notification_reminders enable row level security;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
-- Omitted historical DROP; the replacement is guarded below.;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
-- Omitted historical DROP; the replacement is guarded below.;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
-- Omitted historical DROP; the replacement is guarded below.;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
-- Omitted historical DROP; the replacement is guarded below.;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
-- Omitted historical DROP; the replacement is guarded below.;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
-- Omitted historical DROP; the replacement is guarded below.;
-- Source: 20260824000000_sprint60_enterprise_email.sql
create table if not exists public.email_templates(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,template_key text not null,name text not null,locale text not null default'en',subject_template text not null,html_template text not null,text_template text not null,is_active boolean not null default true,version integer not null default 1,created_by uuid not null references auth.users(id),updated_by uuid not null references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(workspace_id,template_key,locale));
-- Source: 20260824000000_sprint60_enterprise_email.sql
create table if not exists public.email_messages(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,purpose text not null,recipients jsonb not null check(jsonb_typeof(recipients)='array'and jsonb_array_length(recipients)between 1 and 50),locale text not null default'en',variables_ciphertext text not null,subject text not null,provider text not null check(provider in('resend','sendgrid','postmark','smtp')),status text not null default'queued'check(status in('queued','processing','delivered','failed','bounced','cancelled')),attempts integer not null default 0,max_attempts integer not null default 5,scheduled_at timestamptz not null default now(),started_at timestamptz,delivered_at timestamptz,latency_ms integer,provider_message_id text,last_error text,dedupe_key text not null,source_type text,source_id uuid,created_by uuid references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(organization_id,dedupe_key));
-- Source: 20260824000000_sprint60_enterprise_email.sql
create table if not exists public.email_delivery_attempts(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,message_id uuid not null references public.email_messages(id)on delete cascade,provider text not null,status text not null check(status in('processing','delivered','failed','bounced')),latency_ms integer,error_code text,started_at timestamptz not null default now(),completed_at timestamptz);
-- Source: 20260824000000_sprint60_enterprise_email.sql
create index if not exists email_queue_due_idx on public.email_messages(provider,status,scheduled_at)where status='queued';
-- Source: 20260824000000_sprint60_enterprise_email.sql
create index if not exists email_history_idx on public.email_messages(workspace_id,created_at desc);
-- Source: 20260824000000_sprint60_enterprise_email.sql
create index if not exists email_attempt_message_idx on public.email_delivery_attempts(message_id,started_at desc);
-- Source: 20260824000000_sprint60_enterprise_email.sql
alter table public.email_templates enable row level security;
-- Source: 20260824000000_sprint60_enterprise_email.sql
alter table public.email_messages enable row level security;
-- Source: 20260824000000_sprint60_enterprise_email.sql
alter table public.email_delivery_attempts enable row level security;
-- Source: 20260824000000_sprint60_enterprise_email.sql
-- Omitted non-schema data statement from the historical source.;
-- Source: 20260824000000_sprint60_enterprise_email.sql
-- Omitted non-schema data statement from the historical source.;
-- Source: 20260825000000_sprint61_enterprise_workflow_automation.sql
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
-- Source: 20260825000000_sprint61_enterprise_workflow_automation.sql
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
-- Source: 20260825000000_sprint61_enterprise_workflow_automation.sql
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
-- Source: 20260825000000_sprint61_enterprise_workflow_automation.sql
create table if not exists public.workflow_trigger_events (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  trigger_kind text not null, source_type text not null, source_id text not null,
  idempotency_key text not null, payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check(status in ('pending','processing','processed','failed')),
  attempts integer not null default 0, available_at timestamptz not null default now(), processed_at timestamptz,
  failure_reason text, created_at timestamptz not null default now(), unique(workspace_id,idempotency_key)
);
-- Source: 20260825000000_sprint61_enterprise_workflow_automation.sql
create table if not exists public.workflow_automation_approvals (
  id uuid primary key default gen_random_uuid(), instance_id uuid not null references public.workflow_instances(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  node_id text not null, status text not null default 'pending' check(status in ('pending','approved','rejected','expired')),
  requested_by uuid references auth.users(id), decided_by uuid references auth.users(id), reason text,
  requested_at timestamptz not null default now(), decided_at timestamptz, expires_at timestamptz,
  unique(instance_id,node_id)
);
-- Source: 20260825000000_sprint61_enterprise_workflow_automation.sql
create index if not exists workflow_definitions_tenant_idx on public.workflow_definitions(organization_id,workspace_id,status) where deleted_at is null;
-- Source: 20260825000000_sprint61_enterprise_workflow_automation.sql
create index if not exists workflow_instances_monitor_idx on public.workflow_instances(organization_id,workspace_id,created_at desc);
-- Source: 20260825000000_sprint61_enterprise_workflow_automation.sql
create index if not exists workflow_triggers_claim_idx on public.workflow_trigger_events(status,available_at) where status='pending';
-- Source: 20260825000000_sprint61_enterprise_workflow_automation.sql
alter table public.workflow_definitions enable row level security;
-- Source: 20260825000000_sprint61_enterprise_workflow_automation.sql
alter table public.workflow_instances enable row level security;
-- Source: 20260825000000_sprint61_enterprise_workflow_automation.sql
alter table public.workflow_step_executions enable row level security;
-- Source: 20260825000000_sprint61_enterprise_workflow_automation.sql
alter table public.workflow_trigger_events enable row level security;
-- Source: 20260825000000_sprint61_enterprise_workflow_automation.sql
alter table public.workflow_automation_approvals enable row level security;
-- Source: 20260826000000_sprint62_enterprise_customer_onboarding.sql
create table if not exists public.onboarding_sessions(
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade unique,
  organization_id uuid references public.organizations(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  current_step integer not null default 1 check(current_step between 1 and 15),
  completed_steps integer[] not null default '{}', configuration jsonb not null default '{}',
  demo_mode boolean not null default false, started_at timestamptz not null default now(),
  completed_at timestamptz, updated_at timestamptz not null default now()
);
-- Source: 20260826000000_sprint62_enterprise_customer_onboarding.sql
create table if not exists public.onboarding_step_events(
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade, workspace_id uuid references public.workspaces(id) on delete cascade,
  step integer not null check(step between 1 and 15), event_type text not null check(event_type in('started','completed','resumed','abandoned')),
  duration_ms integer, metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
-- Source: 20260826000000_sprint62_enterprise_customer_onboarding.sql
create table if not exists public.onboarding_import_jobs(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade, created_by uuid not null references auth.users(id),
  import_kind text not null check(import_kind in('contacts','companies','leads','deals','properties')),
  file_path text not null, status text not null default 'preview' check(status in('preview','validated','approval_pending','queued','processing','completed','failed')),
  total_rows integer not null default 0, valid_rows integer not null default 0, duplicate_rows integer not null default 0,
  error_rows integer not null default 0, validation_report jsonb not null default '{}', demo_data boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
-- Source: 20260826000000_sprint62_enterprise_customer_onboarding.sql
create table if not exists public.onboarding_tour_progress(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  tour_key text not null, completed boolean not null default false, completed_at timestamptz, updated_at timestamptz not null default now(),
  unique(user_id,workspace_id,tour_key)
);
-- Source: 20260826000000_sprint62_enterprise_customer_onboarding.sql
create table if not exists public.onboarding_connection_events(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check(provider in('gmail','google_calendar','whatsapp','openai','email','stripe')),
  success boolean not null, latency_ms integer, sanitized_error text, created_at timestamptz not null default now()
);
-- Source: 20260826000000_sprint62_enterprise_customer_onboarding.sql
create table if not exists public.onboarding_demo_seed_requests(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade, requested_by uuid not null references auth.users(id),
  status text not null default 'approval_pending' check(status in('approval_pending','approved','processing','completed','failed')),
  dataset_version text not null default 'aurora-v1', demo_data boolean not null default true,
  includes text[] not null default array['contacts','leads','deals','properties','activities','ai_recommendations','dashboards','workflows','executive_reports'],
  created_at timestamptz not null default now(), completed_at timestamptz
);
-- Source: 20260826000000_sprint62_enterprise_customer_onboarding.sql
create index if not exists onboarding_events_dropoff_idx on public.onboarding_step_events(step,event_type,created_at);
-- Source: 20260826000000_sprint62_enterprise_customer_onboarding.sql
create index if not exists onboarding_import_observability_idx on public.onboarding_import_jobs(organization_id,workspace_id,status,created_at desc);
-- Source: 20260826000000_sprint62_enterprise_customer_onboarding.sql
alter table public.onboarding_sessions enable row level security;
-- Source: 20260826000000_sprint62_enterprise_customer_onboarding.sql
alter table public.onboarding_step_events enable row level security;
-- Source: 20260826000000_sprint62_enterprise_customer_onboarding.sql
alter table public.onboarding_import_jobs enable row level security;
-- Source: 20260826000000_sprint62_enterprise_customer_onboarding.sql
alter table public.onboarding_tour_progress enable row level security;
-- Source: 20260826000000_sprint62_enterprise_customer_onboarding.sql
alter table public.onboarding_connection_events enable row level security;
-- Source: 20260826000000_sprint62_enterprise_customer_onboarding.sql
alter table public.onboarding_demo_seed_requests enable row level security;
-- Source: 20260827000000_sprint63_enterprise_knowledge_platform.sql
create table if not exists public.knowledge_articles(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,title text not null,slug text not null,summary text not null default'',content text not null,category text not null,tags text[]not null default'{}',status text not null default'draft'check(status in('draft','review','approved','published','archived')),version integer not null default 1,author_id uuid references auth.users(id),author_name text not null,last_reviewed_at timestamptz,view_count integer not null default 0,helpful_count integer not null default 0,not_helpful_count integer not null default 0,published_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),deleted_at timestamptz,unique(workspace_id,slug,version));
-- Source: 20260827000000_sprint63_enterprise_knowledge_platform.sql
create table if not exists public.knowledge_article_versions(id uuid primary key default gen_random_uuid(),article_id uuid not null references public.knowledge_articles(id)on delete cascade,organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,version integer not null,title text not null,summary text not null,content text not null,tags text[]not null,created_by uuid references auth.users(id),created_at timestamptz not null default now(),unique(article_id,version));
-- Source: 20260827000000_sprint63_enterprise_knowledge_platform.sql
create table if not exists public.knowledge_documents(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,file_name text not null,storage_path text not null,mime_type text not null,category text not null,tags text[]not null default'{}',status text not null default'draft'check(status in('draft','published','archived')),version integer not null default 1,author_id uuid references auth.users(id),author_name text not null,last_reviewed_at timestamptz,created_at timestamptz not null default now(),deleted_at timestamptz,unique(workspace_id,storage_path));
-- Source: 20260827000000_sprint63_enterprise_knowledge_platform.sql
create table if not exists public.knowledge_analytics(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,user_id uuid references auth.users(id),event_type text not null check(event_type in('search','search_failed','view','ai_help','feedback_helpful','feedback_not_helpful','upload','support_escalation')),article_id uuid references public.knowledge_articles(id)on delete set null,query text,latency_ms integer,success boolean,metadata jsonb not null default'{}',created_at timestamptz not null default now());
-- Source: 20260827000000_sprint63_enterprise_knowledge_platform.sql
create index if not exists knowledge_articles_search_idx on public.knowledge_articles using gin(to_tsvector('english',title||' '||summary||' '||content));
-- Source: 20260827000000_sprint63_enterprise_knowledge_platform.sql
create index if not exists knowledge_articles_tags_idx on public.knowledge_articles using gin(tags);
-- Source: 20260827000000_sprint63_enterprise_knowledge_platform.sql
create index if not exists knowledge_analytics_dashboard_idx on public.knowledge_analytics(organization_id,workspace_id,event_type,created_at desc);
-- Source: 20260827000000_sprint63_enterprise_knowledge_platform.sql
alter table public.knowledge_articles enable row level security;
-- Source: 20260827000000_sprint63_enterprise_knowledge_platform.sql
alter table public.knowledge_article_versions enable row level security;
-- Source: 20260827000000_sprint63_enterprise_knowledge_platform.sql
alter table public.knowledge_documents enable row level security;
-- Source: 20260827000000_sprint63_enterprise_knowledge_platform.sql
alter table public.knowledge_analytics enable row level security;
-- Source: 20260827000000_sprint63_enterprise_knowledge_platform.sql
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)values('knowledge-documents','knowledge-documents',false,20971520,array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/markdown','text/plain'])on conflict(id) do nothing;
-- Source: 20260828000000_sprint64_production_deployment_platform.sql
create table if not exists public.deployment_migration_history(migration text primary key,checksum text,applied_at timestamptz not null default now(),applied_by text not null default'controlled-release');
-- Source: 20260828000000_sprint64_production_deployment_platform.sql
create table if not exists public.deployment_releases(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,environment text not null check(environment in('development','staging','production')),version text not null,build_id text not null,commit_sha text not null,deployed_at timestamptz not null default now(),status text not null check(status in('started','healthy','degraded','failed')),metadata jsonb not null default'{}');
-- Source: 20260828000000_sprint64_production_deployment_platform.sql
alter table public.deployment_migration_history enable row level security;
-- Source: 20260828000000_sprint64_production_deployment_platform.sql
alter table public.deployment_releases enable row level security;
-- Source: 20260828000000_sprint64_production_deployment_platform.sql
-- Omitted non-schema data statement from the historical source.;
-- Source: 20260829000000_sprint65_enterprise_performance_optimization.sql
create index if not exists ai_runtime_outputs_performance_idx on public.ai_runtime_outputs(organization_id,workspace_id,created_at desc)include(latency_ms,input_tokens,output_tokens,cost_estimate);
-- Source: 20260829000000_sprint65_enterprise_performance_optimization.sql
create index if not exists workflow_instances_performance_idx on public.workflow_instances(organization_id,workspace_id,created_at desc)include(duration_ms,status,retry_count);
-- Source: 20260829000000_sprint65_enterprise_performance_optimization.sql
create index if not exists workflow_approvals_lookup_idx on public.workflow_automation_approvals(workspace_id,status,requested_at)where status='pending';
-- Source: 20260829000000_sprint65_enterprise_performance_optimization.sql
create index if not exists workflow_queue_throughput_idx on public.workflow_trigger_events(workspace_id,status,available_at)include(attempts)where status in('pending','processing');
-- Source: 20260829000000_sprint65_enterprise_performance_optimization.sql
create index if not exists notification_queue_throughput_idx on public.notification_queue(workspace_id,status,next_attempt_at)include(attempts,created_at,delivered_at)where status in('queued','processing','sent');
-- Source: 20260829000000_sprint65_enterprise_performance_optimization.sql
create index if not exists notification_preferences_lookup_idx on public.notification_preferences(workspace_id,user_id);
-- Source: 20260829000000_sprint65_enterprise_performance_optimization.sql
create index if not exists knowledge_articles_listing_idx on public.knowledge_articles(organization_id,workspace_id,status,updated_at desc)where deleted_at is null;
-- Source: 20260829000000_sprint65_enterprise_performance_optimization.sql
create index if not exists knowledge_documents_listing_idx on public.knowledge_documents(organization_id,workspace_id,status,created_at desc)where deleted_at is null;
-- Source: 20260829000000_sprint65_enterprise_performance_optimization.sql
create index if not exists knowledge_analytics_performance_idx on public.knowledge_analytics(organization_id,workspace_id,created_at desc)include(event_type,latency_ms,success);
-- Source: 20260830000000_sprint66_enterprise_security_hardening.sql
create table if not exists public.security_review_events(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,user_id uuid references auth.users(id),event_type text not null check(event_type in('permission_denied','authorization_failed','rate_limited','suspicious_request','security_review')),resource text not null,metadata jsonb not null default'{}',created_at timestamptz not null default now());
-- Source: 20260830000000_sprint66_enterprise_security_hardening.sql
create index if not exists security_review_events_observability_idx on public.security_review_events(organization_id,workspace_id,event_type,created_at desc);
-- Source: 20260830000000_sprint66_enterprise_security_hardening.sql
alter table public.security_review_events enable row level security;
-- Source: 20260831000000_sprint67_public_marketing_platform.sql
create table if not exists public.marketing_leads(id uuid primary key default gen_random_uuid(),kind text not null check(kind in('demo','trial','sales','newsletter')),name text,email text not null,company text,message text,plan text,source text not null default'public_website',status text not null default'new',created_at timestamptz not null default now());
-- Source: 20260831000000_sprint67_public_marketing_platform.sql
create table if not exists public.marketing_events(id bigint generated always as identity primary key,event_type text not null,path text not null,session_hash text not null,metadata jsonb not null default'{}',created_at timestamptz not null default now());
-- Source: 20260831000000_sprint67_public_marketing_platform.sql
create index if not exists marketing_events_analytics_idx on public.marketing_events(event_type,created_at desc);
-- Source: 20260831000000_sprint67_public_marketing_platform.sql
create index if not exists marketing_leads_pipeline_idx on public.marketing_leads(kind,status,created_at desc);
-- Source: 20260831000000_sprint67_public_marketing_platform.sql
alter table public.marketing_leads enable row level security;
-- Source: 20260831000000_sprint67_public_marketing_platform.sql
alter table public.marketing_events enable row level security;
-- Source: 20260901000000_sprint68_documentation_platform.sql
create table if not exists public.documentation_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('view','search','failed_search','feedback','bookmark')),
  article_slug text check (char_length(article_slug) <= 120),
  search_query text check (char_length(search_query) <= 120),
  helpful boolean,
  session_hash text,
  created_at timestamptz not null default now()
);
-- Source: 20260901000000_sprint68_documentation_platform.sql
alter table public.documentation_events enable row level security;
-- Source: 20260901000000_sprint68_documentation_platform.sql
create index if not exists documentation_events_created_at_idx on public.documentation_events(created_at desc);
-- Source: 20260901000000_sprint68_documentation_platform.sql
create index if not exists documentation_events_article_idx on public.documentation_events(article_slug, created_at desc);
-- Source: 20260902120000_sprint69_2_enterprise_conversion_analytics.sql
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
-- Source: 20260902120000_sprint69_2_enterprise_conversion_analytics.sql
create index if not exists workspace_analytics_events_scope_idx on public.workspace_analytics_events(organization_id,workspace_id,occurred_at desc)include(event_name,path,duration_ms);
-- Source: 20260902120000_sprint69_2_enterprise_conversion_analytics.sql
alter table public.workspace_analytics_events enable row level security;
-- Source: 20260902120000_sprint69_2_enterprise_conversion_analytics.sql
create index if not exists marketing_events_path_performance_idx on public.marketing_events(path,event_type,created_at desc);
-- Source: 20260902180000_sprint69_5_launch_readiness_audit.sql
create table if not exists public.launch_readiness_audit_runs(id bigint generated always as identity primary key,organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),actor_id uuid not null references auth.users(id),score integer not null check(score between 0 and 100),state text not null check(state in('ready','needs_attention','blocked')),summary jsonb not null default'{}',created_at timestamptz not null default now());
-- Source: 20260902180000_sprint69_5_launch_readiness_audit.sql
create index if not exists launch_readiness_audit_runs_scope_idx on public.launch_readiness_audit_runs(organization_id,workspace_id,created_at desc);
-- Source: 20260902180000_sprint69_5_launch_readiness_audit.sql
alter table public.launch_readiness_audit_runs enable row level security;
-- Source: 20260906000000_sprint76_enterprise_organization_management.sql
alter table public.organizations add column if not exists business_hours jsonb not null default '{"monday":{"open":"09:00","close":"18:00"},"tuesday":{"open":"09:00","close":"18:00"},"wednesday":{"open":"09:00","close":"18:00"},"thursday":{"open":"09:00","close":"18:00"},"friday":{"open":"09:00","close":"18:00"}}';
-- Source: 20260906000000_sprint76_enterprise_organization_management.sql
alter table public.organizations add column if not exists regional_settings jsonb not null default '{}';
-- Source: 20260906000000_sprint76_enterprise_organization_management.sql
create table if not exists public.organization_departments(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), workspace_id uuid not null references public.workspaces(id),
  name text not null check(char_length(trim(name)) between 2 and 100), manager_member_id uuid references public.workspace_members(id), kpis jsonb not null default '[]', permissions text[] not null default '{}',
  status text not null default 'active' check(status in('active','archived')), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1
);
-- Source: 20260906000000_sprint76_enterprise_organization_management.sql
create unique index if not exists organization_departments_active_name_idx on public.organization_departments(workspace_id,lower(name)) where status='active';
-- Source: 20260906000000_sprint76_enterprise_organization_management.sql
create index if not exists organization_departments_tenant_idx on public.organization_departments(organization_id,workspace_id,status);
-- Source: 20260906000000_sprint76_enterprise_organization_management.sql
-- Omitted non-schema data statement from the historical source.;
-- Source: 20260906000000_sprint76_enterprise_organization_management.sql
create table if not exists public.organization_teams(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), workspace_id uuid not null references public.workspaces(id), department_id uuid not null references public.organization_departments(id),
  name text not null check(char_length(trim(name)) between 2 and 100), manager_member_id uuid references public.workspace_members(id), capacity integer not null default 10 check(capacity between 1 and 10000),
  status text not null default 'active' check(status in('active','archived')), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1
);
-- Source: 20260906000000_sprint76_enterprise_organization_management.sql
create unique index if not exists organization_teams_active_name_idx on public.organization_teams(workspace_id,lower(name)) where status='active';
-- Source: 20260906000000_sprint76_enterprise_organization_management.sql
create index if not exists organization_teams_tenant_idx on public.organization_teams(organization_id,workspace_id,department_id,status);
-- Source: 20260906000000_sprint76_enterprise_organization_management.sql
create table if not exists public.organization_team_members(
  organization_id uuid not null references public.organizations(id), workspace_id uuid not null references public.workspaces(id), team_id uuid not null references public.organization_teams(id) on delete cascade, member_id uuid not null references public.workspace_members(id) on delete cascade, assigned_at timestamptz not null default now(), primary key(team_id,member_id)
);
-- Source: 20260906000000_sprint76_enterprise_organization_management.sql
alter table public.organization_departments enable row level security;
-- Source: 20260906000000_sprint76_enterprise_organization_management.sql
alter table public.organization_teams enable row level security;
-- Source: 20260906000000_sprint76_enterprise_organization_management.sql
alter table public.organization_team_members enable row level security;
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
create table if not exists public.property_projects (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), workspace_id uuid not null references public.workspaces(id),
  code text not null, name text not null, developer text not null, status text not null check(status in('upcoming','launching','active','sold-out','completed')),
  description text not null default'', address text not null, city text not null, state text not null, country text not null, zip_code text not null,
  latitude numeric, longitude numeric, launch_date date, possession_date date, project_type text not null, cover_image text, gallery jsonb not null default'[]',
  assigned_sales_team text[] not null default'{}', construction_progress numeric not null default 0 check(construction_progress between 0 and 100),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(workspace_id,code)
);
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
create table if not exists public.property_towers (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), workspace_id uuid not null references public.workspaces(id), project_id uuid not null references public.property_projects(id) on delete cascade,
  name text not null, floors integer not null check(floors>0), total_units integer not null check(total_units>=0), status text not null, construction_progress numeric not null default 0 check(construction_progress between 0 and 100), notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(project_id,name)
);
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
create table if not exists public.property_units (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), workspace_id uuid not null references public.workspaces(id), project_id uuid not null references public.property_projects(id) on delete cascade, tower_id uuid not null references public.property_towers(id) on delete cascade,
  unit_number text not null, floor integer not null, bhk_type text not null, bedrooms integer not null default 0, bathrooms integer not null default 0, area numeric not null check(area>0), area_unit text not null check(area_unit in('sqft','sqm')), balcony boolean not null default false, parking integer not null default 0, facing text, view_name text,
  price numeric not null check(price>=0), offer_price numeric check(offer_price>=0), booking_amount numeric not null default 0 check(booking_amount>=0), currency char(3) not null, status text not null check(status in('available','reserved','booked','sold','blocked','cancelled')), buyer_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tower_id,unit_number)
);
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
create table if not exists public.property_price_revisions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), workspace_id uuid not null references public.workspaces(id), project_id uuid not null references public.property_projects(id) on delete cascade, unit_id uuid references public.property_units(id) on delete cascade,
  effective_from date not null, base_price numeric not null check(base_price>=0), offer_price numeric check(offer_price>=0), currency char(3) not null, discount_rule text, override_approval_id uuid,
  created_by uuid not null default auth.uid(), created_at timestamptz not null default now()
);
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
create table if not exists public.property_documents (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), workspace_id uuid not null references public.workspaces(id), project_id uuid not null references public.property_projects(id) on delete cascade,
  title text not null, kind text not null check(kind in('floor-plan','master-plan','brochure','elevation','construction','image','video')), storage_path text, placeholder boolean not null default false,
  created_by uuid not null default auth.uid(), created_at timestamptz not null default now()
);
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
create table if not exists public.property_inventory_audit (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), workspace_id uuid not null references public.workspaces(id), project_id uuid not null references public.property_projects(id), unit_id uuid references public.property_units(id),
  action text not null, actor_id uuid default auth.uid(), actor_label text not null, metadata jsonb not null default'{}', occurred_at timestamptz not null default now()
);
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
create table if not exists public.property_inventory_opportunity_requests (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), workspace_id uuid not null references public.workspaces(id), project_id uuid not null references public.property_projects(id), unit_id uuid not null references public.property_units(id), buyer_id uuid not null,
  status text not null default'pending' check(status in('pending','completed','cancelled')), created_by uuid not null default auth.uid(), created_at timestamptz not null default now()
);
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
create index if not exists property_projects_search_idx on public.property_projects(workspace_id,city,status,developer);
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
create index if not exists property_towers_project_idx on public.property_towers(workspace_id,project_id);
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
create index if not exists property_units_inventory_idx on public.property_units(workspace_id,project_id,tower_id,status,bhk_type,price,area);
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
create index if not exists property_price_history_idx on public.property_price_revisions(workspace_id,project_id,unit_id,effective_from desc);
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
create index if not exists property_documents_project_idx on public.property_documents(workspace_id,project_id,kind);
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
create index if not exists property_inventory_audit_idx on public.property_inventory_audit(workspace_id,project_id,occurred_at desc);
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
alter table public.property_projects enable row level security;
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
alter table public.property_towers enable row level security;
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
alter table public.property_units enable row level security;
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
alter table public.property_price_revisions enable row level security;
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
alter table public.property_documents enable row level security;
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
alter table public.property_inventory_audit enable row level security;
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
alter table public.property_inventory_opportunity_requests enable row level security;
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
no parallel scheduling engine.
alter table public.site_visits drop constraint if exists site_visits_status_check;
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
alter table public.site_visits add column if not exists contact_id uuid,add column if not exists project_id uuid,add column if not exists tower_id uuid,add column if not exists unit_id uuid,add column if not exists customer_label text,add column if not exists agent_label text,add column if not exists project_label text,add column if not exists tower_label text,add column if not exists unit_label text,add column if not exists duration_minutes integer not null default 60,add column if not exists visit_type text not null default'initial',add column if not exists priority text not null default'medium',add column if not exists agenda jsonb not null default'[]',add column if not exists visitor_instructions text,add column if not exists documents jsonb not null default'[]',add column if not exists checklist jsonb not null default'[]',add column if not exists reminder_timeline jsonb not null default'[]',add column if not exists arrival_at timestamptz,add column if not exists departure_at timestamptz;
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
-- Constraint evolution is handled by the reviewed Version 1 constraint section.;
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
-- Constraint evolution is handled by the reviewed Version 1 constraint section.;
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
-- Constraint evolution is handled by the reviewed Version 1 constraint section.;
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
-- Constraint evolution is handled by the reviewed Version 1 constraint section.;
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
create table if not exists public.site_visit_feedback(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),visit_id uuid not null references public.site_visits(id) on delete cascade,rating integer not null check(rating between 1 and 5),agent_notes text,interested_unit_ids uuid[] not null default'{}',budget_update numeric,currency char(3),preferred_configuration text,objections text[] not null default'{}',competitor_projects text[] not null default'{}',probability_change integer check(probability_change between -100 and 100),created_by uuid not null default auth.uid(),created_at timestamptz not null default now());
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
create table if not exists public.site_visit_audit(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),visit_id uuid not null references public.site_visits(id),action text not null,actor_id uuid default auth.uid(),actor_label text not null default'Authorized user',metadata jsonb not null default'{}',occurred_at timestamptz not null default now());
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
create table if not exists public.site_visit_follow_up_requests(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),visit_id uuid not null references public.site_visits(id),kind text not null check(kind in('task','reminder','summary','next-property','opportunity-stage','second-visit','email-draft','whatsapp-draft')),status text not null default'pending',recommendation_only boolean not null default false,created_by uuid not null default auth.uid(),created_at timestamptz not null default now());
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
create index if not exists site_visits_schedule_v2_idx on public.site_visits(organization_id,workspace_id,assigned_agent_id,starts_at,ends_at)where deleted_at is null;
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
create index if not exists site_visit_feedback_visit_idx on public.site_visit_feedback(workspace_id,visit_id,created_at desc);
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
create index if not exists site_visit_audit_visit_idx on public.site_visit_audit(workspace_id,visit_id,occurred_at desc);
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
create index if not exists site_visit_follow_up_idx on public.site_visit_follow_up_requests(workspace_id,status,created_at);
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
alter table public.site_visit_feedback enable row level security;
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
alter table public.site_visit_audit enable row level security;
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
alter table public.site_visit_follow_up_requests enable row level security;
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
-- Omitted historical DROP; the replacement is guarded below.;
-- Source: 20260909000000_sprint80_ai_property_matching.sql
create table if not exists public.buyer_property_profiles(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),customer_id uuid not null,lead_id uuid,opportunity_id uuid,budget_min numeric,budget_max numeric,currency char(3) not null default'USD',cities text[] not null default'{}',localities text[] not null default'{}',project_ids uuid[] not null default'{}',developers text[] not null default'{}',property_types text[] not null default'{}',bedrooms integer,bathrooms integer,area_min numeric,area_max numeric,floor_preference text,facing text[] not null default'{}',parking integer,furnishing text check(furnishing in('furnished','semi-furnished','unfurnished')),intent text check(intent in('investment','self-use')),possession_timeline date,construction_preference text check(construction_preference in('ready-to-move','under-construction','either')),amenities text[] not null default'{}',proximity jsonb not null default'{}',lifestyle text[] not null default'{}',notes text,created_by uuid not null default auth.uid(),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),version integer not null default 1,check(budget_min is null or budget_max is null or budget_min<=budget_max),check(area_min is null or area_max is null or area_min<=area_max));
-- Source: 20260909000000_sprint80_ai_property_matching.sql
create table if not exists public.property_match_signals(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),profile_id uuid not null references public.buyer_property_profiles(id)on delete cascade,project_id uuid,unit_id uuid,recommendation_id text,signal_type text not null check(signal_type in('viewed','rejected','accepted','favorited','shortlisted','visit-completed')),popularity_score integer check(popularity_score between 0 and 100),source_type text not null check(source_type in('crm','site-visit','inventory','user')),source_id uuid,created_by uuid not null default auth.uid(),created_at timestamptz not null default now());
-- Source: 20260909000000_sprint80_ai_property_matching.sql
create table if not exists public.property_match_runs(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),profile_id uuid not null references public.buyer_property_profiles(id),provider_id text not null,provider_version text not null,inventory_version text not null,weights jsonb not null,generated_count integer not null,created_by uuid not null default auth.uid(),created_at timestamptz not null default now());
-- Source: 20260909000000_sprint80_ai_property_matching.sql
create table if not exists public.property_match_results(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),run_id uuid not null references public.property_match_runs(id)on delete cascade,profile_id uuid not null references public.buyer_property_profiles(id),project_id uuid not null,unit_id uuid not null,score integer not null check(score between 0 and 100),confidence integer not null check(confidence between 0 and 100),factors jsonb not null,reasons jsonb not null,strengths jsonb not null,tradeoffs jsonb not null,availability text not null,recommendation_only boolean not null default true,created_at timestamptz not null default now());
-- Source: 20260909000000_sprint80_ai_property_matching.sql
create table if not exists public.property_shortlists(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),profile_id uuid not null references public.buyer_property_profiles(id)on delete cascade,name text not null,unit_ids uuid[] not null default'{}',favorite_unit_ids uuid[] not null default'{}',shared_internally boolean not null default false,export_status text not null default'placeholder',created_by uuid not null default auth.uid(),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
-- Source: 20260909000000_sprint80_ai_property_matching.sql
create table if not exists public.property_match_audit(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),workspace_id uuid not null references public.workspaces(id),profile_id uuid,recommendation_id text,action text not null,actor_id uuid default auth.uid(),metadata jsonb not null default'{}',occurred_at timestamptz not null default now());
-- Source: 20260909000000_sprint80_ai_property_matching.sql
create index if not exists buyer_profiles_tenant_idx on public.buyer_property_profiles(workspace_id,customer_id,lead_id,opportunity_id);
-- Source: 20260909000000_sprint80_ai_property_matching.sql
create index if not exists match_signals_profile_idx on public.property_match_signals(workspace_id,profile_id,signal_type,created_at desc);
-- Source: 20260909000000_sprint80_ai_property_matching.sql
create index if not exists match_results_profile_idx on public.property_match_results(workspace_id,profile_id,score desc);
-- Source: 20260909000000_sprint80_ai_property_matching.sql
create index if not exists shortlists_profile_idx on public.property_shortlists(workspace_id,profile_id,created_at desc);
-- Source: 20260909000000_sprint80_ai_property_matching.sql
create index if not exists match_audit_trace_idx on public.property_match_audit(workspace_id,profile_id,occurred_at desc);
-- Source: 20260909000000_sprint80_ai_property_matching.sql
alter table public.buyer_property_profiles enable row level security;
-- Source: 20260909000000_sprint80_ai_property_matching.sql
alter table public.property_match_signals enable row level security;
-- Source: 20260909000000_sprint80_ai_property_matching.sql
alter table public.property_match_runs enable row level security;
-- Source: 20260909000000_sprint80_ai_property_matching.sql
alter table public.property_match_results enable row level security;
-- Source: 20260909000000_sprint80_ai_property_matching.sql
alter table public.property_shortlists enable row level security;
-- Source: 20260909000000_sprint80_ai_property_matching.sql
alter table public.property_match_audit enable row level security;
-- Source: 20260910000000_sprint81_enterprise_communications_hub.sql
alter table public.communication_notes add column if not exists pinned boolean not null default false;
-- Source: 20260910000000_sprint81_enterprise_communications_hub.sql
alter table public.communication_notes add column if not exists mentions uuid[] not null default '{}';
-- Source: 20260910000000_sprint81_enterprise_communications_hub.sql
alter table public.communication_notes add column if not exists attachment_ids uuid[] not null default '{}';
-- Source: 20260910000000_sprint81_enterprise_communications_hub.sql
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
-- Source: 20260910000000_sprint81_enterprise_communications_hub.sql
create index if not exists communication_attachments_thread_idx on public.communication_attachments(organization_id,workspace_id,thread_id,created_at desc);
-- Source: 20260910000000_sprint81_enterprise_communications_hub.sql
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
-- Source: 20260910000000_sprint81_enterprise_communications_hub.sql
create index if not exists communication_ai_thread_idx on public.communication_ai_recommendations(organization_id,workspace_id,thread_id,created_at desc);
-- Source: 20260910000000_sprint81_enterprise_communications_hub.sql
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
-- Source: 20260910000000_sprint81_enterprise_communications_hub.sql
create index if not exists communication_audit_tenant_idx on public.communication_audit(organization_id,workspace_id,occurred_at desc);
-- Source: 20260910000000_sprint81_enterprise_communications_hub.sql
alter table public.communication_attachments enable row level security;
-- Source: 20260910000000_sprint81_enterprise_communications_hub.sql
alter table public.communication_ai_recommendations enable row level security;
-- Source: 20260910000000_sprint81_enterprise_communications_hub.sql
alter table public.communication_audit enable row level security;
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
create table if not exists public.creative_brand_kits(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,workspace_id uuid not null references public.workspaces(id) on delete cascade,name text not null,logo_path text,secondary_logo_path text,colors text[] not null default '{}',typography text[] not null default '{}',fonts text[] not null default '{}',icons text[] not null default '{}',watermarks text[] not null default '{}',email_signature text,phone text,address text,website text,social_links jsonb not null default '{}',legal_disclaimer text,rera_information text,tone text not null default 'Professional real estate',created_by uuid not null references auth.users(id),updated_by uuid not null references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),version integer not null default 1,unique(workspace_id,name)
);
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
create table if not exists public.creative_campaigns(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,workspace_id uuid not null references public.workspaces(id) on delete cascade,project_id uuid not null references public.inventory_projects(id),name text not null check(char_length(name) between 1 and 160),status text not null default 'draft' check(status in('draft','marketing-review','sales-review','management-approval','approved','ready-to-publish')),brief jsonb not null,payload jsonb not null default '{}',selected_variation text check(selected_variation in('Version A','Version B','Version C','Version D','Version E')),created_by uuid not null references auth.users(id),updated_by uuid not null references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),version integer not null default 1
);
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
create table if not exists public.creative_assets(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,workspace_id uuid not null references public.workspaces(id) on delete cascade,campaign_id uuid not null references public.creative_campaigns(id) on delete cascade,project_id uuid not null references public.inventory_projects(id),name text not null,category text not null check(category in('flyer','video','brochure','image','social-post','presentation')),format text not null,platform text not null,language text not null,status text not null default 'draft' check(status in('draft','marketing-review','sales-review','management-approval','approved','ready-to-publish')),prompt text not null,ai_employee text not null,approver uuid references auth.users(id),edits text[] not null default '{}',exports text[] not null default '{}',publishing_history text[] not null default '{}',storyboard jsonb,generated_at timestamptz not null default now(),created_by uuid not null references auth.users(id),version integer not null default 1
);
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
create table if not exists public.creative_timeline(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,workspace_id uuid not null references public.workspaces(id) on delete cascade,campaign_id uuid references public.creative_campaigns(id) on delete cascade,asset_id uuid references public.creative_assets(id) on delete cascade,event_type text not null,prompt_reference text,ai_employee text,project_id uuid references public.inventory_projects(id),approver uuid references auth.users(id),metadata jsonb not null default '{}',actor_id uuid not null references auth.users(id),occurred_at timestamptz not null default now(),check(campaign_id is not null or asset_id is not null)
);
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
create index if not exists creative_campaign_recent_idx on public.creative_campaigns(organization_id,workspace_id,updated_at desc);
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
create index if not exists creative_asset_search_idx on public.creative_assets(organization_id,workspace_id,project_id,platform,language,status,generated_at desc);
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
create index if not exists creative_timeline_idx on public.creative_timeline(organization_id,workspace_id,occurred_at desc);
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
alter table public.creative_brand_kits enable row level security;
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
alter table public.creative_campaigns enable row level security;
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
alter table public.creative_assets enable row level security;
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
alter table public.creative_timeline enable row level security;
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
alter table public.creative_assets add column if not exists storage_path text;
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
alter table public.creative_assets add column if not exists mime_type text check(mime_type in('image/png','image/jpeg'));
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
alter table public.creative_assets add column if not exists model text;
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
alter table public.creative_assets add column if not exists reasoning_summary text;
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
alter table public.creative_assets add column if not exists cache_key text;
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
-- Constraint evolution is handled by the reviewed Version 1 constraint section.;
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
-- Constraint evolution is handled by the reviewed Version 1 constraint section.;
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
create unique index if not exists creative_asset_cache_idx on public.creative_assets(workspace_id,cache_key)where cache_key is not null;
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
create table if not exists public.creative_generation_jobs(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,project_id uuid not null references public.inventory_projects(id),campaign_id uuid not null references public.creative_campaigns(id)on delete cascade,prompt text not null check(char_length(prompt)between 1 and 2000),format text not null,layout_style text not null check(layout_style in('Luxury','Modern','Minimal','Corporate','Festival','Offer','Investment','Premium','Dark','Light')),cache_key text not null,status text not null default'queued'check(status in('queued','processing','completed','failed')),progress integer not null default 0 check(progress between 0 and 100),attempts integer not null default 0,max_attempts integer not null default 3 check(max_attempts between 1 and 5),asset_id uuid references public.creative_assets(id),diagnostic text,claimed_at timestamptz,completed_at timestamptz,created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
create index if not exists creative_jobs_queue_idx on public.creative_generation_jobs(status,created_at)where status in('queued','processing');
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
create index if not exists creative_jobs_tenant_idx on public.creative_generation_jobs(organization_id,workspace_id,created_at desc);
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
create table if not exists public.creative_editor_documents(
 asset_id uuid primary key references public.creative_assets(id)on delete cascade,organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,width integer not null check(width between 320 and 4096),height integer not null check(height between 320 and 4096),elements jsonb not null default'[]',revision integer not null default 1,updated_by uuid not null references auth.users(id),updated_at timestamptz not null default now()
);
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
alter table public.creative_generation_jobs enable row level security;
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
alter table public.creative_editor_documents enable row level security;
-- Source: 20260913000000_sprint82_6_ai_growth_studio.sql
-- Constraint evolution is handled by the reviewed Version 1 constraint section.;
-- Source: 20260913000000_sprint82_6_ai_growth_studio.sql
-- Constraint evolution is handled by the reviewed Version 1 constraint section.;
-- Source: 20260913000000_sprint82_6_ai_growth_studio.sql
create table if not exists public.creative_campaign_packs(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, workspace_id uuid not null references public.workspaces(id) on delete cascade, campaign_id uuid not null references public.creative_campaigns(id) on delete cascade, project_id uuid not null references public.inventory_projects(id), name text not null check(char_length(name) between 1 and 180), language text not null check(language in('English','Hindi','Arabic','Thai','Japanese','Spanish','German','French')), status text not null default 'draft' check(status in('draft','marketing-review','sales-review','management-approval','approved','ready-to-publish')), formats text[] not null, asset_count integer not null default 0 check(asset_count>=0), created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(campaign_id,language)
);
-- Source: 20260913000000_sprint82_6_ai_growth_studio.sql
create table if not exists public.creative_campaign_schedule(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, workspace_id uuid not null references public.workspaces(id) on delete cascade, campaign_id uuid not null references public.creative_campaigns(id) on delete cascade, channel text not null check(channel in('Instagram','Facebook','LinkedIn','Email','WhatsApp','Website','Internal approvals')), scheduled_for timestamptz not null, state text not null default 'draft' check(state in('draft','approval-pending','ready')), publishing_enabled boolean not null default false check(publishing_enabled=false), created_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);
-- Source: 20260913000000_sprint82_6_ai_growth_studio.sql
create table if not exists public.creative_growth_reviews(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, workspace_id uuid not null references public.workspaces(id) on delete cascade, campaign_id uuid not null references public.creative_campaigns(id) on delete cascade, brand_compliance_score integer not null check(brand_compliance_score between 0 and 100), creative_quality_score integer not null check(creative_quality_score between 0 and 100), checks jsonb not null, suggestions text[] not null default '{}', recommendation_only boolean not null default true check(recommendation_only=true), created_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);
-- Source: 20260913000000_sprint82_6_ai_growth_studio.sql
create index if not exists creative_pack_scope_idx on public.creative_campaign_packs(organization_id,workspace_id,project_id,status,created_at desc);
-- Source: 20260913000000_sprint82_6_ai_growth_studio.sql
create index if not exists creative_schedule_scope_idx on public.creative_campaign_schedule(organization_id,workspace_id,scheduled_for);
-- Source: 20260913000000_sprint82_6_ai_growth_studio.sql
alter table public.creative_campaign_packs enable row level security;
-- Source: 20260913000000_sprint82_6_ai_growth_studio.sql
alter table public.creative_campaign_schedule enable row level security;
-- Source: 20260913000000_sprint82_6_ai_growth_studio.sql
alter table public.creative_growth_reviews enable row level security;
-- Source: 20260914000000_sprint83_enterprise_commercial_platform.sql
-- Constraint evolution is handled by the reviewed Version 1 constraint section.;
-- Source: 20260914000000_sprint83_enterprise_commercial_platform.sql
-- Constraint evolution is handled by the reviewed Version 1 constraint section.;
-- Source: 20260914000000_sprint83_enterprise_commercial_platform.sql
create table if not exists public.commercial_provider_customers(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,workspace_id uuid not null references public.workspaces(id) on delete cascade,provider text not null check(provider in('stripe','razorpay')),provider_customer_id text not null,livemode boolean not null default false,metadata jsonb not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(workspace_id,provider),unique(provider,provider_customer_id)
);
-- Source: 20260914000000_sprint83_enterprise_commercial_platform.sql
create table if not exists public.workspace_feature_licenses(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,workspace_id uuid not null references public.workspaces(id) on delete cascade,feature text not null check(feature in('creative_studio_beta','marketing_studio','growth_studio','ai_workforce','property_matching','communications','inventory','reports')),enabled boolean not null default false,source text not null check(source in('subscription','trial','enterprise-contract','administrator')),starts_at timestamptz not null default now(),ends_at timestamptz,updated_by uuid references auth.users(id),updated_at timestamptz not null default now(),unique(workspace_id,feature),check(ends_at is null or ends_at>starts_at)
);
-- Source: 20260914000000_sprint83_enterprise_commercial_platform.sql
create table if not exists public.commercial_webhook_events(
 id uuid primary key default gen_random_uuid(),organization_id uuid references public.organizations(id),workspace_id uuid references public.workspaces(id),provider text not null check(provider in('stripe','razorpay')),provider_event_id text not null,event_type text not null,status text not null check(status in('received','processed','ignored','failed')),error_code text,payload jsonb not null default '{}',received_at timestamptz not null default now(),processed_at timestamptz,unique(provider,provider_event_id)
);
-- Source: 20260914000000_sprint83_enterprise_commercial_platform.sql
create index if not exists commercial_customer_scope_idx on public.commercial_provider_customers(organization_id,workspace_id,provider);
-- Source: 20260914000000_sprint83_enterprise_commercial_platform.sql
create index if not exists feature_license_scope_idx on public.workspace_feature_licenses(organization_id,workspace_id,feature,enabled);
-- Source: 20260914000000_sprint83_enterprise_commercial_platform.sql
alter table public.commercial_provider_customers enable row level security;
-- Source: 20260914000000_sprint83_enterprise_commercial_platform.sql
alter table public.workspace_feature_licenses enable row level security;
-- Source: 20260914000000_sprint83_enterprise_commercial_platform.sql
alter table public.commercial_webhook_events enable row level security;
-- Source: 20260916000000_sprint84_2_public_contact_reliability.sql
create extension if not exists pgcrypto;
-- Source: 20260916000000_sprint84_2_public_contact_reliability.sql
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
-- Source: 20260916000000_sprint84_2_public_contact_reliability.sql
create table if not exists public.marketing_events(
  id bigint generated always as identity primary key,
  event_type text not null,
  path text not null,
  session_hash text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
-- Source: 20260916000000_sprint84_2_public_contact_reliability.sql
create index if not exists marketing_leads_pipeline_idx on public.marketing_leads(kind,status,created_at desc);
-- Source: 20260916000000_sprint84_2_public_contact_reliability.sql
create index if not exists marketing_events_analytics_idx on public.marketing_events(event_type,created_at desc);
-- Source: 20260916000000_sprint84_2_public_contact_reliability.sql
alter table public.marketing_leads enable row level security;
-- Source: 20260916000000_sprint84_2_public_contact_reliability.sql
alter table public.marketing_events enable row level security;
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
-- Constraint evolution is handled by the reviewed Version 1 constraint section.;
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
-- Constraint evolution is handled by the reviewed Version 1 constraint section.;
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
alter table public.knowledge_articles add column if not exists knowledge_kind text not null default'knowledge_article'check(knowledge_kind in('knowledge_article','private_article','internal_sop','sales_script','support_playbook','onboarding_checklist','ai_playbook'));
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
alter table public.knowledge_articles add column if not exists visibility text not null default'workspace'check(visibility in('workspace','organization'));
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
alter table public.knowledge_articles add column if not exists product_version text;
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
alter table public.knowledge_articles add column if not exists module text;
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
alter table public.knowledge_articles add column if not exists feature_key text;
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
alter table public.knowledge_articles add column if not exists minimum_plan text;
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
alter table public.knowledge_articles add column if not exists deprecated boolean not null default false;
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
alter table public.knowledge_articles add column if not exists upcoming boolean not null default false;
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
alter table public.knowledge_articles add column if not exists approved_by uuid references auth.users(id);
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
alter table public.knowledge_articles add column if not exists approved_at timestamptz;
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
create table if not exists public.knowledge_article_relations(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,article_id uuid not null references public.knowledge_articles(id)on delete cascade,related_article_id uuid not null references public.knowledge_articles(id)on delete cascade,relation text not null check(relation in('related','supersedes','prerequisite')),created_by uuid references auth.users(id),created_at timestamptz not null default now(),unique(article_id,related_article_id,relation),check(article_id<>related_article_id));
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
create table if not exists public.knowledge_videos(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,title text not null,summary text not null default'',video_url text not null,transcript text not null default'',video_kind text not null check(video_kind in('walkthrough','short_tutorial','feature_introduction','release_highlight')),module text,tags text[]not null default'{}',product_version text,status text not null default'draft'check(status in('draft','review','approved','archived')),created_by uuid references auth.users(id),approved_by uuid references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),deleted_at timestamptz);
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
create table if not exists public.knowledge_quality_feedback(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,source_reference text not null,rating text not null check(rating in('helpful','not_helpful','needs_update','report_problem')),session_hash text,user_id uuid references auth.users(id),created_at timestamptz not null default now());
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
create index if not exists knowledge_trusted_retrieval_idx on public.knowledge_articles(organization_id,workspace_id,status,module,product_version,updated_at desc)where deleted_at is null;
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
create index if not exists knowledge_video_transcript_idx on public.knowledge_videos using gin(to_tsvector('english',title||' '||summary||' '||transcript));
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
create index if not exists knowledge_quality_feedback_idx on public.knowledge_quality_feedback(organization_id,workspace_id,rating,created_at desc);
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
alter table public.knowledge_article_relations enable row level security;
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
alter table public.knowledge_videos enable row level security;
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
alter table public.knowledge_quality_feedback enable row level security;
-- Source: 20260917000000_sprint86_4_product_intelligence.sql
create table if not exists public.product_intelligence_events(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,event_name text not null check(event_name in('page_viewed','feature_opened','lead_created','inventory_imported','campaign_generated','proposal_exported','site_visit_booked','report_exported','knowledge_article_opened','quick_action_used','ai_suggestion_accepted','ai_suggestion_dismissed','search_performed','feedback_submitted','error_recovered','retry_completed')),module text not null,path text not null,duration_ms integer,outcome text check(outcome in('success','failure','abandoned')),session_hash text not null,metadata jsonb not null default'{}',occurred_at timestamptz not null default now());
-- Source: 20260917000000_sprint86_4_product_intelligence.sql
create table if not exists public.product_feedback(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id)on delete cascade,workspace_id uuid not null references public.workspaces(id)on delete cascade,user_id uuid references auth.users(id),kind text not null check(kind in('bug_report','feature_request','improvement_idea','ux_issue','knowledge_correction','general_feedback')),title text not null,description text not null,priority text not null check(priority in('low','medium','high','critical')),rating integer check(rating between 1 and 5),resolution_quality integer check(resolution_quality between 1 and 5),screenshot_path text,status text not null default'open'check(status in('open','reviewing','planned','resolved','closed')),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
-- Source: 20260917000000_sprint86_4_product_intelligence.sql
create index if not exists product_intelligence_scope_idx on public.product_intelligence_events(organization_id,workspace_id,occurred_at desc)include(event_name,module,duration_ms,outcome);
-- Source: 20260917000000_sprint86_4_product_intelligence.sql
create index if not exists product_intelligence_module_idx on public.product_intelligence_events(workspace_id,module,event_name,occurred_at desc);
-- Source: 20260917000000_sprint86_4_product_intelligence.sql
create index if not exists product_feedback_trends_idx on public.product_feedback(organization_id,workspace_id,kind,priority,created_at desc);
-- Source: 20260917000000_sprint86_4_product_intelligence.sql
alter table public.product_intelligence_events enable row level security;
-- Source: 20260917000000_sprint86_4_product_intelligence.sql
alter table public.product_feedback enable row level security;
-- Source: 20260917000000_sprint86_4_product_intelligence.sql
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)values('product-feedback','product-feedback',false,5242880,array['image/png','image/jpeg','image/webp'])on conflict(id) do nothing;
-- Source: 20260918000000_sprint86_5_continuous_learning.sql
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
-- Source: 20260918000000_sprint86_5_continuous_learning.sql
create unique index if not exists intelligence_memory_org_key on public.intelligence_memory(workspace_id,memory_key) where scope='organization';
-- Source: 20260918000000_sprint86_5_continuous_learning.sql
create unique index if not exists intelligence_memory_user_key on public.intelligence_memory(workspace_id,user_id,memory_key) where scope='user';
-- Source: 20260918000000_sprint86_5_continuous_learning.sql
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
-- Source: 20260918000000_sprint86_5_continuous_learning.sql
create index if not exists continuous_learning_period_idx on public.continuous_learning_aggregates(organization_id,workspace_id,period_start desc,metric_key);
-- Source: 20260918000000_sprint86_5_continuous_learning.sql
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
-- Source: 20260918000000_sprint86_5_continuous_learning.sql
create index if not exists executive_briefings_scope_idx on public.executive_intelligence_briefings(organization_id,workspace_id,generated_at desc);
-- Source: 20260918000000_sprint86_5_continuous_learning.sql
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
-- Source: 20260918000000_sprint86_5_continuous_learning.sql
create index if not exists continuous_learning_jobs_scope_idx on public.continuous_learning_jobs(organization_id,workspace_id,started_at desc);
-- Source: 20260918000000_sprint86_5_continuous_learning.sql
alter table public.intelligence_memory enable row level security;
-- Source: 20260918000000_sprint86_5_continuous_learning.sql
alter table public.continuous_learning_aggregates enable row level security;
-- Source: 20260918000000_sprint86_5_continuous_learning.sql
alter table public.executive_intelligence_briefings enable row level security;
-- Source: 20260918000000_sprint86_5_continuous_learning.sql
alter table public.continuous_learning_jobs enable row level security;

-- FUNCTIONS (final Version 1 definitions)
-- Source: 20260814000000_sprint43_google_identity_workspace.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='handle_new_user_profile') then execute $vayon_sql$create or replace function public.handle_new_user_profile() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.user_profiles(user_id, name, email, avatar_url)
  values(new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), coalesce(new.email, ''), new.raw_user_meta_data->>'avatar_url')
  on conflict(user_id) do update set email = excluded.email, avatar_url = coalesce(excluded.avatar_url, user_profiles.avatar_url), updated_at = now();
  return new;
end
$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260814000000_sprint43_google_identity_workspace.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='update_user_profile') then execute $vayon_sql$create or replace function public.update_user_profile(p_input jsonb) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'authentication required'; end if;
  insert into public.user_profiles(user_id,name,email,avatar_url,timezone,language,country,phone,job_title,department,notification_preferences,security_settings)
  select v_user, trim(coalesce(p_input->>'name','')), coalesce(u.email,''), nullif(p_input->>'avatarUrl',''), coalesce(nullif(p_input->>'timezone',''),'UTC'), coalesce(nullif(p_input->>'language',''),'en'), nullif(upper(p_input->>'country'),''), nullif(trim(p_input->>'phone'),''), nullif(trim(p_input->>'jobTitle'),''), nullif(trim(p_input->>'department'),''), coalesce(p_input->'notificationPreferences','{}'::jsonb), coalesce(p_input->'securitySettings','{}'::jsonb) from auth.users u where u.id=v_user
  on conflict(user_id) do update set name=excluded.name,email=excluded.email,avatar_url=excluded.avatar_url,timezone=excluded.timezone,language=excluded.language,country=excluded.country,phone=excluded.phone,job_title=excluded.job_title,department=excluded.department,notification_preferences=excluded.notification_preferences,security_settings=excluded.security_settings,updated_at=now(),version=user_profiles.version+1;
  perform public.record_identity_audit('profile.updated', null, null, 'success', '{}'::jsonb);
end
$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260814000000_sprint43_google_identity_workspace.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='complete_sprint43_onboarding') then execute $vayon_sql$create or replace function public.complete_sprint43_onboarding(p_input jsonb) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user uuid:=auth.uid(); v_org uuid; v_workspace uuid; v_owner_role uuid; v_item jsonb; v_role uuid;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if exists(select 1 from public.organization_members where user_id=v_user and status='active') then raise exception 'user already belongs to an organization'; end if;
  select id into v_owner_role from public.roles where code='organization_owner';
  insert into public.organizations(name,country,currency,timezone,language,logo_path,business_type,company_size,phone,website,industry,created_by)
  values(trim(p_input->>'organizationName'),upper(p_input->>'country'),upper(p_input->>'currency'),p_input->>'timezone',p_input->>'language',nullif(p_input->>'logoPath',''),nullif(p_input->>'businessType',''),nullif(p_input->>'companySize',''),nullif(p_input->>'phone',''),nullif(p_input->>'website',''),nullif(p_input->>'industry',''),v_user) returning id into v_org;
  insert into public.organization_members(organization_id,user_id,role_id) values(v_org,v_user,v_owner_role);
  insert into public.workspaces(organization_id,name,office,branch,created_by) values(v_org,trim(p_input->>'workspaceName'),nullif(p_input->>'office',''),nullif(p_input->>'branch',''),v_user) returning id into v_workspace;
  insert into public.workspace_members(workspace_id,organization_id,user_id,role_id) values(v_workspace,v_org,v_user,v_owner_role);
  for v_item in select * from jsonb_array_elements(coalesce(p_input->'invitations','[]'::jsonb)) loop
    select id into v_role from public.roles where code=v_item->>'role' and code not in ('super_admin','organization_owner');
    if v_role is not null then
      insert into public.invitations(organization_id,workspace_id,email,name,role_id,invited_by)
      values(v_org,v_workspace,lower(v_item->>'email'),v_item->>'name',v_role,v_user) on conflict do nothing;
    end if;
  end loop;
  update public.user_profiles set timezone=p_input->>'timezone',language=p_input->>'language',country=upper(p_input->>'country'),phone=nullif(p_input->>'phone',''),updated_at=now(),version=version+1 where user_id=v_user;
  insert into public.identity_audit_events(organization_id,workspace_id,user_id,event_type,metadata) values(v_org,v_workspace,v_user,'organization.created',jsonb_build_object('source','onboarding'));
  insert into public.identity_audit_events(organization_id,workspace_id,user_id,event_type,metadata) values(v_org,v_workspace,v_user,'workspace.created',jsonb_build_object('source','onboarding'));
  return jsonb_build_object('organization_id',v_org,'workspace_id',v_workspace);
end
$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260814000000_sprint43_google_identity_workspace.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='create_team_invitation') then execute $vayon_sql$create or replace function public.create_team_invitation(p_workspace_id uuid,p_email text,p_name text,p_role text) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user uuid:=auth.uid(); v_org uuid; v_role_id uuid; v_id uuid; v_current_role text;
begin
  select organization_id into v_org from public.workspace_members where workspace_id=p_workspace_id and user_id=v_user and status='active';
  v_current_role:=public.current_workspace_role(p_workspace_id);
  if v_org is null or v_current_role not in ('organization_owner','organization_admin') then raise exception 'insufficient invitation permission'; end if;
  select id into v_role_id from public.roles where code=p_role and code in ('organization_admin','branch_manager','sales_manager','agent','viewer');
  if v_role_id is null then raise exception 'invalid invitation role'; end if;
  insert into public.invitations(organization_id,workspace_id,email,name,role_id,invited_by) values(v_org,p_workspace_id,lower(trim(p_email)),trim(p_name),v_role_id,v_user) returning id into v_id;
  insert into public.identity_audit_events(organization_id,workspace_id,user_id,event_type,metadata) values(v_org,p_workspace_id,v_user,'invitation.created',jsonb_build_object('invitation_id',v_id,'role',p_role));
  return v_id;
end
$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260814000000_sprint43_google_identity_workspace.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='set_organization_logo') then execute $vayon_sql$create or replace function public.set_organization_logo(p_organization_id uuid, p_logo_path text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if public.is_organization_member(p_organization_id) is not true or not exists (
    select 1 from public.organization_members om join public.roles r on r.id=om.role_id
    where om.organization_id=p_organization_id and om.user_id=auth.uid() and om.status='active' and r.code in ('organization_owner','organization_admin')
  ) then raise exception 'insufficient logo permission'; end if;
  update public.organizations set logo_path=nullif(p_logo_path,''),updated_at=now() where id=p_organization_id;
end
$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='process_stripe_billing_event') then execute $vayon_sql$create or replace function public.process_stripe_billing_event(p_event_id text,p_event_type text,p_payload jsonb) returns void language plpgsql security definer set search_path=public as $$declare v_org uuid;v_workspace uuid;v_customer uuid;v_subscription uuid;begin if current_setting('role',true)<>'service_role'then raise exception'service role required';end if;v_org=nullif(coalesce(p_payload->'metadata'->>'organization_id',p_payload->'subscription_details'->'metadata'->>'organization_id'),'')::uuid;v_workspace=nullif(coalesce(p_payload->'metadata'->>'workspace_id',p_payload->'subscription_details'->'metadata'->>'workspace_id'),'')::uuid;if v_workspace is null and v_org is not null then select id into v_workspace from workspaces where organization_id=v_org and status='active' order by created_at limit 1;end if;insert into billing_events(organization_id,workspace_id,provider_event_id,event_type,status,payload)values(v_org,v_workspace,p_event_id,p_event_type,'received',p_payload)on conflict(provider,provider_event_id)do nothing;if not found then return;end if;
if p_event_type='checkout.session.completed' then insert into billing_customers(organization_id,workspace_id,provider_customer_id,livemode,email)values(v_org,v_workspace,p_payload->>'customer',coalesce((p_payload->>'livemode')::boolean,false),p_payload->'customer_details'->>'email')on conflict(workspace_id)do update set provider_customer_id=excluded.provider_customer_id,email=excluded.email,updated_at=now();
elsif p_event_type='customer.updated' then update billing_customers set email=p_payload->>'email',address=coalesce(p_payload->'address','{}'),tax_exempt=coalesce(p_payload->>'tax_exempt','none'),updated_at=now() where provider_customer_id=p_payload->>'id';
elsif p_event_type like 'customer.subscription.%' then select organization_id,id into v_org,v_workspace from workspaces where id=coalesce(v_workspace,(select workspace_id from billing_customers where provider_customer_id=p_payload->>'customer'));select id into v_subscription from subscriptions where workspace_id=v_workspace and deleted_at is null;update subscriptions set provider='stripe',provider_customer_id=p_payload->>'customer',provider_subscription_id=p_payload->>'id',status=case p_payload->>'status' when'active'then'active' when'trialing'then'trialing' when'past_due'then'past_due' when'canceled'then'cancelled' else status end,cancel_at_period_end=coalesce((p_payload->>'cancel_at_period_end')::boolean,false),trial_ends_at=case when p_payload->>'trial_end'is null then null else to_timestamp((p_payload->>'trial_end')::bigint)end,current_period_ends_at=case when p_payload->>'current_period_end'is null then current_period_ends_at else to_timestamp((p_payload->>'current_period_end')::bigint)end,updated_at=now(),version=version+1 where id=v_subscription;insert into subscription_items(organization_id,workspace_id,subscription_id,provider_item_id,provider_price_id,quantity,metered)select v_org,v_workspace,v_subscription,item->>'id',item->'price'->>'id',greatest(1,coalesce((item->>'quantity')::integer,1)),coalesce((item->'price'->'recurring'->>'usage_type')='metered',false)from jsonb_array_elements(coalesce(p_payload->'items'->'data','[]'))item on conflict(provider_item_id)do update set provider_price_id=excluded.provider_price_id,quantity=excluded.quantity,metered=excluded.metered,updated_at=now();
elsif p_event_type like 'invoice.%' then select workspace_id into v_workspace from billing_customers where provider_customer_id=p_payload->>'customer';select id into v_subscription from subscriptions where workspace_id=v_workspace and deleted_at is null;insert into invoices(organization_id,workspace_id,subscription_id,invoice_number,status,currency,subtotal,tax,issued_at,due_at,paid_at,download_url,provider_invoice_id,payment_intent_id,created_by,metadata)select organization_id,v_workspace,v_subscription,coalesce(p_payload->>'number',p_payload->>'id'),case when p_event_type='invoice.paid'then'paid'when p_event_type='invoice.payment_failed'then'failed'else coalesce(p_payload->>'status','open')end,upper(coalesce(p_payload->>'currency','inr')),coalesce((p_payload->>'subtotal')::numeric/100,0),coalesce((p_payload->'total_tax_amounts'->0->>'amount')::numeric/100,0),to_timestamp((p_payload->>'created')::bigint),case when p_payload->>'due_date'is null then null else to_timestamp((p_payload->>'due_date')::bigint)end,case when p_event_type='invoice.paid'then now()end,p_payload->>'hosted_invoice_url',p_payload->>'id',p_payload->>'payment_intent',created_by,p_payload from subscriptions where id=v_subscription on conflict(provider_invoice_id)do update set status=excluded.status,paid_at=excluded.paid_at,download_url=excluded.download_url,metadata=excluded.metadata,updated_at=now();
elsif p_event_type like 'payment_method.%' then select id,workspace_id into v_customer,v_workspace from billing_customers where provider_customer_id=p_payload->>'customer';if p_event_type='payment_method.attached'then insert into payment_methods(organization_id,workspace_id,billing_customer_id,provider_payment_method_id,type,brand,last4,expiry_month,expiry_year)select organization_id,workspace_id,id,p_payload->>'id',p_payload->>'type',p_payload->'card'->>'brand',p_payload->'card'->>'last4',(p_payload->'card'->>'exp_month')::integer,(p_payload->'card'->>'exp_year')::integer from billing_customers where id=v_customer on conflict(provider_payment_method_id)do update set detached_at=null;else update payment_methods set detached_at=now(),is_default=false where provider_payment_method_id=p_payload->>'id';end if;end if;update billing_events set status='processed',processed_at=now(),organization_id=coalesce(organization_id,v_org),workspace_id=coalesce(workspace_id,v_workspace)where provider_event_id=p_event_id;exception when others then update billing_events set status='failed',error_code=sqlstate,processed_at=now()where provider_event_id=p_event_id;raise;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='reactivate_subscription') then execute $vayon_sql$create or replace function public.reactivate_subscription(p_workspace_id uuid,p_expected_version integer)returns void language plpgsql security definer set search_path=public as $$begin if not can_manage_billing(p_workspace_id)then raise exception'insufficient billing permission';end if;update subscriptions set cancel_at_period_end=false,updated_by=auth.uid(),updated_at=now(),version=version+1 where workspace_id=p_workspace_id and version=p_expected_version and deleted_at is null;if not found then raise exception'subscription changed by another user';end if;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='enterprise_org_context') then execute $vayon_sql$create or replace function public.enterprise_org_context(p_workspace_id uuid,p_owner_only boolean default false)returns uuid language plpgsql stable security definer set search_path=public as $$declare v_org uuid;v_role text;begin select wm.organization_id into v_org from workspace_members wm where wm.workspace_id=p_workspace_id and wm.user_id=auth.uid()and wm.status='active';v_role:=public.current_workspace_role(p_workspace_id);if v_org is null or v_role not in('organization_owner','organization_admin')or(p_owner_only and v_role<>'organization_owner')then raise exception'insufficient organization permission';end if;return v_org;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='set_enterprise_organization_logo') then execute $vayon_sql$create or replace function public.set_enterprise_organization_logo(p_workspace_id uuid,p_logo_path text)returns void language plpgsql security definer set search_path=public as $$declare v_org uuid:=enterprise_org_context(p_workspace_id);begin if p_logo_path not like v_org::text||'/'||p_workspace_id::text||'/company-logo/%'then raise exception'invalid logo path';end if;update organizations set logo_path=p_logo_path,updated_at=now(),version=version+1 where id=v_org;insert into organization_audit_events(organization_id,workspace_id,actor_id,event_type,metadata)values(v_org,p_workspace_id,auth.uid(),'organization.updated','{"field":"logo"}');end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='invite_organization_member') then execute $vayon_sql$create or replace function public.invite_organization_member(p_workspace_id uuid,p_name text,p_email text,p_role text)returns uuid language plpgsql security definer set search_path=public as $$declare v_org uuid:=enterprise_org_context(p_workspace_id);v_role uuid;v_id uuid;begin select id into v_role from roles where code=p_role and code in('organization_admin','manager','sales','marketing','operations','finance','support','read_only');if v_role is null then raise exception'invalid role';end if;if exists(select 1 from auth.users u join organization_members om on om.user_id=u.id where om.organization_id=v_org and lower(u.email)=lower(p_email)and om.status<>'removed')then raise exception'user is already a member';end if;update invitations set status='cancelled',cancelled_at=now()where organization_id=v_org and lower(email)=lower(p_email)and status='pending';insert into invitations(organization_id,workspace_id,email,name,role_id,status,expires_at,invited_by)values(v_org,p_workspace_id,lower(trim(p_email)),trim(p_name),v_role,'pending',now()+interval'7 days',auth.uid())returning id into v_id;insert into organization_audit_events(organization_id,workspace_id,actor_id,event_type,subject_id,metadata)values(v_org,p_workspace_id,auth.uid(),'invitation.sent',v_id,jsonb_build_object('role',p_role));return v_id;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='resend_organization_invitation') then execute $vayon_sql$create or replace function public.resend_organization_invitation(p_workspace_id uuid,p_invitation_id uuid)returns jsonb language plpgsql security definer set search_path=public as $$declare v_org uuid:=enterprise_org_context(p_workspace_id);v_email text;begin update invitations set expires_at=now()+interval'7 days',resent_at=now()where id=p_invitation_id and organization_id=v_org and workspace_id=p_workspace_id and status='pending'returning email into v_email;if v_email is null then raise exception'pending invitation not found';end if;insert into organization_audit_events(organization_id,workspace_id,actor_id,event_type,subject_id)values(v_org,p_workspace_id,auth.uid(),'invitation.resent',p_invitation_id);return jsonb_build_object('email',v_email);end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='cancel_organization_invitation') then execute $vayon_sql$create or replace function public.cancel_organization_invitation(p_workspace_id uuid,p_invitation_id uuid)returns void language plpgsql security definer set search_path=public as $$declare v_org uuid:=enterprise_org_context(p_workspace_id);begin update invitations set status='cancelled',cancelled_at=now()where id=p_invitation_id and organization_id=v_org and workspace_id=p_workspace_id and status='pending';if not found then raise exception'pending invitation not found';end if;insert into organization_audit_events(organization_id,workspace_id,actor_id,event_type,subject_id)values(v_org,p_workspace_id,auth.uid(),'invitation.cancelled',p_invitation_id);end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='accept_organization_invitation') then execute $vayon_sql$create or replace function public.accept_organization_invitation()returns uuid language plpgsql security definer set search_path=public as $$declare v_user uuid:=auth.uid();v_email text;v_inv invitations%rowtype;begin if v_user is null then raise exception'authentication required';end if;select lower(email)into v_email from auth.users where id=v_user;select*into v_inv from invitations where lower(email)=v_email and status='pending'and expires_at>now()order by created_at desc limit 1 for update;if not found then raise exception'valid invitation not found';end if;insert into organization_members(organization_id,user_id,role_id,status)values(v_inv.organization_id,v_user,v_inv.role_id,'active')on conflict(organization_id,user_id)do update set role_id=excluded.role_id,status='active',updated_at=now();insert into workspace_members(workspace_id,organization_id,user_id,role_id,status)values(v_inv.workspace_id,v_inv.organization_id,v_user,v_inv.role_id,'active')on conflict(workspace_id,user_id)do update set role_id=excluded.role_id,status='active',updated_at=now();update invitations set status='accepted',accepted_at=now()where id=v_inv.id;insert into organization_audit_events(organization_id,workspace_id,actor_id,event_type,subject_id)values(v_inv.organization_id,v_inv.workspace_id,v_user,'invitation.accepted',v_inv.id);return v_inv.workspace_id;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='change_organization_member_role') then execute $vayon_sql$create or replace function public.change_organization_member_role(p_workspace_id uuid,p_member_id uuid,p_role text)returns void language plpgsql security definer set search_path=public as $$declare v_org uuid:=enterprise_org_context(p_workspace_id);v_role uuid;v_user uuid;begin select id into v_role from roles where code=p_role and code in('organization_admin','manager','sales','marketing','operations','finance','support','read_only');select user_id into v_user from workspace_members where id=p_member_id and organization_id=v_org and workspace_id=p_workspace_id and status<>'removed';if v_role is null or v_user is null then raise exception'invalid member or role';end if;if exists(select 1 from workspace_members wm join roles r on r.id=wm.role_id where wm.id=p_member_id and r.code='organization_owner')then raise exception'owner role cannot be changed';end if;update workspace_members set role_id=v_role,updated_at=now()where id=p_member_id;update organization_members set role_id=v_role,updated_at=now()where organization_id=v_org and user_id=v_user;insert into organization_audit_events(organization_id,workspace_id,actor_id,event_type,subject_id,metadata)values(v_org,p_workspace_id,auth.uid(),'member.role_changed',v_user,jsonb_build_object('role',p_role));end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='set_organization_member_status') then execute $vayon_sql$create or replace function public.set_organization_member_status(p_workspace_id uuid,p_member_id uuid,p_status text)returns void language plpgsql security definer set search_path=public as $$declare v_org uuid:=enterprise_org_context(p_workspace_id);v_user uuid;begin if p_status not in('active','suspended')then raise exception'invalid status';end if;select wm.user_id into v_user from workspace_members wm join roles r on r.id=wm.role_id where wm.id=p_member_id and wm.organization_id=v_org and wm.workspace_id=p_workspace_id and r.code<>'organization_owner';if v_user is null or v_user=auth.uid()then raise exception'member cannot be changed';end if;update workspace_members set status=p_status,updated_at=now()where id=p_member_id;update organization_members set status=p_status,updated_at=now()where organization_id=v_org and user_id=v_user;insert into organization_audit_events(organization_id,workspace_id,actor_id,event_type,subject_id)values(v_org,p_workspace_id,auth.uid(),case when p_status='active'then'member.reactivated'else'member.suspended'end,v_user);end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='remove_organization_member') then execute $vayon_sql$create or replace function public.remove_organization_member(p_workspace_id uuid,p_member_id uuid)returns void language plpgsql security definer set search_path=public as $$declare v_org uuid:=enterprise_org_context(p_workspace_id);v_user uuid;begin select wm.user_id into v_user from workspace_members wm join roles r on r.id=wm.role_id where wm.id=p_member_id and wm.organization_id=v_org and wm.workspace_id=p_workspace_id and r.code<>'organization_owner';if v_user is null or v_user=auth.uid()then raise exception'member cannot be removed';end if;update workspace_members set status='removed',updated_at=now()where id=p_member_id;update organization_members set status='removed',updated_at=now()where organization_id=v_org and user_id=v_user;insert into organization_audit_events(organization_id,workspace_id,actor_id,event_type,subject_id)values(v_org,p_workspace_id,auth.uid(),'member.removed',v_user);end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='transfer_organization_ownership') then execute $vayon_sql$create or replace function public.transfer_organization_ownership(p_workspace_id uuid,p_member_id uuid,p_confirmation text)returns void language plpgsql security definer set search_path=public as $$declare v_org uuid:=enterprise_org_context(p_workspace_id,true);v_target uuid;v_owner_role uuid;v_admin_role uuid;begin if p_confirmation<>'TRANSFER'then raise exception'ownership confirmation required';end if;select user_id into v_target from workspace_members where id=p_member_id and organization_id=v_org and workspace_id=p_workspace_id and status='active';if v_target is null or v_target=auth.uid()then raise exception'invalid ownership target';end if;select id into v_owner_role from roles where code='organization_owner';select id into v_admin_role from roles where code='organization_admin';update organization_members set role_id=v_admin_role,updated_at=now()where organization_id=v_org and user_id=auth.uid();update workspace_members set role_id=v_admin_role,updated_at=now()where workspace_id=p_workspace_id and user_id=auth.uid();update organization_members set role_id=v_owner_role,updated_at=now()where organization_id=v_org and user_id=v_target;update workspace_members set role_id=v_owner_role,updated_at=now()where workspace_id=p_workspace_id and user_id=v_target;insert into organization_audit_events(organization_id,workspace_id,actor_id,event_type,subject_id,metadata)values(v_org,p_workspace_id,auth.uid(),'ownership.transferred',v_target,jsonb_build_object('previous_owner',auth.uid()));end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260821000000_sprint57_ai_collaboration.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='audit_ai_collaboration') then execute $vayon_sql$create or replace function public.audit_ai_collaboration()returns trigger language plpgsql security definer set search_path=public as $$begin insert into activity_events(organization_id,workspace_id,event_type,title,actor_id,related_type,related_id,metadata)values(new.organization_id,new.workspace_id,'ai.collaboration.'||tg_op::text,'AI collaboration audit event',auth.uid(),'ai_collaboration',new.id,jsonb_build_object('table',tg_table_name,'recommendation_only',true,'approval_required',true));return new;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260822000000_sprint58_enterprise_security.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='switch_current_organization') then execute $vayon_sql$create or replace function public.switch_current_organization(p_organization_id uuid,p_workspace_id uuid)returns void language plpgsql security definer set search_path=public as $$begin if not exists(select 1 from organization_members where organization_id=p_organization_id and user_id=auth.uid()and status='active')or not exists(select 1 from workspace_members where organization_id=p_organization_id and workspace_id=p_workspace_id and user_id=auth.uid()and status='active')then raise exception'invalid organization membership';end if;insert into user_organization_context(user_id,organization_id,workspace_id)values(auth.uid(),p_organization_id,p_workspace_id)on conflict(user_id)do update set organization_id=excluded.organization_id,workspace_id=excluded.workspace_id,switched_at=now();insert into identity_audit_events(organization_id,workspace_id,user_id,event_type,metadata)values(p_organization_id,p_workspace_id,auth.uid(),'organization.switched','{}');end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260822000000_sprint58_enterprise_security.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='create_personal_access_token') then execute $vayon_sql$create or replace function public.create_personal_access_token(p_workspace_id uuid,p_name text,p_token_prefix text,p_token_hash text,p_scopes text[],p_expires_at timestamptz)returns uuid language plpgsql security definer set search_path=public as $$declare v_org uuid;v_id uuid;begin select organization_id into v_org from workspace_members where workspace_id=p_workspace_id and user_id=auth.uid()and status='active';if v_org is null or array_length(p_scopes,1)>20 or p_expires_at is not null and p_expires_at<=now()then raise exception'invalid token request';end if;insert into personal_access_tokens(user_id,organization_id,workspace_id,name,token_prefix,token_hash,scopes,expires_at)values(auth.uid(),v_org,p_workspace_id,trim(p_name),p_token_prefix,p_token_hash,p_scopes,p_expires_at)returning id into v_id;insert into identity_audit_events(organization_id,workspace_id,user_id,event_type,metadata)values(v_org,p_workspace_id,auth.uid(),'token.created',jsonb_build_object('token_id',v_id,'scopes',p_scopes));return v_id;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260822000000_sprint58_enterprise_security.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='revoke_personal_access_token') then execute $vayon_sql$create or replace function public.revoke_personal_access_token(p_token_id uuid)returns void language plpgsql security definer set search_path=public as $$declare t personal_access_tokens%rowtype;begin select*into t from personal_access_tokens where id=p_token_id and user_id=auth.uid()and revoked_at is null for update;if not found then raise exception'token not found';end if;update personal_access_tokens set revoked_at=now()where id=t.id;insert into identity_audit_events(organization_id,workspace_id,user_id,event_type,metadata)values(t.organization_id,t.workspace_id,auth.uid(),'token.revoked',jsonb_build_object('token_id',t.id));end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260822000000_sprint58_enterprise_security.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='record_identity_audit') then execute $vayon_sql$create or replace function public.record_identity_audit(p_event_type text,p_organization_id uuid default null,p_workspace_id uuid default null,p_outcome text default'success',p_metadata jsonb default'{}')returns uuid language plpgsql security definer set search_path=public as $$declare v_id uuid;begin if auth.uid()is null then raise exception'authentication required';end if;if p_event_type not in('login','logout','password.changed','password.reset','email.verified','email.changed','mfa.enabled','mfa.disabled','device.trusted','device.removed','session.revoked','token.created','token.revoked','organization.switched','workspace.created','organization.created','google.connected','profile.updated','invitation.created')then raise exception'invalid audit event';end if;if p_organization_id is not null and not is_organization_member(p_organization_id)then raise exception'invalid audit tenant';end if;insert into identity_audit_events(organization_id,workspace_id,user_id,event_type,outcome,metadata)values(p_organization_id,p_workspace_id,auth.uid(),p_event_type,p_outcome,coalesce(p_metadata,'{}'))returning id into v_id;return v_id;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260822000000_sprint58_enterprise_security.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='record_authentication_attempt') then execute $vayon_sql$create or replace function public.record_authentication_attempt(p_email_hash text,p_outcome text,p_method text,p_latency_ms integer,p_mfa_used boolean default false,p_ip_hash text default null,p_user_agent text default null)returns void language plpgsql security definer set search_path=public as $$declare v_failures integer;begin if p_outcome not in('success','failure','locked')or p_latency_ms<0 then raise exception'invalid attempt';end if;insert into authentication_attempts(user_id,email_hash,outcome,auth_method,latency_ms,mfa_used,ip_hash,user_agent)values(auth.uid(),p_email_hash,p_outcome,p_method,p_latency_ms,p_mfa_used,p_ip_hash,left(p_user_agent,500));select count(*)into v_failures from authentication_attempts where email_hash=p_email_hash and outcome='failure'and occurred_at>now()-interval'15 minutes';if v_failures>=5 and auth.uid()is not null then insert into security_alerts(user_id,alert_type,severity,title,details)values(auth.uid(),'suspicious_login','high','Repeated failed login attempts detected',jsonb_build_object('attempts',v_failures));end if;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260822000000_sprint58_enterprise_security.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='check_auth_rate_limit') then execute $vayon_sql$create or replace function public.check_auth_rate_limit(p_email_hash text)returns boolean language sql security definer set search_path=public as $$select count(*)<5 from authentication_attempts where email_hash=p_email_hash and outcome='failure'and occurred_at>now()-interval'15 minutes'$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260822000000_sprint58_enterprise_security.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='replace_mfa_recovery_codes') then execute $vayon_sql$create or replace function public.replace_mfa_recovery_codes(p_code_hashes text[])returns void language plpgsql security definer set search_path=public as $$begin if auth.uid()is null or array_length(p_code_hashes,1)<>10 then raise exception'invalid recovery codes';end if;delete from mfa_recovery_codes where user_id=auth.uid();insert into mfa_recovery_codes(user_id,code_hash)select auth.uid(),unnest(p_code_hashes);end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260822000000_sprint58_enterprise_security.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='revoke_other_identity_sessions') then execute $vayon_sql$create or replace function public.revoke_other_identity_sessions()returns void language plpgsql security definer set search_path=public as $$begin update identity_sessions set revoked_at=now()where user_id=auth.uid()and revoked_at is null;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260822000000_sprint58_enterprise_security.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='trust_identity_device') then execute $vayon_sql$create or replace function public.trust_identity_device(p_fingerprint text,p_name text)returns uuid language plpgsql security definer set search_path=public as $$declare v_id uuid;begin insert into trusted_devices(user_id,organization_id,workspace_id,device_fingerprint,device_name,expires_at)select auth.uid(),organization_id,workspace_id,p_fingerprint,left(p_name,100),now()+interval'90 days'from user_organization_context where user_id=auth.uid()on conflict(user_id,device_fingerprint)do update set device_name=excluded.device_name,last_seen_at=now(),expires_at=excluded.expires_at,removed_at=null returning id into v_id;return v_id;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260822000000_sprint58_enterprise_security.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='remove_identity_device') then execute $vayon_sql$create or replace function public.remove_identity_device(p_device_id uuid)returns void language plpgsql security definer set search_path=public as $$begin update trusted_devices set removed_at=now()where id=p_device_id and user_id=auth.uid()and removed_at is null;if not found then raise exception'device not found';end if;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260822000000_sprint58_enterprise_security.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='upsert_identity_session') then execute $vayon_sql$create or replace function public.upsert_identity_session(p_fingerprint text,p_device_name text,p_ip_hash text,p_user_agent text,p_expires_at timestamptz)returns uuid language plpgsql security definer set search_path=public as $$declare v_id uuid;v_org uuid;v_workspace uuid;begin select organization_id,workspace_id into v_org,v_workspace from user_organization_context where user_id=auth.uid();insert into identity_sessions(user_id,organization_id,workspace_id,session_fingerprint,device_name,ip_hash,user_agent,expires_at)values(auth.uid(),v_org,v_workspace,p_fingerprint,left(p_device_name,100),p_ip_hash,left(p_user_agent,500),p_expires_at)on conflict(user_id,session_fingerprint)do update set last_seen_at=now(),expires_at=excluded.expires_at,revoked_at=null returning id into v_id;return v_id;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='enqueue_notification') then execute $vayon_sql$create or replace function public.enqueue_notification(p_input jsonb)returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;v_channel text;v_org uuid:=(p_input->>'organizationId')::uuid;v_workspace uuid:=(p_input->>'workspaceId')::uuid;v_user uuid:=nullif(p_input->>'userId','')::uuid;
begin
  if not exists(select 1 from workspaces where id=v_workspace and organization_id=v_org)then raise exception 'Invalid notification workspace.';end if;
  insert into notification_events(organization_id,workspace_id,user_id,category,title,body,priority,dedupe_key,source_type,source_id,mentioned)
  values(v_org,v_workspace,v_user,p_input->>'category',left(p_input->>'title',180),left(p_input->>'body',4000),coalesce(p_input->>'priority','normal'),left(p_input->>'dedupeKey',220),nullif(p_input->>'sourceType',''),nullif(p_input->>'sourceId','')::uuid,coalesce((p_input->>'mentioned')::boolean,false))
  on conflict(organization_id,dedupe_key)do update set title=excluded.title,body=excluded.body,priority=excluded.priority returning id into v_id;
  for v_channel in select jsonb_array_elements_text(coalesce(p_input->'channels','["in_app"]'))loop
    if v_channel not in('in_app','email')then continue;end if;
    insert into notification_queue(organization_id,workspace_id,notification_id,channel,idempotency_key)values(v_org,v_workspace,v_id,v_channel,v_id||':'||v_channel)on conflict(idempotency_key)do nothing;
  end loop;
  insert into activity_events(organization_id,workspace_id,event_type,title,description,related_type,related_id,metadata)
  values(v_org,v_workspace,'notification.created',left(p_input->>'title',180),left(p_input->>'body',4000),'notification',v_id,jsonb_build_object('category',p_input->>'category','priority',coalesce(p_input->>'priority','normal')))on conflict do nothing;
  return v_id;
end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='mutate_notification') then execute $vayon_sql$create or replace function public.mutate_notification(p_notification_id uuid,p_action text,p_snoozed_until timestamptz default null)returns void language plpgsql security definer set search_path=public as $$
begin
  if p_action not in('read','unread','archive','restore','star','unstar','snooze')then raise exception 'Unsupported notification action.';end if;
  update notification_events set read_at=case when p_action='read'then now()when p_action='unread'then null else read_at end,archived_at=case when p_action='archive'then now()when p_action='restore'then null else archived_at end,starred=case when p_action='star'then true when p_action='unstar'then false else starred end,snoozed_until=case when p_action='snooze'then p_snoozed_until else snoozed_until end
  where id=p_notification_id and public.is_organization_member(organization_id)and(user_id is null or user_id=auth.uid());
end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='save_notification_preferences') then execute $vayon_sql$create or replace function public.save_notification_preferences(p_input jsonb)returns void language plpgsql security definer set search_path=public as $$
declare v_org uuid:=(p_input->>'organizationId')::uuid;v_workspace uuid:=(p_input->>'workspaceId')::uuid;
begin
  if auth.uid()is null or not public.is_organization_member(v_org)or not exists(select 1 from workspaces where id=v_workspace and organization_id=v_org)then raise exception 'Access denied.';end if;
  insert into notification_preferences(organization_id,workspace_id,user_id,email_enabled,in_app_enabled,browser_push_enabled,whatsapp_enabled,webhook_enabled,muted,quiet_hours_start,quiet_hours_end,digest_frequency,categories)
  values(v_org,v_workspace,auth.uid(),coalesce((p_input->>'email')::boolean,true),coalesce((p_input->>'inApp')::boolean,true),coalesce((p_input->>'browserPush')::boolean,false),coalesce((p_input->>'whatsapp')::boolean,false),coalesce((p_input->>'webhook')::boolean,false),coalesce((p_input->>'muted')::boolean,false),nullif(p_input->>'quietHoursStart','')::time,nullif(p_input->>'quietHoursEnd','')::time,coalesce(p_input->>'digestFrequency','instant'),coalesce(p_input->'categories','{}'))
  on conflict(workspace_id,user_id)do update set email_enabled=excluded.email_enabled,in_app_enabled=excluded.in_app_enabled,browser_push_enabled=excluded.browser_push_enabled,whatsapp_enabled=excluded.whatsapp_enabled,webhook_enabled=excluded.webhook_enabled,muted=excluded.muted,quiet_hours_start=excluded.quiet_hours_start,quiet_hours_end=excluded.quiet_hours_end,digest_frequency=excluded.digest_frequency,categories=excluded.categories,updated_at=now();
end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='schedule_notification_reminder') then execute $vayon_sql$create or replace function public.schedule_notification_reminder(p_input jsonb)returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;v_org uuid:=(p_input->>'organizationId')::uuid;v_workspace uuid:=(p_input->>'workspaceId')::uuid;
begin
  if auth.uid()is null or not public.is_organization_member(v_org)or not exists(select 1 from workspaces where id=v_workspace and organization_id=v_org)then raise exception 'Access denied.';end if;
  insert into notification_reminders(organization_id,workspace_id,user_id,kind,title,remind_at,source_type,source_id)values(v_org,v_workspace,auth.uid(),p_input->>'kind',left(p_input->>'title',180),(p_input->>'remindAt')::timestamptz,nullif(p_input->>'sourceType',''),nullif(p_input->>'sourceId','')::uuid)returning id into v_id;return v_id;
end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='notification_observability') then execute $vayon_sql$create or replace function public.notification_observability(p_workspace_id uuid)returns table(unread_count bigint,queued bigint,delivered bigint,failed bigint,average_latency_ms numeric,by_channel jsonb,by_category jsonb)language sql stable security definer set search_path=public as $$
select(select count(*)from notification_events n where n.workspace_id=p_workspace_id and n.read_at is null and n.archived_at is null and(n.user_id is null or n.user_id=auth.uid())),(select count(*)from notification_queue q where q.workspace_id=p_workspace_id and q.status in('queued','processing')),(select count(*)from notification_queue q where q.workspace_id=p_workspace_id and q.status='sent'),(select count(*)from notification_queue q where q.workspace_id=p_workspace_id and q.status='failed'),(select round(avg(extract(epoch from(coalesce(q.delivered_at,q.updated_at)-q.created_at))*1000))from notification_queue q where q.workspace_id=p_workspace_id and q.status='sent'),coalesce((select jsonb_object_agg(channel,total)from(select channel,count(*)total from notification_queue where workspace_id=p_workspace_id group by channel)s),'{}'),coalesce((select jsonb_object_agg(category,total)from(select category,count(*)total from notification_events where workspace_id=p_workspace_id group by category)s),'{}')where public.is_organization_member((select organization_id from workspaces where id=p_workspace_id));
$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='notify_ai_recommendation') then execute $vayon_sql$create or replace function public.notify_ai_recommendation()returns trigger language plpgsql security definer set search_path=public as $$begin perform enqueue_notification(jsonb_build_object('organizationId',new.organization_id,'workspaceId',new.workspace_id,'category','ai_recommendation','title',new.title,'body',new.summary,'priority',case when coalesce(new.confidence,0)>=.9 then'high'else'normal'end,'channels',jsonb_build_array('in_app'),'dedupeKey','ai-recommendation:'||new.id,'sourceType','ai_recommendation','sourceId',new.id));return new;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='notify_ai_approval') then execute $vayon_sql$create or replace function public.notify_ai_approval()returns trigger language plpgsql security definer set search_path=public as $$begin perform enqueue_notification(jsonb_build_object('organizationId',new.organization_id,'workspaceId',new.workspace_id,'category','approval','title',case when new.status='pending'then'Approval required'else'Approval '||new.status end,'body','An AI recommendation approval is '||new.status||'.','priority',case when new.status='pending'then'high'else'normal'end,'channels',jsonb_build_array('in_app'),'dedupeKey','ai-approval:'||new.id||':'||new.version,'sourceType','approval','sourceId',new.id));return new;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='notify_security_alert') then execute $vayon_sql$create or replace function public.notify_security_alert()returns trigger language plpgsql security definer set search_path=public as $$begin if new.organization_id is not null and new.workspace_id is not null then perform enqueue_notification(jsonb_build_object('organizationId',new.organization_id,'workspaceId',new.workspace_id,'userId',new.user_id,'category','security','title',new.title,'body','Review this security event in Identity & Security.','priority',case when new.severity in('high','critical')then'urgent'else'normal'end,'channels',jsonb_build_array('in_app','email'),'dedupeKey','security-alert:'||new.id,'sourceType','security_alert','sourceId',new.id));end if;return new;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='notify_billing_event') then execute $vayon_sql$create or replace function public.notify_billing_event()returns trigger language plpgsql security definer set search_path=public as $$declare v_title text;v_priority text:='normal';begin if new.organization_id is null or new.workspace_id is null or new.status not in('processed','failed')then return new;end if;v_title:=case new.event_type when'invoice.paid'then'Payment succeeded'when'invoice.payment_failed'then'Payment failed'when'checkout.session.completed'then'Subscription activated'when'customer.subscription.deleted'then'Subscription cancelled'else'Billing update'end;if new.event_type='invoice.payment_failed'or new.status='failed'then v_priority:='urgent';end if;perform enqueue_notification(jsonb_build_object('organizationId',new.organization_id,'workspaceId',new.workspace_id,'category','billing','title',v_title,'body','Review the latest billing event in Billing settings.','priority',v_priority,'channels',jsonb_build_array('in_app','email'),'dedupeKey','billing-event:'||new.id,'sourceType','billing_event','sourceId',new.id));return new;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='process_due_notification_reminders') then execute $vayon_sql$create or replace function public.process_due_notification_reminders(p_limit integer default 100)returns integer language plpgsql security definer set search_path=public as $$declare r notification_reminders%rowtype;v_count integer:=0;v_notification uuid;begin for r in select*from notification_reminders where status='scheduled'and remind_at<=now()order by remind_at for update skip locked limit least(greatest(p_limit,1),500)loop v_notification:=enqueue_notification(jsonb_build_object('organizationId',r.organization_id,'workspaceId',r.workspace_id,'userId',r.user_id,'category',case when r.kind='meeting'then'calendar'when r.kind in('lead_follow_up','deal_deadline')then'crm'when r.kind in('subscription_renewal','trial_ending')then'billing'when r.kind='workflow_approval'then'approval'when r.kind='ai_recommendation'then'ai_recommendation'else'workflow'end,'title',r.title,'body','Scheduled reminder','priority','normal','channels',jsonb_build_array('in_app','email'),'dedupeKey','reminder:'||r.id,'sourceType','reminder','sourceId',r.id));update notification_reminders set status='sent',notification_id=v_notification,updated_at=now()where id=r.id;v_count:=v_count+1;end loop;return v_count;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260824000000_sprint60_enterprise_email.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='can_manage_email_platform') then execute $vayon_sql$create or replace function public.can_manage_email_platform(p_workspace_id uuid)returns boolean language sql stable security definer set search_path=public as $$select coalesce(public.current_workspace_role(p_workspace_id)in('organization_owner','organization_admin','operations'),false)$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260824000000_sprint60_enterprise_email.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='enqueue_email_message') then execute $vayon_sql$create or replace function public.enqueue_email_message(p_workspace_id uuid,p_input jsonb)returns uuid language plpgsql security definer set search_path=public as $$declare v_org uuid;v_id uuid;begin select organization_id into v_org from workspaces where id=p_workspace_id;if v_org is null or(current_setting('role',true)<>'service_role'and not public.is_organization_member(v_org))then raise exception'email workspace access denied';end if;if p_input->>'provider'not in('resend','sendgrid','postmark','smtp')then raise exception'invalid email provider';end if;insert into email_messages(organization_id,workspace_id,purpose,recipients,locale,variables_ciphertext,subject,provider,scheduled_at,dedupe_key,source_type,source_id,created_by)values(v_org,p_workspace_id,p_input->>'purpose',p_input->'to',coalesce(p_input->>'locale','en'),p_input->>'variablesCiphertext',p_input->>'purpose',p_input->>'provider',coalesce((p_input->>'scheduledAt')::timestamptz,now()),p_input->>'dedupeKey',nullif(p_input->>'sourceType',''),nullif(p_input->>'sourceId','')::uuid,auth.uid())on conflict(organization_id,dedupe_key)do update set updated_at=email_messages.updated_at returning id into v_id;insert into activity_events(organization_id,workspace_id,event_type,title,actor_id,related_type,related_id,metadata)values(v_org,p_workspace_id,'email.queued','Transactional email queued',auth.uid(),'email',v_id,jsonb_build_object('purpose',p_input->>'purpose','provider',p_input->>'provider'));return v_id;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260824000000_sprint60_enterprise_email.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='claim_email_message') then execute $vayon_sql$create or replace function public.claim_email_message(p_provider text)returns jsonb language plpgsql security definer set search_path=public as $$declare r email_messages%rowtype;begin if current_setting('role',true)<>'service_role'then raise exception'service role required';end if;select*into r from email_messages where provider=p_provider and status='queued'and scheduled_at<=now()and attempts<max_attempts order by scheduled_at for update skip locked limit 1;if r.id is null then return null;end if;update email_messages set status='processing',started_at=now(),attempts=attempts+1,updated_at=now()where id=r.id;insert into email_delivery_attempts(organization_id,workspace_id,message_id,provider,status)values(r.organization_id,r.workspace_id,r.id,r.provider,'processing');return to_jsonb(r);end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260824000000_sprint60_enterprise_email.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='complete_email_message') then execute $vayon_sql$create or replace function public.complete_email_message(p_message_id uuid,p_success boolean,p_provider_message_id text,p_latency_ms integer,p_error text)returns void language plpgsql security definer set search_path=public as $$declare r email_messages%rowtype;v_status text;begin if current_setting('role',true)<>'service_role'then raise exception'service role required';end if;select*into r from email_messages where id=p_message_id for update;if r.id is null then raise exception'email message not found';end if;v_status:=case when p_success then'delivered'when r.attempts>=r.max_attempts then'failed'else'queued'end;update email_messages set status=v_status,provider_message_id=case when p_success then p_provider_message_id else provider_message_id end,latency_ms=p_latency_ms,last_error=case when p_success then null else left(p_error,500)end,delivered_at=case when p_success then now()else delivered_at end,scheduled_at=case when not p_success and r.attempts<r.max_attempts then now()+(interval'1 minute'*power(2,r.attempts))else scheduled_at end,updated_at=now()where id=p_message_id;update email_delivery_attempts set status=case when p_success then'delivered'else'failed'end,latency_ms=p_latency_ms,error_code=case when p_success then null else left(p_error,120)end,completed_at=now()where message_id=p_message_id and status='processing';insert into activity_events(organization_id,workspace_id,event_type,title,related_type,related_id,metadata)values(r.organization_id,r.workspace_id,case when p_success then'email.delivered'else'email.delivery_failed'end,case when p_success then'Transactional email delivered'else'Transactional email delivery failed'end,'email',r.id,jsonb_build_object('provider',r.provider,'latency_ms',p_latency_ms,'attempt',r.attempts));end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260824000000_sprint60_enterprise_email.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='retry_email_message') then execute $vayon_sql$create or replace function public.retry_email_message(p_workspace_id uuid,p_message_id uuid)returns void language plpgsql security definer set search_path=public as $$declare v_org uuid;begin if not can_manage_email_platform(p_workspace_id)then raise exception'insufficient email permission';end if;update email_messages set status='queued',scheduled_at=now(),last_error=null,updated_at=now()where id=p_message_id and workspace_id=p_workspace_id and status in('failed','bounced');if not found then raise exception'failed email not found';end if;select organization_id into v_org from workspaces where id=p_workspace_id;insert into organization_audit_events(organization_id,workspace_id,actor_id,event_type,subject_id)values(v_org,p_workspace_id,auth.uid(),'email.retry_requested',p_message_id);end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260824000000_sprint60_enterprise_email.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='save_email_template') then execute $vayon_sql$create or replace function public.save_email_template(p_workspace_id uuid,p_input jsonb)returns uuid language plpgsql security definer set search_path=public as $$declare v_org uuid;v_id uuid;begin if not can_manage_email_platform(p_workspace_id)then raise exception'insufficient email permission';end if;select organization_id into v_org from workspaces where id=p_workspace_id;insert into email_templates(organization_id,workspace_id,template_key,name,locale,subject_template,html_template,text_template,is_active,created_by,updated_by)values(v_org,p_workspace_id,p_input->>'key',p_input->>'name',p_input->>'locale',p_input->>'subject',p_input->>'html',p_input->>'text',coalesce((p_input->>'active')::boolean,true),auth.uid(),auth.uid())on conflict(workspace_id,template_key,locale)do update set name=excluded.name,subject_template=excluded.subject_template,html_template=excluded.html_template,text_template=excluded.text_template,is_active=excluded.is_active,updated_by=auth.uid(),updated_at=now(),version=email_templates.version+1 returning id into v_id;insert into organization_audit_events(organization_id,workspace_id,actor_id,event_type,subject_id,metadata)values(v_org,p_workspace_id,auth.uid(),'email.template_saved',v_id,jsonb_build_object('key',p_input->>'key','locale',p_input->>'locale'));return v_id;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260824000000_sprint60_enterprise_email.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='email_delivery_statistics') then execute $vayon_sql$create or replace function public.email_delivery_statistics(p_workspace_id uuid)returns table(queued bigint,delivered bigint,failed bigint,bounced bigint,retries bigint,average_latency_ms numeric)language sql stable security definer set search_path=public as $$select count(*)filter(where status in('queued','processing')),count(*)filter(where status='delivered'),count(*)filter(where status='failed'),count(*)filter(where status='bounced'),coalesce(sum(greatest(attempts-1,0)),0),round(avg(latency_ms)filter(where status='delivered'))from email_messages where workspace_id=p_workspace_id and public.is_organization_member(organization_id)$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260825000000_sprint61_enterprise_workflow_automation.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='can_manage_workflow_automation') then execute $vayon_sql$create or replace function public.can_manage_workflow_automation(p_workspace_id uuid) returns boolean language sql stable security definer set search_path=public as $$
 select public.current_workspace_role(p_workspace_id) in ('organization_owner','organization_admin','manager','operations');
$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260825000000_sprint61_enterprise_workflow_automation.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='save_workflow_definition') then execute $vayon_sql$create or replace function public.save_workflow_definition(p_workspace_id uuid,p_input jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare v_org uuid; v_id uuid:=coalesce(nullif(p_input->>'id','')::uuid,gen_random_uuid()); v_version integer:=greatest(coalesce((p_input->>'version')::integer,1),1);
begin
 select organization_id into v_org from workspace_members where workspace_id=p_workspace_id and user_id=auth.uid() and status='active';
 if v_org is null or not public.can_manage_workflow_automation(p_workspace_id) then raise exception 'insufficient workflow permission'; end if;
 if jsonb_array_length(coalesce(p_input->'nodes','[]'))=0 or length(coalesce(p_input->>'name',''))<2 then raise exception 'invalid workflow definition'; end if;
 insert into workflow_definitions(id,organization_id,workspace_id,name,description,version,status,definition,created_by,updated_by)
 values(v_id,v_org,p_workspace_id,trim(p_input->>'name'),coalesce(p_input->>'description',''),v_version,'draft',p_input,auth.uid(),auth.uid())
 on conflict(id) do update set name=excluded.name,description=excluded.description,definition=excluded.definition,version=workflow_definitions.version+1,status='draft',updated_by=auth.uid(),updated_at=now()
 where workflow_definitions.organization_id=v_org and workflow_definitions.workspace_id=p_workspace_id and workflow_definitions.deleted_at is null;
 if not found then raise exception 'workflow not found in workspace'; end if;
 insert into organization_audit_events(organization_id,workspace_id,actor_id,event_type,subject_id,metadata) values(v_org,p_workspace_id,auth.uid(),'workflow.saved',v_id,jsonb_build_object('version',v_version));
 return v_id;
end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260825000000_sprint61_enterprise_workflow_automation.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='publish_workflow_definition') then execute $vayon_sql$create or replace function public.publish_workflow_definition(p_workspace_id uuid,p_workflow_id uuid,p_expected_version integer) returns void language plpgsql security definer set search_path=public as $$
declare v_org uuid;
begin
 select organization_id into v_org from workspace_members where workspace_id=p_workspace_id and user_id=auth.uid() and status='active';
 if v_org is null or not public.can_manage_workflow_automation(p_workspace_id) then raise exception 'insufficient workflow permission'; end if;
 update workflow_definitions set status='published',published_at=now(),updated_by=auth.uid(),updated_at=now() where id=p_workflow_id and organization_id=v_org and workspace_id=p_workspace_id and version=p_expected_version and deleted_at is null;
 if not found then raise exception 'workflow changed or unavailable'; end if;
 insert into organization_audit_events(organization_id,workspace_id,actor_id,event_type,subject_id) values(v_org,p_workspace_id,auth.uid(),'workflow.published',p_workflow_id);
end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260825000000_sprint61_enterprise_workflow_automation.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='enqueue_workflow_trigger') then execute $vayon_sql$create or replace function public.enqueue_workflow_trigger(p_workspace_id uuid,p_trigger_kind text,p_source_type text,p_source_id text,p_idempotency_key text,p_payload jsonb default '{}'::jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare v_org uuid;v_id uuid;
begin select organization_id into v_org from workspaces where id=p_workspace_id;if v_org is null then raise exception 'workspace unavailable';end if;
 insert into workflow_trigger_events(organization_id,workspace_id,trigger_kind,source_type,source_id,idempotency_key,payload) values(v_org,p_workspace_id,p_trigger_kind,p_source_type,p_source_id,p_idempotency_key,coalesce(p_payload,'{}')) on conflict(workspace_id,idempotency_key) do update set idempotency_key=excluded.idempotency_key returning id into v_id;return v_id;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260826000000_sprint62_enterprise_customer_onboarding.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='get_enterprise_onboarding_session') then execute $vayon_sql$create or replace function public.get_enterprise_onboarding_session() returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb;begin if auth.uid() is null then raise exception 'authentication required';end if;
 insert into onboarding_sessions(user_id) values(auth.uid()) on conflict(user_id) do nothing;
 select to_jsonb(s) into result from onboarding_sessions s where user_id=auth.uid();return result;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260826000000_sprint62_enterprise_customer_onboarding.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='save_enterprise_onboarding_progress') then execute $vayon_sql$create or replace function public.save_enterprise_onboarding_progress(p_step integer,p_configuration jsonb,p_completed_steps integer[],p_demo_mode boolean) returns void language plpgsql security definer set search_path=public as $$
declare previous_step integer; started timestamptz;begin if auth.uid() is null or p_step not between 1 and 15 then raise exception 'invalid onboarding progress';end if;
 select current_step,updated_at into previous_step,started from onboarding_sessions where user_id=auth.uid() for update;
 insert into onboarding_sessions(user_id,current_step,completed_steps,configuration,demo_mode) values(auth.uid(),p_step,coalesce(p_completed_steps,'{}'),coalesce(p_configuration,'{}'),p_demo_mode)
 on conflict(user_id) do update set current_step=excluded.current_step,completed_steps=excluded.completed_steps,configuration=excluded.configuration,demo_mode=excluded.demo_mode,updated_at=now();
 insert into onboarding_step_events(user_id,step,event_type,duration_ms,metadata) values(auth.uid(),coalesce(previous_step,p_step),'completed',greatest(0,(extract(epoch from(now()-coalesce(started,now())))*1000)::integer),jsonb_build_object('next_step',p_step));end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260826000000_sprint62_enterprise_customer_onboarding.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='complete_enterprise_onboarding') then execute $vayon_sql$create or replace function public.complete_enterprise_onboarding() returns void language plpgsql security definer set search_path=public as $$
declare s onboarding_sessions%rowtype;v_org uuid;v_workspace uuid;begin select*into s from onboarding_sessions where user_id=auth.uid() for update;if not found then raise exception 'onboarding session unavailable';end if;
 select wm.organization_id,wm.workspace_id into v_org,v_workspace from workspace_members wm where wm.user_id=auth.uid() and wm.status='active' order by wm.created_at limit 1;
 if v_org is null then raise exception 'organization must be created before launch';end if;
 update onboarding_sessions set organization_id=v_org,workspace_id=v_workspace,current_step=15,completed_steps=array[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],completed_at=now(),updated_at=now() where id=s.id;
 if s.demo_mode then insert into onboarding_demo_seed_requests(organization_id,workspace_id,requested_by) values(v_org,v_workspace,auth.uid()) on conflict do nothing;end if;
 insert into organization_audit_events(organization_id,workspace_id,actor_id,event_type,subject_id,metadata) values(v_org,v_workspace,auth.uid(),'onboarding.completed',s.id,jsonb_build_object('demo_mode',s.demo_mode));
 insert into onboarding_step_events(user_id,organization_id,workspace_id,step,event_type,duration_ms) values(auth.uid(),v_org,v_workspace,15,'completed',(extract(epoch from(now()-s.started_at))*1000)::integer);end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260827000000_sprint63_enterprise_knowledge_platform.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='can_manage_knowledge') then execute $vayon_sql$create or replace function public.can_manage_knowledge(p_workspace_id uuid)returns boolean language sql stable security definer set search_path=public as $$select public.current_workspace_role(p_workspace_id)in('organization_owner','organization_admin','manager')$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260827000000_sprint63_enterprise_knowledge_platform.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='register_knowledge_document') then execute $vayon_sql$create or replace function public.register_knowledge_document(p_workspace_id uuid,p_file_name text,p_storage_path text,p_mime_type text,p_category text,p_tags text[])returns uuid language plpgsql security definer set search_path=public as $$declare v_org uuid;v_id uuid;begin select organization_id into v_org from workspace_members where workspace_id=p_workspace_id and user_id=auth.uid()and status='active';if v_org is null or not can_manage_knowledge(p_workspace_id)then raise exception'insufficient knowledge permission';end if;if p_mime_type not in('application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/markdown','text/plain')then raise exception'unsupported document type';end if;insert into knowledge_documents(organization_id,workspace_id,file_name,storage_path,mime_type,category,tags,author_id,author_name)values(v_org,p_workspace_id,p_file_name,p_storage_path,p_mime_type,p_category,coalesce(p_tags,'{}'),auth.uid(),coalesce(auth.jwt()->>'email','Workspace author'))returning id into v_id;insert into knowledge_analytics(organization_id,workspace_id,user_id,event_type,success,metadata)values(v_org,p_workspace_id,auth.uid(),'upload',true,jsonb_build_object('document_id',v_id,'mime_type',p_mime_type));insert into organization_audit_events(organization_id,workspace_id,actor_id,event_type,subject_id)values(v_org,p_workspace_id,auth.uid(),'knowledge.document_uploaded',v_id);return v_id;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260827000000_sprint63_enterprise_knowledge_platform.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='search_enterprise_knowledge') then execute $vayon_sql$create or replace function public.search_enterprise_knowledge(p_workspace_id uuid,p_query text,p_category text default null,p_tags text[]default'{}',p_limit integer default 30)returns table(id uuid,title text,summary text,category text,tags text[],score real,source text,citation text)language plpgsql security definer set search_path=public as $$declare v_org uuid;v_started timestamptz:=clock_timestamp();v_count integer;begin select organization_id into v_org from workspace_members where workspace_id=p_workspace_id and user_id=auth.uid()and status='active';if v_org is null then raise exception'workspace access required';end if;return query select a.id,a.title,a.summary,a.category,a.tags,ts_rank(to_tsvector('english',a.title||' '||a.summary||' '||a.content),websearch_to_tsquery('english',p_query))::real,'article',a.slug||'@v'||a.version from knowledge_articles a where a.organization_id=v_org and a.workspace_id=p_workspace_id and a.status='published'and a.deleted_at is null and(p_category is null or a.category=p_category)and(cardinality(p_tags)=0 or a.tags@>p_tags)and to_tsvector('english',a.title||' '||a.summary||' '||a.content)@@websearch_to_tsquery('english',p_query)order by 6 desc limit least(greatest(p_limit,1),100);get diagnostics v_count=row_count;insert into knowledge_analytics(organization_id,workspace_id,user_id,event_type,query,latency_ms,success)values(v_org,p_workspace_id,auth.uid(),case when v_count=0 then'search_failed'else'search'end,p_query,(extract(epoch from(clock_timestamp()-v_started))*1000)::integer,v_count>0);end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260827000000_sprint63_enterprise_knowledge_platform.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='record_knowledge_feedback') then execute $vayon_sql$create or replace function public.record_knowledge_feedback(p_workspace_id uuid,p_article_id uuid,p_helpful boolean)returns void language plpgsql security definer set search_path=public as $$declare a knowledge_articles%rowtype;begin select*into a from knowledge_articles where id=p_article_id and workspace_id=p_workspace_id and public.current_workspace_role(workspace_id)is not null;if not found then raise exception'article unavailable';end if;update knowledge_articles set helpful_count=helpful_count+case when p_helpful then 1 else 0 end,not_helpful_count=not_helpful_count+case when p_helpful then 0 else 1 end where id=a.id;insert into knowledge_analytics(organization_id,workspace_id,user_id,event_type,article_id,success)values(a.organization_id,a.workspace_id,auth.uid(),case when p_helpful then'feedback_helpful'else'feedback_not_helpful'end,a.id,true);end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260827000000_sprint63_enterprise_knowledge_platform.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='enterprise_knowledge_dashboard') then execute $vayon_sql$create or replace function public.enterprise_knowledge_dashboard(p_workspace_id uuid)returns jsonb language sql stable security definer set search_path=public as $$select jsonb_build_object('published_articles',count(*)filter(where status='published'),'drafts',count(*)filter(where status='draft'),'popular_articles',count(*)filter(where view_count>=10),'failed_searches',(select count(*)from knowledge_analytics where workspace_id=p_workspace_id and event_type='search_failed'),'ai_help_requests',(select count(*)from knowledge_analytics where workspace_id=p_workspace_id and event_type='ai_help'),'missing_content',(select count(*)from knowledge_analytics where workspace_id=p_workspace_id and event_type='search_failed'),'document_uploads',(select count(*)from knowledge_documents where workspace_id=p_workspace_id and deleted_at is null),'review_reminders',count(*)filter(where last_reviewed_at is null or last_reviewed_at<now()-interval'180 days'))from knowledge_articles where workspace_id=p_workspace_id and deleted_at is null and public.current_workspace_role(p_workspace_id)is not null$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260829000000_sprint65_enterprise_performance_optimization.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='enterprise_performance_snapshot') then execute $vayon_sql$create or replace function public.enterprise_performance_snapshot(p_workspace_id uuid)returns table(api_latency_ms numeric,database_latency_ms numeric,workflow_latency_ms numeric,ai_latency_ms numeric,notification_latency_ms numeric,slow_queries bigint,slow_endpoints bigint)language plpgsql stable security definer set search_path=public as $$declare v_started timestamptz:=clock_timestamp();begin if public.current_workspace_role(p_workspace_id)is null then raise exception'workspace access required';end if;return query select(select round(avg(latency_ms))from integration_logs where workspace_id=p_workspace_id and occurred_at>now()-interval'24 hours'),(extract(epoch from(clock_timestamp()-v_started))*1000)::numeric,(select round(avg(duration_ms))from workflow_instances where workspace_id=p_workspace_id and created_at>now()-interval'24 hours'),(select round(avg(latency_ms))from ai_runtime_outputs where workspace_id=p_workspace_id and created_at>now()-interval'24 hours'),(select round(avg(extract(epoch from(coalesce(delivered_at,updated_at)-created_at))*1000))from notification_queue where workspace_id=p_workspace_id and status='sent'and created_at>now()-interval'24 hours'),(select count(*)from integration_logs where workspace_id=p_workspace_id and duration_ms>1000 and occurred_at>now()-interval'24 hours'),(select count(*)from integration_logs where workspace_id=p_workspace_id and duration_ms>500 and occurred_at>now()-interval'24 hours');end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260830000000_sprint66_enterprise_security_hardening.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='enterprise_security_rls_audit') then execute $vayon_sql$create or replace function public.enterprise_security_rls_audit(p_workspace_id uuid)returns table(tables integer,enabled integer,fully_covered integer,missing_rls text[],missing_policies text[])language plpgsql stable security definer set search_path=public,pg_catalog as $$begin if public.current_workspace_role(p_workspace_id)not in('organization_owner','organization_admin')and(auth.jwt()->'app_metadata'->>'role')<>'super_admin'then raise exception'administrator access required';end if;return query with t as(select tablename,rowsecurity from pg_tables where schemaname='public'),p as(select tablename,array_agg(distinct cmd)commands from pg_policies where schemaname='public'group by tablename),a as(select t.tablename,t.rowsecurity,coalesce(p.commands,'{}')commands from t left join p using(tablename))select count(*)::integer,count(*)filter(where rowsecurity)::integer,count(*)filter(where rowsecurity and('ALL'=any(commands)or('SELECT'=any(commands)and'INSERT'=any(commands)and'UPDATE'=any(commands)and'DELETE'=any(commands))))::integer,coalesce(array_agg(tablename order by tablename)filter(where not rowsecurity),'{}'),coalesce(array_agg(tablename order by tablename)filter(where rowsecurity and not('ALL'=any(commands)or('SELECT'=any(commands)and'INSERT'=any(commands)and'UPDATE'=any(commands)and'DELETE'=any(commands)))),'{}')from a;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260901000000_sprint68_documentation_platform.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='record_documentation_event') then execute $vayon_sql$create or replace function public.record_documentation_event(p_event jsonb) returns void language plpgsql security definer set search_path=public as $$
declare v_type text:=p_event->>'type'; begin
  if v_type is null or v_type not in ('view','search','failed_search','feedback','bookmark') then raise exception 'Invalid documentation event'; end if;
  insert into public.documentation_events(event_type,article_slug,search_query,helpful,session_hash) values(v_type,left(nullif(p_event->>'articleSlug',''),120),left(nullif(p_event->>'query',''),120),case when p_event ? 'helpful' then (p_event->>'helpful')::boolean end,case when nullif(p_event->>'sessionId','') is null then null else encode(digest(p_event->>'sessionId','sha256'),'hex') end);
end $$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260902120000_sprint69_2_enterprise_conversion_analytics.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='record_workspace_analytics_event') then execute $vayon_sql$create or replace function public.record_workspace_analytics_event(p_workspace_id uuid,p_event jsonb)returns void language plpgsql security definer set search_path=public as $$declare v_org uuid;v_name text:=p_event->>'name';begin select organization_id into v_org from workspaces where id=p_workspace_id and public.current_workspace_role(id)is not null;if v_org is null then raise exception'workspace access required';end if;if v_name not in('organization_created','workspace_completed','onboarding_completed','first_ai_interaction','subscription_initiated','ai_workforce_used','crm_used','knowledge_used','workflow_used','notifications_used','email_used','executive_dashboard_used','marketing_ai_used','sales_ai_used','whatsapp_ai_used')or coalesce(p_event->>'path','')not like'/vayon/%'then raise exception'invalid analytics event';end if;insert into workspace_analytics_events(organization_id,workspace_id,event_name,path,duration_ms,metadata)values(v_org,p_workspace_id,v_name,p_event->>'path',least(86400000,greatest(0,coalesce((p_event->>'durationMs')::integer,0))),coalesce(p_event->'metadata','{}')-'email'-'name'-'phone'-'token'-'authorization');end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260902180000_sprint69_5_launch_readiness_audit.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='record_launch_readiness_audit') then execute $vayon_sql$create or replace function public.record_launch_readiness_audit(p_workspace_id uuid,p_summary jsonb)returns void language plpgsql security definer set search_path=public as $$declare v_org uuid;v_role text;v_score integer;v_state text;begin select organization_id,public.current_workspace_role(id)into v_org,v_role from workspaces where id=p_workspace_id;if v_org is null or v_role not in('organization_owner','organization_admin')then raise exception'administrator access required';end if;v_score:=(p_summary->>'score')::integer;v_state:=p_summary->>'state';if v_score not between 0 and 100 or v_state not in('ready','needs_attention','blocked')then raise exception'invalid readiness summary';end if;insert into launch_readiness_audit_runs(organization_id,workspace_id,actor_id,score,state,summary)values(v_org,p_workspace_id,auth.uid(),v_score,v_state,jsonb_build_object('checks',coalesce(p_summary->'checks','[]'::jsonb),'debt',coalesce(p_summary->'debt','[]'::jsonb)));end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260906000000_sprint76_enterprise_organization_management.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='manage_organization_department') then execute $vayon_sql$create or replace function public.manage_organization_department(p_workspace_id uuid,p_intent text,p_department_id uuid,p_input jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare v_org uuid:=public.enterprise_org_context(p_workspace_id);v_id uuid:=p_department_id;v_manager uuid:=nullif(p_input->>'managerMemberId','')::uuid;
begin
  if v_manager is not null and not exists(select 1 from workspace_members where id=v_manager and organization_id=v_org and workspace_id=p_workspace_id and status='active') then raise exception'invalid department manager';end if;
  if p_intent='create' then insert into organization_departments(organization_id,workspace_id,name,manager_member_id,kpis,permissions) values(v_org,p_workspace_id,trim(p_input->>'name'),v_manager,coalesce(p_input->'kpis','[]'),coalesce(array(select jsonb_array_elements_text(coalesce(p_input->'permissions','[]'))),'{}')) returning id into v_id;
  elsif p_intent='update' then update organization_departments set name=trim(p_input->>'name'),manager_member_id=v_manager,kpis=coalesce(p_input->'kpis',kpis),permissions=coalesce(array(select jsonb_array_elements_text(coalesce(p_input->'permissions','[]'))),permissions),updated_at=now(),version=version+1 where id=v_id and organization_id=v_org and workspace_id=p_workspace_id and status='active';
  elsif p_intent='archive' then update organization_departments set status='archived',updated_at=now(),version=version+1 where id=v_id and organization_id=v_org and workspace_id=p_workspace_id;
  else raise exception'invalid department intent';end if;
  if not found then raise exception'department not found';end if;
  insert into organization_audit_events(organization_id,workspace_id,actor_id,event_type,subject_id,metadata) values(v_org,p_workspace_id,auth.uid(),'organization.updated',v_id,jsonb_build_object('resource','department','intent',p_intent));return v_id;
end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260906000000_sprint76_enterprise_organization_management.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='manage_organization_team') then execute $vayon_sql$create or replace function public.manage_organization_team(p_workspace_id uuid,p_intent text,p_team_id uuid,p_input jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare v_org uuid:=public.enterprise_org_context(p_workspace_id);v_id uuid:=p_team_id;v_department uuid:=nullif(p_input->>'departmentId','')::uuid;v_manager uuid:=nullif(p_input->>'managerMemberId','')::uuid;v_member text;
begin
  if p_intent in('create','update') and not exists(select 1 from organization_departments where id=v_department and organization_id=v_org and workspace_id=p_workspace_id and status='active') then raise exception'invalid department';end if;
  if v_manager is not null and not exists(select 1 from workspace_members where id=v_manager and organization_id=v_org and workspace_id=p_workspace_id and status='active') then raise exception'invalid team manager';end if;
  if p_intent='create' then insert into organization_teams(organization_id,workspace_id,department_id,name,manager_member_id,capacity) values(v_org,p_workspace_id,v_department,trim(p_input->>'name'),v_manager,greatest(1,coalesce((p_input->>'capacity')::integer,10))) returning id into v_id;
  elsif p_intent='update' then update organization_teams set department_id=v_department,name=trim(p_input->>'name'),manager_member_id=v_manager,capacity=greatest(1,coalesce((p_input->>'capacity')::integer,capacity)),updated_at=now(),version=version+1 where id=v_id and organization_id=v_org and workspace_id=p_workspace_id and status='active';
  elsif p_intent='archive' then update organization_teams set status='archived',updated_at=now(),version=version+1 where id=v_id and organization_id=v_org and workspace_id=p_workspace_id;
  else raise exception'invalid team intent';end if;
  if not found then raise exception'team not found';end if;
  if p_intent in('create','update') then delete from organization_team_members where team_id=v_id and organization_id=v_org and workspace_id=p_workspace_id;for v_member in select jsonb_array_elements_text(coalesce(p_input->'memberIds','[]')) loop insert into organization_team_members(organization_id,workspace_id,team_id,member_id) select v_org,p_workspace_id,v_id,wm.id from workspace_members wm where wm.id=v_member::uuid and wm.organization_id=v_org and wm.workspace_id=p_workspace_id and wm.status='active' on conflict do nothing;end loop;end if;
  insert into organization_audit_events(organization_id,workspace_id,actor_id,event_type,subject_id,metadata) values(v_org,p_workspace_id,auth.uid(),'organization.updated',v_id,jsonb_build_object('resource','team','intent',p_intent));return v_id;
end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260906000000_sprint76_enterprise_organization_management.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='update_enterprise_organization') then execute $vayon_sql$create or replace function public.update_enterprise_organization(p_workspace_id uuid,p_input jsonb)returns void language plpgsql security definer set search_path=public as $$declare v_org uuid:=enterprise_org_context(p_workspace_id);begin update organizations set name=trim(p_input->>'name'),business_email=lower(p_input->>'businessEmail'),phone=nullif(trim(p_input->>'phone'),''),website=nullif(trim(p_input->>'website'),''),timezone=p_input->>'timezone',locale=p_input->>'locale',currency=upper(p_input->>'currency'),address=coalesce(p_input->'address','{}'),branding=coalesce(p_input->'branding','{}'),business_hours=coalesce(p_input->'businessHours',business_hours),regional_settings=coalesce(p_input->'regionalSettings',regional_settings),updated_at=now(),version=version+1 where id=v_org;insert into organization_audit_events(organization_id,workspace_id,actor_id,event_type,metadata)values(v_org,p_workspace_id,auth.uid(),'organization.updated',jsonb_build_object('profile_version','updated'));end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='inventory_workspace_member') then execute $vayon_sql$create or replace function public.inventory_workspace_member(p_organization_id uuid,p_workspace_id uuid) returns boolean language sql stable security definer set search_path=public as $$select public.is_organization_member(p_organization_id) and exists(select 1 from public.workspace_members wm where wm.workspace_id=p_workspace_id and wm.organization_id=p_organization_id and wm.user_id=auth.uid() and wm.status='active')$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='inventory_can_write') then execute $vayon_sql$create or replace function public.inventory_can_write(p_organization_id uuid,p_workspace_id uuid) returns boolean language sql stable security definer set search_path=public as $$select public.inventory_workspace_member(p_organization_id,p_workspace_id) and exists(select 1 from public.organization_members om left join public.roles r on r.id=om.role_id where om.organization_id=p_organization_id and om.user_id=auth.uid() and om.status='active' and r.code in('organization_owner','organization_admin','administrator','sales_manager','sales_agent','project_manager'))$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='transition_property_unit') then execute $vayon_sql$create or replace function public.transition_property_unit(p_workspace_id uuid,p_unit_id uuid,p_expected_status text,p_next_status text,p_buyer_id uuid default null,p_create_opportunity boolean default false) returns void language plpgsql security definer set search_path=public as $$
declare v_org uuid:=public.enterprise_org_context(p_workspace_id);v_project uuid;v_current text;
begin
  if not public.inventory_can_write(v_org,p_workspace_id) then raise exception'not authorized';end if;
  if p_next_status not in('available','reserved','booked') then raise exception'invalid transition';end if;
  if p_next_status='booked' and p_buyer_id is null then raise exception'buyer required';end if;
  select project_id,status into v_project,v_current from property_units where id=p_unit_id and organization_id=v_org and workspace_id=p_workspace_id for update;
  if v_current is null or v_current<>p_expected_status then raise exception'inventory changed; refresh and retry';end if;
  if not ((v_current='available' and p_next_status='reserved') or (v_current='reserved' and p_next_status in('available','booked'))) then raise exception'invalid inventory lifecycle transition';end if;
  update property_units set status=p_next_status,buyer_id=case when p_next_status='available' then null else p_buyer_id end,updated_at=now() where id=p_unit_id;
  insert into property_inventory_audit(organization_id,workspace_id,project_id,unit_id,action,actor_label,metadata) values(v_org,p_workspace_id,v_project,p_unit_id,'inventory.'||p_next_status,'Authorized user',jsonb_build_object('previous_status',v_current,'buyer_id',p_buyer_id));
  if p_create_opportunity and p_buyer_id is not null then insert into property_inventory_opportunity_requests(organization_id,workspace_id,project_id,unit_id,buyer_id)values(v_org,p_workspace_id,v_project,p_unit_id,p_buyer_id);end if;
end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='site_visit_member') then execute $vayon_sql$create or replace function public.site_visit_member(p_organization_id uuid,p_workspace_id uuid)returns boolean language sql stable security definer set search_path=public as $$select public.is_organization_member(p_organization_id)and exists(select 1 from workspace_members wm where wm.organization_id=p_organization_id and wm.workspace_id=p_workspace_id and wm.user_id=auth.uid()and wm.status='active')$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='site_visit_can_manage') then execute $vayon_sql$create or replace function public.site_visit_can_manage(p_organization_id uuid,p_workspace_id uuid)returns boolean language sql stable security definer set search_path=public as $$select public.site_visit_member(p_organization_id,p_workspace_id)and exists(select 1 from organization_members om left join roles r on r.id=om.role_id where om.organization_id=p_organization_id and om.user_id=auth.uid()and om.status='active'and r.code in('organization_owner','organization_admin','administrator','sales_manager','sales_agent','project_manager'))$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='site_visit_agent_availability') then execute $vayon_sql$create or replace function public.site_visit_agent_availability(p_workspace_id uuid)returns table(agent_id uuid,agent_name text,available boolean,visits_today bigint,workload integer,languages text[],region text,manager text)language sql stable security definer set search_path=public as $$select wm.user_id,coalesce(nullif(u.raw_user_meta_data->>'full_name',''),u.email,'Agent'),not exists(select 1 from site_visits sv where sv.workspace_id=p_workspace_id and sv.assigned_agent_id=wm.user_id and sv.status in('scheduled','confirmed','checked_in')and tstzrange(sv.starts_at,coalesce(sv.ends_at,sv.starts_at+interval'60 minutes'))&&tstzrange(now(),now()+interval'60 minutes')),count(sv.id)filter(where sv.starts_at::date=current_date),least(100,(count(sv.id)filter(where sv.starts_at>=date_trunc('week',now()))*10)::integer),array['English']::text[],'Assigned region','Assigned manager'from workspace_members wm join auth.users u on u.id=wm.user_id left join site_visits sv on sv.workspace_id=wm.workspace_id and sv.assigned_agent_id=wm.user_id where wm.workspace_id=p_workspace_id and wm.user_id=auth.uid()and wm.status='active'group by wm.user_id,u.raw_user_meta_data,u.email$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='manage_site_visit_lifecycle') then execute $vayon_sql$create or replace function public.manage_site_visit_lifecycle(p_workspace_id uuid,p_visit_id uuid,p_expected_version integer,p_action text,p_payload jsonb default'{}')returns void language plpgsql security definer set search_path=public as $$declare v_org uuid;v site_visits%rowtype;v_next text;begin select organization_id into v_org from workspace_members where workspace_id=p_workspace_id and user_id=auth.uid()and status='active';if v_org is null or not site_visit_can_manage(v_org,p_workspace_id)then raise exception'not authorized';end if;select*into v from site_visits where id=p_visit_id and organization_id=v_org and workspace_id=p_workspace_id and deleted_at is null for update;if v.id is null or v.version<>p_expected_version then raise exception'visit changed; refresh and retry';end if;
if p_action='confirm'then v_next:='confirmed';elsif p_action='check-in'then v_next:='checked_in';elsif p_action='complete'then v_next:='completed';elsif p_action='cancel'then v_next:='cancelled';elsif p_action='no-show'then v_next:='no_show';elsif p_action='reschedule'then v_next:='rescheduled';else v_next:=v.status;end if;
if p_action='check-in'then update site_visits set status=v_next,arrival_at=coalesce(nullif(p_payload->>'arrivalAt','')::timestamptz,now()),updated_at=now(),updated_by=auth.uid(),version=version+1 where id=v.id;elsif p_action in('confirm','complete','cancel','no-show','reschedule')then update site_visits set status=v_next,departure_at=case when p_action='complete'then coalesce(nullif(p_payload->>'departureAt','')::timestamptz,now())else departure_at end,updated_at=now(),updated_by=auth.uid(),version=version+1 where id=v.id;elsif p_action='feedback'then insert into site_visit_feedback(organization_id,workspace_id,visit_id,rating,agent_notes)values(v_org,p_workspace_id,v.id,greatest(1,least(5,(p_payload->>'rating')::integer)),nullif(p_payload->>'notes',''));elsif p_action='follow-up'then insert into site_visit_follow_up_requests(organization_id,workspace_id,visit_id,kind)values(v_org,p_workspace_id,v.id,'task'),(v_org,p_workspace_id,v.id,'reminder'),(v_org,p_workspace_id,v.id,'summary'),(v_org,p_workspace_id,v.id,'next-property');elsif p_action in('reserve-unit','release-unit')then if v.unit_id is null then raise exception'no unit linked';end if;perform transition_property_unit(p_workspace_id,v.unit_id,(select status from property_units where id=v.unit_id),case when p_action='reserve-unit'then'reserved'else'available'end,null,false);else raise exception'unsupported action';end if;
insert into site_visit_audit(organization_id,workspace_id,visit_id,action,metadata)values(v_org,p_workspace_id,v.id,'visit.'||p_action,p_payload);insert into activity_events(organization_id,workspace_id,event_type,title,actor_id,related_type,related_id)values(v_org,p_workspace_id,'site_visit.'||p_action,'Site visit '||replace(p_action,'-',' '),auth.uid(),'site_visit',v.id);if p_action='complete'then insert into site_visit_follow_up_requests(organization_id,workspace_id,visit_id,kind)values(v_org,p_workspace_id,v.id,'task'),(v_org,p_workspace_id,v.id,'reminder'),(v_org,p_workspace_id,v.id,'summary');end if;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260909000000_sprint80_ai_property_matching.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='property_match_member') then execute $vayon_sql$create or replace function public.property_match_member(p_organization_id uuid,p_workspace_id uuid)returns boolean language sql stable security definer set search_path=public as $$select public.is_organization_member(p_organization_id)and exists(select 1 from workspace_members wm where wm.organization_id=p_organization_id and wm.workspace_id=p_workspace_id and wm.user_id=auth.uid()and wm.status='active')$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260909000000_sprint80_ai_property_matching.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='property_match_can_manage') then execute $vayon_sql$create or replace function public.property_match_can_manage(p_organization_id uuid,p_workspace_id uuid)returns boolean language sql stable security definer set search_path=public as $$select property_match_member(p_organization_id,p_workspace_id)and exists(select 1 from organization_members om left join roles r on r.id=om.role_id where om.organization_id=p_organization_id and om.user_id=auth.uid()and om.status='active'and r.code in('organization_owner','organization_admin','administrator','sales_manager','sales_agent','project_manager','marketing'))$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260909000000_sprint80_ai_property_matching.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='save_property_shortlist') then execute $vayon_sql$create or replace function public.save_property_shortlist(p_workspace_id uuid,p_input jsonb)returns uuid language plpgsql security definer set search_path=public as $$declare v_org uuid;v_profile buyer_property_profiles%rowtype;v_id uuid;begin select organization_id into v_org from workspace_members where workspace_id=p_workspace_id and user_id=auth.uid()and status='active';if v_org is null or not property_match_can_manage(v_org,p_workspace_id)then raise exception'not authorized';end if;select*into v_profile from buyer_property_profiles where id=(p_input->>'profileId')::uuid and organization_id=v_org and workspace_id=p_workspace_id;if v_profile.id is null then raise exception'invalid buyer profile';end if;insert into property_shortlists(organization_id,workspace_id,profile_id,name,unit_ids,favorite_unit_ids)values(v_org,p_workspace_id,v_profile.id,left(trim(p_input->>'name'),120),coalesce(array(select jsonb_array_elements_text(coalesce(p_input->'unitIds','[]'))::uuid),'{}'),coalesce(array(select jsonb_array_elements_text(coalesce(p_input->'favoriteUnitIds','[]'))::uuid),'{}'))returning id into v_id;insert into property_match_audit(organization_id,workspace_id,profile_id,action,metadata)values(v_org,p_workspace_id,v_profile.id,'shortlist.created',jsonb_build_object('shortlist_id',v_id));return v_id;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260910000000_sprint81_enterprise_communications_hub.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='communication_tenant_member') then execute $vayon_sql$create or replace function public.communication_tenant_member(p_organization_id uuid,p_workspace_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select auth.uid() is not null
    and public.is_organization_member(p_organization_id)
    and public.current_workspace_role(p_workspace_id) is not null
    and exists(select 1 from public.workspaces w where w.id=p_workspace_id and w.organization_id=p_organization_id)
$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260910000000_sprint81_enterprise_communications_hub.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='communication_can_manage') then execute $vayon_sql$create or replace function public.communication_can_manage(p_workspace_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select public.current_workspace_role(p_workspace_id) in ('organization_owner','organization_admin','branch_manager','sales_manager','agent')
$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260910000000_sprint81_enterprise_communications_hub.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='add_enterprise_communication_note') then execute $vayon_sql$create or replace function public.add_enterprise_communication_note(p_thread_id uuid,p_body text,p_pinned boolean default false,p_mentions uuid[] default '{}')
returns uuid language plpgsql security definer set search_path=public as $$
declare t public.communication_threads%rowtype; n uuid;
begin
  select * into t from public.communication_threads where id=p_thread_id and deleted_at is null;
  if not found or not public.communication_tenant_member(t.organization_id,t.workspace_id) or not public.communication_can_manage(t.workspace_id) then raise exception 'insufficient communication permission'; end if;
  if char_length(trim(p_body)) not between 1 and 12000 then raise exception 'invalid note length'; end if;
  insert into public.communication_notes(organization_id,workspace_id,thread_id,body,pinned,mentions,created_by,updated_by) values(t.organization_id,t.workspace_id,t.id,trim(p_body),p_pinned,p_mentions,auth.uid(),auth.uid()) returning id into n;
  insert into public.communications(organization_id,workspace_id,thread_id,channel,direction,status,body,user_id) values(t.organization_id,t.workspace_id,t.id,'internal_note','internal','logged',trim(p_body),auth.uid());
  insert into public.communication_audit(organization_id,workspace_id,thread_id,event_type,actor_id,metadata) values(t.organization_id,t.workspace_id,t.id,'internal_note.created',auth.uid(),jsonb_build_object('note_id',n,'pinned',p_pinned,'mention_count',cardinality(p_mentions)));
  return n;
end $$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='creative_studio_member') then execute $vayon_sql$create or replace function public.creative_studio_member(p_org uuid,p_workspace uuid)returns boolean language sql stable security definer set search_path=public as $$select auth.uid() is not null and public.is_organization_member(p_org) and public.current_workspace_role(p_workspace) is not null and exists(select 1 from public.workspaces where id=p_workspace and organization_id=p_org)$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='creative_studio_manage') then execute $vayon_sql$create or replace function public.creative_studio_manage(p_workspace uuid)returns boolean language sql stable security definer set search_path=public as $$select public.current_workspace_role(p_workspace) in('organization_owner','organization_admin','administrator','marketing','sales_manager','project_manager')$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='creative_studio_access') then execute $vayon_sql$create or replace function public.creative_studio_access()returns text language sql stable security definer set search_path=public as $$select case when exists(select 1 from public.feature_flags f join public.feature_flag_assignments a on a.flag_id=f.id and a.deleted_at is null and a.enabled=true join public.workspace_members wm on wm.organization_id=a.assignment_value::uuid and wm.user_id=auth.uid() and wm.status='active' where f.key='creative_studio_beta' and f.status in('enabled','beta') and f.deleted_at is null and a.assignment_type='organization') then 'selected-beta' else 'disabled' end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='create_creative_campaign_draft') then execute $vayon_sql$create or replace function public.create_creative_campaign_draft(p_input jsonb)returns uuid language plpgsql security definer set search_path=public as $$declare w uuid;o uuid;i uuid;begin select wm.workspace_id,wm.organization_id into w,o from public.workspace_members wm where wm.user_id=auth.uid()and wm.status='active'order by wm.created_at limit 1;if w is null or not public.creative_studio_manage(w)then raise exception'insufficient creative studio permission';end if;if not exists(select 1 from public.inventory_projects p where p.id=(p_input->>'projectId')::uuid and p.organization_id=o and p.workspace_id=w)then raise exception'invalid project';end if;insert into public.creative_campaigns(organization_id,workspace_id,project_id,name,status,brief,payload,created_by,updated_by)values(o,w,(p_input->>'projectId')::uuid,left(trim(p_input->>'name'),160),'draft',p_input->'brief',p_input->'payload',auth.uid(),auth.uid())returning id into i;insert into public.creative_timeline(organization_id,workspace_id,campaign_id,event_type,prompt_reference,ai_employee,project_id,metadata,actor_id)values(o,w,i,'campaign.draft_created','Sanitized campaign brief','AI Workforce collaboration',(p_input->>'projectId')::uuid,jsonb_build_object('status','draft','recommendation_only',true,'live_publishing',false),auth.uid());return i;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='advance_creative_campaign') then execute $vayon_sql$create or replace function public.advance_creative_campaign(p_campaign uuid,p_expected_version integer,p_next text)returns void language plpgsql security definer set search_path=public as $$declare c public.creative_campaigns%rowtype;expected text;begin select*into c from public.creative_campaigns where id=p_campaign for update;if not found or not public.creative_studio_manage(c.workspace_id)then raise exception'insufficient creative approval permission';end if;if c.version<>p_expected_version then raise exception'campaign changed';end if;expected=case c.status when'draft'then'marketing-review'when'marketing-review'then'sales-review'when'sales-review'then'management-approval'when'management-approval'then'approved'when'approved'then'ready-to-publish'end;if p_next is distinct from expected then raise exception'invalid approval transition';end if;update public.creative_campaigns set status=p_next,updated_by=auth.uid(),updated_at=now(),version=version+1 where id=c.id;insert into public.creative_timeline(organization_id,workspace_id,campaign_id,event_type,project_id,approver,actor_id,metadata)values(c.organization_id,c.workspace_id,c.id,'campaign.'||p_next,c.project_id,auth.uid(),auth.uid(),jsonb_build_object('previous',c.status,'next',p_next));end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='enqueue_creative_generation') then execute $vayon_sql$create or replace function public.enqueue_creative_generation(p_input jsonb)returns uuid language plpgsql security definer set search_path=public as $$declare p public.inventory_projects%rowtype;c uuid;j uuid;cached uuid;begin select*into p from public.inventory_projects where id=(p_input->>'projectId')::uuid;if not found or not public.creative_studio_member(p.organization_id,p.workspace_id)or not public.creative_studio_manage(p.workspace_id)then raise exception'insufficient creative generation permission';end if;if char_length(trim(p_input->>'prompt'))not between 1 and 2000 then raise exception'invalid creative prompt';end if;select id into cached from public.creative_assets where workspace_id=p.workspace_id and cache_key=p_input->>'cacheKey'and status='draft'limit 1;insert into public.creative_campaigns(organization_id,workspace_id,project_id,name,status,brief,payload,created_by,updated_by)values(p.organization_id,p.workspace_id,p.id,left((p_input->>'format')||' · '||p.name,160),'draft',jsonb_build_object('campaignType','Custom','audiences','[]'::jsonb,'platforms',jsonb_build_array(p_input->>'format'),'language','English','objective',p_input->>'prompt'),jsonb_build_object('projectName',p.name,'developer',p.developer,'generation','ai-image'),auth.uid(),auth.uid())returning id into c;insert into public.creative_generation_jobs(organization_id,workspace_id,project_id,campaign_id,prompt,format,layout_style,cache_key,status,progress,asset_id,created_by,completed_at)values(p.organization_id,p.workspace_id,p.id,c,trim(p_input->>'prompt'),left(p_input->>'format',100),p_input->>'layoutStyle',p_input->>'cacheKey',case when cached is null then'queued'else'completed'end,case when cached is null then 0 else 100 end,cached,auth.uid(),case when cached is null then null else now()end)returning id into j;insert into public.creative_timeline(organization_id,workspace_id,campaign_id,event_type,prompt_reference,ai_employee,project_id,metadata,actor_id)values(p.organization_id,p.workspace_id,c,case when cached is null then'generation.queued'else'generation.cache_hit'end,'Stored privately on generation job','Creative AI',p.id,jsonb_build_object('job_id',j,'layout',p_input->>'layoutStyle','format',p_input->>'format','draft_only',true),auth.uid());return j;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='claim_creative_generation') then execute $vayon_sql$create or replace function public.claim_creative_generation(p_job_id uuid)returns jsonb language plpgsql security definer set search_path=public as $$declare j public.creative_generation_jobs%rowtype;begin if current_setting('role',true)<>'service_role'then raise exception'service role required';end if;select*into j from public.creative_generation_jobs where id=p_job_id and(status='queued'or(status='failed'and attempts<max_attempts))for update skip locked;if not found then return null;end if;update public.creative_generation_jobs set status='processing',progress=10,attempts=attempts+1,claimed_at=now(),updated_at=now()where id=j.id;return to_jsonb(j)||jsonb_build_object('status','processing','attempts',j.attempts+1);end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='complete_creative_generation') then execute $vayon_sql$create or replace function public.complete_creative_generation(p_job_id uuid,p_success boolean,p_storage_path text,p_mime_type text,p_model text,p_latency_ms integer,p_diagnostic text,p_reasoning_summary text)returns void language plpgsql security definer set search_path=public as $$declare j public.creative_generation_jobs%rowtype;a uuid;begin if current_setting('role',true)<>'service_role'then raise exception'service role required';end if;select*into j from public.creative_generation_jobs where id=p_job_id for update;if not found then raise exception'generation job unavailable';end if;if p_success then insert into public.creative_assets(organization_id,workspace_id,campaign_id,project_id,name,category,format,platform,language,status,prompt,ai_employee,edits,exports,publishing_history,storyboard,generated_at,created_by,version,storage_path,mime_type,model,reasoning_summary,cache_key)values(j.organization_id,j.workspace_id,j.campaign_id,j.project_id,j.format||' · AI draft','image',j.format,j.format,'English','draft',j.prompt,'Creative AI','{}','{}','{}',null,now(),j.created_by,1,p_storage_path,p_mime_type,p_model,p_reasoning_summary,j.cache_key)returning id into a;insert into public.creative_editor_documents(asset_id,organization_id,workspace_id,width,height,elements,updated_by)values(a,j.organization_id,j.workspace_id,case when j.format~*'banner|linkedin|facebook'then 1536 else 1024 end,case when j.format~*'story|poster|flyer|brochure|whatsapp'then 1536 else 1024 end,jsonb_build_array(jsonb_build_object('id','background','type','image','x',0,'y',0,'width',1024,'height',1024,'content',p_storage_path,'style','{}'::jsonb),jsonb_build_object('id','headline','type','text','x',80,'y',90,'width',700,'height',150,'content','Edit campaign headline','style',jsonb_build_object('fontSize',64,'fontWeight',700))),j.created_by);update public.creative_generation_jobs set status='completed',progress=100,asset_id=a,diagnostic=null,completed_at=now(),updated_at=now()where id=j.id;insert into public.creative_timeline(organization_id,workspace_id,campaign_id,asset_id,event_type,prompt_reference,ai_employee,project_id,metadata,actor_id)values(j.organization_id,j.workspace_id,j.campaign_id,a,'generation.completed','Private job prompt','Creative AI',j.project_id,jsonb_build_object('job_id',j.id,'model',p_model,'latency_ms',p_latency_ms,'status','draft','publishing_disabled',true),j.created_by);else update public.creative_generation_jobs set status=case when attempts<max_attempts then'queued'else'failed'end,progress=0,diagnostic=left(coalesce(p_diagnostic,'provider_exception'),120),updated_at=now()where id=j.id;insert into public.creative_timeline(organization_id,workspace_id,campaign_id,event_type,ai_employee,project_id,metadata,actor_id)values(j.organization_id,j.workspace_id,j.campaign_id,'generation.failed','Creative AI',j.project_id,jsonb_build_object('job_id',j.id,'diagnostic',left(coalesce(p_diagnostic,'provider_exception'),120),'retry_available',j.attempts<j.max_attempts),j.created_by);end if;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='autosave_creative_editor') then execute $vayon_sql$create or replace function public.autosave_creative_editor(p_asset_id uuid,p_expected_revision integer,p_elements jsonb)returns integer language plpgsql security definer set search_path=public as $$declare d public.creative_editor_documents%rowtype;next_revision integer;begin select*into d from public.creative_editor_documents where asset_id=p_asset_id for update;if not found or not public.creative_studio_manage(d.workspace_id)then raise exception'insufficient editor permission';end if;if d.revision<>p_expected_revision then raise exception'editor document changed';end if;if jsonb_typeof(p_elements)<>'array'or jsonb_array_length(p_elements)>250 then raise exception'invalid editor document';end if;next_revision=d.revision+1;update public.creative_editor_documents set elements=p_elements,revision=next_revision,updated_by=auth.uid(),updated_at=now()where asset_id=p_asset_id;insert into public.creative_timeline(organization_id,workspace_id,asset_id,event_type,metadata,actor_id)values(d.organization_id,d.workspace_id,d.asset_id,'editor.autosaved',jsonb_build_object('revision',next_revision,'element_count',jsonb_array_length(p_elements)),auth.uid());return next_revision;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260913000000_sprint82_6_ai_growth_studio.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='create_growth_campaign_pack') then execute $vayon_sql$create or replace function public.create_growth_campaign_pack(p_campaign_id uuid,p_language text,p_formats text[]) returns uuid language plpgsql security definer set search_path=public as $$declare c public.creative_campaigns%rowtype;i uuid;begin select*into c from public.creative_campaigns where id=p_campaign_id for update;if not found or not public.creative_studio_member(c.organization_id,c.workspace_id) or not public.creative_studio_manage(c.workspace_id) then raise exception'insufficient growth studio permission';end if;if p_language not in('English','Hindi','Arabic','Thai','Japanese','Spanish','German','French')or cardinality(p_formats)<1 or cardinality(p_formats)>40 then raise exception'invalid campaign pack';end if;insert into public.creative_campaign_packs(organization_id,workspace_id,campaign_id,project_id,name,language,status,formats,created_by)values(c.organization_id,c.workspace_id,c.id,c.project_id,c.name||' package',p_language,'draft',p_formats,auth.uid())on conflict(campaign_id,language)do update set formats=excluded.formats,updated_at=now()returning id into i;insert into public.creative_timeline(organization_id,workspace_id,campaign_id,event_type,project_id,metadata,actor_id)values(c.organization_id,c.workspace_id,c.id,'campaign.pack_created',c.project_id,jsonb_build_object('pack_id',i,'language',p_language,'format_count',cardinality(p_formats),'recommendation_only',true,'publishing_enabled',false),auth.uid());return i;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260914000000_sprint83_enterprise_commercial_platform.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='workspace_feature_licensed') then execute $vayon_sql$create or replace function public.workspace_feature_licensed(p_workspace_id uuid,p_feature text)returns boolean language sql stable security definer set search_path=public as $$select public.current_workspace_role(p_workspace_id)is not null and exists(select 1 from public.workspace_feature_licenses l where l.workspace_id=p_workspace_id and l.feature=p_feature and l.enabled=true and l.starts_at<=now()and(l.ends_at is null or l.ends_at>now()))$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260914000000_sprint83_enterprise_commercial_platform.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='record_billing_usage') then execute $vayon_sql$create or replace function public.record_billing_usage(p_workspace_id uuid,p_metric text,p_quantity numeric,p_idempotency_key text)returns void language plpgsql security definer set search_path=public as $$declare v_org uuid;v_limit numeric;v_used numeric;v_start date=date_trunc('month',now())::date;v_end date=(date_trunc('month',now())+interval'1 month'-interval'1 day')::date;begin if p_quantity<0 or p_metric not in('ai_requests','tokens','storage_gb','users','whatsapp_messages','emails','calendar_events','api_calls','image_generations','creative_exports','video_projects','conversation_summaries','future_video_generation_credits')then raise exception'invalid usage event';end if;select organization_id into v_org from public.workspaces where id=p_workspace_id;if v_org is null or public.current_workspace_role(p_workspace_id)is null then raise exception'workspace unavailable';end if;select limit_value into v_limit from public.organization_limits where workspace_id=p_workspace_id and metric=p_metric;select coalesce(quantity,0)into v_used from public.organization_usage where workspace_id=p_workspace_id and metric=p_metric and period_start=v_start;if v_limit is not null and coalesce(v_used,0)+p_quantity>v_limit then raise exception'subscription limit exceeded for %',p_metric;end if;insert into public.usage_events(organization_id,workspace_id,metric,quantity,idempotency_key)values(v_org,p_workspace_id,p_metric,p_quantity,p_idempotency_key)on conflict(workspace_id,idempotency_key)do nothing;if found then insert into public.organization_usage(organization_id,workspace_id,metric,quantity,period_start,period_end)values(v_org,p_workspace_id,p_metric,p_quantity,v_start,v_end)on conflict(workspace_id,metric,period_start)do update set quantity=public.organization_usage.quantity+excluded.quantity,updated_at=now();end if;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260914000000_sprint83_enterprise_commercial_platform.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='record_commercial_webhook') then execute $vayon_sql$create or replace function public.record_commercial_webhook(p_provider text,p_event_id text,p_event_type text,p_payload jsonb,p_workspace_id uuid default null)returns void language plpgsql security definer set search_path=public as $$declare o uuid;begin if current_setting('role',true)<>'service_role'then raise exception'service role required';end if;if p_provider not in('stripe','razorpay')then raise exception'unsupported billing provider';end if;select organization_id into o from public.workspaces where id=p_workspace_id;insert into public.commercial_webhook_events(organization_id,workspace_id,provider,provider_event_id,event_type,status,payload)values(o,p_workspace_id,p_provider,p_event_id,p_event_type,'received',p_payload)on conflict(provider,provider_event_id)do nothing;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260916000000_sprint84_2_public_contact_reliability.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='capture_public_marketing_lead') then execute $vayon_sql$create or replace function public.capture_public_marketing_lead(p_input jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_kind text:=p_input->>'kind'; v_email text:=lower(trim(p_input->>'email'));
begin
  if v_kind not in('demo','trial','sales','newsletter') or v_email!~'^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or length(v_email)>254 or length(coalesce(p_input->>'message',''))>2000 then raise exception 'invalid lead'; end if;
  insert into public.marketing_leads(kind,name,email,company,message,plan)
  values(v_kind,left(nullif(trim(p_input->>'name'),''),100),v_email,left(nullif(trim(p_input->>'company'),''),160),left(nullif(trim(p_input->>'message'),''),2000),left(nullif(trim(p_input->>'plan'),''),30)) returning id into v_id;
  return v_id;
end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260916000000_sprint84_2_public_contact_reliability.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='record_public_marketing_event') then execute $vayon_sql$create or replace function public.record_public_marketing_event(p_event jsonb)
returns void language plpgsql security definer set search_path=public as $$
begin
  if p_event->>'type' not in('page_view','cta_click','demo_request','trial_signup','contact_sales','newsletter','demo_launch','roi_calculation','industry_view','comparison_view','marketing_conversion','web_vital','tracking_failure') or length(p_event->>'path')>300 or (p_event->>'sessionId')!~'^[0-9a-f-]{36}$' then raise exception 'invalid event'; end if;
  insert into public.marketing_events(event_type,path,session_hash,metadata)
  values(p_event->>'type',p_event->>'path',encode(digest(p_event->>'sessionId','sha256'),'hex'),coalesce(p_event->'metadata','{}')-'email'-'name'-'phone'-'token'-'authorization');
end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='transition_knowledge_article') then execute $vayon_sql$create or replace function public.transition_knowledge_article(p_workspace_id uuid,p_article_id uuid,p_next_status text,p_expected_version integer)returns void language plpgsql security definer set search_path=public as $$declare a public.knowledge_articles%rowtype;v_next text;begin if not public.can_manage_knowledge(p_workspace_id)then raise exception'insufficient knowledge permission';end if;select*into a from public.knowledge_articles where id=p_article_id and workspace_id=p_workspace_id and deleted_at is null for update;if not found or a.version<>p_expected_version then raise exception'knowledge article unavailable or changed';end if;v_next=case a.status when'draft'then'review'when'review'then'approved'when'approved'then'archived'when'published'then'archived'end;if p_next_status is distinct from v_next then raise exception'invalid knowledge transition';end if;insert into public.knowledge_article_versions(article_id,organization_id,workspace_id,version,title,summary,content,tags,created_by)values(a.id,a.organization_id,a.workspace_id,a.version,a.title,a.summary,a.content,a.tags,auth.uid())on conflict do nothing;update public.knowledge_articles set status=p_next_status,version=version+1,approved_by=case when p_next_status='approved'then auth.uid()else approved_by end,approved_at=case when p_next_status='approved'then now()else approved_at end,updated_at=now()where id=a.id;insert into public.organization_audit_events(organization_id,workspace_id,actor_id,event_type,subject_id,metadata)values(a.organization_id,a.workspace_id,auth.uid(),'knowledge.article_transitioned',a.id,jsonb_build_object('from',a.status,'to',p_next_status,'version',a.version+1));end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='retrieve_trusted_knowledge') then execute $vayon_sql$create or replace function public.retrieve_trusted_knowledge(p_workspace_id uuid,p_query text,p_expanded_terms text[],p_module text default null,p_product_version text default null,p_limit integer default 30)returns table(id uuid,title text,summary text,category text,tags text[],score real,source text,citation text,authority text,version text,module text,video_url text,transcript text,feature_key text,minimum_plan text,deprecated boolean,upcoming boolean)language plpgsql security definer set search_path=public as $$declare v_org uuid;begin select organization_id into v_org from public.workspace_members where workspace_id=p_workspace_id and user_id=auth.uid()and status='active';if v_org is null then raise exception'workspace access required';end if;return query with candidates as(select a.id,a.title,a.summary,a.category,a.tags,(case when a.category in('organization','playbook')or a.knowledge_kind<>'knowledge_article'then 700 when a.category='administrator'then 500 when a.category='release_notes'then 300 when a.category='faq'then 200 else 600 end+case when p_module is not null and(a.module=p_module or p_module=any(a.tags))then 30 else 0 end+case when p_product_version is not null and a.product_version=p_product_version then 20 else 0 end+coalesce((select count(*)*8 from unnest(coalesce(p_expanded_terms,'{}'))t where(a.title||' '||a.summary||' '||a.content||' '||array_to_string(a.tags,' '))ilike'%'||t||'%'),0)-case when a.deprecated then 150 else 0 end)::real s,'article'::text src,a.slug||'@v'||a.version c,case when a.category in('organization','playbook')or a.knowledge_kind<>'knowledge_article'then'organization'when a.category='administrator'then'administrator_guide'when a.category='release_notes'then'release_notes'when a.category='faq'then'faq'else'approved_knowledge_base'end authority,a.version::text,a.module,null::text video_url,null::text transcript,a.feature_key,a.minimum_plan,a.deprecated,a.upcoming from public.knowledge_articles a where a.organization_id=v_org and a.workspace_id=p_workspace_id and a.status in('approved','published')and a.deleted_at is null and a.upcoming=false and exists(select 1 from unnest(coalesce(p_expanded_terms,'{}'))t where(a.title||' '||a.summary||' '||a.content||' '||array_to_string(a.tags,' '))ilike'%'||t||'%') union all select v.id,v.title,v.summary,'video',v.tags,(600+case when p_module is not null and v.module=p_module then 30 else 0 end+coalesce((select count(*)*8 from unnest(coalesce(p_expanded_terms,'{}'))t where(v.title||' '||v.summary||' '||v.transcript)ilike'%'||t||'%'),0))::real,'video',v.id::text||'@'||coalesce(v.product_version,'current'),'approved_knowledge_base',coalesce(v.product_version,'current'),v.module,v.video_url,v.transcript,null,null,false,false from public.knowledge_videos v where v.organization_id=v_org and v.workspace_id=p_workspace_id and v.status='approved'and v.deleted_at is null and exists(select 1 from unnest(coalesce(p_expanded_terms,'{}'))t where(v.title||' '||v.summary||' '||v.transcript)ilike'%'||t||'%'))select c.id,c.title,c.summary,c.category,c.tags,c.s,c.src,c.c,c.authority,c.version,c.module,c.video_url,c.transcript,c.feature_key,c.minimum_plan,c.deprecated,c.upcoming from candidates c order by c.s desc limit least(greatest(p_limit,1),100);end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='record_knowledge_quality_feedback') then execute $vayon_sql$create or replace function public.record_knowledge_quality_feedback(p_workspace_id uuid,p_article_id text,p_rating text,p_session_id text default null)returns void language plpgsql security definer set search_path=public as $$declare v_org uuid;v_hash text;begin select organization_id into v_org from public.workspace_members where workspace_id=p_workspace_id and user_id=auth.uid()and status='active';if v_org is null then raise exception'workspace access required';end if;if p_rating not in('helpful','not_helpful','needs_update','report_problem')or length(p_article_id)>200 then raise exception'invalid knowledge feedback';end if;v_hash=case when p_session_id is null or p_session_id=''then null else encode(extensions.digest(left(p_session_id,200),'sha256'),'hex')end;insert into public.knowledge_quality_feedback(organization_id,workspace_id,source_reference,rating,session_hash,user_id)values(v_org,p_workspace_id,p_article_id,p_rating,v_hash,null);insert into public.organization_audit_events(organization_id,workspace_id,actor_id,event_type,metadata)values(v_org,p_workspace_id,auth.uid(),'knowledge.feedback_recorded',jsonb_build_object('rating',p_rating,'source_reference',left(p_article_id,200)));end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260917000000_sprint86_4_product_intelligence.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='record_product_intelligence_events') then execute $vayon_sql$create or replace function public.record_product_intelligence_events(p_workspace_id uuid,p_events jsonb)returns void language plpgsql security definer set search_path=public as $$declare v_org uuid;v_event jsonb;v_count integer:=0;v_session text;v_metadata jsonb;begin select organization_id into v_org from public.workspace_members where workspace_id=p_workspace_id and user_id=auth.uid()and status='active';if v_org is null then raise exception'workspace access required';end if;if jsonb_typeof(p_events)<>'array'or jsonb_array_length(p_events)<1 or jsonb_array_length(p_events)>50 then raise exception'invalid event batch';end if;for v_event in select*from jsonb_array_elements(p_events)loop if v_event->>'name'not in('page_viewed','feature_opened','lead_created','inventory_imported','campaign_generated','proposal_exported','site_visit_booked','report_exported','knowledge_article_opened','quick_action_used','ai_suggestion_accepted','ai_suggestion_dismissed','search_performed','feedback_submitted','error_recovered','retry_completed')or coalesce(v_event->>'path','')not like'/vayon/%'or coalesce(v_event->>'module','')!~'^[a-z0-9-]{1,60}$'then raise exception'invalid product event';end if;v_session=encode(extensions.digest(left(v_event->>'anonymousSessionId',200),'sha256'),'hex');v_metadata=jsonb_strip_nulls(jsonb_build_object('action',v_event->'metadata'->'action','topic',v_event->'metadata'->'topic','confidence',v_event->'metadata'->'confidence','contextRelevance',v_event->'metadata'->'contextRelevance','intent',v_event->'metadata'->'intent'));insert into public.product_intelligence_events(organization_id,workspace_id,event_name,module,path,duration_ms,outcome,session_hash,metadata)values(v_org,p_workspace_id,v_event->>'name',v_event->>'module',left(v_event->>'path',300),least(86400000,greatest(0,coalesce((v_event->>'durationMs')::integer,0))),nullif(v_event->>'outcome',''),v_session,v_metadata);v_count=v_count+1;end loop;insert into public.organization_audit_events(organization_id,workspace_id,actor_id,event_type,metadata)values(v_org,p_workspace_id,auth.uid(),'product_intelligence.batch_recorded',jsonb_build_object('event_count',v_count));end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260917000000_sprint86_4_product_intelligence.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='submit_product_feedback') then execute $vayon_sql$create or replace function public.submit_product_feedback(p_workspace_id uuid,p_feedback jsonb)returns uuid language plpgsql security definer set search_path=public as $$declare v_org uuid;v_id uuid;v_kind text:=p_feedback->>'kind';v_screenshot text:=nullif(p_feedback->>'screenshotPath','');begin select organization_id into v_org from public.workspace_members where workspace_id=p_workspace_id and user_id=auth.uid()and status='active';if v_org is null then raise exception'workspace access required';end if;if v_kind not in('bug_report','feature_request','improvement_idea','ux_issue','knowledge_correction','general_feedback')or length(trim(p_feedback->>'title'))not between 3 and 160 or length(trim(p_feedback->>'description'))not between 10 and 4000 or p_feedback->>'priority'not in('low','medium','high','critical')then raise exception'invalid feedback';end if;if v_screenshot is not null and v_screenshot not like v_org::text||'/'||p_workspace_id::text||'/%'then raise exception'invalid screenshot scope';end if;insert into public.product_feedback(organization_id,workspace_id,user_id,kind,title,description,priority,rating,resolution_quality,screenshot_path)values(v_org,p_workspace_id,auth.uid(),v_kind,trim(p_feedback->>'title'),trim(p_feedback->>'description'),p_feedback->>'priority',nullif(p_feedback->>'rating','')::integer,nullif(p_feedback->>'resolutionQuality','')::integer,v_screenshot)returning id into v_id;insert into public.product_intelligence_events(organization_id,workspace_id,event_name,module,path,outcome,session_hash,metadata)values(v_org,p_workspace_id,'feedback_submitted','product-intelligence','/vayon/settings/product-intelligence','success',encode(extensions.digest(v_id::text,'sha256'),'hex'),jsonb_build_object('kind',v_kind,'priority',p_feedback->>'priority'));insert into public.organization_audit_events(organization_id,workspace_id,actor_id,event_type,subject_id,metadata)values(v_org,p_workspace_id,auth.uid(),'product_feedback.submitted',v_id,jsonb_build_object('kind',v_kind,'priority',p_feedback->>'priority','has_screenshot',v_screenshot is not null));return v_id;end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260918000000_sprint86_5_continuous_learning.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='upsert_intelligence_memory') then execute $vayon_sql$create or replace function public.upsert_intelligence_memory(p_workspace_id uuid,p_scope text,p_key text,p_value jsonb) returns uuid language plpgsql security definer set search_path=public as $$
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
end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260918000000_sprint86_5_continuous_learning.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='store_executive_intelligence_briefing') then execute $vayon_sql$create or replace function public.store_executive_intelligence_briefing(p_workspace_id uuid,p_briefing jsonb) returns uuid language plpgsql security definer set search_path=public as $$
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
end$$$vayon_sql$; end if; end $vayon_function$;
-- Source: 20260918000000_sprint86_5_continuous_learning.sql
do $vayon_function$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='refresh_continuous_learning_aggregates') then execute $vayon_sql$create or replace function public.refresh_continuous_learning_aggregates(p_workspace_id uuid,p_period_start date default current_date) returns integer language plpgsql security definer set search_path=public as $$
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
end$$$vayon_sql$; end if; end $vayon_function$;

-- POLICIES (final Version 1 definitions)
-- Source: 20260814000000_sprint43_google_identity_workspace.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='user_profiles_owner_read') then execute $vayon_sql$create policy "user_profiles_owner_read" on public.user_profiles for select to authenticated using (user_id = auth.uid())$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260814000000_sprint43_google_identity_workspace.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='user_profiles_owner_update') then execute $vayon_sql$create policy "user_profiles_owner_update" on public.user_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260814000000_sprint43_google_identity_workspace.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='identity_audit_events' and policyname='identity_audit_owner_or_member_read') then execute $vayon_sql$create policy "identity_audit_owner_or_member_read" on public.identity_audit_events for select to authenticated using (
  user_id = auth.uid() or (organization_id is not null and public.is_organization_member(organization_id))
)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='subscriptions' and policyname='subscriptions_billing_read') then execute $vayon_sql$create policy "subscriptions_billing_read" on public.subscriptions for select to authenticated using(public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','billing_admin','finance','finance_manager','finance_analyst','read_only'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='organization_usage' and policyname='usage_billing_read') then execute $vayon_sql$create policy "usage_billing_read" on public.organization_usage for select to authenticated using(public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','billing_admin','finance','finance_manager','finance_analyst','read_only'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='organization_limits' and policyname='limits_billing_read') then execute $vayon_sql$create policy "limits_billing_read" on public.organization_limits for select to authenticated using(public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','billing_admin','finance','finance_manager','finance_analyst','read_only'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='invoices' and policyname='invoices_billing_read') then execute $vayon_sql$create policy "invoices_billing_read" on public.invoices for select to authenticated using(public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','billing_admin','finance','finance_manager','finance_analyst','read_only'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='billing_contacts' and policyname='billing_contacts_billing_read') then execute $vayon_sql$create policy "billing_contacts_billing_read" on public.billing_contacts for select to authenticated using(public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','billing_admin','finance','finance_manager','finance_analyst','read_only'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='billing_customers' and policyname='billing_customers_read') then execute $vayon_sql$create policy "billing_customers_read" on public.billing_customers for select to authenticated using(public.is_organization_member(organization_id) and public.current_workspace_role(workspace_id) in('organization_owner','organization_admin','billing_admin','finance','finance_manager','finance_analyst','read_only'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='subscription_items' and policyname='subscription_items_read') then execute $vayon_sql$create policy "subscription_items_read" on public.subscription_items for select to authenticated using(public.is_organization_member(organization_id) and public.current_workspace_role(workspace_id) in('organization_owner','organization_admin','billing_admin','finance','finance_manager','finance_analyst','read_only'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='payment_methods' and policyname='payment_methods_read') then execute $vayon_sql$create policy "payment_methods_read" on public.payment_methods for select to authenticated using(public.is_organization_member(organization_id) and public.current_workspace_role(workspace_id) in('organization_owner','organization_admin','billing_admin','finance','finance_manager','finance_analyst','read_only'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='billing_events' and policyname='billing_events_read') then execute $vayon_sql$create policy "billing_events_read" on public.billing_events for select to authenticated using(public.is_organization_member(organization_id) and public.current_workspace_role(workspace_id) in('organization_owner','organization_admin','billing_admin','finance','finance_manager','finance_analyst','read_only'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='usage_events' and policyname='usage_events_read') then execute $vayon_sql$create policy "usage_events_read" on public.usage_events for select to authenticated using(public.is_organization_member(organization_id) and public.current_workspace_role(workspace_id) in('organization_owner','organization_admin','billing_admin','finance','finance_manager','finance_analyst','read_only'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='permissions' and policyname='permissions_authenticated_read') then execute $vayon_sql$create policy "permissions_authenticated_read" on public.permissions for select to authenticated using(true)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='role_permissions' and policyname='role_permissions_authenticated_read') then execute $vayon_sql$create policy "role_permissions_authenticated_read" on public.role_permissions for select to authenticated using(true)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='organization_audit_events' and policyname='organization_audit_member_read') then execute $vayon_sql$create policy "organization_audit_member_read" on public.organization_audit_events for select to authenticated using(public.is_organization_member(organization_id)and exists(select 1 from workspace_members wm where wm.workspace_id=organization_audit_events.workspace_id and wm.user_id=auth.uid()and wm.status='active'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='organization_profiles_peer_read') then execute $vayon_sql$create policy "organization_profiles_peer_read" on public.user_profiles for select to authenticated using(user_id=auth.uid()or exists(select 1 from organization_members mine join organization_members peer on peer.organization_id=mine.organization_id where mine.user_id=auth.uid()and mine.status='active'and peer.user_id=user_profiles.user_id and peer.status in('active','suspended')))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260821000000_sprint57_ai_collaboration.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='ai_collaboration_runs' and policyname='collaboration_run_read') then execute $vayon_sql$create policy "collaboration_run_read" on public.ai_collaboration_runs for select to authenticated using(public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)is not null)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260821000000_sprint57_ai_collaboration.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='ai_collaboration_runs' and policyname='collaboration_run_insert') then execute $vayon_sql$create policy "collaboration_run_insert" on public.ai_collaboration_runs for insert to authenticated with check(created_by=auth.uid()and recommendation_only and approval_required and public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)is not null)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260821000000_sprint57_ai_collaboration.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='ai_collaboration_runs' and policyname='collaboration_run_update') then execute $vayon_sql$create policy "collaboration_run_update" on public.ai_collaboration_runs for update to authenticated using(created_by=auth.uid()and public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)is not null)with check(created_by=auth.uid()and recommendation_only and approval_required)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260821000000_sprint57_ai_collaboration.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='ai_collaboration_events' and policyname='collaboration_event_read') then execute $vayon_sql$create policy "collaboration_event_read" on public.ai_collaboration_events for select to authenticated using(public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)is not null)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260821000000_sprint57_ai_collaboration.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='ai_collaboration_events' and policyname='collaboration_event_insert') then execute $vayon_sql$create policy "collaboration_event_insert" on public.ai_collaboration_events for insert to authenticated with check(created_by=auth.uid()and public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)is not null and exists(select 1 from public.ai_collaboration_runs r where r.id=run_id and r.organization_id=organization_id and r.workspace_id=workspace_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260821000000_sprint57_ai_collaboration.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='ai_collaboration_recommendations' and policyname='collaboration_recommendation_read') then execute $vayon_sql$create policy "collaboration_recommendation_read" on public.ai_collaboration_recommendations for select to authenticated using(public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)is not null)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260821000000_sprint57_ai_collaboration.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='ai_collaboration_recommendations' and policyname='collaboration_recommendation_insert') then execute $vayon_sql$create policy "collaboration_recommendation_insert" on public.ai_collaboration_recommendations for insert to authenticated with check(created_by=auth.uid()and recommendation_only and approval_status='pending'and public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)is not null and exists(select 1 from public.ai_collaboration_runs r where r.id=run_id and r.organization_id=organization_id and r.workspace_id=workspace_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260822000000_sprint58_enterprise_security.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='identity_sessions' and policyname='identity_session_owner') then execute $vayon_sql$create policy "identity_session_owner" on public.identity_sessions for select to authenticated using(user_id=auth.uid())$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260822000000_sprint58_enterprise_security.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='trusted_devices' and policyname='trusted_device_owner') then execute $vayon_sql$create policy "trusted_device_owner" on public.trusted_devices for select to authenticated using(user_id=auth.uid())$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260822000000_sprint58_enterprise_security.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='security_alerts' and policyname='security_alert_owner') then execute $vayon_sql$create policy "security_alert_owner" on public.security_alerts for select to authenticated using(user_id=auth.uid())$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260822000000_sprint58_enterprise_security.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='authentication_attempts' and policyname='authentication_attempt_owner') then execute $vayon_sql$create policy "authentication_attempt_owner" on public.authentication_attempts for select to authenticated using(user_id=auth.uid())$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260822000000_sprint58_enterprise_security.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='personal_access_tokens' and policyname='pat_owner_read') then execute $vayon_sql$create policy "pat_owner_read" on public.personal_access_tokens for select to authenticated using(user_id=auth.uid()and public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)is not null)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260822000000_sprint58_enterprise_security.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='mfa_recovery_codes' and policyname='recovery_code_owner') then execute $vayon_sql$create policy "recovery_code_owner" on public.mfa_recovery_codes for select to authenticated using(user_id=auth.uid())$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260822000000_sprint58_enterprise_security.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='user_organization_context' and policyname='organization_context_owner') then execute $vayon_sql$create policy "organization_context_owner" on public.user_organization_context for select to authenticated using(user_id=auth.uid()and public.is_organization_member(organization_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='notification_reminders' and policyname='notification_reminders_owner') then execute $vayon_sql$create policy notification_reminders_owner on public.notification_reminders for all to authenticated using(user_id=auth.uid()and public.is_organization_member(organization_id))with check(user_id=auth.uid()and public.is_organization_member(organization_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='notification_queue' and policyname='notification_queue_member_read') then execute $vayon_sql$create policy notification_queue_member_read on public.notification_queue for select to authenticated using(public.is_organization_member(organization_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260824000000_sprint60_enterprise_email.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='email_templates' and policyname='email_templates_member_read') then execute $vayon_sql$create policy email_templates_member_read on public.email_templates for select to authenticated using(public.is_organization_member(organization_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260824000000_sprint60_enterprise_email.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='email_messages' and policyname='email_messages_member_read') then execute $vayon_sql$create policy email_messages_member_read on public.email_messages for select to authenticated using(public.is_organization_member(organization_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260824000000_sprint60_enterprise_email.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='email_delivery_attempts' and policyname='email_attempts_member_read') then execute $vayon_sql$create policy email_attempts_member_read on public.email_delivery_attempts for select to authenticated using(public.is_organization_member(organization_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260825000000_sprint61_enterprise_workflow_automation.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='workflow_definitions' and policyname='workflow definitions tenant read') then execute $vayon_sql$create policy "workflow definitions tenant read" on public.workflow_definitions for select to authenticated using(public.current_workspace_role(workspace_id) is not null)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260825000000_sprint61_enterprise_workflow_automation.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='workflow_instances' and policyname='workflow instances tenant read') then execute $vayon_sql$create policy "workflow instances tenant read" on public.workflow_instances for select to authenticated using(public.current_workspace_role(workspace_id) is not null)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260825000000_sprint61_enterprise_workflow_automation.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='workflow_step_executions' and policyname='workflow steps tenant read') then execute $vayon_sql$create policy "workflow steps tenant read" on public.workflow_step_executions for select to authenticated using(public.current_workspace_role(workspace_id) is not null)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260825000000_sprint61_enterprise_workflow_automation.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='workflow_trigger_events' and policyname='workflow triggers tenant read') then execute $vayon_sql$create policy "workflow triggers tenant read" on public.workflow_trigger_events for select to authenticated using(public.current_workspace_role(workspace_id) is not null)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260825000000_sprint61_enterprise_workflow_automation.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='workflow_automation_approvals' and policyname='workflow approvals tenant read') then execute $vayon_sql$create policy "workflow approvals tenant read" on public.workflow_automation_approvals for select to authenticated using(public.current_workspace_role(workspace_id) is not null)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260826000000_sprint62_enterprise_customer_onboarding.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='onboarding_sessions' and policyname='onboarding owner session read') then execute $vayon_sql$create policy "onboarding owner session read" on public.onboarding_sessions for select to authenticated using(user_id=auth.uid())$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260826000000_sprint62_enterprise_customer_onboarding.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='onboarding_step_events' and policyname='onboarding owner events read') then execute $vayon_sql$create policy "onboarding owner events read" on public.onboarding_step_events for select to authenticated using(user_id=auth.uid())$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260826000000_sprint62_enterprise_customer_onboarding.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='onboarding_import_jobs' and policyname='onboarding tenant imports read') then execute $vayon_sql$create policy "onboarding tenant imports read" on public.onboarding_import_jobs for select to authenticated using(public.current_workspace_role(workspace_id) is not null)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260826000000_sprint62_enterprise_customer_onboarding.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='onboarding_tour_progress' and policyname='onboarding tenant tour read') then execute $vayon_sql$create policy "onboarding tenant tour read" on public.onboarding_tour_progress for select to authenticated using(user_id=auth.uid() and public.current_workspace_role(workspace_id) is not null)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260826000000_sprint62_enterprise_customer_onboarding.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='onboarding_connection_events' and policyname='onboarding tenant connections read') then execute $vayon_sql$create policy "onboarding tenant connections read" on public.onboarding_connection_events for select to authenticated using(public.current_workspace_role(workspace_id) is not null)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260826000000_sprint62_enterprise_customer_onboarding.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='onboarding_demo_seed_requests' and policyname='onboarding tenant demo read') then execute $vayon_sql$create policy "onboarding tenant demo read" on public.onboarding_demo_seed_requests for select to authenticated using(public.current_workspace_role(workspace_id) is not null)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260827000000_sprint63_enterprise_knowledge_platform.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='knowledge_articles' and policyname='knowledge articles tenant read') then execute $vayon_sql$create policy "knowledge articles tenant read"on public.knowledge_articles for select to authenticated using(public.current_workspace_role(workspace_id)is not null)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260827000000_sprint63_enterprise_knowledge_platform.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='knowledge_article_versions' and policyname='knowledge versions tenant read') then execute $vayon_sql$create policy "knowledge versions tenant read"on public.knowledge_article_versions for select to authenticated using(public.current_workspace_role(workspace_id)is not null)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260827000000_sprint63_enterprise_knowledge_platform.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='knowledge_documents' and policyname='knowledge documents tenant read') then execute $vayon_sql$create policy "knowledge documents tenant read"on public.knowledge_documents for select to authenticated using(public.current_workspace_role(workspace_id)is not null)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260827000000_sprint63_enterprise_knowledge_platform.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='knowledge_analytics' and policyname='knowledge analytics admin read') then execute $vayon_sql$create policy "knowledge analytics admin read"on public.knowledge_analytics for select to authenticated using(public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','manager'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260827000000_sprint63_enterprise_knowledge_platform.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='knowledge object tenant insert') then execute $vayon_sql$create policy "knowledge object tenant insert"on storage.objects for insert to authenticated with check(bucket_id='knowledge-documents'and public.current_workspace_role((storage.foldername(name))[2]::uuid)in('organization_owner','organization_admin','manager'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260827000000_sprint63_enterprise_knowledge_platform.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='knowledge object tenant read') then execute $vayon_sql$create policy "knowledge object tenant read"on storage.objects for select to authenticated using(bucket_id='knowledge-documents'and public.current_workspace_role((storage.foldername(name))[2]::uuid)is not null)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260828000000_sprint64_production_deployment_platform.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='deployment_migration_history' and policyname='deployment migration administrators read') then execute $vayon_sql$create policy "deployment migration administrators read"on public.deployment_migration_history for select to authenticated using(exists(select 1 from public.workspace_members wm join public.roles r on r.id=wm.role_id where wm.user_id=auth.uid()and wm.status='active'and r.code in('organization_owner','organization_admin'))or(auth.jwt()->'app_metadata'->>'role')='super_admin')$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260828000000_sprint64_production_deployment_platform.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='deployment_releases' and policyname='deployment releases administrators read') then execute $vayon_sql$create policy "deployment releases administrators read"on public.deployment_releases for select to authenticated using((public.current_workspace_role(workspace_id)in('organization_owner','organization_admin')and organization_id=(select wm.organization_id from public.workspace_members wm where wm.workspace_id=deployment_releases.workspace_id and wm.user_id=auth.uid()and wm.status='active'limit 1))or(auth.jwt()->'app_metadata'->>'role')='super_admin')$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260830000000_sprint66_enterprise_security_hardening.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='security_review_events' and policyname='security review administrators read') then execute $vayon_sql$create policy "security review administrators read"on public.security_review_events for select to authenticated using(public.current_workspace_role(workspace_id)in('organization_owner','organization_admin')or(auth.jwt()->'app_metadata'->>'role')='super_admin')$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260902120000_sprint69_2_enterprise_conversion_analytics.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='workspace_analytics_events' and policyname='workspace_analytics_events_select') then execute $vayon_sql$create policy workspace_analytics_events_select on public.workspace_analytics_events for select to authenticated using(public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','manager','marketing','finance','read_only'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260902180000_sprint69_5_launch_readiness_audit.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='launch_readiness_audit_runs' and policyname='launch_readiness_audit_runs_select') then execute $vayon_sql$create policy launch_readiness_audit_runs_select on public.launch_readiness_audit_runs for select to authenticated using(public.current_workspace_role(workspace_id)in('organization_owner','organization_admin'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260906000000_sprint76_enterprise_organization_management.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='organization_departments' and policyname='organization_departments_member_read') then execute $vayon_sql$create policy "organization_departments_member_read" on public.organization_departments for select to authenticated using(public.is_organization_member(organization_id) and exists(select 1 from public.workspace_members wm where wm.workspace_id=organization_departments.workspace_id and wm.user_id=auth.uid() and wm.status='active'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260906000000_sprint76_enterprise_organization_management.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='organization_teams' and policyname='organization_teams_member_read') then execute $vayon_sql$create policy "organization_teams_member_read" on public.organization_teams for select to authenticated using(public.is_organization_member(organization_id) and exists(select 1 from public.workspace_members wm where wm.workspace_id=organization_teams.workspace_id and wm.user_id=auth.uid() and wm.status='active'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260906000000_sprint76_enterprise_organization_management.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='organization_team_members' and policyname='organization_team_members_member_read') then execute $vayon_sql$create policy "organization_team_members_member_read" on public.organization_team_members for select to authenticated using(public.is_organization_member(organization_id) and exists(select 1 from public.workspace_members wm where wm.workspace_id=organization_team_members.workspace_id and wm.user_id=auth.uid() and wm.status='active'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
do $$declare t text;begin foreach t in array array['property_projects','property_towers','property_units','property_price_revisions','property_documents','property_inventory_audit','property_inventory_opportunity_requests'] loop execute format('drop policy if exists %I on public.%I',t||'_select',t);begin execute format('create policy %I on public.%I for select to authenticated using(public.inventory_workspace_member(organization_id,workspace_id))',t||'_select',t); exception when duplicate_object then null; end;execute format('drop policy if exists %I on public.%I',t||'_insert',t);begin execute format('create policy %I on public.%I for insert to authenticated with check(public.inventory_can_write(organization_id,workspace_id))',t||'_insert',t); exception when duplicate_object then null; end;execute format('drop policy if exists %I on public.%I',t||'_update',t);begin execute format('create policy %I on public.%I for update to authenticated using(public.inventory_can_write(organization_id,workspace_id)) with check(public.inventory_can_write(organization_id,workspace_id))',t||'_update',t); exception when duplicate_object then null; end;execute format('drop policy if exists %I on public.%I',t||'_delete',t);begin execute format('create policy %I on public.%I for delete to authenticated using(public.inventory_can_write(organization_id,workspace_id))',t||'_delete',t); exception when duplicate_object then null; end;end loop;end$$;
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
do $$declare t text;begin foreach t in array array['site_visit_feedback','site_visit_audit','site_visit_follow_up_requests']loop begin execute format('create policy %I on public.%I for select to authenticated using(public.site_visit_member(organization_id,workspace_id))',t||'_read',t); exception when duplicate_object then null; end;begin execute format('create policy %I on public.%I for insert to authenticated with check(public.site_visit_can_manage(organization_id,workspace_id))',t||'_create',t); exception when duplicate_object then null; end;begin execute format('create policy %I on public.%I for update to authenticated using(public.site_visit_can_manage(organization_id,workspace_id)) with check(public.site_visit_can_manage(organization_id,workspace_id))',t||'_update',t); exception when duplicate_object then null; end;begin execute format('create policy %I on public.%I for delete to authenticated using(public.site_visit_can_manage(organization_id,workspace_id))',t||'_delete',t); exception when duplicate_object then null; end;end loop;end$$;
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='site_visits' and policyname='site_visits_workspace_write') then execute $vayon_sql$create policy site_visits_workspace_write on public.site_visits for update to authenticated using(public.site_visit_can_manage(organization_id,workspace_id))with check(public.site_visit_can_manage(organization_id,workspace_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260909000000_sprint80_ai_property_matching.sql
do $$declare t text;begin foreach t in array array['buyer_property_profiles','property_match_signals','property_match_runs','property_match_results','property_shortlists','property_match_audit']loop begin execute format('create policy %I on public.%I for select to authenticated using(public.property_match_member(organization_id,workspace_id))',t||'_read',t); exception when duplicate_object then null; end;begin execute format('create policy %I on public.%I for insert to authenticated with check(public.property_match_can_manage(organization_id,workspace_id))',t||'_create',t); exception when duplicate_object then null; end;begin execute format('create policy %I on public.%I for update to authenticated using(public.property_match_can_manage(organization_id,workspace_id)) with check(public.property_match_can_manage(organization_id,workspace_id))',t||'_update',t); exception when duplicate_object then null; end;begin execute format('create policy %I on public.%I for delete to authenticated using(public.property_match_can_manage(organization_id,workspace_id))',t||'_delete',t); exception when duplicate_object then null; end;end loop;end$$;
-- Source: 20260910000000_sprint81_enterprise_communications_hub.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='communication_attachments' and policyname='communication_attachments_read') then execute $vayon_sql$create policy "communication_attachments_read" on public.communication_attachments for select to authenticated using (public.communication_tenant_member(organization_id,workspace_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260910000000_sprint81_enterprise_communications_hub.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='communication_attachments' and policyname='communication_attachments_insert') then execute $vayon_sql$create policy "communication_attachments_insert" on public.communication_attachments for insert to authenticated with check (public.communication_tenant_member(organization_id,workspace_id) and public.communication_can_manage(workspace_id) and created_by=auth.uid())$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260910000000_sprint81_enterprise_communications_hub.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='communication_attachments' and policyname='communication_attachments_delete') then execute $vayon_sql$create policy "communication_attachments_delete" on public.communication_attachments for delete to authenticated using (public.communication_tenant_member(organization_id,workspace_id) and public.communication_can_manage(workspace_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260910000000_sprint81_enterprise_communications_hub.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='communication_ai_recommendations' and policyname='communication_ai_read') then execute $vayon_sql$create policy "communication_ai_read" on public.communication_ai_recommendations for select to authenticated using (public.communication_tenant_member(organization_id,workspace_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260910000000_sprint81_enterprise_communications_hub.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='communication_ai_recommendations' and policyname='communication_ai_insert') then execute $vayon_sql$create policy "communication_ai_insert" on public.communication_ai_recommendations for insert to authenticated with check (public.communication_tenant_member(organization_id,workspace_id) and public.communication_can_manage(workspace_id) and created_by=auth.uid() and recommendation_only=true)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260910000000_sprint81_enterprise_communications_hub.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='communication_ai_recommendations' and policyname='communication_ai_update') then execute $vayon_sql$create policy "communication_ai_update" on public.communication_ai_recommendations for update to authenticated using (public.communication_tenant_member(organization_id,workspace_id) and public.communication_can_manage(workspace_id)) with check (public.communication_tenant_member(organization_id,workspace_id) and recommendation_only=true)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260910000000_sprint81_enterprise_communications_hub.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='communication_audit' and policyname='communication_audit_read') then execute $vayon_sql$create policy "communication_audit_read" on public.communication_audit for select to authenticated using (public.communication_tenant_member(organization_id,workspace_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260910000000_sprint81_enterprise_communications_hub.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='communication_audit' and policyname='communication_audit_insert') then execute $vayon_sql$create policy "communication_audit_insert" on public.communication_audit for insert to authenticated with check (public.communication_tenant_member(organization_id,workspace_id) and actor_id=auth.uid())$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='creative_brand_kits' and policyname='creative_brand_read') then execute $vayon_sql$create policy "creative_brand_read" on public.creative_brand_kits for select to authenticated using(public.creative_studio_member(organization_id,workspace_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='creative_brand_kits' and policyname='creative_brand_write') then execute $vayon_sql$create policy "creative_brand_write" on public.creative_brand_kits for all to authenticated using(public.creative_studio_member(organization_id,workspace_id)and public.creative_studio_manage(workspace_id))with check(public.creative_studio_member(organization_id,workspace_id)and public.creative_studio_manage(workspace_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='creative_campaigns' and policyname='creative_campaign_read') then execute $vayon_sql$create policy "creative_campaign_read" on public.creative_campaigns for select to authenticated using(public.creative_studio_member(organization_id,workspace_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='creative_campaigns' and policyname='creative_campaign_write') then execute $vayon_sql$create policy "creative_campaign_write" on public.creative_campaigns for all to authenticated using(public.creative_studio_member(organization_id,workspace_id)and public.creative_studio_manage(workspace_id))with check(public.creative_studio_member(organization_id,workspace_id)and public.creative_studio_manage(workspace_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='creative_assets' and policyname='creative_asset_read') then execute $vayon_sql$create policy "creative_asset_read" on public.creative_assets for select to authenticated using(public.creative_studio_member(organization_id,workspace_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='creative_assets' and policyname='creative_asset_write') then execute $vayon_sql$create policy "creative_asset_write" on public.creative_assets for all to authenticated using(public.creative_studio_member(organization_id,workspace_id)and public.creative_studio_manage(workspace_id))with check(public.creative_studio_member(organization_id,workspace_id)and public.creative_studio_manage(workspace_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='creative_timeline' and policyname='creative_timeline_read') then execute $vayon_sql$create policy "creative_timeline_read" on public.creative_timeline for select to authenticated using(public.creative_studio_member(organization_id,workspace_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='creative_timeline' and policyname='creative_timeline_insert') then execute $vayon_sql$create policy "creative_timeline_insert" on public.creative_timeline for insert to authenticated with check(public.creative_studio_member(organization_id,workspace_id)and actor_id=auth.uid())$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='creative_generation_jobs' and policyname='creative_jobs_read') then execute $vayon_sql$create policy "creative_jobs_read" on public.creative_generation_jobs for select to authenticated using(public.creative_studio_member(organization_id,workspace_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='creative_editor_documents' and policyname='creative_editor_read') then execute $vayon_sql$create policy "creative_editor_read" on public.creative_editor_documents for select to authenticated using(public.creative_studio_member(organization_id,workspace_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='creative_editor_documents' and policyname='creative_editor_write') then execute $vayon_sql$create policy "creative_editor_write" on public.creative_editor_documents for all to authenticated using(public.creative_studio_member(organization_id,workspace_id)and public.creative_studio_manage(workspace_id))with check(public.creative_studio_member(organization_id,workspace_id)and public.creative_studio_manage(workspace_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260913000000_sprint82_6_ai_growth_studio.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='creative_campaign_packs' and policyname='creative_pack_read') then execute $vayon_sql$create policy "creative_pack_read" on public.creative_campaign_packs for select to authenticated using(public.creative_studio_member(organization_id,workspace_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260913000000_sprint82_6_ai_growth_studio.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='creative_campaign_packs' and policyname='creative_pack_write') then execute $vayon_sql$create policy "creative_pack_write" on public.creative_campaign_packs for all to authenticated using(public.creative_studio_member(organization_id,workspace_id) and public.creative_studio_manage(workspace_id)) with check(public.creative_studio_member(organization_id,workspace_id) and public.creative_studio_manage(workspace_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260913000000_sprint82_6_ai_growth_studio.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='creative_campaign_schedule' and policyname='creative_schedule_read') then execute $vayon_sql$create policy "creative_schedule_read" on public.creative_campaign_schedule for select to authenticated using(public.creative_studio_member(organization_id,workspace_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260913000000_sprint82_6_ai_growth_studio.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='creative_campaign_schedule' and policyname='creative_schedule_write') then execute $vayon_sql$create policy "creative_schedule_write" on public.creative_campaign_schedule for all to authenticated using(public.creative_studio_member(organization_id,workspace_id) and public.creative_studio_manage(workspace_id)) with check(public.creative_studio_member(organization_id,workspace_id) and public.creative_studio_manage(workspace_id) and publishing_enabled=false)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260913000000_sprint82_6_ai_growth_studio.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='creative_growth_reviews' and policyname='creative_review_read') then execute $vayon_sql$create policy "creative_review_read" on public.creative_growth_reviews for select to authenticated using(public.creative_studio_member(organization_id,workspace_id))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260913000000_sprint82_6_ai_growth_studio.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='creative_growth_reviews' and policyname='creative_review_write') then execute $vayon_sql$create policy "creative_review_write" on public.creative_growth_reviews for all to authenticated using(public.creative_studio_member(organization_id,workspace_id) and public.creative_studio_manage(workspace_id)) with check(public.creative_studio_member(organization_id,workspace_id) and public.creative_studio_manage(workspace_id) and recommendation_only=true)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260914000000_sprint83_enterprise_commercial_platform.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='commercial_provider_customers' and policyname='commercial_customer_read') then execute $vayon_sql$create policy "commercial_customer_read" on public.commercial_provider_customers for select to authenticated using(public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','billing_admin','finance','finance_manager','finance_analyst','read_only'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260914000000_sprint83_enterprise_commercial_platform.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='workspace_feature_licenses' and policyname='feature_license_read') then execute $vayon_sql$create policy "feature_license_read" on public.workspace_feature_licenses for select to authenticated using(public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)is not null)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260914000000_sprint83_enterprise_commercial_platform.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='workspace_feature_licenses' and policyname='feature_license_manage') then execute $vayon_sql$create policy "feature_license_manage" on public.workspace_feature_licenses for all to authenticated using(public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','billing_admin'))with check(public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','billing_admin'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260914000000_sprint83_enterprise_commercial_platform.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='commercial_webhook_events' and policyname='commercial_events_read') then execute $vayon_sql$create policy "commercial_events_read" on public.commercial_webhook_events for select to authenticated using(organization_id is not null and public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','billing_admin','finance','finance_manager','finance_analyst','read_only'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='knowledge_article_relations' and policyname='knowledge relations tenant read') then execute $vayon_sql$create policy "knowledge relations tenant read"on public.knowledge_article_relations for select to authenticated using(public.current_workspace_role(workspace_id)is not null)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='knowledge_videos' and policyname='knowledge videos tenant read') then execute $vayon_sql$create policy "knowledge videos tenant read"on public.knowledge_videos for select to authenticated using(public.current_workspace_role(workspace_id)is not null)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='knowledge_quality_feedback' and policyname='knowledge quality admin read') then execute $vayon_sql$create policy "knowledge quality admin read"on public.knowledge_quality_feedback for select to authenticated using(public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','manager'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260917000000_sprint86_4_product_intelligence.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='product_intelligence_events' and policyname='product intelligence admin read') then execute $vayon_sql$create policy "product intelligence admin read"on public.product_intelligence_events for select to authenticated using(public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','manager'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260917000000_sprint86_4_product_intelligence.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='product_feedback' and policyname='product feedback admin read') then execute $vayon_sql$create policy "product feedback admin read"on public.product_feedback for select to authenticated using(public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','manager'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260917000000_sprint86_4_product_intelligence.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='product feedback screenshot create') then execute $vayon_sql$create policy "product feedback screenshot create"on storage.objects for insert to authenticated with check(bucket_id='product-feedback'and public.current_workspace_role((storage.foldername(name))[2]::uuid)is not null)$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260917000000_sprint86_4_product_intelligence.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='product feedback screenshot admin read') then execute $vayon_sql$create policy "product feedback screenshot admin read"on storage.objects for select to authenticated using(bucket_id='product-feedback'and public.current_workspace_role((storage.foldername(name))[2]::uuid)in('organization_owner','organization_admin','manager'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260918000000_sprint86_5_continuous_learning.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='intelligence_memory' and policyname='intelligence memory tenant read') then execute $vayon_sql$create policy "intelligence memory tenant read" on public.intelligence_memory for select to authenticated using (public.current_workspace_role(workspace_id) is not null and (scope='organization' or user_id=auth.uid()))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260918000000_sprint86_5_continuous_learning.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='continuous_learning_aggregates' and policyname='learning aggregate admin read') then execute $vayon_sql$create policy "learning aggregate admin read" on public.continuous_learning_aggregates for select to authenticated using (public.current_workspace_role(workspace_id) in ('organization_owner','organization_admin','manager'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260918000000_sprint86_5_continuous_learning.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='executive_intelligence_briefings' and policyname='executive briefing admin read') then execute $vayon_sql$create policy "executive briefing admin read" on public.executive_intelligence_briefings for select to authenticated using (public.current_workspace_role(workspace_id) in ('organization_owner','organization_admin','manager'))$vayon_sql$; end if; end $vayon_policy$;
-- Source: 20260918000000_sprint86_5_continuous_learning.sql
do $vayon_policy$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='continuous_learning_jobs' and policyname='learning job admin read') then execute $vayon_sql$create policy "learning job admin read" on public.continuous_learning_jobs for select to authenticated using (public.current_workspace_role(workspace_id) in ('organization_owner','organization_admin','manager'))$vayon_sql$; end if; end $vayon_policy$;

-- TRIGGERS (final Version 1 definitions)
-- Source: 20260814000000_sprint43_google_identity_workspace.sql
do $vayon_trigger$ begin if not exists(select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname='auth' and c.relname='users' and t.tgname='on_auth_user_profile') then execute $vayon_sql$create trigger on_auth_user_profile after insert or update of email, raw_user_meta_data on auth.users for each row execute function public.handle_new_user_profile()$vayon_sql$; end if; end $vayon_trigger$;
-- Source: 20260821000000_sprint57_ai_collaboration.sql
do $vayon_trigger$ begin if not exists(select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname='public' and c.relname='ai_collaboration_runs' and t.tgname='audit_ai_collaboration_run') then execute $vayon_sql$create trigger audit_ai_collaboration_run after insert or update on public.ai_collaboration_runs for each row execute function public.audit_ai_collaboration()$vayon_sql$; end if; end $vayon_trigger$;
-- Source: 20260821000000_sprint57_ai_collaboration.sql
do $vayon_trigger$ begin if not exists(select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname='public' and c.relname='ai_collaboration_recommendations' and t.tgname='audit_ai_collaboration_recommendation') then execute $vayon_sql$create trigger audit_ai_collaboration_recommendation after insert on public.ai_collaboration_recommendations for each row execute function public.audit_ai_collaboration()$vayon_sql$; end if; end $vayon_trigger$;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
do $vayon_trigger$ begin if not exists(select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname='public' and c.relname='ai_recommendations' and t.tgname='ai_recommendation_notification') then execute $vayon_sql$create trigger ai_recommendation_notification after insert on public.ai_recommendations for each row execute function public.notify_ai_recommendation()$vayon_sql$; end if; end $vayon_trigger$;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
do $vayon_trigger$ begin if not exists(select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname='public' and c.relname='ai_approval_queue' and t.tgname='ai_approval_notification') then execute $vayon_sql$create trigger ai_approval_notification after insert or update of status on public.ai_approval_queue for each row execute function public.notify_ai_approval()$vayon_sql$; end if; end $vayon_trigger$;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
do $vayon_trigger$ begin if not exists(select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname='public' and c.relname='security_alerts' and t.tgname='security_alert_notification') then execute $vayon_sql$create trigger security_alert_notification after insert on public.security_alerts for each row execute function public.notify_security_alert()$vayon_sql$; end if; end $vayon_trigger$;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
do $vayon_trigger$ begin if not exists(select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname='public' and c.relname='billing_events' and t.tgname='billing_event_notification') then execute $vayon_sql$create trigger billing_event_notification after insert or update of status on public.billing_events for each row execute function public.notify_billing_event()$vayon_sql$; end if; end $vayon_trigger$;

-- GRANTS (final Version 1 definitions)
-- Source: 20260814000000_sprint43_google_identity_workspace.sql
revoke all on function public.record_identity_audit(text,uuid,uuid,text,jsonb), public.update_user_profile(jsonb), public.complete_sprint43_onboarding(jsonb), public.create_team_invitation(uuid,text,text,text), public.set_organization_logo(uuid,text) from public;
-- Source: 20260814000000_sprint43_google_identity_workspace.sql
grant execute on function public.record_identity_audit(text,uuid,uuid,text,jsonb), public.update_user_profile(jsonb), public.complete_sprint43_onboarding(jsonb), public.create_team_invitation(uuid,text,text,text), public.set_organization_logo(uuid,text) to authenticated;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
revoke all on function public.record_billing_usage(uuid,text,numeric,text),public.process_stripe_billing_event(text,text,jsonb) from public;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
grant execute on function public.record_billing_usage(uuid,text,numeric,text) to authenticated,service_role;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
grant execute on function public.process_stripe_billing_event(text,text,jsonb) to service_role;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
revoke all on function public.reactivate_subscription(uuid,integer)from public;
-- Source: 20260815020000_sprint50_stripe_billing_platform.sql
grant execute on function public.reactivate_subscription(uuid,integer)to authenticated;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
revoke all on function public.enterprise_org_context(uuid,boolean),public.update_enterprise_organization(uuid,jsonb),public.set_enterprise_organization_logo(uuid,text),public.invite_organization_member(uuid,text,text,text),public.resend_organization_invitation(uuid,uuid),public.cancel_organization_invitation(uuid,uuid),public.accept_organization_invitation(),public.change_organization_member_role(uuid,uuid,text),public.set_organization_member_status(uuid,uuid,text),public.remove_organization_member(uuid,uuid),public.transfer_organization_ownership(uuid,uuid,text)from public;
-- Source: 20260820000000_sprint51_enterprise_organization.sql
grant execute on function public.update_enterprise_organization(uuid,jsonb),public.set_enterprise_organization_logo(uuid,text),public.invite_organization_member(uuid,text,text,text),public.resend_organization_invitation(uuid,uuid),public.cancel_organization_invitation(uuid,uuid),public.accept_organization_invitation(),public.change_organization_member_role(uuid,uuid,text),public.set_organization_member_status(uuid,uuid,text),public.remove_organization_member(uuid,uuid),public.transfer_organization_ownership(uuid,uuid,text)to authenticated;
-- Source: 20260822000000_sprint58_enterprise_security.sql
revoke all on function public.switch_current_organization(uuid,uuid),public.create_personal_access_token(uuid,text,text,text,text[],timestamptz),public.revoke_personal_access_token(uuid),public.record_authentication_attempt(text,text,text,integer,boolean,text,text),public.check_auth_rate_limit(text),public.replace_mfa_recovery_codes(text[]),public.revoke_other_identity_sessions(),public.trust_identity_device(text,text),public.remove_identity_device(uuid),public.upsert_identity_session(text,text,text,text,timestamptz)from public;
-- Source: 20260822000000_sprint58_enterprise_security.sql
grant execute on function public.switch_current_organization(uuid,uuid),public.create_personal_access_token(uuid,text,text,text,text[],timestamptz),public.revoke_personal_access_token(uuid),public.replace_mfa_recovery_codes(text[]),public.revoke_other_identity_sessions(),public.trust_identity_device(text,text),public.remove_identity_device(uuid),public.upsert_identity_session(text,text,text,text,timestamptz)to authenticated;
-- Source: 20260822000000_sprint58_enterprise_security.sql
grant execute on function public.record_authentication_attempt(text,text,text,integer,boolean,text,text),public.check_auth_rate_limit(text)to anon,authenticated;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
revoke all on function public.mutate_notification(uuid,text,timestamptz),public.save_notification_preferences(jsonb),public.schedule_notification_reminder(jsonb),public.notification_observability(uuid)from public;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
grant execute on function public.mutate_notification(uuid,text,timestamptz),public.save_notification_preferences(jsonb),public.schedule_notification_reminder(jsonb),public.notification_observability(uuid)to authenticated;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
revoke all on function public.process_due_notification_reminders(integer)from public;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
grant execute on function public.process_due_notification_reminders(integer)to service_role;
-- Source: 20260823000000_sprint59_enterprise_notifications.sql
grant select on public.notification_queue,public.notification_reminders to authenticated;
-- Source: 20260824000000_sprint60_enterprise_email.sql
revoke all on function public.enqueue_email_message(uuid,jsonb),public.claim_email_message(text),public.complete_email_message(uuid,boolean,text,integer,text),public.retry_email_message(uuid,uuid),public.save_email_template(uuid,jsonb),public.email_delivery_statistics(uuid),public.can_manage_email_platform(uuid)from public;
-- Source: 20260824000000_sprint60_enterprise_email.sql
grant execute on function public.enqueue_email_message(uuid,jsonb),public.retry_email_message(uuid,uuid),public.save_email_template(uuid,jsonb),public.email_delivery_statistics(uuid),public.can_manage_email_platform(uuid)to authenticated;
-- Source: 20260824000000_sprint60_enterprise_email.sql
grant execute on function public.enqueue_email_message(uuid,jsonb),public.claim_email_message(text),public.complete_email_message(uuid,boolean,text,integer,text)to service_role;
-- Source: 20260824000000_sprint60_enterprise_email.sql
grant select on public.email_templates,public.email_messages,public.email_delivery_attempts to authenticated;
-- Source: 20260825000000_sprint61_enterprise_workflow_automation.sql
revoke all on function public.enqueue_workflow_trigger(uuid,text,text,text,text,jsonb) from public,authenticated;
-- Source: 20260825000000_sprint61_enterprise_workflow_automation.sql
grant execute on function public.enqueue_workflow_trigger(uuid,text,text,text,text,jsonb) to service_role;
-- Source: 20260825000000_sprint61_enterprise_workflow_automation.sql
grant execute on function public.can_manage_workflow_automation(uuid),public.save_workflow_definition(uuid,jsonb),public.publish_workflow_definition(uuid,uuid,integer) to authenticated;
-- Source: 20260826000000_sprint62_enterprise_customer_onboarding.sql
revoke all on function public.get_enterprise_onboarding_session(),public.save_enterprise_onboarding_progress(integer,jsonb,integer[],boolean),public.complete_enterprise_onboarding() from public;
-- Source: 20260826000000_sprint62_enterprise_customer_onboarding.sql
grant execute on function public.get_enterprise_onboarding_session(),public.save_enterprise_onboarding_progress(integer,jsonb,integer[],boolean),public.complete_enterprise_onboarding() to authenticated;
-- Source: 20260827000000_sprint63_enterprise_knowledge_platform.sql
revoke all on function public.register_knowledge_document(uuid,text,text,text,text,text[]),public.search_enterprise_knowledge(uuid,text,text,text[],integer),public.record_knowledge_feedback(uuid,uuid,boolean),public.enterprise_knowledge_dashboard(uuid)from public;
-- Source: 20260827000000_sprint63_enterprise_knowledge_platform.sql
grant execute on function public.register_knowledge_document(uuid,text,text,text,text,text[]),public.search_enterprise_knowledge(uuid,text,text,text[],integer),public.record_knowledge_feedback(uuid,uuid,boolean),public.enterprise_knowledge_dashboard(uuid)to authenticated;
-- Source: 20260828000000_sprint64_production_deployment_platform.sql
revoke all on public.deployment_migration_history,public.deployment_releases from anon;
-- Source: 20260828000000_sprint64_production_deployment_platform.sql
grant select on public.deployment_migration_history,public.deployment_releases to authenticated;
-- Source: 20260829000000_sprint65_enterprise_performance_optimization.sql
revoke all on function public.enterprise_performance_snapshot(uuid)from public;
-- Source: 20260829000000_sprint65_enterprise_performance_optimization.sql
grant execute on function public.enterprise_performance_snapshot(uuid)to authenticated;
-- Source: 20260830000000_sprint66_enterprise_security_hardening.sql
revoke all on public.security_review_events from anon;
-- Source: 20260830000000_sprint66_enterprise_security_hardening.sql
grant select on public.security_review_events to authenticated;
-- Source: 20260830000000_sprint66_enterprise_security_hardening.sql
revoke all on function public.enterprise_security_rls_audit(uuid)from public;
-- Source: 20260830000000_sprint66_enterprise_security_hardening.sql
grant execute on function public.enterprise_security_rls_audit(uuid)to authenticated;
-- Source: 20260831000000_sprint67_public_marketing_platform.sql
revoke all on public.marketing_leads,public.marketing_events from anon,authenticated;
-- Source: 20260831000000_sprint67_public_marketing_platform.sql
revoke all on function public.capture_public_marketing_lead(jsonb),public.record_public_marketing_event(jsonb)from public;
-- Source: 20260831000000_sprint67_public_marketing_platform.sql
grant execute on function public.capture_public_marketing_lead(jsonb),public.record_public_marketing_event(jsonb)to anon,authenticated;
-- Source: 20260901000000_sprint68_documentation_platform.sql
revoke all on public.documentation_events from anon, authenticated;
-- Source: 20260901000000_sprint68_documentation_platform.sql
revoke all on function public.record_documentation_event(jsonb) from public;
-- Source: 20260901000000_sprint68_documentation_platform.sql
grant execute on function public.record_documentation_event(jsonb) to anon, authenticated;
-- Source: 20260902000000_sprint69_marketing_asset_observability.sql
revoke all on function public.record_public_marketing_event(jsonb)from public;
-- Source: 20260902000000_sprint69_marketing_asset_observability.sql
grant execute on function public.record_public_marketing_event(jsonb)to anon,authenticated;
-- Source: 20260902120000_sprint69_2_enterprise_conversion_analytics.sql
revoke all on public.workspace_analytics_events from anon,authenticated;
-- Source: 20260902120000_sprint69_2_enterprise_conversion_analytics.sql
revoke all on function public.record_workspace_analytics_event(uuid,jsonb)from public;
-- Source: 20260902120000_sprint69_2_enterprise_conversion_analytics.sql
grant execute on function public.record_workspace_analytics_event(uuid,jsonb)to authenticated;
-- Source: 20260902120000_sprint69_2_enterprise_conversion_analytics.sql
revoke all on function public.record_public_marketing_event(jsonb)from public;
-- Source: 20260902120000_sprint69_2_enterprise_conversion_analytics.sql
grant execute on function public.record_public_marketing_event(jsonb)to anon,authenticated;
-- Source: 20260902180000_sprint69_5_launch_readiness_audit.sql
revoke all on public.launch_readiness_audit_runs from anon,authenticated;
-- Source: 20260902180000_sprint69_5_launch_readiness_audit.sql
revoke all on function public.record_launch_readiness_audit(uuid,jsonb)from public;
-- Source: 20260902180000_sprint69_5_launch_readiness_audit.sql
grant execute on function public.record_launch_readiness_audit(uuid,jsonb)to authenticated;
-- Source: 20260906000000_sprint76_enterprise_organization_management.sql
revoke all on function public.manage_organization_department(uuid,text,uuid,jsonb),public.manage_organization_team(uuid,text,uuid,jsonb) from public;
-- Source: 20260906000000_sprint76_enterprise_organization_management.sql
grant execute on function public.manage_organization_department(uuid,text,uuid,jsonb),public.manage_organization_team(uuid,text,uuid,jsonb) to authenticated;
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
revoke all on function public.transition_property_unit(uuid,uuid,text,text,uuid,boolean) from public;
-- Source: 20260907000000_sprint78_enterprise_property_inventory.sql
grant execute on function public.transition_property_unit(uuid,uuid,text,text,uuid,boolean) to authenticated;
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
revoke all on function public.manage_site_visit_lifecycle(uuid,uuid,integer,text,jsonb)from public;
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
grant execute on function public.manage_site_visit_lifecycle(uuid,uuid,integer,text,jsonb)to authenticated;
-- Source: 20260908000000_sprint79_enterprise_site_visits.sql
grant execute on function public.site_visit_agent_availability(uuid)to authenticated;
-- Source: 20260909000000_sprint80_ai_property_matching.sql
revoke all on function public.save_property_shortlist(uuid,jsonb)from public;
-- Source: 20260909000000_sprint80_ai_property_matching.sql
grant execute on function public.save_property_shortlist(uuid,jsonb)to authenticated;
-- Source: 20260910000000_sprint81_enterprise_communications_hub.sql
revoke all on function public.add_enterprise_communication_note(uuid,text,boolean,uuid[]) from public;
-- Source: 20260910000000_sprint81_enterprise_communications_hub.sql
grant execute on function public.add_enterprise_communication_note(uuid,text,boolean,uuid[]) to authenticated;
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
revoke all on function public.creative_studio_access()from public;
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
grant execute on function public.creative_studio_access()to authenticated;
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
revoke all on function public.create_creative_campaign_draft(jsonb)from public;
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
grant execute on function public.create_creative_campaign_draft(jsonb)to authenticated;
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
revoke all on function public.advance_creative_campaign(uuid,integer,text)from public;
-- Source: 20260911000000_sprint82_creative_studio_beta.sql
grant execute on function public.advance_creative_campaign(uuid,integer,text)to authenticated;
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
revoke all on function public.enqueue_creative_generation(jsonb)from public;
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
grant execute on function public.enqueue_creative_generation(jsonb)to authenticated;
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
revoke all on function public.claim_creative_generation(uuid)from public;
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
grant execute on function public.claim_creative_generation(uuid)to service_role;
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
revoke all on function public.complete_creative_generation(uuid,boolean,text,text,text,integer,text,text)from public;
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
grant execute on function public.complete_creative_generation(uuid,boolean,text,text,text,integer,text,text)to service_role;
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
revoke all on function public.autosave_creative_editor(uuid,integer,jsonb)from public;
-- Source: 20260912000000_sprint82_5_ai_creative_generation.sql
grant execute on function public.autosave_creative_editor(uuid,integer,jsonb)to authenticated;
-- Source: 20260913000000_sprint82_6_ai_growth_studio.sql
revoke all on function public.create_growth_campaign_pack(uuid,text,text[])from public;
-- Source: 20260913000000_sprint82_6_ai_growth_studio.sql
grant execute on function public.create_growth_campaign_pack(uuid,text,text[])to authenticated;
-- Source: 20260914000000_sprint83_enterprise_commercial_platform.sql
revoke all on function public.workspace_feature_licensed(uuid,text)from public;
-- Source: 20260914000000_sprint83_enterprise_commercial_platform.sql
grant execute on function public.workspace_feature_licensed(uuid,text)to authenticated;
-- Source: 20260914000000_sprint83_enterprise_commercial_platform.sql
revoke all on function public.record_commercial_webhook(text,text,text,jsonb,uuid)from public;
-- Source: 20260914000000_sprint83_enterprise_commercial_platform.sql
grant execute on function public.record_commercial_webhook(text,text,text,jsonb,uuid)to service_role;
-- Source: 20260916000000_sprint84_2_public_contact_reliability.sql
revoke all on public.marketing_leads,public.marketing_events from anon,authenticated;
-- Source: 20260916000000_sprint84_2_public_contact_reliability.sql
revoke all on function public.capture_public_marketing_lead(jsonb),public.record_public_marketing_event(jsonb) from public;
-- Source: 20260916000000_sprint84_2_public_contact_reliability.sql
grant execute on function public.capture_public_marketing_lead(jsonb),public.record_public_marketing_event(jsonb) to anon,authenticated;
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
revoke all on function public.transition_knowledge_article(uuid,uuid,text,integer),public.retrieve_trusted_knowledge(uuid,text,text[],text,text,integer),public.record_knowledge_quality_feedback(uuid,text,text,text)from public;
-- Source: 20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql
grant execute on function public.transition_knowledge_article(uuid,uuid,text,integer),public.retrieve_trusted_knowledge(uuid,text,text[],text,text,integer),public.record_knowledge_quality_feedback(uuid,text,text,text)to authenticated;
-- Source: 20260917000000_sprint86_4_product_intelligence.sql
revoke all on public.product_intelligence_events,public.product_feedback from anon,authenticated;
-- Source: 20260917000000_sprint86_4_product_intelligence.sql
revoke all on function public.record_product_intelligence_events(uuid,jsonb),public.submit_product_feedback(uuid,jsonb)from public;
-- Source: 20260917000000_sprint86_4_product_intelligence.sql
grant execute on function public.record_product_intelligence_events(uuid,jsonb),public.submit_product_feedback(uuid,jsonb)to authenticated;
-- Source: 20260918000000_sprint86_5_continuous_learning.sql
revoke all on public.intelligence_memory,public.continuous_learning_aggregates,public.executive_intelligence_briefings,public.continuous_learning_jobs from anon,authenticated;
-- Source: 20260918000000_sprint86_5_continuous_learning.sql
revoke all on function public.upsert_intelligence_memory(uuid,text,text,jsonb),public.store_executive_intelligence_briefing(uuid,jsonb),public.refresh_continuous_learning_aggregates(uuid,date) from public;
-- Source: 20260918000000_sprint86_5_continuous_learning.sql
grant execute on function public.upsert_intelligence_memory(uuid,text,text,jsonb),public.store_executive_intelligence_briefing(uuid,jsonb) to authenticated;
-- Source: 20260918000000_sprint86_5_continuous_learning.sql
grant execute on function public.refresh_continuous_learning_aggregates(uuid,date) to service_role;

-- Reviewed final Version 1 constraint upgrades. These change metadata only and never delete rows.
do $vayon_constraints$ declare current_definition text; begin
  select pg_get_constraintdef(oid,true) into current_definition from pg_constraint where conrelid='public.site_visits'::regclass and conname='site_visits_status_check';
  if current_definition is distinct from 'CHECK (status = ANY (ARRAY[''scheduled''::text, ''confirmed''::text, ''checked_in''::text, ''completed''::text, ''cancelled''::text, ''no_show''::text, ''rescheduled''::text]))' then
    if exists(select 1 from public.site_visits where status not in('scheduled','confirmed','checked_in','completed','cancelled','no_show','rescheduled')) then raise exception 'site_visits contains an incompatible status'; end if;
    alter table public.site_visits drop constraint if exists site_visits_status_check;
    alter table public.site_visits add constraint site_visits_status_check check(status in('scheduled','confirmed','checked_in','completed','cancelled','no_show','rescheduled'));
  end if;
end $vayon_constraints$;

do $vayon_site_visit_constraints$ begin
  if not exists(select 1 from pg_constraint where conrelid='public.site_visits'::regclass and conname='site_visits_type_check') then alter table public.site_visits add constraint site_visits_type_check check(visit_type in('initial','follow_up','virtual_tour','final_inspection')); end if;
  if not exists(select 1 from pg_constraint where conrelid='public.site_visits'::regclass and conname='site_visits_priority_check') then alter table public.site_visits add constraint site_visits_priority_check check(priority in('low','medium','high','urgent')); end if;
  if not exists(select 1 from pg_constraint where conrelid='public.site_visits'::regclass and conname='site_visits_duration_check') then alter table public.site_visits add constraint site_visits_duration_check check(duration_minutes between 15 and 1440); end if;
end $vayon_site_visit_constraints$;

commit;
