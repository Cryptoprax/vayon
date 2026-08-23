-- VAYON Version 1 — definition-aware RLS policies and triggers
-- Generated for manual review. Does not alter migration history.
-- Supabase SQL Editor compatible; no psql meta-commands.
begin;
set local lock_timeout='5s';
set local statement_timeout='120s';

alter table public.user_profiles enable row level security;

alter table public.identity_audit_events enable row level security;

alter table public.billing_customers enable row level security;

alter table public.subscription_items enable row level security;

alter table public.payment_methods enable row level security;

alter table public.billing_events enable row level security;

alter table public.usage_events enable row level security;

alter table public.permissions enable row level security;

alter table public.role_permissions enable row level security;

alter table public.organization_audit_events enable row level security;

alter table public.ai_collaboration_runs enable row level security;

alter table public.ai_collaboration_events enable row level security;

alter table public.ai_collaboration_recommendations enable row level security;

alter table public.identity_sessions enable row level security;

alter table public.trusted_devices enable row level security;

alter table public.security_alerts enable row level security;

alter table public.authentication_attempts enable row level security;

alter table public.personal_access_tokens enable row level security;

alter table public.mfa_recovery_codes enable row level security;

alter table public.user_organization_context enable row level security;

alter table public.notification_reminders enable row level security;

alter table public.email_templates enable row level security;

alter table public.email_messages enable row level security;

alter table public.email_delivery_attempts enable row level security;

alter table public.workflow_definitions enable row level security;

alter table public.workflow_instances enable row level security;

alter table public.workflow_step_executions enable row level security;

alter table public.workflow_trigger_events enable row level security;

alter table public.workflow_automation_approvals enable row level security;

alter table public.onboarding_sessions enable row level security;

alter table public.onboarding_step_events enable row level security;

alter table public.onboarding_import_jobs enable row level security;

alter table public.onboarding_tour_progress enable row level security;

alter table public.onboarding_connection_events enable row level security;

alter table public.onboarding_demo_seed_requests enable row level security;

alter table public.knowledge_articles enable row level security;

alter table public.knowledge_article_versions enable row level security;

alter table public.knowledge_documents enable row level security;

alter table public.knowledge_analytics enable row level security;

alter table public.deployment_migration_history enable row level security;

alter table public.deployment_releases enable row level security;

alter table public.security_review_events enable row level security;

alter table public.marketing_leads enable row level security;

alter table public.marketing_events enable row level security;

alter table public.documentation_events enable row level security;

alter table public.workspace_analytics_events enable row level security;

alter table public.launch_readiness_audit_runs enable row level security;

alter table public.organization_departments enable row level security;

alter table public.organization_teams enable row level security;

alter table public.organization_team_members enable row level security;

alter table public.property_projects enable row level security;

alter table public.property_towers enable row level security;

alter table public.property_units enable row level security;

alter table public.property_price_revisions enable row level security;

alter table public.property_documents enable row level security;

alter table public.property_inventory_audit enable row level security;

alter table public.property_inventory_opportunity_requests enable row level security;

alter table public.site_visit_feedback enable row level security;

alter table public.site_visit_audit enable row level security;

alter table public.site_visit_follow_up_requests enable row level security;

alter table public.buyer_property_profiles enable row level security;

alter table public.property_match_signals enable row level security;

alter table public.property_match_runs enable row level security;

alter table public.property_match_results enable row level security;

alter table public.property_shortlists enable row level security;

alter table public.property_match_audit enable row level security;

alter table public.communication_attachments enable row level security;

alter table public.communication_ai_recommendations enable row level security;

alter table public.communication_audit enable row level security;

alter table public.creative_brand_kits enable row level security;

alter table public.creative_campaigns enable row level security;

alter table public.creative_assets enable row level security;

alter table public.creative_timeline enable row level security;

alter table public.creative_generation_jobs enable row level security;

alter table public.creative_editor_documents enable row level security;

alter table public.creative_campaign_packs enable row level security;

alter table public.creative_campaign_schedule enable row level security;

alter table public.creative_growth_reviews enable row level security;

alter table public.commercial_provider_customers enable row level security;

alter table public.workspace_feature_licenses enable row level security;

alter table public.commercial_webhook_events enable row level security;

alter table public.marketing_leads enable row level security;

alter table public.marketing_events enable row level security;

alter table public.knowledge_article_relations enable row level security;

alter table public.knowledge_videos enable row level security;

alter table public.knowledge_quality_feedback enable row level security;

alter table public.product_intelligence_events enable row level security;

alter table public.product_feedback enable row level security;

alter table public.intelligence_memory enable row level security;

alter table public.continuous_learning_aggregates enable row level security;

alter table public.executive_intelligence_briefings enable row level security;

alter table public.continuous_learning_jobs enable row level security;

