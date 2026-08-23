-- VAYON Version 1 — structurally guarded indexes
-- Generated for manual review. Does not alter migration history.
-- Supabase SQL Editor compatible; no psql meta-commands.
-- Supabase SQL Editor executes this stage transactionally; indexes intentionally use non-concurrent creation.

create temporary table if not exists vayon_expected_indexes(
 index_name text primary key,table_name text not null,access_method text not null,is_unique boolean not null,key_signatures text[] not null,include_columns text[] not null,descending boolean[] not null,nulls_first boolean[] not null,predicate_signature text not null
) on commit preserve rows;

insert into vayon_expected_indexes(index_name,table_name,access_method,is_unique,key_signatures,include_columns,descending,nulls_first,predicate_signature) values
('identity_audit_user_time_idx','identity_audit_events','btree',false,array['user_id','occurred_at']::text[],array[]::text[],array[false,true]::boolean[],array[false,true]::boolean[],''),
('identity_audit_workspace_time_idx','identity_audit_events','btree',false,array['workspace_id','occurred_at']::text[],array[]::text[],array[false,true]::boolean[],array[false,true]::boolean[],'workspace_idisnotnull'),
('subscriptions_provider_id_idx','subscriptions','btree',true,array['provider_subscription_id']::text[],array[]::text[],array[false]::boolean[],array[false]::boolean[],'provider_subscription_idisnotnull'),
('invoices_provider_id_idx','invoices','btree',true,array['provider_invoice_id']::text[],array[]::text[],array[false]::boolean[],array[false]::boolean[],'provider_invoice_idisnotnull'),
('invitations_one_pending_email_idx','invitations','btree',true,array['organization_id','loweremail']::text[],array[]::text[],array[false,false]::boolean[],array[false,false]::boolean[],'status=''pending'''),
('organization_audit_tenant_time_idx','organization_audit_events','btree',false,array['organization_id','workspace_id','occurred_at']::text[],array[]::text[],array[false,false,true]::boolean[],array[false,false,true]::boolean[],''),
('ai_collaboration_run_scope_idx','ai_collaboration_runs','btree',false,array['organization_id','workspace_id','created_at']::text[],array[]::text[],array[false,false,true]::boolean[],array[false,false,true]::boolean[],''),
('ai_collaboration_event_timeline_idx','ai_collaboration_events','btree',false,array['organization_id','workspace_id','created_at']::text[],array[]::text[],array[false,false,true]::boolean[],array[false,false,true]::boolean[],''),
('ai_collaboration_recommendation_graph_idx','ai_collaboration_recommendations','btree',false,array['organization_id','workspace_id','run_id','created_at']::text[],array[]::text[],array[false,false,false,false]::boolean[],array[false,false,false,false]::boolean[],''),
('identity_sessions_active_idx','identity_sessions','btree',false,array['user_id','last_seen_at']::text[],array[]::text[],array[false,true]::boolean[],array[false,true]::boolean[],'revoked_atisnull'),
('auth_attempts_user_time_idx','authentication_attempts','btree',false,array['user_id','occurred_at']::text[],array[]::text[],array[false,true]::boolean[],array[false,true]::boolean[],''),
('pat_scope_idx','personal_access_tokens','btree',false,array['user_id','organization_id','workspace_id']::text[],array[]::text[],array[false,false,false]::boolean[],array[false,false,false]::boolean[],'revoked_atisnull'),
('security_alert_user_time_idx','security_alerts','btree',false,array['user_id','created_at']::text[],array[]::text[],array[false,true]::boolean[],array[false,true]::boolean[],'resolved_atisnull'),
('notification_events_center_idx','notification_events','btree',false,array['workspace_id','user_id','created_at']::text[],array[]::text[],array[false,false,true]::boolean[],array[false,false,true]::boolean[],''),
('notification_events_unread_idx','notification_events','btree',false,array['workspace_id','user_id']::text[],array[]::text[],array[false,false]::boolean[],array[false,false]::boolean[],'read_atisnullandarchived_atisnull'),
('notification_reminders_due_idx','notification_reminders','btree',false,array['status','remind_at']::text[],array[]::text[],array[false,false]::boolean[],array[false,false]::boolean[],'status=''scheduled'''),
('email_queue_due_idx','email_messages','btree',false,array['provider','status','scheduled_at']::text[],array[]::text[],array[false,false,false]::boolean[],array[false,false,false]::boolean[],'status=''queued'''),
('email_history_idx','email_messages','btree',false,array['workspace_id','created_at']::text[],array[]::text[],array[false,true]::boolean[],array[false,true]::boolean[],''),
('email_attempt_message_idx','email_delivery_attempts','btree',false,array['message_id','started_at']::text[],array[]::text[],array[false,true]::boolean[],array[false,true]::boolean[],''),
('workflow_definitions_tenant_idx','workflow_definitions','btree',false,array['organization_id','workspace_id','status']::text[],array[]::text[],array[false,false,false]::boolean[],array[false,false,false]::boolean[],'deleted_atisnull'),
('workflow_instances_monitor_idx','workflow_instances','btree',false,array['organization_id','workspace_id','created_at']::text[],array[]::text[],array[false,false,true]::boolean[],array[false,false,true]::boolean[],''),
('workflow_triggers_claim_idx','workflow_trigger_events','btree',false,array['status','available_at']::text[],array[]::text[],array[false,false]::boolean[],array[false,false]::boolean[],'status=''pending'''),
('onboarding_events_dropoff_idx','onboarding_step_events','btree',false,array['step','event_type','created_at']::text[],array[]::text[],array[false,false,false]::boolean[],array[false,false,false]::boolean[],''),
('onboarding_import_observability_idx','onboarding_import_jobs','btree',false,array['organization_id','workspace_id','status','created_at']::text[],array[]::text[],array[false,false,false,true]::boolean[],array[false,false,false,true]::boolean[],''),
('knowledge_articles_search_idx','knowledge_articles','gin',false,array['to_tsvector''english'',title||''''||summary||''''||content']::text[],array[]::text[],array[false]::boolean[],array[false]::boolean[],''),
('knowledge_articles_tags_idx','knowledge_articles','gin',false,array['tags']::text[],array[]::text[],array[false]::boolean[],array[false]::boolean[],''),
('knowledge_analytics_dashboard_idx','knowledge_analytics','btree',false,array['organization_id','workspace_id','event_type','created_at']::text[],array[]::text[],array[false,false,false,true]::boolean[],array[false,false,false,true]::boolean[],''),
('ai_runtime_outputs_performance_idx','ai_runtime_outputs','btree',false,array['organization_id','workspace_id','created_at']::text[],array['latency_ms','input_tokens','output_tokens','cost_estimate']::text[],array[false,false,true]::boolean[],array[false,false,true]::boolean[],''),
('workflow_instances_performance_idx','workflow_instances','btree',false,array['organization_id','workspace_id','created_at']::text[],array['duration_ms','status','retry_count']::text[],array[false,false,true]::boolean[],array[false,false,true]::boolean[],''),
('workflow_approvals_lookup_idx','workflow_automation_approvals','btree',false,array['workspace_id','status','requested_at']::text[],array[]::text[],array[false,false,false]::boolean[],array[false,false,false]::boolean[],'status=''pending'''),
('workflow_queue_throughput_idx','workflow_trigger_events','btree',false,array['workspace_id','status','available_at']::text[],array['attempts']::text[],array[false,false,false]::boolean[],array[false,false,false]::boolean[],'statusin''pending'',''processing'''),
('notification_queue_throughput_idx','notification_queue','btree',false,array['workspace_id','status','next_attempt_at']::text[],array['attempts','created_at','delivered_at']::text[],array[false,false,false]::boolean[],array[false,false,false]::boolean[],'statusin''queued'',''processing'',''sent'''),
('notification_preferences_lookup_idx','notification_preferences','btree',false,array['workspace_id','user_id']::text[],array[]::text[],array[false,false]::boolean[],array[false,false]::boolean[],''),
('knowledge_articles_listing_idx','knowledge_articles','btree',false,array['organization_id','workspace_id','status','updated_at']::text[],array[]::text[],array[false,false,false,true]::boolean[],array[false,false,false,true]::boolean[],'deleted_atisnull'),
('knowledge_documents_listing_idx','knowledge_documents','btree',false,array['organization_id','workspace_id','status','created_at']::text[],array[]::text[],array[false,false,false,true]::boolean[],array[false,false,false,true]::boolean[],'deleted_atisnull'),
('knowledge_analytics_performance_idx','knowledge_analytics','btree',false,array['organization_id','workspace_id','created_at']::text[],array['event_type','latency_ms','success']::text[],array[false,false,true]::boolean[],array[false,false,true]::boolean[],''),
('security_review_events_observability_idx','security_review_events','btree',false,array['organization_id','workspace_id','event_type','created_at']::text[],array[]::text[],array[false,false,false,true]::boolean[],array[false,false,false,true]::boolean[],''),
('marketing_events_analytics_idx','marketing_events','btree',false,array['event_type','created_at']::text[],array[]::text[],array[false,true]::boolean[],array[false,true]::boolean[],''),
('marketing_leads_pipeline_idx','marketing_leads','btree',false,array['kind','status','created_at']::text[],array[]::text[],array[false,false,true]::boolean[],array[false,false,true]::boolean[],''),
('documentation_events_created_at_idx','documentation_events','btree',false,array['created_at']::text[],array[]::text[],array[true]::boolean[],array[true]::boolean[],''),
('documentation_events_article_idx','documentation_events','btree',false,array['article_slug','created_at']::text[],array[]::text[],array[false,true]::boolean[],array[false,true]::boolean[],''),
('workspace_analytics_events_scope_idx','workspace_analytics_events','btree',false,array['organization_id','workspace_id','occurred_at']::text[],array['event_name','path','duration_ms']::text[],array[false,false,true]::boolean[],array[false,false,true]::boolean[],''),
('marketing_events_path_performance_idx','marketing_events','btree',false,array['path','event_type','created_at']::text[],array[]::text[],array[false,false,true]::boolean[],array[false,false,true]::boolean[],''),
('launch_readiness_audit_runs_scope_idx','launch_readiness_audit_runs','btree',false,array['organization_id','workspace_id','created_at']::text[],array[]::text[],array[false,false,true]::boolean[],array[false,false,true]::boolean[],''),
('organization_departments_active_name_idx','organization_departments','btree',true,array['workspace_id','lowername']::text[],array[]::text[],array[false,false]::boolean[],array[false,false]::boolean[],'status=''active'''),
('organization_departments_tenant_idx','organization_departments','btree',false,array['organization_id','workspace_id','status']::text[],array[]::text[],array[false,false,false]::boolean[],array[false,false,false]::boolean[],''),
('organization_teams_active_name_idx','organization_teams','btree',true,array['workspace_id','lowername']::text[],array[]::text[],array[false,false]::boolean[],array[false,false]::boolean[],'status=''active'''),
('organization_teams_tenant_idx','organization_teams','btree',false,array['organization_id','workspace_id','department_id','status']::text[],array[]::text[],array[false,false,false,false]::boolean[],array[false,false,false,false]::boolean[],''),
('property_projects_search_idx','property_projects','btree',false,array['workspace_id','city','status','developer']::text[],array[]::text[],array[false,false,false,false]::boolean[],array[false,false,false,false]::boolean[],''),
('property_towers_project_idx','property_towers','btree',false,array['workspace_id','project_id']::text[],array[]::text[],array[false,false]::boolean[],array[false,false]::boolean[],''),
('property_units_inventory_idx','property_units','btree',false,array['workspace_id','project_id','tower_id','status','bhk_type','price','area']::text[],array[]::text[],array[false,false,false,false,false,false,false]::boolean[],array[false,false,false,false,false,false,false]::boolean[],''),
('property_price_history_idx','property_price_revisions','btree',false,array['workspace_id','project_id','unit_id','effective_from']::text[],array[]::text[],array[false,false,false,true]::boolean[],array[false,false,false,true]::boolean[],''),
('property_documents_project_idx','property_documents','btree',false,array['workspace_id','project_id','kind']::text[],array[]::text[],array[false,false,false]::boolean[],array[false,false,false]::boolean[],''),
('property_inventory_audit_idx','property_inventory_audit','btree',false,array['workspace_id','project_id','occurred_at']::text[],array[]::text[],array[false,false,true]::boolean[],array[false,false,true]::boolean[],''),
('site_visits_schedule_v2_idx','site_visits','btree',false,array['organization_id','workspace_id','assigned_agent_id','starts_at','ends_at']::text[],array[]::text[],array[false,false,false,false,false]::boolean[],array[false,false,false,false,false]::boolean[],'deleted_atisnull'),
('site_visit_feedback_visit_idx','site_visit_feedback','btree',false,array['workspace_id','visit_id','created_at']::text[],array[]::text[],array[false,false,true]::boolean[],array[false,false,true]::boolean[],''),
('site_visit_audit_visit_idx','site_visit_audit','btree',false,array['workspace_id','visit_id','occurred_at']::text[],array[]::text[],array[false,false,true]::boolean[],array[false,false,true]::boolean[],''),
('site_visit_follow_up_idx','site_visit_follow_up_requests','btree',false,array['workspace_id','status','created_at']::text[],array[]::text[],array[false,false,false]::boolean[],array[false,false,false]::boolean[],''),
('buyer_profiles_tenant_idx','buyer_property_profiles','btree',false,array['workspace_id','customer_id','lead_id','opportunity_id']::text[],array[]::text[],array[false,false,false,false]::boolean[],array[false,false,false,false]::boolean[],''),
('match_signals_profile_idx','property_match_signals','btree',false,array['workspace_id','profile_id','signal_type','created_at']::text[],array[]::text[],array[false,false,false,true]::boolean[],array[false,false,false,true]::boolean[],''),
('match_results_profile_idx','property_match_results','btree',false,array['workspace_id','profile_id','score']::text[],array[]::text[],array[false,false,true]::boolean[],array[false,false,true]::boolean[],''),
('shortlists_profile_idx','property_shortlists','btree',false,array['workspace_id','profile_id','created_at']::text[],array[]::text[],array[false,false,true]::boolean[],array[false,false,true]::boolean[],''),
('match_audit_trace_idx','property_match_audit','btree',false,array['workspace_id','profile_id','occurred_at']::text[],array[]::text[],array[false,false,true]::boolean[],array[false,false,true]::boolean[],''),
('communication_attachments_thread_idx','communication_attachments','btree',false,array['organization_id','workspace_id','thread_id','created_at']::text[],array[]::text[],array[false,false,false,true]::boolean[],array[false,false,false,true]::boolean[],''),
('communication_ai_thread_idx','communication_ai_recommendations','btree',false,array['organization_id','workspace_id','thread_id','created_at']::text[],array[]::text[],array[false,false,false,true]::boolean[],array[false,false,false,true]::boolean[],''),
('communication_audit_tenant_idx','communication_audit','btree',false,array['organization_id','workspace_id','occurred_at']::text[],array[]::text[],array[false,false,true]::boolean[],array[false,false,true]::boolean[],''),
('creative_campaign_recent_idx','creative_campaigns','btree',false,array['organization_id','workspace_id','updated_at']::text[],array[]::text[],array[false,false,true]::boolean[],array[false,false,true]::boolean[],''),
('creative_asset_search_idx','creative_assets','btree',false,array['organization_id','workspace_id','project_id','platform','language','status','generated_at']::text[],array[]::text[],array[false,false,false,false,false,false,true]::boolean[],array[false,false,false,false,false,false,true]::boolean[],''),
('creative_timeline_idx','creative_timeline','btree',false,array['organization_id','workspace_id','occurred_at']::text[],array[]::text[],array[false,false,true]::boolean[],array[false,false,true]::boolean[],''),
('creative_asset_cache_idx','creative_assets','btree',true,array['workspace_id','cache_key']::text[],array[]::text[],array[false,false]::boolean[],array[false,false]::boolean[],'cache_keyisnotnull'),
('creative_jobs_queue_idx','creative_generation_jobs','btree',false,array['status','created_at']::text[],array[]::text[],array[false,false]::boolean[],array[false,false]::boolean[],'statusin''queued'',''processing'''),
('creative_jobs_tenant_idx','creative_generation_jobs','btree',false,array['organization_id','workspace_id','created_at']::text[],array[]::text[],array[false,false,true]::boolean[],array[false,false,true]::boolean[],''),
('creative_pack_scope_idx','creative_campaign_packs','btree',false,array['organization_id','workspace_id','project_id','status','created_at']::text[],array[]::text[],array[false,false,false,false,true]::boolean[],array[false,false,false,false,true]::boolean[],''),
('creative_schedule_scope_idx','creative_campaign_schedule','btree',false,array['organization_id','workspace_id','scheduled_for']::text[],array[]::text[],array[false,false,false]::boolean[],array[false,false,false]::boolean[],''),
('commercial_customer_scope_idx','commercial_provider_customers','btree',false,array['organization_id','workspace_id','provider']::text[],array[]::text[],array[false,false,false]::boolean[],array[false,false,false]::boolean[],''),
('feature_license_scope_idx','workspace_feature_licenses','btree',false,array['organization_id','workspace_id','feature','enabled']::text[],array[]::text[],array[false,false,false,false]::boolean[],array[false,false,false,false]::boolean[],''),
('knowledge_trusted_retrieval_idx','knowledge_articles','btree',false,array['organization_id','workspace_id','status','module','product_version','updated_at']::text[],array[]::text[],array[false,false,false,false,false,true]::boolean[],array[false,false,false,false,false,true]::boolean[],'deleted_atisnull'),
('knowledge_video_transcript_idx','knowledge_videos','gin',false,array['to_tsvector''english'',title||''''||summary||''''||transcript']::text[],array[]::text[],array[false]::boolean[],array[false]::boolean[],''),
('knowledge_quality_feedback_idx','knowledge_quality_feedback','btree',false,array['organization_id','workspace_id','rating','created_at']::text[],array[]::text[],array[false,false,false,true]::boolean[],array[false,false,false,true]::boolean[],''),
('product_intelligence_scope_idx','product_intelligence_events','btree',false,array['organization_id','workspace_id','occurred_at']::text[],array['event_name','module','duration_ms','outcome']::text[],array[false,false,true]::boolean[],array[false,false,true]::boolean[],''),
('product_intelligence_module_idx','product_intelligence_events','btree',false,array['workspace_id','module','event_name','occurred_at']::text[],array[]::text[],array[false,false,false,true]::boolean[],array[false,false,false,true]::boolean[],''),
('product_feedback_trends_idx','product_feedback','btree',false,array['organization_id','workspace_id','kind','priority','created_at']::text[],array[]::text[],array[false,false,false,false,true]::boolean[],array[false,false,false,false,true]::boolean[],''),
('intelligence_memory_org_key','intelligence_memory','btree',true,array['workspace_id','memory_key']::text[],array[]::text[],array[false,false]::boolean[],array[false,false]::boolean[],'scope=''organization'''),
('intelligence_memory_user_key','intelligence_memory','btree',true,array['workspace_id','user_id','memory_key']::text[],array[]::text[],array[false,false,false]::boolean[],array[false,false,false]::boolean[],'scope=''user'''),
('continuous_learning_period_idx','continuous_learning_aggregates','btree',false,array['organization_id','workspace_id','period_start','metric_key']::text[],array[]::text[],array[false,false,true,false]::boolean[],array[false,false,true,false]::boolean[],''),
('executive_briefings_scope_idx','executive_intelligence_briefings','btree',false,array['organization_id','workspace_id','generated_at']::text[],array[]::text[],array[false,false,true]::boolean[],array[false,false,true]::boolean[],''),
('continuous_learning_jobs_scope_idx','continuous_learning_jobs','btree',false,array['organization_id','workspace_id','started_at']::text[],array[]::text[],array[false,false,true]::boolean[],array[false,false,true]::boolean[],'')
on conflict(index_name) do nothing;

