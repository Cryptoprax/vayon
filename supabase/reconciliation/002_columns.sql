-- VAYON Version 1 — additive columns and constraints
-- Generated for manual review. Does not alter migration history.
-- Supabase SQL Editor compatible; no psql meta-commands.
begin;
set local lock_timeout='5s';
set local statement_timeout='120s';

alter table public.organizations add column if not exists business_type text;

alter table public.organizations add column if not exists company_size text;

alter table public.organizations add column if not exists phone text;

alter table public.organizations add column if not exists website text;

alter table public.organizations add column if not exists industry text;

alter table public.subscriptions add column if not exists provider_price_id text;

alter table public.invoices add column if not exists payment_intent_id text;

alter table public.organizations add column if not exists business_email text;

alter table public.organizations add column if not exists locale text not null default 'en-IN';

alter table public.organizations add column if not exists address jsonb not null default '{}';

alter table public.organizations add column if not exists branding jsonb not null default '{}';

alter table public.organizations add column if not exists version integer not null default 1;

alter table public.invitations add column if not exists resent_at timestamptz;

alter table public.invitations add column if not exists accepted_at timestamptz;

alter table public.invitations add column if not exists cancelled_at timestamptz;

alter table public.organization_members add column if not exists updated_at timestamptz not null default now();

alter table public.workspace_members add column if not exists updated_at timestamptz not null default now();

alter table public.notification_events add column if not exists source_type text;

alter table public.notification_events add column if not exists source_id uuid;

alter table public.notification_events add column if not exists archived_at timestamptz;

alter table public.notification_events add column if not exists snoozed_until timestamptz;

alter table public.notification_events add column if not exists starred boolean not null default false;

alter table public.notification_events add column if not exists mentioned boolean not null default false;

alter table public.notification_preferences add column if not exists browser_push_enabled boolean not null default false;

alter table public.notification_preferences add column if not exists whatsapp_enabled boolean not null default false;

alter table public.notification_preferences add column if not exists muted boolean not null default false;

alter table public.notification_preferences add column if not exists digest_frequency text not null default 'instant' ;

alter table public.notification_queue add column if not exists started_at timestamptz;

alter table public.notification_queue add column if not exists delivered_at timestamptz;

alter table public.notification_queue add column if not exists provider text;

alter table public.organizations add column if not exists business_hours jsonb not null default '{"monday":{"open":"09:00","close":"18:00"},"tuesday":{"open":"09:00","close":"18:00"},"wednesday":{"open":"09:00","close":"18:00"},"thursday":{"open":"09:00","close":"18:00"},"friday":{"open":"09:00","close":"18:00"}}';

alter table public.organizations add column if not exists regional_settings jsonb not null default '{}';

alter table public.site_visits add column if not exists contact_id uuid,add column if not exists project_id uuid,add column if not exists tower_id uuid,add column if not exists unit_id uuid,add column if not exists customer_label text,add column if not exists agent_label text,add column if not exists project_label text,add column if not exists tower_label text,add column if not exists unit_label text,add column if not exists duration_minutes integer not null default 60,add column if not exists visit_type text not null default'initial',add column if not exists priority text not null default'medium',add column if not exists agenda jsonb not null default'[]',add column if not exists visitor_instructions text,add column if not exists documents jsonb not null default'[]',add column if not exists checklist jsonb not null default'[]',add column if not exists reminder_timeline jsonb not null default'[]',add column if not exists arrival_at timestamptz,add column if not exists departure_at timestamptz;

alter table public.communication_notes add column if not exists pinned boolean not null default false;

alter table public.communication_notes add column if not exists mentions uuid[] not null default '{}';

alter table public.communication_notes add column if not exists attachment_ids uuid[] not null default '{}';

alter table public.creative_assets add column if not exists storage_path text;

alter table public.creative_assets add column if not exists mime_type text ;

alter table public.creative_assets add column if not exists model text;

alter table public.creative_assets add column if not exists reasoning_summary text;

alter table public.creative_assets add column if not exists cache_key text;

alter table public.knowledge_articles add column if not exists knowledge_kind text not null default'knowledge_article';

alter table public.knowledge_articles add column if not exists visibility text not null default'workspace';

alter table public.knowledge_articles add column if not exists product_version text;

alter table public.knowledge_articles add column if not exists module text;

alter table public.knowledge_articles add column if not exists feature_key text;

alter table public.knowledge_articles add column if not exists minimum_plan text;

alter table public.knowledge_articles add column if not exists deprecated boolean not null default false;

alter table public.knowledge_articles add column if not exists upcoming boolean not null default false;

alter table public.knowledge_articles add column if not exists approved_by uuid references auth.users(id);

alter table public.knowledge_articles add column if not exists approved_at timestamptz;

do $vayon_constraint$
declare
  constraint_oid oid;
  constraint_type "char";
  targets_expected_column boolean;
