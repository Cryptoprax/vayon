-- VAYON Version 1 pre-deploy validation — READ ONLY
begin transaction read only;
set local statement_timeout='120s';
select 'tables' as surface,count(*) as total from information_schema.tables where table_schema='public';
select 'rls_disabled' as surface,count(*) as total from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in('r','p') and not c.relrowsecurity;
select 'functions' as surface,count(*) as total from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public';
select 'policies' as surface,count(*) as total from pg_policies where schemaname in('public','storage');
select 'triggers' as surface,count(*) as total from pg_trigger where not tgisinternal;
select 'indexes' as surface,count(*) as total from pg_indexes where schemaname='public';
select id,name,public,file_size_limit,allowed_mime_types from storage.buckets order by id;
select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid),pg_get_function_result(p.oid),l.lanname,p.provolatile,p.prosecdef,p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_language l on l.oid=p.prolang where n.nspname='public' order by 1,2,3;
select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check from pg_policies where schemaname in('public','storage') order by 1,2,3;
select schemaname,tablename,indexname,indexdef from pg_indexes where schemaname='public' order by 2,3;
rollback;