do $vayon_index_audit$
declare expected record;index_oid oid;actual_table text;actual_method text;actual_unique boolean;actual_valid boolean;actual_ready boolean;actual_live boolean;actual_keys text[];actual_include text[];actual_descending boolean[];actual_nulls_first boolean[];actual_predicate text;default_opclasses boolean;
begin
 for expected in select * from vayon_expected_indexes order by index_name loop
  select idx.oid,t.relname,am.amname,x.indisunique,x.indisvalid,x.indisready,x.indislive,
   (select array_agg(case when x.indkey[pos-1]<>0 then a.attname else regexp_replace(regexp_replace(lower(pg_get_indexdef(idx.oid,pos,false)),'::(text|regconfig|varchar|character varying|timestamp( with(out)? time zone)?|date|integer|bigint|numeric|uuid)(\\[\\])?','','g'),'[[:space:]()]','','g') end order by pos) from generate_series(1,x.indnkeyatts) pos left join pg_attribute a on a.attrelid=x.indrelid and a.attnum=x.indkey[pos-1]),
   coalesce((select array_agg(a.attname order by pos) from generate_series(x.indnkeyatts+1,x.indnatts) pos join pg_attribute a on a.attrelid=x.indrelid and a.attnum=x.indkey[pos-1]),array[]::text[]),
   (select array_agg((x.indoption[pos-1]&1)<>0 order by pos) from generate_series(1,x.indnkeyatts) pos),
   (select array_agg((x.indoption[pos-1]&2)<>0 order by pos) from generate_series(1,x.indnkeyatts) pos),
   coalesce(replace(replace(replace(regexp_replace(regexp_replace(lower(pg_get_expr(x.indpred,x.indrelid,false)),'::(text|regconfig|varchar|character varying|timestamp( with(out)? time zone)?|date|integer|bigint|numeric|uuid)(\\[\\])?','','g'),'[[:space:]()]','','g'),'[',''),']',''),'=anyarray','in'),''),
   not exists(select 1 from generate_series(1,x.indnkeyatts) pos join pg_opclass opc on opc.oid=x.indclass[pos-1] where not opc.opcdefault)
  into index_oid,actual_table,actual_method,actual_unique,actual_valid,actual_ready,actual_live,actual_keys,actual_include,actual_descending,actual_nulls_first,actual_predicate,default_opclasses
  from pg_class idx join pg_namespace ns on ns.oid=idx.relnamespace left join pg_index x on x.indexrelid=idx.oid left join pg_class t on t.oid=x.indrelid left join pg_am am on am.oid=idx.relam
  where ns.nspname='public' and idx.relname=expected.index_name;
  if index_oid is null then continue;end if;
  if not coalesce(actual_valid,false) or not coalesce(actual_ready,false) or not coalesce(actual_live,false) then raise exception 'Invalid existing index: %',expected.index_name;end if;
  if actual_table is distinct from expected.table_name or actual_method is distinct from expected.access_method or actual_unique is distinct from expected.is_unique or actual_keys is distinct from expected.key_signatures or actual_include is distinct from expected.include_columns or actual_descending is distinct from expected.descending or actual_nulls_first is distinct from expected.nulls_first or actual_predicate is distinct from expected.predicate_signature or not coalesce(default_opclasses,false) then raise exception 'Index structural conflict: %',expected.index_name;end if;
 end loop;