-- Definition-aware reconciliation for public.user_profiles.user_profiles_owner_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'user_id=auth.uid()' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='user_profiles_owner_read';
  if not found then execute $definition$create policy "user_profiles_owner_read" on public.user_profiles for select to authenticated using (user_id = auth.uid())$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.user_profiles.user_profiles_owner_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.user_profiles.user_profiles_owner_update
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'UPDATE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'user_id=auth.uid()' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'user_id=auth.uid()' into differs from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='user_profiles_owner_update';
  if not found then execute $definition$create policy "user_profiles_owner_update" on public.user_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.user_profiles.user_profiles_owner_update (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.identity_audit_events.identity_audit_owner_or_member_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'user_id=auth.uid()or(organization_idisnotnullandpublic.is_organization_member(organization_id))' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='identity_audit_events' and policyname='identity_audit_owner_or_member_read';
  if not found then execute $definition$create policy "identity_audit_owner_or_member_read" on public.identity_audit_events for select to authenticated using (
  user_id = auth.uid() or (organization_id is not null and public.is_organization_member(organization_id))
)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.identity_audit_events.identity_audit_owner_or_member_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.subscriptions.subscriptions_billing_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.is_organization_member(organization_id)andpublic.current_workspace_role(workspace_id)in(''organization_owner'',''organization_admin'',''billing_admin'',''finance'',''finance_manager'',''finance_analyst'',''read_only'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='subscriptions' and policyname='subscriptions_billing_read';
  if not found then execute $definition$create policy "subscriptions_billing_read" on public.subscriptions for select to authenticated using(public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','billing_admin','finance','finance_manager','finance_analyst','read_only'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.subscriptions.subscriptions_billing_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.organization_usage.usage_billing_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.is_organization_member(organization_id)andpublic.current_workspace_role(workspace_id)in(''organization_owner'',''organization_admin'',''billing_admin'',''finance'',''finance_manager'',''finance_analyst'',''read_only'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='organization_usage' and policyname='usage_billing_read';
  if not found then execute $definition$create policy "usage_billing_read" on public.organization_usage for select to authenticated using(public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','billing_admin','finance','finance_manager','finance_analyst','read_only'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.organization_usage.usage_billing_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.organization_limits.limits_billing_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.is_organization_member(organization_id)andpublic.current_workspace_role(workspace_id)in(''organization_owner'',''organization_admin'',''billing_admin'',''finance'',''finance_manager'',''finance_analyst'',''read_only'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='organization_limits' and policyname='limits_billing_read';
  if not found then execute $definition$create policy "limits_billing_read" on public.organization_limits for select to authenticated using(public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','billing_admin','finance','finance_manager','finance_analyst','read_only'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.organization_limits.limits_billing_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.invoices.invoices_billing_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.is_organization_member(organization_id)andpublic.current_workspace_role(workspace_id)in(''organization_owner'',''organization_admin'',''billing_admin'',''finance'',''finance_manager'',''finance_analyst'',''read_only'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='invoices' and policyname='invoices_billing_read';
  if not found then execute $definition$create policy "invoices_billing_read" on public.invoices for select to authenticated using(public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','billing_admin','finance','finance_manager','finance_analyst','read_only'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.invoices.invoices_billing_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.billing_contacts.billing_contacts_billing_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.is_organization_member(organization_id)andpublic.current_workspace_role(workspace_id)in(''organization_owner'',''organization_admin'',''billing_admin'',''finance'',''finance_manager'',''finance_analyst'',''read_only'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='billing_contacts' and policyname='billing_contacts_billing_read';
  if not found then execute $definition$create policy "billing_contacts_billing_read" on public.billing_contacts for select to authenticated using(public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','billing_admin','finance','finance_manager','finance_analyst','read_only'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.billing_contacts.billing_contacts_billing_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.billing_customers.billing_customers_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.is_organization_member(organization_id)andpublic.current_workspace_role(workspace_id)in(''organization_owner'',''organization_admin'',''billing_admin'',''finance'',''finance_manager'',''finance_analyst'',''read_only'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='billing_customers' and policyname='billing_customers_read';
  if not found then execute $definition$create policy "billing_customers_read" on public.billing_customers for select to authenticated using(public.is_organization_member(organization_id) and public.current_workspace_role(workspace_id) in('organization_owner','organization_admin','billing_admin','finance','finance_manager','finance_analyst','read_only'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.billing_customers.billing_customers_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.subscription_items.subscription_items_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.is_organization_member(organization_id)andpublic.current_workspace_role(workspace_id)in(''organization_owner'',''organization_admin'',''billing_admin'',''finance'',''finance_manager'',''finance_analyst'',''read_only'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='subscription_items' and policyname='subscription_items_read';
  if not found then execute $definition$create policy "subscription_items_read" on public.subscription_items for select to authenticated using(public.is_organization_member(organization_id) and public.current_workspace_role(workspace_id) in('organization_owner','organization_admin','billing_admin','finance','finance_manager','finance_analyst','read_only'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.subscription_items.subscription_items_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.payment_methods.payment_methods_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.is_organization_member(organization_id)andpublic.current_workspace_role(workspace_id)in(''organization_owner'',''organization_admin'',''billing_admin'',''finance'',''finance_manager'',''finance_analyst'',''read_only'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='payment_methods' and policyname='payment_methods_read';
  if not found then execute $definition$create policy "payment_methods_read" on public.payment_methods for select to authenticated using(public.is_organization_member(organization_id) and public.current_workspace_role(workspace_id) in('organization_owner','organization_admin','billing_admin','finance','finance_manager','finance_analyst','read_only'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.payment_methods.payment_methods_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.billing_events.billing_events_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.is_organization_member(organization_id)andpublic.current_workspace_role(workspace_id)in(''organization_owner'',''organization_admin'',''billing_admin'',''finance'',''finance_manager'',''finance_analyst'',''read_only'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='billing_events' and policyname='billing_events_read';
  if not found then execute $definition$create policy "billing_events_read" on public.billing_events for select to authenticated using(public.is_organization_member(organization_id) and public.current_workspace_role(workspace_id) in('organization_owner','organization_admin','billing_admin','finance','finance_manager','finance_analyst','read_only'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.billing_events.billing_events_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.usage_events.usage_events_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.is_organization_member(organization_id)andpublic.current_workspace_role(workspace_id)in(''organization_owner'',''organization_admin'',''billing_admin'',''finance'',''finance_manager'',''finance_analyst'',''read_only'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='usage_events' and policyname='usage_events_read';
  if not found then execute $definition$create policy "usage_events_read" on public.usage_events for select to authenticated using(public.is_organization_member(organization_id) and public.current_workspace_role(workspace_id) in('organization_owner','organization_admin','billing_admin','finance','finance_manager','finance_analyst','read_only'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.usage_events.usage_events_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.permissions.permissions_authenticated_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'true' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='permissions' and policyname='permissions_authenticated_read';
  if not found then execute $definition$create policy "permissions_authenticated_read" on public.permissions for select to authenticated using(true)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.permissions.permissions_authenticated_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.role_permissions.role_permissions_authenticated_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'true' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='role_permissions' and policyname='role_permissions_authenticated_read';
  if not found then execute $definition$create policy "role_permissions_authenticated_read" on public.role_permissions for select to authenticated using(true)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.role_permissions.role_permissions_authenticated_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.organization_audit_events.organization_audit_member_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.is_organization_member(organization_id)andexists(select1fromworkspace_memberswmwherewm.workspace_id=organization_audit_events.workspace_idandwm.user_id=auth.uid()andwm.status=''active'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='organization_audit_events' and policyname='organization_audit_member_read';
  if not found then execute $definition$create policy "organization_audit_member_read" on public.organization_audit_events for select to authenticated using(public.is_organization_member(organization_id)and exists(select 1 from workspace_members wm where wm.workspace_id=organization_audit_events.workspace_id and wm.user_id=auth.uid()and wm.status='active'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.organization_audit_events.organization_audit_member_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.user_profiles.organization_profiles_peer_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'user_id=auth.uid()orexists(select1fromorganization_membersminejoinorganization_memberspeeronpeer.organization_id=mine.organization_idwheremine.user_id=auth.uid()andmine.status=''active''andpeer.user_id=user_profiles.user_idandpeer.statusin(''active'',''suspended''))' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='organization_profiles_peer_read';
  if not found then execute $definition$create policy "organization_profiles_peer_read" on public.user_profiles for select to authenticated using(user_id=auth.uid()or exists(select 1 from organization_members mine join organization_members peer on peer.organization_id=mine.organization_id where mine.user_id=auth.uid()and mine.status='active'and peer.user_id=user_profiles.user_id and peer.status in('active','suspended')))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.user_profiles.organization_profiles_peer_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.ai_collaboration_runs.collaboration_run_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.is_organization_member(organization_id)andpublic.current_workspace_role(workspace_id)isnotnull' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='ai_collaboration_runs' and policyname='collaboration_run_read';
  if not found then execute $definition$create policy "collaboration_run_read" on public.ai_collaboration_runs for select to authenticated using(public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)is not null)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.ai_collaboration_runs.collaboration_run_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.ai_collaboration_runs.collaboration_run_insert
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'INSERT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'created_by=auth.uid()andrecommendation_onlyandapproval_requiredandpublic.is_organization_member(organization_id)andpublic.current_workspace_role(workspace_id)isnotnull' into differs from pg_policies where schemaname='public' and tablename='ai_collaboration_runs' and policyname='collaboration_run_insert';
  if not found then execute $definition$create policy "collaboration_run_insert" on public.ai_collaboration_runs for insert to authenticated with check(created_by=auth.uid()and recommendation_only and approval_required and public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)is not null)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.ai_collaboration_runs.collaboration_run_insert (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.ai_collaboration_runs.collaboration_run_update
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'UPDATE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'created_by=auth.uid()andpublic.is_organization_member(organization_id)andpublic.current_workspace_role(workspace_id)isnotnull' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'created_by=auth.uid()andrecommendation_onlyandapproval_required' into differs from pg_policies where schemaname='public' and tablename='ai_collaboration_runs' and policyname='collaboration_run_update';
  if not found then execute $definition$create policy "collaboration_run_update" on public.ai_collaboration_runs for update to authenticated using(created_by=auth.uid()and public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)is not null)with check(created_by=auth.uid()and recommendation_only and approval_required)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.ai_collaboration_runs.collaboration_run_update (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.ai_collaboration_events.collaboration_event_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.is_organization_member(organization_id)andpublic.current_workspace_role(workspace_id)isnotnull' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='ai_collaboration_events' and policyname='collaboration_event_read';
  if not found then execute $definition$create policy "collaboration_event_read" on public.ai_collaboration_events for select to authenticated using(public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)is not null)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.ai_collaboration_events.collaboration_event_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.ai_collaboration_events.collaboration_event_insert
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'INSERT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'created_by=auth.uid()andpublic.is_organization_member(organization_id)andpublic.current_workspace_role(workspace_id)isnotnullandexists(select1frompublic.ai_collaboration_runsrwherer.id=run_idandr.organization_id=organization_idandr.workspace_id=workspace_id)' into differs from pg_policies where schemaname='public' and tablename='ai_collaboration_events' and policyname='collaboration_event_insert';
  if not found then execute $definition$create policy "collaboration_event_insert" on public.ai_collaboration_events for insert to authenticated with check(created_by=auth.uid()and public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)is not null and exists(select 1 from public.ai_collaboration_runs r where r.id=run_id and r.organization_id=organization_id and r.workspace_id=workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.ai_collaboration_events.collaboration_event_insert (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.ai_collaboration_recommendations.collaboration_recommendation_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.is_organization_member(organization_id)andpublic.current_workspace_role(workspace_id)isnotnull' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='ai_collaboration_recommendations' and policyname='collaboration_recommendation_read';
  if not found then execute $definition$create policy "collaboration_recommendation_read" on public.ai_collaboration_recommendations for select to authenticated using(public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)is not null)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.ai_collaboration_recommendations.collaboration_recommendation_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.ai_collaboration_recommendations.collaboration_recommendation_insert
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'INSERT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'created_by=auth.uid()andrecommendation_onlyandapproval_status=''pending''andpublic.is_organization_member(organization_id)andpublic.current_workspace_role(workspace_id)isnotnullandexists(select1frompublic.ai_collaboration_runsrwherer.id=run_idandr.organization_id=organization_idandr.workspace_id=workspace_id)' into differs from pg_policies where schemaname='public' and tablename='ai_collaboration_recommendations' and policyname='collaboration_recommendation_insert';
  if not found then execute $definition$create policy "collaboration_recommendation_insert" on public.ai_collaboration_recommendations for insert to authenticated with check(created_by=auth.uid()and recommendation_only and approval_status='pending'and public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)is not null and exists(select 1 from public.ai_collaboration_runs r where r.id=run_id and r.organization_id=organization_id and r.workspace_id=workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.ai_collaboration_recommendations.collaboration_recommendation_insert (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.identity_sessions.identity_session_owner
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'user_id=auth.uid()' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='identity_sessions' and policyname='identity_session_owner';
  if not found then execute $definition$create policy "identity_session_owner" on public.identity_sessions for select to authenticated using(user_id=auth.uid())$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.identity_sessions.identity_session_owner (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.trusted_devices.trusted_device_owner
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'user_id=auth.uid()' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='trusted_devices' and policyname='trusted_device_owner';
  if not found then execute $definition$create policy "trusted_device_owner" on public.trusted_devices for select to authenticated using(user_id=auth.uid())$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.trusted_devices.trusted_device_owner (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.security_alerts.security_alert_owner
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'user_id=auth.uid()' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='security_alerts' and policyname='security_alert_owner';
  if not found then execute $definition$create policy "security_alert_owner" on public.security_alerts for select to authenticated using(user_id=auth.uid())$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.security_alerts.security_alert_owner (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.authentication_attempts.authentication_attempt_owner
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'user_id=auth.uid()' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='authentication_attempts' and policyname='authentication_attempt_owner';
  if not found then execute $definition$create policy "authentication_attempt_owner" on public.authentication_attempts for select to authenticated using(user_id=auth.uid())$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.authentication_attempts.authentication_attempt_owner (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.personal_access_tokens.pat_owner_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'user_id=auth.uid()andpublic.is_organization_member(organization_id)andpublic.current_workspace_role(workspace_id)isnotnull' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='personal_access_tokens' and policyname='pat_owner_read';
  if not found then execute $definition$create policy "pat_owner_read" on public.personal_access_tokens for select to authenticated using(user_id=auth.uid()and public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)is not null)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.personal_access_tokens.pat_owner_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.mfa_recovery_codes.recovery_code_owner
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'user_id=auth.uid()' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='mfa_recovery_codes' and policyname='recovery_code_owner';
  if not found then execute $definition$create policy "recovery_code_owner" on public.mfa_recovery_codes for select to authenticated using(user_id=auth.uid())$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.mfa_recovery_codes.recovery_code_owner (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.user_organization_context.organization_context_owner
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'user_id=auth.uid()andpublic.is_organization_member(organization_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='user_organization_context' and policyname='organization_context_owner';
  if not found then execute $definition$create policy "organization_context_owner" on public.user_organization_context for select to authenticated using(user_id=auth.uid()and public.is_organization_member(organization_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.user_organization_context.organization_context_owner (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.notification_reminders.notification_reminders_owner
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'ALL' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'user_id=auth.uid()andpublic.is_organization_member(organization_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'user_id=auth.uid()andpublic.is_organization_member(organization_id)' into differs from pg_policies where schemaname='public' and tablename='notification_reminders' and policyname='notification_reminders_owner';
  if not found then execute $definition$create policy notification_reminders_owner on public.notification_reminders for all to authenticated using(user_id=auth.uid()and public.is_organization_member(organization_id))with check(user_id=auth.uid()and public.is_organization_member(organization_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.notification_reminders.notification_reminders_owner (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.notification_queue.notification_queue_member_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.is_organization_member(organization_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='notification_queue' and policyname='notification_queue_member_read';
  if not found then execute $definition$create policy notification_queue_member_read on public.notification_queue for select to authenticated using(public.is_organization_member(organization_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.notification_queue.notification_queue_member_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.email_templates.email_templates_member_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.is_organization_member(organization_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='email_templates' and policyname='email_templates_member_read';
  if not found then execute $definition$create policy email_templates_member_read on public.email_templates for select to authenticated using(public.is_organization_member(organization_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.email_templates.email_templates_member_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.email_messages.email_messages_member_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.is_organization_member(organization_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='email_messages' and policyname='email_messages_member_read';
  if not found then execute $definition$create policy email_messages_member_read on public.email_messages for select to authenticated using(public.is_organization_member(organization_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.email_messages.email_messages_member_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.email_delivery_attempts.email_attempts_member_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.is_organization_member(organization_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='email_delivery_attempts' and policyname='email_attempts_member_read';
  if not found then execute $definition$create policy email_attempts_member_read on public.email_delivery_attempts for select to authenticated using(public.is_organization_member(organization_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.email_delivery_attempts.email_attempts_member_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.workflow_definitions.workflow definitions tenant read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.current_workspace_role(workspace_id)isnotnull' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='workflow_definitions' and policyname='workflow definitions tenant read';
  if not found then execute $definition$create policy "workflow definitions tenant read" on public.workflow_definitions for select to authenticated using(public.current_workspace_role(workspace_id) is not null)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.workflow_definitions.workflow definitions tenant read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.workflow_instances.workflow instances tenant read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.current_workspace_role(workspace_id)isnotnull' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='workflow_instances' and policyname='workflow instances tenant read';
  if not found then execute $definition$create policy "workflow instances tenant read" on public.workflow_instances for select to authenticated using(public.current_workspace_role(workspace_id) is not null)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.workflow_instances.workflow instances tenant read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.workflow_step_executions.workflow steps tenant read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.current_workspace_role(workspace_id)isnotnull' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='workflow_step_executions' and policyname='workflow steps tenant read';
  if not found then execute $definition$create policy "workflow steps tenant read" on public.workflow_step_executions for select to authenticated using(public.current_workspace_role(workspace_id) is not null)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.workflow_step_executions.workflow steps tenant read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.workflow_trigger_events.workflow triggers tenant read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.current_workspace_role(workspace_id)isnotnull' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='workflow_trigger_events' and policyname='workflow triggers tenant read';
  if not found then execute $definition$create policy "workflow triggers tenant read" on public.workflow_trigger_events for select to authenticated using(public.current_workspace_role(workspace_id) is not null)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.workflow_trigger_events.workflow triggers tenant read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.workflow_automation_approvals.workflow approvals tenant read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.current_workspace_role(workspace_id)isnotnull' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='workflow_automation_approvals' and policyname='workflow approvals tenant read';
  if not found then execute $definition$create policy "workflow approvals tenant read" on public.workflow_automation_approvals for select to authenticated using(public.current_workspace_role(workspace_id) is not null)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.workflow_automation_approvals.workflow approvals tenant read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.onboarding_sessions.onboarding owner session read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'user_id=auth.uid()' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='onboarding_sessions' and policyname='onboarding owner session read';
  if not found then execute $definition$create policy "onboarding owner session read" on public.onboarding_sessions for select to authenticated using(user_id=auth.uid())$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.onboarding_sessions.onboarding owner session read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.onboarding_step_events.onboarding owner events read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'user_id=auth.uid()' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='onboarding_step_events' and policyname='onboarding owner events read';
  if not found then execute $definition$create policy "onboarding owner events read" on public.onboarding_step_events for select to authenticated using(user_id=auth.uid())$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.onboarding_step_events.onboarding owner events read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.onboarding_import_jobs.onboarding tenant imports read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.current_workspace_role(workspace_id)isnotnull' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='onboarding_import_jobs' and policyname='onboarding tenant imports read';
  if not found then execute $definition$create policy "onboarding tenant imports read" on public.onboarding_import_jobs for select to authenticated using(public.current_workspace_role(workspace_id) is not null)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.onboarding_import_jobs.onboarding tenant imports read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.onboarding_tour_progress.onboarding tenant tour read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'user_id=auth.uid()andpublic.current_workspace_role(workspace_id)isnotnull' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='onboarding_tour_progress' and policyname='onboarding tenant tour read';
  if not found then execute $definition$create policy "onboarding tenant tour read" on public.onboarding_tour_progress for select to authenticated using(user_id=auth.uid() and public.current_workspace_role(workspace_id) is not null)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.onboarding_tour_progress.onboarding tenant tour read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.onboarding_connection_events.onboarding tenant connections read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.current_workspace_role(workspace_id)isnotnull' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='onboarding_connection_events' and policyname='onboarding tenant connections read';
  if not found then execute $definition$create policy "onboarding tenant connections read" on public.onboarding_connection_events for select to authenticated using(public.current_workspace_role(workspace_id) is not null)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.onboarding_connection_events.onboarding tenant connections read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.onboarding_demo_seed_requests.onboarding tenant demo read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.current_workspace_role(workspace_id)isnotnull' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='onboarding_demo_seed_requests' and policyname='onboarding tenant demo read';
  if not found then execute $definition$create policy "onboarding tenant demo read" on public.onboarding_demo_seed_requests for select to authenticated using(public.current_workspace_role(workspace_id) is not null)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.onboarding_demo_seed_requests.onboarding tenant demo read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.knowledge_articles.knowledge articles tenant read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.current_workspace_role(workspace_id)isnotnull' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='knowledge_articles' and policyname='knowledge articles tenant read';
  if not found then execute $definition$create policy "knowledge articles tenant read"on public.knowledge_articles for select to authenticated using(public.current_workspace_role(workspace_id)is not null)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.knowledge_articles.knowledge articles tenant read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.knowledge_article_versions.knowledge versions tenant read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.current_workspace_role(workspace_id)isnotnull' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='knowledge_article_versions' and policyname='knowledge versions tenant read';
  if not found then execute $definition$create policy "knowledge versions tenant read"on public.knowledge_article_versions for select to authenticated using(public.current_workspace_role(workspace_id)is not null)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.knowledge_article_versions.knowledge versions tenant read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.knowledge_documents.knowledge documents tenant read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.current_workspace_role(workspace_id)isnotnull' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='knowledge_documents' and policyname='knowledge documents tenant read';
  if not found then execute $definition$create policy "knowledge documents tenant read"on public.knowledge_documents for select to authenticated using(public.current_workspace_role(workspace_id)is not null)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.knowledge_documents.knowledge documents tenant read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.knowledge_analytics.knowledge analytics admin read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.current_workspace_role(workspace_id)in(''organization_owner'',''organization_admin'',''manager'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='knowledge_analytics' and policyname='knowledge analytics admin read';
  if not found then execute $definition$create policy "knowledge analytics admin read"on public.knowledge_analytics for select to authenticated using(public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','manager'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.knowledge_analytics.knowledge analytics admin read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for storage.objects.knowledge object tenant insert
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'INSERT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'bucket_id=''knowledge-documents''andpublic.current_workspace_role((storage.foldername(name))[2]::uuid)in(''organization_owner'',''organization_admin'',''manager'')' into differs from pg_policies where schemaname='storage' and tablename='objects' and policyname='knowledge object tenant insert';
  if not found then execute $definition$create policy "knowledge object tenant insert"on storage.objects for insert to authenticated with check(bucket_id='knowledge-documents'and public.current_workspace_role((storage.foldername(name))[2]::uuid)in('organization_owner','organization_admin','manager'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: storage.objects.knowledge object tenant insert (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for storage.objects.knowledge object tenant read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'bucket_id=''knowledge-documents''andpublic.current_workspace_role((storage.foldername(name))[2]::uuid)isnotnull' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='storage' and tablename='objects' and policyname='knowledge object tenant read';
  if not found then execute $definition$create policy "knowledge object tenant read"on storage.objects for select to authenticated using(bucket_id='knowledge-documents'and public.current_workspace_role((storage.foldername(name))[2]::uuid)is not null)$definition$;
  elsif differs then raise exception 'Policy definition conflict: storage.objects.knowledge object tenant read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.deployment_migration_history.deployment migration administrators read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'exists(select1frompublic.workspace_memberswmjoinpublic.rolesronr.id=wm.role_idwherewm.user_id=auth.uid()andwm.status=''active''andr.codein(''organization_owner'',''organization_admin''))or(auth.jwt()->''app_metadata''->>''role'')=''super_admin''' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='deployment_migration_history' and policyname='deployment migration administrators read';
  if not found then execute $definition$create policy "deployment migration administrators read"on public.deployment_migration_history for select to authenticated using(exists(select 1 from public.workspace_members wm join public.roles r on r.id=wm.role_id where wm.user_id=auth.uid()and wm.status='active'and r.code in('organization_owner','organization_admin'))or(auth.jwt()->'app_metadata'->>'role')='super_admin')$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.deployment_migration_history.deployment migration administrators read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.deployment_releases.deployment releases administrators read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'(public.current_workspace_role(workspace_id)in(''organization_owner'',''organization_admin'')andorganization_id=(selectwm.organization_idfrompublic.workspace_memberswmwherewm.workspace_id=deployment_releases.workspace_idandwm.user_id=auth.uid()andwm.status=''active''limit1))or(auth.jwt()->''app_metadata''->>''role'')=''super_admin''' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='deployment_releases' and policyname='deployment releases administrators read';
  if not found then execute $definition$create policy "deployment releases administrators read"on public.deployment_releases for select to authenticated using((public.current_workspace_role(workspace_id)in('organization_owner','organization_admin')and organization_id=(select wm.organization_id from public.workspace_members wm where wm.workspace_id=deployment_releases.workspace_id and wm.user_id=auth.uid()and wm.status='active'limit 1))or(auth.jwt()->'app_metadata'->>'role')='super_admin')$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.deployment_releases.deployment releases administrators read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.security_review_events.security review administrators read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.current_workspace_role(workspace_id)in(''organization_owner'',''organization_admin'')or(auth.jwt()->''app_metadata''->>''role'')=''super_admin''' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='security_review_events' and policyname='security review administrators read';
  if not found then execute $definition$create policy "security review administrators read"on public.security_review_events for select to authenticated using(public.current_workspace_role(workspace_id)in('organization_owner','organization_admin')or(auth.jwt()->'app_metadata'->>'role')='super_admin')$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.security_review_events.security review administrators read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.workspace_analytics_events.workspace_analytics_events_select
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.current_workspace_role(workspace_id)in(''organization_owner'',''organization_admin'',''manager'',''marketing'',''finance'',''read_only'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='workspace_analytics_events' and policyname='workspace_analytics_events_select';
  if not found then execute $definition$create policy workspace_analytics_events_select on public.workspace_analytics_events for select to authenticated using(public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','manager','marketing','finance','read_only'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.workspace_analytics_events.workspace_analytics_events_select (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.launch_readiness_audit_runs.launch_readiness_audit_runs_select
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.current_workspace_role(workspace_id)in(''organization_owner'',''organization_admin'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='launch_readiness_audit_runs' and policyname='launch_readiness_audit_runs_select';
  if not found then execute $definition$create policy launch_readiness_audit_runs_select on public.launch_readiness_audit_runs for select to authenticated using(public.current_workspace_role(workspace_id)in('organization_owner','organization_admin'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.launch_readiness_audit_runs.launch_readiness_audit_runs_select (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.organization_departments.organization_departments_member_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.is_organization_member(organization_id)andexists(select1frompublic.workspace_memberswmwherewm.workspace_id=organization_departments.workspace_idandwm.user_id=auth.uid()andwm.status=''active'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='organization_departments' and policyname='organization_departments_member_read';
  if not found then execute $definition$create policy "organization_departments_member_read" on public.organization_departments for select to authenticated using(public.is_organization_member(organization_id) and exists(select 1 from public.workspace_members wm where wm.workspace_id=organization_departments.workspace_id and wm.user_id=auth.uid() and wm.status='active'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.organization_departments.organization_departments_member_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.organization_teams.organization_teams_member_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.is_organization_member(organization_id)andexists(select1frompublic.workspace_memberswmwherewm.workspace_id=organization_teams.workspace_idandwm.user_id=auth.uid()andwm.status=''active'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='organization_teams' and policyname='organization_teams_member_read';
  if not found then execute $definition$create policy "organization_teams_member_read" on public.organization_teams for select to authenticated using(public.is_organization_member(organization_id) and exists(select 1 from public.workspace_members wm where wm.workspace_id=organization_teams.workspace_id and wm.user_id=auth.uid() and wm.status='active'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.organization_teams.organization_teams_member_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.organization_team_members.organization_team_members_member_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.is_organization_member(organization_id)andexists(select1frompublic.workspace_memberswmwherewm.workspace_id=organization_team_members.workspace_idandwm.user_id=auth.uid()andwm.status=''active'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='organization_team_members' and policyname='organization_team_members_member_read';
  if not found then execute $definition$create policy "organization_team_members_member_read" on public.organization_team_members for select to authenticated using(public.is_organization_member(organization_id) and exists(select 1 from public.workspace_members wm where wm.workspace_id=organization_team_members.workspace_id and wm.user_id=auth.uid() and wm.status='active'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.organization_team_members.organization_team_members_member_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.site_visits.site_visits_workspace_write
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'UPDATE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.site_visit_can_manage(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.site_visit_can_manage(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='site_visits' and policyname='site_visits_workspace_write';
  if not found then execute $definition$create policy site_visits_workspace_write on public.site_visits for update to authenticated using(public.site_visit_can_manage(organization_id,workspace_id))with check(public.site_visit_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.site_visits.site_visits_workspace_write (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.communication_attachments.communication_attachments_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.communication_tenant_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='communication_attachments' and policyname='communication_attachments_read';
  if not found then execute $definition$create policy "communication_attachments_read" on public.communication_attachments for select to authenticated using (public.communication_tenant_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.communication_attachments.communication_attachments_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.communication_attachments.communication_attachments_insert
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'INSERT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.communication_tenant_member(organization_id,workspace_id)andpublic.communication_can_manage(workspace_id)andcreated_by=auth.uid()' into differs from pg_policies where schemaname='public' and tablename='communication_attachments' and policyname='communication_attachments_insert';
  if not found then execute $definition$create policy "communication_attachments_insert" on public.communication_attachments for insert to authenticated with check (public.communication_tenant_member(organization_id,workspace_id) and public.communication_can_manage(workspace_id) and created_by=auth.uid())$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.communication_attachments.communication_attachments_insert (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.communication_attachments.communication_attachments_delete
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'DELETE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.communication_tenant_member(organization_id,workspace_id)andpublic.communication_can_manage(workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='communication_attachments' and policyname='communication_attachments_delete';
  if not found then execute $definition$create policy "communication_attachments_delete" on public.communication_attachments for delete to authenticated using (public.communication_tenant_member(organization_id,workspace_id) and public.communication_can_manage(workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.communication_attachments.communication_attachments_delete (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.communication_ai_recommendations.communication_ai_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.communication_tenant_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='communication_ai_recommendations' and policyname='communication_ai_read';
  if not found then execute $definition$create policy "communication_ai_read" on public.communication_ai_recommendations for select to authenticated using (public.communication_tenant_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.communication_ai_recommendations.communication_ai_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.communication_ai_recommendations.communication_ai_insert
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'INSERT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.communication_tenant_member(organization_id,workspace_id)andpublic.communication_can_manage(workspace_id)andcreated_by=auth.uid()andrecommendation_only=true' into differs from pg_policies where schemaname='public' and tablename='communication_ai_recommendations' and policyname='communication_ai_insert';
  if not found then execute $definition$create policy "communication_ai_insert" on public.communication_ai_recommendations for insert to authenticated with check (public.communication_tenant_member(organization_id,workspace_id) and public.communication_can_manage(workspace_id) and created_by=auth.uid() and recommendation_only=true)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.communication_ai_recommendations.communication_ai_insert (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.communication_ai_recommendations.communication_ai_update
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'UPDATE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.communication_tenant_member(organization_id,workspace_id)andpublic.communication_can_manage(workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.communication_tenant_member(organization_id,workspace_id)andrecommendation_only=true' into differs from pg_policies where schemaname='public' and tablename='communication_ai_recommendations' and policyname='communication_ai_update';
  if not found then execute $definition$create policy "communication_ai_update" on public.communication_ai_recommendations for update to authenticated using (public.communication_tenant_member(organization_id,workspace_id) and public.communication_can_manage(workspace_id)) with check (public.communication_tenant_member(organization_id,workspace_id) and recommendation_only=true)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.communication_ai_recommendations.communication_ai_update (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.communication_audit.communication_audit_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.communication_tenant_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='communication_audit' and policyname='communication_audit_read';
  if not found then execute $definition$create policy "communication_audit_read" on public.communication_audit for select to authenticated using (public.communication_tenant_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.communication_audit.communication_audit_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.communication_audit.communication_audit_insert
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'INSERT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.communication_tenant_member(organization_id,workspace_id)andactor_id=auth.uid()' into differs from pg_policies where schemaname='public' and tablename='communication_audit' and policyname='communication_audit_insert';
  if not found then execute $definition$create policy "communication_audit_insert" on public.communication_audit for insert to authenticated with check (public.communication_tenant_member(organization_id,workspace_id) and actor_id=auth.uid())$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.communication_audit.communication_audit_insert (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.creative_brand_kits.creative_brand_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.creative_studio_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='creative_brand_kits' and policyname='creative_brand_read';
  if not found then execute $definition$create policy "creative_brand_read" on public.creative_brand_kits for select to authenticated using(public.creative_studio_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.creative_brand_kits.creative_brand_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.creative_brand_kits.creative_brand_write
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'ALL' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.creative_studio_member(organization_id,workspace_id)andpublic.creative_studio_manage(workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.creative_studio_member(organization_id,workspace_id)andpublic.creative_studio_manage(workspace_id)' into differs from pg_policies where schemaname='public' and tablename='creative_brand_kits' and policyname='creative_brand_write';
  if not found then execute $definition$create policy "creative_brand_write" on public.creative_brand_kits for all to authenticated using(public.creative_studio_member(organization_id,workspace_id)and public.creative_studio_manage(workspace_id))with check(public.creative_studio_member(organization_id,workspace_id)and public.creative_studio_manage(workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.creative_brand_kits.creative_brand_write (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.creative_campaigns.creative_campaign_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.creative_studio_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='creative_campaigns' and policyname='creative_campaign_read';
  if not found then execute $definition$create policy "creative_campaign_read" on public.creative_campaigns for select to authenticated using(public.creative_studio_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.creative_campaigns.creative_campaign_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.creative_campaigns.creative_campaign_write
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'ALL' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.creative_studio_member(organization_id,workspace_id)andpublic.creative_studio_manage(workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.creative_studio_member(organization_id,workspace_id)andpublic.creative_studio_manage(workspace_id)' into differs from pg_policies where schemaname='public' and tablename='creative_campaigns' and policyname='creative_campaign_write';
  if not found then execute $definition$create policy "creative_campaign_write" on public.creative_campaigns for all to authenticated using(public.creative_studio_member(organization_id,workspace_id)and public.creative_studio_manage(workspace_id))with check(public.creative_studio_member(organization_id,workspace_id)and public.creative_studio_manage(workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.creative_campaigns.creative_campaign_write (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.creative_assets.creative_asset_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.creative_studio_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='creative_assets' and policyname='creative_asset_read';
  if not found then execute $definition$create policy "creative_asset_read" on public.creative_assets for select to authenticated using(public.creative_studio_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.creative_assets.creative_asset_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.creative_assets.creative_asset_write
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'ALL' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.creative_studio_member(organization_id,workspace_id)andpublic.creative_studio_manage(workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.creative_studio_member(organization_id,workspace_id)andpublic.creative_studio_manage(workspace_id)' into differs from pg_policies where schemaname='public' and tablename='creative_assets' and policyname='creative_asset_write';
  if not found then execute $definition$create policy "creative_asset_write" on public.creative_assets for all to authenticated using(public.creative_studio_member(organization_id,workspace_id)and public.creative_studio_manage(workspace_id))with check(public.creative_studio_member(organization_id,workspace_id)and public.creative_studio_manage(workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.creative_assets.creative_asset_write (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.creative_timeline.creative_timeline_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.creative_studio_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='creative_timeline' and policyname='creative_timeline_read';
  if not found then execute $definition$create policy "creative_timeline_read" on public.creative_timeline for select to authenticated using(public.creative_studio_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.creative_timeline.creative_timeline_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.creative_timeline.creative_timeline_insert
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'INSERT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.creative_studio_member(organization_id,workspace_id)andactor_id=auth.uid()' into differs from pg_policies where schemaname='public' and tablename='creative_timeline' and policyname='creative_timeline_insert';
  if not found then execute $definition$create policy "creative_timeline_insert" on public.creative_timeline for insert to authenticated with check(public.creative_studio_member(organization_id,workspace_id)and actor_id=auth.uid())$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.creative_timeline.creative_timeline_insert (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.creative_generation_jobs.creative_jobs_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.creative_studio_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='creative_generation_jobs' and policyname='creative_jobs_read';
  if not found then execute $definition$create policy "creative_jobs_read" on public.creative_generation_jobs for select to authenticated using(public.creative_studio_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.creative_generation_jobs.creative_jobs_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.creative_editor_documents.creative_editor_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.creative_studio_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='creative_editor_documents' and policyname='creative_editor_read';
  if not found then execute $definition$create policy "creative_editor_read" on public.creative_editor_documents for select to authenticated using(public.creative_studio_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.creative_editor_documents.creative_editor_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.creative_editor_documents.creative_editor_write
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'ALL' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.creative_studio_member(organization_id,workspace_id)andpublic.creative_studio_manage(workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.creative_studio_member(organization_id,workspace_id)andpublic.creative_studio_manage(workspace_id)' into differs from pg_policies where schemaname='public' and tablename='creative_editor_documents' and policyname='creative_editor_write';
  if not found then execute $definition$create policy "creative_editor_write" on public.creative_editor_documents for all to authenticated using(public.creative_studio_member(organization_id,workspace_id)and public.creative_studio_manage(workspace_id))with check(public.creative_studio_member(organization_id,workspace_id)and public.creative_studio_manage(workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.creative_editor_documents.creative_editor_write (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.creative_campaign_packs.creative_pack_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.creative_studio_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='creative_campaign_packs' and policyname='creative_pack_read';
  if not found then execute $definition$create policy "creative_pack_read" on public.creative_campaign_packs for select to authenticated using(public.creative_studio_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.creative_campaign_packs.creative_pack_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.creative_campaign_packs.creative_pack_write
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'ALL' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.creative_studio_member(organization_id,workspace_id)andpublic.creative_studio_manage(workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.creative_studio_member(organization_id,workspace_id)andpublic.creative_studio_manage(workspace_id)' into differs from pg_policies where schemaname='public' and tablename='creative_campaign_packs' and policyname='creative_pack_write';
  if not found then execute $definition$create policy "creative_pack_write" on public.creative_campaign_packs for all to authenticated using(public.creative_studio_member(organization_id,workspace_id) and public.creative_studio_manage(workspace_id)) with check(public.creative_studio_member(organization_id,workspace_id) and public.creative_studio_manage(workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.creative_campaign_packs.creative_pack_write (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.creative_campaign_schedule.creative_schedule_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.creative_studio_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='creative_campaign_schedule' and policyname='creative_schedule_read';
  if not found then execute $definition$create policy "creative_schedule_read" on public.creative_campaign_schedule for select to authenticated using(public.creative_studio_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.creative_campaign_schedule.creative_schedule_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.creative_campaign_schedule.creative_schedule_write
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'ALL' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.creative_studio_member(organization_id,workspace_id)andpublic.creative_studio_manage(workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.creative_studio_member(organization_id,workspace_id)andpublic.creative_studio_manage(workspace_id)andpublishing_enabled=false' into differs from pg_policies where schemaname='public' and tablename='creative_campaign_schedule' and policyname='creative_schedule_write';
  if not found then execute $definition$create policy "creative_schedule_write" on public.creative_campaign_schedule for all to authenticated using(public.creative_studio_member(organization_id,workspace_id) and public.creative_studio_manage(workspace_id)) with check(public.creative_studio_member(organization_id,workspace_id) and public.creative_studio_manage(workspace_id) and publishing_enabled=false)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.creative_campaign_schedule.creative_schedule_write (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.creative_growth_reviews.creative_review_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.creative_studio_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='creative_growth_reviews' and policyname='creative_review_read';
  if not found then execute $definition$create policy "creative_review_read" on public.creative_growth_reviews for select to authenticated using(public.creative_studio_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.creative_growth_reviews.creative_review_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.creative_growth_reviews.creative_review_write
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'ALL' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.creative_studio_member(organization_id,workspace_id)andpublic.creative_studio_manage(workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.creative_studio_member(organization_id,workspace_id)andpublic.creative_studio_manage(workspace_id)andrecommendation_only=true' into differs from pg_policies where schemaname='public' and tablename='creative_growth_reviews' and policyname='creative_review_write';
  if not found then execute $definition$create policy "creative_review_write" on public.creative_growth_reviews for all to authenticated using(public.creative_studio_member(organization_id,workspace_id) and public.creative_studio_manage(workspace_id)) with check(public.creative_studio_member(organization_id,workspace_id) and public.creative_studio_manage(workspace_id) and recommendation_only=true)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.creative_growth_reviews.creative_review_write (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.commercial_provider_customers.commercial_customer_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.is_organization_member(organization_id)andpublic.current_workspace_role(workspace_id)in(''organization_owner'',''organization_admin'',''billing_admin'',''finance'',''finance_manager'',''finance_analyst'',''read_only'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='commercial_provider_customers' and policyname='commercial_customer_read';
  if not found then execute $definition$create policy "commercial_customer_read" on public.commercial_provider_customers for select to authenticated using(public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','billing_admin','finance','finance_manager','finance_analyst','read_only'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.commercial_provider_customers.commercial_customer_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.workspace_feature_licenses.feature_license_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.is_organization_member(organization_id)andpublic.current_workspace_role(workspace_id)isnotnull' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='workspace_feature_licenses' and policyname='feature_license_read';
  if not found then execute $definition$create policy "feature_license_read" on public.workspace_feature_licenses for select to authenticated using(public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)is not null)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.workspace_feature_licenses.feature_license_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.workspace_feature_licenses.feature_license_manage
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'ALL' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.is_organization_member(organization_id)andpublic.current_workspace_role(workspace_id)in(''organization_owner'',''organization_admin'',''billing_admin'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.is_organization_member(organization_id)andpublic.current_workspace_role(workspace_id)in(''organization_owner'',''organization_admin'',''billing_admin'')' into differs from pg_policies where schemaname='public' and tablename='workspace_feature_licenses' and policyname='feature_license_manage';
  if not found then execute $definition$create policy "feature_license_manage" on public.workspace_feature_licenses for all to authenticated using(public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','billing_admin'))with check(public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','billing_admin'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.workspace_feature_licenses.feature_license_manage (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.commercial_webhook_events.commercial_events_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'organization_idisnotnullandpublic.is_organization_member(organization_id)andpublic.current_workspace_role(workspace_id)in(''organization_owner'',''organization_admin'',''billing_admin'',''finance'',''finance_manager'',''finance_analyst'',''read_only'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='commercial_webhook_events' and policyname='commercial_events_read';
  if not found then execute $definition$create policy "commercial_events_read" on public.commercial_webhook_events for select to authenticated using(organization_id is not null and public.is_organization_member(organization_id)and public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','billing_admin','finance','finance_manager','finance_analyst','read_only'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.commercial_webhook_events.commercial_events_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.knowledge_article_relations.knowledge relations tenant read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.current_workspace_role(workspace_id)isnotnull' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='knowledge_article_relations' and policyname='knowledge relations tenant read';
  if not found then execute $definition$create policy "knowledge relations tenant read"on public.knowledge_article_relations for select to authenticated using(public.current_workspace_role(workspace_id)is not null)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.knowledge_article_relations.knowledge relations tenant read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.knowledge_videos.knowledge videos tenant read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.current_workspace_role(workspace_id)isnotnull' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='knowledge_videos' and policyname='knowledge videos tenant read';
  if not found then execute $definition$create policy "knowledge videos tenant read"on public.knowledge_videos for select to authenticated using(public.current_workspace_role(workspace_id)is not null)$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.knowledge_videos.knowledge videos tenant read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.knowledge_quality_feedback.knowledge quality admin read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.current_workspace_role(workspace_id)in(''organization_owner'',''organization_admin'',''manager'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='knowledge_quality_feedback' and policyname='knowledge quality admin read';
  if not found then execute $definition$create policy "knowledge quality admin read"on public.knowledge_quality_feedback for select to authenticated using(public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','manager'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.knowledge_quality_feedback.knowledge quality admin read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.product_intelligence_events.product intelligence admin read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.current_workspace_role(workspace_id)in(''organization_owner'',''organization_admin'',''manager'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='product_intelligence_events' and policyname='product intelligence admin read';
  if not found then execute $definition$create policy "product intelligence admin read"on public.product_intelligence_events for select to authenticated using(public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','manager'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.product_intelligence_events.product intelligence admin read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.product_feedback.product feedback admin read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.current_workspace_role(workspace_id)in(''organization_owner'',''organization_admin'',''manager'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='product_feedback' and policyname='product feedback admin read';
  if not found then execute $definition$create policy "product feedback admin read"on public.product_feedback for select to authenticated using(public.current_workspace_role(workspace_id)in('organization_owner','organization_admin','manager'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.product_feedback.product feedback admin read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for storage.objects.product feedback screenshot create
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'INSERT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'bucket_id=''product-feedback''andpublic.current_workspace_role((storage.foldername(name))[2]::uuid)isnotnull' into differs from pg_policies where schemaname='storage' and tablename='objects' and policyname='product feedback screenshot create';
  if not found then execute $definition$create policy "product feedback screenshot create"on storage.objects for insert to authenticated with check(bucket_id='product-feedback'and public.current_workspace_role((storage.foldername(name))[2]::uuid)is not null)$definition$;
  elsif differs then raise exception 'Policy definition conflict: storage.objects.product feedback screenshot create (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for storage.objects.product feedback screenshot admin read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'bucket_id=''product-feedback''andpublic.current_workspace_role((storage.foldername(name))[2]::uuid)in(''organization_owner'',''organization_admin'',''manager'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='storage' and tablename='objects' and policyname='product feedback screenshot admin read';
  if not found then execute $definition$create policy "product feedback screenshot admin read"on storage.objects for select to authenticated using(bucket_id='product-feedback'and public.current_workspace_role((storage.foldername(name))[2]::uuid)in('organization_owner','organization_admin','manager'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: storage.objects.product feedback screenshot admin read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.intelligence_memory.intelligence memory tenant read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.current_workspace_role(workspace_id)isnotnulland(scope=''organization''oruser_id=auth.uid())' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='intelligence_memory' and policyname='intelligence memory tenant read';
  if not found then execute $definition$create policy "intelligence memory tenant read" on public.intelligence_memory for select to authenticated using (public.current_workspace_role(workspace_id) is not null and (scope='organization' or user_id=auth.uid()))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.intelligence_memory.intelligence memory tenant read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.continuous_learning_aggregates.learning aggregate admin read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.current_workspace_role(workspace_id)in(''organization_owner'',''organization_admin'',''manager'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='continuous_learning_aggregates' and policyname='learning aggregate admin read';
  if not found then execute $definition$create policy "learning aggregate admin read" on public.continuous_learning_aggregates for select to authenticated using (public.current_workspace_role(workspace_id) in ('organization_owner','organization_admin','manager'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.continuous_learning_aggregates.learning aggregate admin read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.executive_intelligence_briefings.executive briefing admin read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.current_workspace_role(workspace_id)in(''organization_owner'',''organization_admin'',''manager'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='executive_intelligence_briefings' and policyname='executive briefing admin read';
  if not found then execute $definition$create policy "executive briefing admin read" on public.executive_intelligence_briefings for select to authenticated using (public.current_workspace_role(workspace_id) in ('organization_owner','organization_admin','manager'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.executive_intelligence_briefings.executive briefing admin read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.continuous_learning_jobs.learning job admin read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.current_workspace_role(workspace_id)in(''organization_owner'',''organization_admin'',''manager'')' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='continuous_learning_jobs' and policyname='learning job admin read';
  if not found then execute $definition$create policy "learning job admin read" on public.continuous_learning_jobs for select to authenticated using (public.current_workspace_role(workspace_id) in ('organization_owner','organization_admin','manager'))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.continuous_learning_jobs.learning job admin read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_projects.property_projects_select
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.inventory_workspace_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='property_projects' and policyname='property_projects_select';
  if not found then execute $definition$create policy property_projects_select on public.property_projects for select to authenticated using(public.inventory_workspace_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_projects.property_projects_select (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_projects.property_projects_insert
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'INSERT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='property_projects' and policyname='property_projects_insert';
  if not found then execute $definition$create policy property_projects_insert on public.property_projects for insert to authenticated with check(public.inventory_can_write(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_projects.property_projects_insert (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_projects.property_projects_update
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'UPDATE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='property_projects' and policyname='property_projects_update';
  if not found then execute $definition$create policy property_projects_update on public.property_projects for update to authenticated using(public.inventory_can_write(organization_id,workspace_id)) with check(public.inventory_can_write(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_projects.property_projects_update (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_projects.property_projects_delete
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'DELETE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='property_projects' and policyname='property_projects_delete';
  if not found then execute $definition$create policy property_projects_delete on public.property_projects for delete to authenticated using(public.inventory_can_write(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_projects.property_projects_delete (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_towers.property_towers_select
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.inventory_workspace_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='property_towers' and policyname='property_towers_select';
  if not found then execute $definition$create policy property_towers_select on public.property_towers for select to authenticated using(public.inventory_workspace_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_towers.property_towers_select (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_towers.property_towers_insert
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'INSERT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='property_towers' and policyname='property_towers_insert';
  if not found then execute $definition$create policy property_towers_insert on public.property_towers for insert to authenticated with check(public.inventory_can_write(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_towers.property_towers_insert (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_towers.property_towers_update
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'UPDATE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='property_towers' and policyname='property_towers_update';
  if not found then execute $definition$create policy property_towers_update on public.property_towers for update to authenticated using(public.inventory_can_write(organization_id,workspace_id)) with check(public.inventory_can_write(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_towers.property_towers_update (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_towers.property_towers_delete
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'DELETE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='property_towers' and policyname='property_towers_delete';
  if not found then execute $definition$create policy property_towers_delete on public.property_towers for delete to authenticated using(public.inventory_can_write(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_towers.property_towers_delete (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_units.property_units_select
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.inventory_workspace_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='property_units' and policyname='property_units_select';
  if not found then execute $definition$create policy property_units_select on public.property_units for select to authenticated using(public.inventory_workspace_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_units.property_units_select (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_units.property_units_insert
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'INSERT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='property_units' and policyname='property_units_insert';
  if not found then execute $definition$create policy property_units_insert on public.property_units for insert to authenticated with check(public.inventory_can_write(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_units.property_units_insert (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_units.property_units_update
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'UPDATE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='property_units' and policyname='property_units_update';
  if not found then execute $definition$create policy property_units_update on public.property_units for update to authenticated using(public.inventory_can_write(organization_id,workspace_id)) with check(public.inventory_can_write(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_units.property_units_update (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_units.property_units_delete
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'DELETE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='property_units' and policyname='property_units_delete';
  if not found then execute $definition$create policy property_units_delete on public.property_units for delete to authenticated using(public.inventory_can_write(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_units.property_units_delete (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_price_revisions.property_price_revisions_select
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.inventory_workspace_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='property_price_revisions' and policyname='property_price_revisions_select';
  if not found then execute $definition$create policy property_price_revisions_select on public.property_price_revisions for select to authenticated using(public.inventory_workspace_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_price_revisions.property_price_revisions_select (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_price_revisions.property_price_revisions_insert
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'INSERT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='property_price_revisions' and policyname='property_price_revisions_insert';
  if not found then execute $definition$create policy property_price_revisions_insert on public.property_price_revisions for insert to authenticated with check(public.inventory_can_write(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_price_revisions.property_price_revisions_insert (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_price_revisions.property_price_revisions_update
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'UPDATE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='property_price_revisions' and policyname='property_price_revisions_update';
  if not found then execute $definition$create policy property_price_revisions_update on public.property_price_revisions for update to authenticated using(public.inventory_can_write(organization_id,workspace_id)) with check(public.inventory_can_write(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_price_revisions.property_price_revisions_update (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_price_revisions.property_price_revisions_delete
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'DELETE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='property_price_revisions' and policyname='property_price_revisions_delete';
  if not found then execute $definition$create policy property_price_revisions_delete on public.property_price_revisions for delete to authenticated using(public.inventory_can_write(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_price_revisions.property_price_revisions_delete (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_documents.property_documents_select
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.inventory_workspace_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='property_documents' and policyname='property_documents_select';
  if not found then execute $definition$create policy property_documents_select on public.property_documents for select to authenticated using(public.inventory_workspace_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_documents.property_documents_select (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_documents.property_documents_insert
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'INSERT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='property_documents' and policyname='property_documents_insert';
  if not found then execute $definition$create policy property_documents_insert on public.property_documents for insert to authenticated with check(public.inventory_can_write(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_documents.property_documents_insert (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_documents.property_documents_update
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'UPDATE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='property_documents' and policyname='property_documents_update';
  if not found then execute $definition$create policy property_documents_update on public.property_documents for update to authenticated using(public.inventory_can_write(organization_id,workspace_id)) with check(public.inventory_can_write(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_documents.property_documents_update (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_documents.property_documents_delete
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'DELETE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='property_documents' and policyname='property_documents_delete';
  if not found then execute $definition$create policy property_documents_delete on public.property_documents for delete to authenticated using(public.inventory_can_write(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_documents.property_documents_delete (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_inventory_audit.property_inventory_audit_select
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.inventory_workspace_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='property_inventory_audit' and policyname='property_inventory_audit_select';
  if not found then execute $definition$create policy property_inventory_audit_select on public.property_inventory_audit for select to authenticated using(public.inventory_workspace_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_inventory_audit.property_inventory_audit_select (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_inventory_audit.property_inventory_audit_insert
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'INSERT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='property_inventory_audit' and policyname='property_inventory_audit_insert';
  if not found then execute $definition$create policy property_inventory_audit_insert on public.property_inventory_audit for insert to authenticated with check(public.inventory_can_write(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_inventory_audit.property_inventory_audit_insert (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_inventory_audit.property_inventory_audit_update
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'UPDATE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='property_inventory_audit' and policyname='property_inventory_audit_update';
  if not found then execute $definition$create policy property_inventory_audit_update on public.property_inventory_audit for update to authenticated using(public.inventory_can_write(organization_id,workspace_id)) with check(public.inventory_can_write(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_inventory_audit.property_inventory_audit_update (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_inventory_audit.property_inventory_audit_delete
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'DELETE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='property_inventory_audit' and policyname='property_inventory_audit_delete';
  if not found then execute $definition$create policy property_inventory_audit_delete on public.property_inventory_audit for delete to authenticated using(public.inventory_can_write(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_inventory_audit.property_inventory_audit_delete (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_inventory_opportunity_requests.property_inventory_opportunity_requests_select
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.inventory_workspace_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='property_inventory_opportunity_requests' and policyname='property_inventory_opportunity_requests_select';
  if not found then execute $definition$create policy property_inventory_opportunity_requests_select on public.property_inventory_opportunity_requests for select to authenticated using(public.inventory_workspace_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_inventory_opportunity_requests.property_inventory_opportunity_requests_select (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_inventory_opportunity_requests.property_inventory_opportunity_requests_insert
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'INSERT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='property_inventory_opportunity_requests' and policyname='property_inventory_opportunity_requests_insert';
  if not found then execute $definition$create policy property_inventory_opportunity_requests_insert on public.property_inventory_opportunity_requests for insert to authenticated with check(public.inventory_can_write(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_inventory_opportunity_requests.property_inventory_opportunity_requests_insert (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_inventory_opportunity_requests.property_inventory_opportunity_requests_update
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'UPDATE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='property_inventory_opportunity_requests' and policyname='property_inventory_opportunity_requests_update';
  if not found then execute $definition$create policy property_inventory_opportunity_requests_update on public.property_inventory_opportunity_requests for update to authenticated using(public.inventory_can_write(organization_id,workspace_id)) with check(public.inventory_can_write(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_inventory_opportunity_requests.property_inventory_opportunity_requests_update (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_inventory_opportunity_requests.property_inventory_opportunity_requests_delete
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'DELETE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.inventory_can_write(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='property_inventory_opportunity_requests' and policyname='property_inventory_opportunity_requests_delete';
  if not found then execute $definition$create policy property_inventory_opportunity_requests_delete on public.property_inventory_opportunity_requests for delete to authenticated using(public.inventory_can_write(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_inventory_opportunity_requests.property_inventory_opportunity_requests_delete (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.site_visit_feedback.site_visit_feedback_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.site_visit_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='site_visit_feedback' and policyname='site_visit_feedback_read';
  if not found then execute $definition$create policy site_visit_feedback_read on public.site_visit_feedback for select to authenticated using(public.site_visit_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.site_visit_feedback.site_visit_feedback_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.site_visit_feedback.site_visit_feedback_create
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'INSERT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.site_visit_can_manage(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='site_visit_feedback' and policyname='site_visit_feedback_create';
  if not found then execute $definition$create policy site_visit_feedback_create on public.site_visit_feedback for insert to authenticated with check(public.site_visit_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.site_visit_feedback.site_visit_feedback_create (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.site_visit_feedback.site_visit_feedback_update
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'UPDATE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.site_visit_can_manage(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.site_visit_can_manage(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='site_visit_feedback' and policyname='site_visit_feedback_update';
  if not found then execute $definition$create policy site_visit_feedback_update on public.site_visit_feedback for update to authenticated using(public.site_visit_can_manage(organization_id,workspace_id)) with check(public.site_visit_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.site_visit_feedback.site_visit_feedback_update (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.site_visit_feedback.site_visit_feedback_delete
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'DELETE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.site_visit_can_manage(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='site_visit_feedback' and policyname='site_visit_feedback_delete';
  if not found then execute $definition$create policy site_visit_feedback_delete on public.site_visit_feedback for delete to authenticated using(public.site_visit_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.site_visit_feedback.site_visit_feedback_delete (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.site_visit_audit.site_visit_audit_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.site_visit_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='site_visit_audit' and policyname='site_visit_audit_read';
  if not found then execute $definition$create policy site_visit_audit_read on public.site_visit_audit for select to authenticated using(public.site_visit_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.site_visit_audit.site_visit_audit_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.site_visit_audit.site_visit_audit_create
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'INSERT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.site_visit_can_manage(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='site_visit_audit' and policyname='site_visit_audit_create';
  if not found then execute $definition$create policy site_visit_audit_create on public.site_visit_audit for insert to authenticated with check(public.site_visit_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.site_visit_audit.site_visit_audit_create (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.site_visit_audit.site_visit_audit_update
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'UPDATE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.site_visit_can_manage(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.site_visit_can_manage(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='site_visit_audit' and policyname='site_visit_audit_update';
  if not found then execute $definition$create policy site_visit_audit_update on public.site_visit_audit for update to authenticated using(public.site_visit_can_manage(organization_id,workspace_id)) with check(public.site_visit_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.site_visit_audit.site_visit_audit_update (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.site_visit_audit.site_visit_audit_delete
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'DELETE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.site_visit_can_manage(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='site_visit_audit' and policyname='site_visit_audit_delete';
  if not found then execute $definition$create policy site_visit_audit_delete on public.site_visit_audit for delete to authenticated using(public.site_visit_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.site_visit_audit.site_visit_audit_delete (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.site_visit_follow_up_requests.site_visit_follow_up_requests_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.site_visit_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='site_visit_follow_up_requests' and policyname='site_visit_follow_up_requests_read';
  if not found then execute $definition$create policy site_visit_follow_up_requests_read on public.site_visit_follow_up_requests for select to authenticated using(public.site_visit_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.site_visit_follow_up_requests.site_visit_follow_up_requests_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.site_visit_follow_up_requests.site_visit_follow_up_requests_create
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'INSERT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.site_visit_can_manage(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='site_visit_follow_up_requests' and policyname='site_visit_follow_up_requests_create';
  if not found then execute $definition$create policy site_visit_follow_up_requests_create on public.site_visit_follow_up_requests for insert to authenticated with check(public.site_visit_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.site_visit_follow_up_requests.site_visit_follow_up_requests_create (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.site_visit_follow_up_requests.site_visit_follow_up_requests_update
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'UPDATE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.site_visit_can_manage(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.site_visit_can_manage(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='site_visit_follow_up_requests' and policyname='site_visit_follow_up_requests_update';
  if not found then execute $definition$create policy site_visit_follow_up_requests_update on public.site_visit_follow_up_requests for update to authenticated using(public.site_visit_can_manage(organization_id,workspace_id)) with check(public.site_visit_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.site_visit_follow_up_requests.site_visit_follow_up_requests_update (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.site_visit_follow_up_requests.site_visit_follow_up_requests_delete
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'DELETE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.site_visit_can_manage(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='site_visit_follow_up_requests' and policyname='site_visit_follow_up_requests_delete';
  if not found then execute $definition$create policy site_visit_follow_up_requests_delete on public.site_visit_follow_up_requests for delete to authenticated using(public.site_visit_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.site_visit_follow_up_requests.site_visit_follow_up_requests_delete (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.buyer_property_profiles.buyer_property_profiles_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.property_match_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='buyer_property_profiles' and policyname='buyer_property_profiles_read';
  if not found then execute $definition$create policy buyer_property_profiles_read on public.buyer_property_profiles for select to authenticated using(public.property_match_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.buyer_property_profiles.buyer_property_profiles_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.buyer_property_profiles.buyer_property_profiles_create
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'INSERT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.property_match_can_manage(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='buyer_property_profiles' and policyname='buyer_property_profiles_create';
  if not found then execute $definition$create policy buyer_property_profiles_create on public.buyer_property_profiles for insert to authenticated with check(public.property_match_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.buyer_property_profiles.buyer_property_profiles_create (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.buyer_property_profiles.buyer_property_profiles_update
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'UPDATE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.property_match_can_manage(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.property_match_can_manage(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='buyer_property_profiles' and policyname='buyer_property_profiles_update';
  if not found then execute $definition$create policy buyer_property_profiles_update on public.buyer_property_profiles for update to authenticated using(public.property_match_can_manage(organization_id,workspace_id)) with check(public.property_match_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.buyer_property_profiles.buyer_property_profiles_update (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.buyer_property_profiles.buyer_property_profiles_delete
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'DELETE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.property_match_can_manage(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='buyer_property_profiles' and policyname='buyer_property_profiles_delete';
  if not found then execute $definition$create policy buyer_property_profiles_delete on public.buyer_property_profiles for delete to authenticated using(public.property_match_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.buyer_property_profiles.buyer_property_profiles_delete (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_match_signals.property_match_signals_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.property_match_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='property_match_signals' and policyname='property_match_signals_read';
  if not found then execute $definition$create policy property_match_signals_read on public.property_match_signals for select to authenticated using(public.property_match_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_match_signals.property_match_signals_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_match_signals.property_match_signals_create
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'INSERT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.property_match_can_manage(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='property_match_signals' and policyname='property_match_signals_create';
  if not found then execute $definition$create policy property_match_signals_create on public.property_match_signals for insert to authenticated with check(public.property_match_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_match_signals.property_match_signals_create (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_match_signals.property_match_signals_update
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'UPDATE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.property_match_can_manage(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.property_match_can_manage(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='property_match_signals' and policyname='property_match_signals_update';
  if not found then execute $definition$create policy property_match_signals_update on public.property_match_signals for update to authenticated using(public.property_match_can_manage(organization_id,workspace_id)) with check(public.property_match_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_match_signals.property_match_signals_update (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_match_signals.property_match_signals_delete
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'DELETE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.property_match_can_manage(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='property_match_signals' and policyname='property_match_signals_delete';
  if not found then execute $definition$create policy property_match_signals_delete on public.property_match_signals for delete to authenticated using(public.property_match_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_match_signals.property_match_signals_delete (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_match_runs.property_match_runs_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.property_match_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='property_match_runs' and policyname='property_match_runs_read';
  if not found then execute $definition$create policy property_match_runs_read on public.property_match_runs for select to authenticated using(public.property_match_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_match_runs.property_match_runs_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_match_runs.property_match_runs_create
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'INSERT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.property_match_can_manage(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='property_match_runs' and policyname='property_match_runs_create';
  if not found then execute $definition$create policy property_match_runs_create on public.property_match_runs for insert to authenticated with check(public.property_match_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_match_runs.property_match_runs_create (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_match_runs.property_match_runs_update
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'UPDATE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.property_match_can_manage(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.property_match_can_manage(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='property_match_runs' and policyname='property_match_runs_update';
  if not found then execute $definition$create policy property_match_runs_update on public.property_match_runs for update to authenticated using(public.property_match_can_manage(organization_id,workspace_id)) with check(public.property_match_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_match_runs.property_match_runs_update (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_match_runs.property_match_runs_delete
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'DELETE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.property_match_can_manage(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='property_match_runs' and policyname='property_match_runs_delete';
  if not found then execute $definition$create policy property_match_runs_delete on public.property_match_runs for delete to authenticated using(public.property_match_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_match_runs.property_match_runs_delete (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_match_results.property_match_results_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.property_match_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='property_match_results' and policyname='property_match_results_read';
  if not found then execute $definition$create policy property_match_results_read on public.property_match_results for select to authenticated using(public.property_match_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_match_results.property_match_results_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_match_results.property_match_results_create
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'INSERT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.property_match_can_manage(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='property_match_results' and policyname='property_match_results_create';
  if not found then execute $definition$create policy property_match_results_create on public.property_match_results for insert to authenticated with check(public.property_match_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_match_results.property_match_results_create (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_match_results.property_match_results_update
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'UPDATE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.property_match_can_manage(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.property_match_can_manage(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='property_match_results' and policyname='property_match_results_update';
  if not found then execute $definition$create policy property_match_results_update on public.property_match_results for update to authenticated using(public.property_match_can_manage(organization_id,workspace_id)) with check(public.property_match_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_match_results.property_match_results_update (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_match_results.property_match_results_delete
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'DELETE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.property_match_can_manage(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='property_match_results' and policyname='property_match_results_delete';
  if not found then execute $definition$create policy property_match_results_delete on public.property_match_results for delete to authenticated using(public.property_match_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_match_results.property_match_results_delete (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_shortlists.property_shortlists_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.property_match_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='property_shortlists' and policyname='property_shortlists_read';
  if not found then execute $definition$create policy property_shortlists_read on public.property_shortlists for select to authenticated using(public.property_match_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_shortlists.property_shortlists_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_shortlists.property_shortlists_create
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'INSERT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.property_match_can_manage(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='property_shortlists' and policyname='property_shortlists_create';
  if not found then execute $definition$create policy property_shortlists_create on public.property_shortlists for insert to authenticated with check(public.property_match_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_shortlists.property_shortlists_create (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_shortlists.property_shortlists_update
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'UPDATE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.property_match_can_manage(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.property_match_can_manage(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='property_shortlists' and policyname='property_shortlists_update';
  if not found then execute $definition$create policy property_shortlists_update on public.property_shortlists for update to authenticated using(public.property_match_can_manage(organization_id,workspace_id)) with check(public.property_match_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_shortlists.property_shortlists_update (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_shortlists.property_shortlists_delete
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'DELETE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.property_match_can_manage(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='property_shortlists' and policyname='property_shortlists_delete';
  if not found then execute $definition$create policy property_shortlists_delete on public.property_shortlists for delete to authenticated using(public.property_match_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_shortlists.property_shortlists_delete (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_match_audit.property_match_audit_read
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'SELECT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.property_match_member(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='property_match_audit' and policyname='property_match_audit_read';
  if not found then execute $definition$create policy property_match_audit_read on public.property_match_audit for select to authenticated using(public.property_match_member(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_match_audit.property_match_audit_read (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_match_audit.property_match_audit_create
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'INSERT' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.property_match_can_manage(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='property_match_audit' and policyname='property_match_audit_create';
  if not found then execute $definition$create policy property_match_audit_create on public.property_match_audit for insert to authenticated with check(public.property_match_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_match_audit.property_match_audit_create (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_match_audit.property_match_audit_update
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'UPDATE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.property_match_can_manage(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'public.property_match_can_manage(organization_id,workspace_id)' into differs from pg_policies where schemaname='public' and tablename='property_match_audit' and policyname='property_match_audit_update';
  if not found then execute $definition$create policy property_match_audit_update on public.property_match_audit for update to authenticated using(public.property_match_can_manage(organization_id,workspace_id)) with check(public.property_match_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_match_audit.property_match_audit_update (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for public.property_match_audit.property_match_audit_delete
do $vayon_policy$ declare differs boolean; begin
  select coalesce(cmd,'ALL')<>'DELETE' or coalesce(permissive,'')<>'PERMISSIVE' or not (roles @> array['authenticated']::name[] and roles <@ array['authenticated']::name[]) or regexp_replace(coalesce(qual,''),'\s+','','g')<>'public.property_match_can_manage(organization_id,workspace_id)' or regexp_replace(coalesce(with_check,''),'\s+','','g')<>'' into differs from pg_policies where schemaname='public' and tablename='property_match_audit' and policyname='property_match_audit_delete';
  if not found then execute $definition$create policy property_match_audit_delete on public.property_match_audit for delete to authenticated using(public.property_match_can_manage(organization_id,workspace_id))$definition$;
  elsif differs then raise exception 'Policy definition conflict: public.property_match_audit.property_match_audit_delete (command, permissive mode, roles, USING, or WITH CHECK differs)'; end if;
end $vayon_policy$;

-- Definition-aware reconciliation for auth.users.on_auth_user_profile
do $vayon_trigger$ declare definition text; begin
  select regexp_replace(lower(pg_get_triggerdef(t.oid,true)),'\s+','','g') into definition from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname='auth' and c.relname='users' and t.tgname='on_auth_user_profile';
  if definition is null then execute $definition$create trigger on_auth_user_profile after insert or update of email, raw_user_meta_data on auth.users for each row execute function public.handle_new_user_profile()$definition$;
  elsif definition<>'createtriggeron_auth_user_profileafterinsertorupdateofemail,raw_user_meta_dataonauth.usersforeachrowexecutefunctionpublic.handle_new_user_profile()' then raise exception 'Trigger definition conflict: auth.users.on_auth_user_profile'; end if;
end $vayon_trigger$;

-- Definition-aware reconciliation for public.ai_collaboration_runs.audit_ai_collaboration_run
do $vayon_trigger$ declare definition text; begin
  select regexp_replace(lower(pg_get_triggerdef(t.oid,true)),'\s+','','g') into definition from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname='public' and c.relname='ai_collaboration_runs' and t.tgname='audit_ai_collaboration_run';
  if definition is null then execute $definition$create trigger audit_ai_collaboration_run after insert or update on public.ai_collaboration_runs for each row execute function public.audit_ai_collaboration()$definition$;
  elsif definition<>'createtriggeraudit_ai_collaboration_runafterinsertorupdateonpublic.ai_collaboration_runsforeachrowexecutefunctionpublic.audit_ai_collaboration()' then raise exception 'Trigger definition conflict: public.ai_collaboration_runs.audit_ai_collaboration_run'; end if;
end $vayon_trigger$;

-- Definition-aware reconciliation for public.ai_collaboration_recommendations.audit_ai_collaboration_recommendation
do $vayon_trigger$ declare definition text; begin
  select regexp_replace(lower(pg_get_triggerdef(t.oid,true)),'\s+','','g') into definition from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname='public' and c.relname='ai_collaboration_recommendations' and t.tgname='audit_ai_collaboration_recommendation';
  if definition is null then execute $definition$create trigger audit_ai_collaboration_recommendation after insert on public.ai_collaboration_recommendations for each row execute function public.audit_ai_collaboration()$definition$;
  elsif definition<>'createtriggeraudit_ai_collaboration_recommendationafterinsertonpublic.ai_collaboration_recommendationsforeachrowexecutefunctionpublic.audit_ai_collaboration()' then raise exception 'Trigger definition conflict: public.ai_collaboration_recommendations.audit_ai_collaboration_recommendation'; end if;
end $vayon_trigger$;

-- Definition-aware reconciliation for public.ai_recommendations.ai_recommendation_notification
do $vayon_trigger$ declare definition text; begin
  select regexp_replace(lower(pg_get_triggerdef(t.oid,true)),'\s+','','g') into definition from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname='public' and c.relname='ai_recommendations' and t.tgname='ai_recommendation_notification';
  if definition is null then execute $definition$create trigger ai_recommendation_notification after insert on public.ai_recommendations for each row execute function public.notify_ai_recommendation()$definition$;
  elsif definition<>'createtriggerai_recommendation_notificationafterinsertonpublic.ai_recommendationsforeachrowexecutefunctionpublic.notify_ai_recommendation()' then raise exception 'Trigger definition conflict: public.ai_recommendations.ai_recommendation_notification'; end if;
end $vayon_trigger$;

-- Definition-aware reconciliation for public.ai_approval_queue.ai_approval_notification
do $vayon_trigger$ declare definition text; begin
  select regexp_replace(lower(pg_get_triggerdef(t.oid,true)),'\s+','','g') into definition from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname='public' and c.relname='ai_approval_queue' and t.tgname='ai_approval_notification';
  if definition is null then execute $definition$create trigger ai_approval_notification after insert or update of status on public.ai_approval_queue for each row execute function public.notify_ai_approval()$definition$;
  elsif definition<>'createtriggerai_approval_notificationafterinsertorupdateofstatusonpublic.ai_approval_queueforeachrowexecutefunctionpublic.notify_ai_approval()' then raise exception 'Trigger definition conflict: public.ai_approval_queue.ai_approval_notification'; end if;
end $vayon_trigger$;

-- Definition-aware reconciliation for public.security_alerts.security_alert_notification
do $vayon_trigger$ declare definition text; begin
  select regexp_replace(lower(pg_get_triggerdef(t.oid,true)),'\s+','','g') into definition from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname='public' and c.relname='security_alerts' and t.tgname='security_alert_notification';
  if definition is null then execute $definition$create trigger security_alert_notification after insert on public.security_alerts for each row execute function public.notify_security_alert()$definition$;
  elsif definition<>'createtriggersecurity_alert_notificationafterinsertonpublic.security_alertsforeachrowexecutefunctionpublic.notify_security_alert()' then raise exception 'Trigger definition conflict: public.security_alerts.security_alert_notification'; end if;
end $vayon_trigger$;

-- Definition-aware reconciliation for public.billing_events.billing_event_notification
do $vayon_trigger$ declare definition text; begin
  select regexp_replace(lower(pg_get_triggerdef(t.oid,true)),'\s+','','g') into definition from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname='public' and c.relname='billing_events' and t.tgname='billing_event_notification';
  if definition is null then execute $definition$create trigger billing_event_notification after insert or update of status on public.billing_events for each row execute function public.notify_billing_event()$definition$;
  elsif definition<>'createtriggerbilling_event_notificationafterinsertorupdateofstatusonpublic.billing_eventsforeachrowexecutefunctionpublic.notify_billing_event()' then raise exception 'Trigger definition conflict: public.billing_events.billing_event_notification'; end if;
end $vayon_trigger$;

commit;