begin
  select c.oid,c.contype,
         cardinality(c.conkey)=1 and exists(
           select 1
           from unnest(c.conkey) as key(attnum)
           join pg_attribute a on a.attrelid=c.conrelid and a.attnum=key.attnum
           where a.attname='digest_frequency' and not a.attisdropped
         )
  into constraint_oid,constraint_type,targets_expected_column
  from pg_constraint c
  where c.conrelid='public.notification_preferences'::regclass and c.conname='notification_preferences_digest_frequency_check';
  if constraint_oid is not null then
    if constraint_type<>'c' or not coalesce(targets_expected_column,false) then
      raise exception 'Constraint identity conflict: notification_preferences_digest_frequency_check';
    end if;
  else
    if exists(select 1 from public.notification_preferences where not (digest_frequency in('instant','daily','weekly','off'))) then
      raise exception 'Existing data blocks constraint notification_preferences_digest_frequency_check';
    end if;
    alter table public.notification_preferences add constraint notification_preferences_digest_frequency_check check(digest_frequency in('instant','daily','weekly','off')) not valid;
    alter table public.notification_preferences validate constraint notification_preferences_digest_frequency_check;
  end if;
end $vayon_constraint$;

do $vayon_constraint$
declare
  constraint_oid oid;
  constraint_type "char";
  targets_expected_column boolean;
begin
  select c.oid,c.contype,
         cardinality(c.conkey)=1 and exists(
           select 1
           from unnest(c.conkey) as key(attnum)
           join pg_attribute a on a.attrelid=c.conrelid and a.attnum=key.attnum
           where a.attname='mime_type' and not a.attisdropped
         )
  into constraint_oid,constraint_type,targets_expected_column
  from pg_constraint c
  where c.conrelid='public.creative_assets'::regclass and c.conname='creative_assets_mime_type_check';
  if constraint_oid is not null then
    if constraint_type<>'c' or not coalesce(targets_expected_column,false) then
      raise exception 'Constraint identity conflict: creative_assets_mime_type_check';
    end if;
  else
    if exists(select 1 from public.creative_assets where not (mime_type in('image/png','image/jpeg'))) then
      raise exception 'Existing data blocks constraint creative_assets_mime_type_check';
    end if;
    alter table public.creative_assets add constraint creative_assets_mime_type_check check(mime_type in('image/png','image/jpeg')) not valid;
    alter table public.creative_assets validate constraint creative_assets_mime_type_check;
  end if;
end $vayon_constraint$;

do $vayon_constraint$
declare
  constraint_oid oid;
  constraint_type "char";
  targets_expected_column boolean;
begin
  select c.oid,c.contype,
         cardinality(c.conkey)=1 and exists(
           select 1
           from unnest(c.conkey) as key(attnum)
           join pg_attribute a on a.attrelid=c.conrelid and a.attnum=key.attnum
           where a.attname='knowledge_kind' and not a.attisdropped
         )
  into constraint_oid,constraint_type,targets_expected_column
  from pg_constraint c
  where c.conrelid='public.knowledge_articles'::regclass and c.conname='knowledge_articles_knowledge_kind_check';
  if constraint_oid is not null then
    if constraint_type<>'c' or not coalesce(targets_expected_column,false) then
      raise exception 'Constraint identity conflict: knowledge_articles_knowledge_kind_check';
    end if;
  else
    if exists(select 1 from public.knowledge_articles where not (knowledge_kind in('knowledge_article','private_article','internal_sop','sales_script','support_playbook','onboarding_checklist','ai_playbook'))) then
      raise exception 'Existing data blocks constraint knowledge_articles_knowledge_kind_check';
    end if;
    alter table public.knowledge_articles add constraint knowledge_articles_knowledge_kind_check check(knowledge_kind in('knowledge_article','private_article','internal_sop','sales_script','support_playbook','onboarding_checklist','ai_playbook')) not valid;
    alter table public.knowledge_articles validate constraint knowledge_articles_knowledge_kind_check;
  end if;
end $vayon_constraint$;

do $vayon_constraint$
declare
  constraint_oid oid;
  constraint_type "char";
  targets_expected_column boolean;
begin
  select c.oid,c.contype,
         cardinality(c.conkey)=1 and exists(
           select 1
           from unnest(c.conkey) as key(attnum)
           join pg_attribute a on a.attrelid=c.conrelid and a.attnum=key.attnum
           where a.attname='visibility' and not a.attisdropped
         )
  into constraint_oid,constraint_type,targets_expected_column
  from pg_constraint c
  where c.conrelid='public.knowledge_articles'::regclass and c.conname='knowledge_articles_visibility_check';
  if constraint_oid is not null then
    if constraint_type<>'c' or not coalesce(targets_expected_column,false) then
      raise exception 'Constraint identity conflict: knowledge_articles_visibility_check';
    end if;
  else
    if exists(select 1 from public.knowledge_articles where not (visibility in('workspace','organization'))) then
      raise exception 'Existing data blocks constraint knowledge_articles_visibility_check';
    end if;
    alter table public.knowledge_articles add constraint knowledge_articles_visibility_check check(visibility in('workspace','organization')) not valid;
    alter table public.knowledge_articles validate constraint knowledge_articles_visibility_check;
  end if;