end $vayon_index_audit$;

do $vayon_unique_preflight$ begin if exists(select 1 from public.subscriptions where provider_subscription_id is not null group by provider_subscription_id having count(*)>1) then raise exception 'Duplicate data blocks unique index subscriptions_provider_id_idx'; end if; end $vayon_unique_preflight$;
do $vayon_unique_preflight$ begin if exists(select 1 from public.invoices where provider_invoice_id is not null group by provider_invoice_id having count(*)>1) then raise exception 'Duplicate data blocks unique index invoices_provider_id_idx'; end if; end $vayon_unique_preflight$;
do $vayon_unique_preflight$ begin if exists(select 1 from public.invitations where status='pending' group by organization_id,lower(email) having count(*)>1) then raise exception 'Duplicate data blocks unique index invitations_one_pending_email_idx'; end if; end $vayon_unique_preflight$;
do $vayon_unique_preflight$ begin if exists(select 1 from public.organization_departments where status='active' group by workspace_id,lower(name) having count(*)>1) then raise exception 'Duplicate data blocks unique index organization_departments_active_name_idx'; end if; end $vayon_unique_preflight$;
do $vayon_unique_preflight$ begin if exists(select 1 from public.organization_teams where status='active' group by workspace_id,lower(name) having count(*)>1) then raise exception 'Duplicate data blocks unique index organization_teams_active_name_idx'; end if; end $vayon_unique_preflight$;
do $vayon_unique_preflight$ begin if exists(select 1 from public.creative_assets where cache_key is not null group by workspace_id,cache_key having count(*)>1) then raise exception 'Duplicate data blocks unique index creative_asset_cache_idx'; end if; end $vayon_unique_preflight$;
do $vayon_unique_preflight$ begin if exists(select 1 from public.intelligence_memory where scope='organization' group by workspace_id,memory_key having count(*)>1) then raise exception 'Duplicate data blocks unique index intelligence_memory_org_key'; end if; end $vayon_unique_preflight$;
do $vayon_unique_preflight$ begin if exists(select 1 from public.intelligence_memory where scope='user' group by workspace_id,user_id,memory_key having count(*)>1) then raise exception 'Duplicate data blocks unique index intelligence_memory_user_key'; end if; end $vayon_unique_preflight$;

