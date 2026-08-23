-- VAYON Version 1 post-deploy validation — READ ONLY
begin transaction read only;
set local statement_timeout='120s';
select 'tables' as surface,count(*) as total from information_schema.tables where table_schema='public';
select 'rls_disabled' as surface,count(*) as total from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in('r','p') and not c.relrowsecurity;
select 'functions' as surface,count(*) as total from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public';
select 'policies' as surface,count(*) as total from pg_policies where schemaname in('public','storage');
select 'triggers' as surface,count(*) as total from pg_trigger where not tgisinternal;
select 'indexes' as surface,count(*) as total from pg_indexes where schemaname='public';
select id,name,public,file_size_limit,allowed_mime_types from storage.buckets order by id;
do $vayon_postcheck$ begin if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in('r','p') and not c.relrowsecurity) then raise exception 'Post-deploy validation failed: public table without RLS'; end if; if not exists(select 1 from pg_policies where schemaname='public') then raise exception 'Post-deploy validation failed: no public policies'; end if; end $vayon_postcheck$;
select table_schema,table_name,column_name,data_type,is_nullable,column_default from information_schema.columns where table_schema='public' order by 2,ordinal_position;
select n.nspname,c.relname,c.relrowsecurity,count(pol.policyname) as policy_count from pg_class c join pg_namespace n on n.oid=c.relnamespace left join pg_policies pol on pol.schemaname=n.nspname and pol.tablename=c.relname where n.nspname='public' and c.relkind in('r','p') group by 1,2,3 order by 2;
select c.relname,t.tgname,t.tgenabled,pg_get_triggerdef(t.oid,true) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname in('public','auth') order by 1,2;
rollback;
