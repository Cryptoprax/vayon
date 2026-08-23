-- VAYON Version 1 — storage buckets
-- Generated for manual review. Does not alter migration history.
-- Supabase SQL Editor compatible; no psql meta-commands.
begin;
set local lock_timeout='5s';
set local statement_timeout='120s';

do $vayon_bucket$
declare existing storage.buckets%rowtype;
begin
  select * into existing from storage.buckets where id='knowledge-documents';
  if not found then
    insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
    values('knowledge-documents','knowledge-documents',false,20971520,array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/markdown','text/plain']);
  elsif existing.name is distinct from 'knowledge-documents'
     or existing.public is distinct from false
     or existing.file_size_limit is distinct from 20971520
     or existing.allowed_mime_types is null
     or not (existing.allowed_mime_types @> array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/markdown','text/plain']::text[]
             and existing.allowed_mime_types <@ array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/markdown','text/plain']::text[]) then
    raise exception 'Storage bucket conflict: knowledge-documents (name, public flag, file size limit, or allowed MIME types differs)';
  end if;
end $vayon_bucket$;

do $vayon_bucket$
declare existing storage.buckets%rowtype;
begin
  select * into existing from storage.buckets where id='product-feedback';
  if not found then
    insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
    values('product-feedback','product-feedback',false,5242880,array['image/png','image/jpeg','image/webp']);
  elsif existing.name is distinct from 'product-feedback'
     or existing.public is distinct from false
     or existing.file_size_limit is distinct from 5242880
     or existing.allowed_mime_types is null
     or not (existing.allowed_mime_types @> array['image/png','image/jpeg','image/webp']::text[]
             and existing.allowed_mime_types <@ array['image/png','image/jpeg','image/webp']::text[]) then
    raise exception 'Storage bucket conflict: product-feedback (name, public flag, file size limit, or allowed MIME types differs)';
  end if;
end $vayon_bucket$;

commit;