create index if not exists identity_audit_user_time_idx on public.identity_audit_events(user_id, occurred_at desc);

create index if not exists identity_audit_workspace_time_idx on public.identity_audit_events(workspace_id, occurred_at desc) where workspace_id is not null;

create unique index if not exists subscriptions_provider_id_idx on public.subscriptions(provider_subscription_id) where provider_subscription_id is not null;

create unique index if not exists invoices_provider_id_idx on public.invoices(provider_invoice_id) where provider_invoice_id is not null;

create unique index if not exists invitations_one_pending_email_idx on public.invitations(organization_id,lower(email))where status='pending';

create index if not exists organization_audit_tenant_time_idx on public.organization_audit_events(organization_id,workspace_id,occurred_at desc);

create index if not exists ai_collaboration_run_scope_idx on public.ai_collaboration_runs(organization_id,workspace_id,created_at desc);

create index if not exists ai_collaboration_event_timeline_idx on public.ai_collaboration_events(organization_id,workspace_id,created_at desc);

create index if not exists ai_collaboration_recommendation_graph_idx on public.ai_collaboration_recommendations(organization_id,workspace_id,run_id,created_at);

create index if not exists identity_sessions_active_idx on public.identity_sessions(user_id,last_seen_at desc)where revoked_at is null;