end $vayon_constraint$;

do $vayon_constraint$
declare
  constraint_oid oid;
  constraint_type "char";
  targets_expected_column boolean;
begin
  select c.oid,c.contype,
         cardinality(c.conkey)=1 and exists(
           select 1
           from unnest(c.conkey) as key(attnum)
           join pg_attribute a on a.attrelid=c.conrelid and a.attnum=key.attnum
           where a.attname='status' and not a.attisdropped
         )
  into constraint_oid,constraint_type,targets_expected_column
  from pg_constraint c
  where c.conrelid='public.site_visits'::regclass and c.conname='site_visits_status_check';
  if constraint_oid is not null then
    if constraint_type<>'c' or not coalesce(targets_expected_column,false) then
      raise exception 'Constraint identity conflict: site_visits_status_check';
    end if;
  else
    if exists(select 1 from public.site_visits where not (status in('scheduled','confirmed','checked_in','completed','cancelled','no_show','rescheduled'))) then
      raise exception 'Existing data blocks constraint site_visits_status_check';
    end if;
    alter table public.site_visits add constraint site_visits_status_check check(status in('scheduled','confirmed','checked_in','completed','cancelled','no_show','rescheduled')) not valid;
    alter table public.site_visits validate constraint site_visits_status_check;
  end if;
end $vayon_constraint$;

do $vayon_constraint$
declare
  constraint_oid oid;
  constraint_type "char";
  targets_expected_column boolean;
begin
  select c.oid,c.contype,
         cardinality(c.conkey)=1 and exists(
           select 1
           from unnest(c.conkey) as key(attnum)
           join pg_attribute a on a.attrelid=c.conrelid and a.attnum=key.attnum
           where a.attname='visit_type' and not a.attisdropped
         )
  into constraint_oid,constraint_type,targets_expected_column
  from pg_constraint c
  where c.conrelid='public.site_visits'::regclass and c.conname='site_visits_type_check';
  if constraint_oid is not null then
    if constraint_type<>'c' or not coalesce(targets_expected_column,false) then
      raise exception 'Constraint identity conflict: site_visits_type_check';
    end if;
  else
    if exists(select 1 from public.site_visits where not (visit_type in('initial','follow_up','virtual_tour','final_inspection'))) then
      raise exception 'Existing data blocks constraint site_visits_type_check';
    end if;
    alter table public.site_visits add constraint site_visits_type_check check(visit_type in('initial','follow_up','virtual_tour','final_inspection')) not valid;
    alter table public.site_visits validate constraint site_visits_type_check;
  end if;
end $vayon_constraint$;

do $vayon_constraint$
declare
  constraint_oid oid;
  constraint_type "char";
  targets_expected_column boolean;
begin
  select c.oid,c.contype,
         cardinality(c.conkey)=1 and exists(
           select 1
           from unnest(c.conkey) as key(attnum)
           join pg_attribute a on a.attrelid=c.conrelid and a.attnum=key.attnum
           where a.attname='priority' and not a.attisdropped
         )
  into constraint_oid,constraint_type,targets_expected_column
  from pg_constraint c
  where c.conrelid='public.site_visits'::regclass and c.conname='site_visits_priority_check';
  if constraint_oid is not null then
    if constraint_type<>'c' or not coalesce(targets_expected_column,false) then
      raise exception 'Constraint identity conflict: site_visits_priority_check';
    end if;
  else
    if exists(select 1 from public.site_visits where not (priority in('low','medium','high','urgent'))) then
      raise exception 'Existing data blocks constraint site_visits_priority_check';
    end if;
    alter table public.site_visits add constraint site_visits_priority_check check(priority in('low','medium','high','urgent')) not valid;
    alter table public.site_visits validate constraint site_visits_priority_check;
  end if;
end $vayon_constraint$;

do $vayon_constraint$
declare
  constraint_oid oid;
  constraint_type "char";
  targets_expected_column boolean;
begin
  select c.oid,c.contype,
         cardinality(c.conkey)=1 and exists(
           select 1
           from unnest(c.conkey) as key(attnum)
           join pg_attribute a on a.attrelid=c.conrelid and a.attnum=key.attnum
           where a.attname='duration_minutes' and not a.attisdropped
         )
  into constraint_oid,constraint_type,targets_expected_column
  from pg_constraint c
  where c.conrelid='public.site_visits'::regclass and c.conname='site_visits_duration_check';
  if constraint_oid is not null then
    if constraint_type<>'c' or not coalesce(targets_expected_column,false) then
      raise exception 'Constraint identity conflict: site_visits_duration_check';
    end if;
  else
    if exists(select 1 from public.site_visits where not (duration_minutes between 15 and 1440)) then
      raise exception 'Existing data blocks constraint site_visits_duration_check';
    end if;
    alter table public.site_visits add constraint site_visits_duration_check check(duration_minutes between 15 and 1440) not valid;
    alter table public.site_visits validate constraint site_visits_duration_check;
  end if;
end $vayon_constraint$;

commit;