create index if not exists auth_attempts_user_time_idx on public.authentication_attempts(user_id,occurred_at desc);

create index if not exists pat_scope_idx on public.personal_access_tokens(user_id,organization_id,workspace_id)where revoked_at is null;

create index if not exists security_alert_user_time_idx on public.security_alerts(user_id,created_at desc)where resolved_at is null;

create index if not exists notification_events_center_idx on public.notification_events(workspace_id,user_id,created_at desc);

create index if not exists notification_events_unread_idx on public.notification_events(workspace_id,user_id)where read_at is null and archived_at is null;

create index if not exists notification_reminders_due_idx on public.notification_reminders(status,remind_at)where status='scheduled';

create index if not exists email_queue_due_idx on public.email_messages(provider,status,scheduled_at)where status='queued';

create index if not exists email_history_idx on public.email_messages(workspace_id,created_at desc);

create index if not exists email_attempt_message_idx on public.email_delivery_attempts(message_id,started_at desc);

create index if not exists workflow_definitions_tenant_idx on public.workflow_definitions(organization_id,workspace_id,status) where deleted_at is null;

create index if not exists workflow_instances_monitor_idx on public.workflow_instances(organization_id,workspace_id,created_at desc);

create index if not exists workflow_triggers_claim_idx on public.workflow_trigger_events(status,available_at) where status='pending';

create index if not exists onboarding_events_dropoff_idx on public.onboarding_step_events(step,event_type,created_at);

create index if not exists onboarding_import_observability_idx on public.onboarding_import_jobs(organization_id,workspace_id,status,created_at desc);

create index if not exists knowledge_articles_search_idx on public.knowledge_articles using gin(to_tsvector('english',title||' '||summary||' '||content));

create index if not exists knowledge_articles_tags_idx on public.knowledge_articles using gin(tags);

create index if not exists knowledge_analytics_dashboard_idx on public.knowledge_analytics(organization_id,workspace_id,event_type,created_at desc);

create index if not exists ai_runtime_outputs_performance_idx on public.ai_runtime_outputs(organization_id,workspace_id,created_at desc)include(latency_ms,input_tokens,output_tokens,cost_estimate);

create index if not exists workflow_instances_performance_idx on public.workflow_instances(organization_id,workspace_id,created_at desc)include(duration_ms,status,retry_count);

create index if not exists workflow_approvals_lookup_idx on public.workflow_automation_approvals(workspace_id,status,requested_at)where status='pending';

create index if not exists workflow_queue_throughput_idx on public.workflow_trigger_events(workspace_id,status,available_at)include(attempts)where status in('pending','processing');

create index if not exists notification_queue_throughput_idx on public.notification_queue(workspace_id,status,next_attempt_at)include(attempts,created_at,delivered_at)where status in('queued','processing','sent');

create index if not exists notification_preferences_lookup_idx on public.notification_preferences(workspace_id,user_id);

create index if not exists knowledge_articles_listing_idx on public.knowledge_articles(organization_id,workspace_id,status,updated_at desc)where deleted_at is null;

create index if not exists knowledge_documents_listing_idx on public.knowledge_documents(organization_id,workspace_id,status,created_at desc)where deleted_at is null;

create index if not exists knowledge_analytics_performance_idx on public.knowledge_analytics(organization_id,workspace_id,created_at desc)include(event_type,latency_ms,success);

create index if not exists security_review_events_observability_idx on public.security_review_events(organization_id,workspace_id,event_type,created_at desc);

create index if not exists marketing_events_analytics_idx on public.marketing_events(event_type,created_at desc);

create index if not exists marketing_leads_pipeline_idx on public.marketing_leads(kind,status,created_at desc);

create index if not exists documentation_events_created_at_idx on public.documentation_events(created_at desc);

create index if not exists documentation_events_article_idx on public.documentation_events(article_slug, created_at desc);

create index if not exists workspace_analytics_events_scope_idx on public.workspace_analytics_events(organization_id,workspace_id,occurred_at desc)include(event_name,path,duration_ms);

create index if not exists marketing_events_path_performance_idx on public.marketing_events(path,event_type,created_at desc);

create index if not exists launch_readiness_audit_runs_scope_idx on public.launch_readiness_audit_runs(organization_id,workspace_id,created_at desc);

create unique index if not exists organization_departments_active_name_idx on public.organization_departments(workspace_id,lower(name)) where status='active';

create index if not exists organization_departments_tenant_idx on public.organization_departments(organization_id,workspace_id,status);

create unique index if not exists organization_teams_active_name_idx on public.organization_teams(workspace_id,lower(name)) where status='active';

create index if not exists organization_teams_tenant_idx on public.organization_teams(organization_id,workspace_id,department_id,status);

create index if not exists property_projects_search_idx on public.property_projects(workspace_id,city,status,developer);

create index if not exists property_towers_project_idx on public.property_towers(workspace_id,project_id);

create index if not exists property_units_inventory_idx on public.property_units(workspace_id,project_id,tower_id,status,bhk_type,price,area);

create index if not exists property_price_history_idx on public.property_price_revisions(workspace_id,project_id,unit_id,effective_from desc);

create index if not exists property_documents_project_idx on public.property_documents(workspace_id,project_id,kind);

create index if not exists property_inventory_audit_idx on public.property_inventory_audit(workspace_id,project_id,occurred_at desc);

create index if not exists site_visits_schedule_v2_idx on public.site_visits(organization_id,workspace_id,assigned_agent_id,starts_at,ends_at)where deleted_at is null;

create index if not exists site_visit_feedback_visit_idx on public.site_visit_feedback(workspace_id,visit_id,created_at desc);

create index if not exists site_visit_audit_visit_idx on public.site_visit_audit(workspace_id,visit_id,occurred_at desc);

create index if not exists site_visit_follow_up_idx on public.site_visit_follow_up_requests(workspace_id,status,created_at);

create index if not exists buyer_profiles_tenant_idx on public.buyer_property_profiles(workspace_id,customer_id,lead_id,opportunity_id);

create index if not exists match_signals_profile_idx on public.property_match_signals(workspace_id,profile_id,signal_type,created_at desc);

create index if not exists match_results_profile_idx on public.property_match_results(workspace_id,profile_id,score desc);

create index if not exists shortlists_profile_idx on public.property_shortlists(workspace_id,profile_id,created_at desc);

create index if not exists match_audit_trace_idx on public.property_match_audit(workspace_id,profile_id,occurred_at desc);

create index if not exists communication_attachments_thread_idx on public.communication_attachments(organization_id,workspace_id,thread_id,created_at desc);

create index if not exists communication_ai_thread_idx on public.communication_ai_recommendations(organization_id,workspace_id,thread_id,created_at desc);

create index if not exists communication_audit_tenant_idx on public.communication_audit(organization_id,workspace_id,occurred_at desc);

create index if not exists creative_campaign_recent_idx on public.creative_campaigns(organization_id,workspace_id,updated_at desc);

create index if not exists creative_asset_search_idx on public.creative_assets(organization_id,workspace_id,project_id,platform,language,status,generated_at desc);

create index if not exists creative_timeline_idx on public.creative_timeline(organization_id,workspace_id,occurred_at desc);

create unique index if not exists creative_asset_cache_idx on public.creative_assets(workspace_id,cache_key)where cache_key is not null;

create index if not exists creative_jobs_queue_idx on public.creative_generation_jobs(status,created_at)where status in('queued','processing');

create index if not exists creative_jobs_tenant_idx on public.creative_generation_jobs(organization_id,workspace_id,created_at desc);

create index if not exists creative_pack_scope_idx on public.creative_campaign_packs(organization_id,workspace_id,project_id,status,created_at desc);

create index if not exists creative_schedule_scope_idx on public.creative_campaign_schedule(organization_id,workspace_id,scheduled_for);

create index if not exists commercial_customer_scope_idx on public.commercial_provider_customers(organization_id,workspace_id,provider);

create index if not exists feature_license_scope_idx on public.workspace_feature_licenses(organization_id,workspace_id,feature,enabled);

create index if not exists knowledge_trusted_retrieval_idx on public.knowledge_articles(organization_id,workspace_id,status,module,product_version,updated_at desc)where deleted_at is null;

create index if not exists knowledge_video_transcript_idx on public.knowledge_videos using gin(to_tsvector('english',title||' '||summary||' '||transcript));

create index if not exists knowledge_quality_feedback_idx on public.knowledge_quality_feedback(organization_id,workspace_id,rating,created_at desc);

create index if not exists product_intelligence_scope_idx on public.product_intelligence_events(organization_id,workspace_id,occurred_at desc)include(event_name,module,duration_ms,outcome);

create index if not exists product_intelligence_module_idx on public.product_intelligence_events(workspace_id,module,event_name,occurred_at desc);

create index if not exists product_feedback_trends_idx on public.product_feedback(organization_id,workspace_id,kind,priority,created_at desc);

create unique index if not exists intelligence_memory_org_key on public.intelligence_memory(workspace_id,memory_key) where scope='organization';

create unique index if not exists intelligence_memory_user_key on public.intelligence_memory(workspace_id,user_id,memory_key) where scope='user';

create index if not exists continuous_learning_period_idx on public.continuous_learning_aggregates(organization_id,workspace_id,period_start desc,metric_key);

create index if not exists executive_briefings_scope_idx on public.executive_intelligence_briefings(organization_id,workspace_id,generated_at desc);

create index if not exists continuous_learning_jobs_scope_idx on public.continuous_learning_jobs(organization_id,workspace_id,started_at desc);


