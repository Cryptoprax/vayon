-- Phase DBV6C: ACL hardening for M5's Meta lead -> CRM ingestion RPCs.
--
-- WHY THIS EXISTS: identical default-privilege gap documented in every
-- prior hardening migration this engagement has produced -- M5's own grant
-- blocks only revoke from public, never from the other role default
-- privileges also grant to.
--
-- WHY DBV1E (Wave 5) ALREADY CORRECTS 3 OF THESE 4 FUNCTIONS BUT IS NOT
-- SUFFICIENT ON ITS OWN: resolve_or_create_meta_lead_crm_identity,
-- ingest_meta_lead_to_crm, and list_meta_lead_crm_pending_batch are all
-- named explicitly in DBV1E's own header (lines 59-60), confirmed by direct
-- grep. DBV1E is applied only after M5 has already been live (Wave 3B)
-- through Waves 4A/4B/4C -- this migration closes that exposure window
-- immediately. DBV1E is not modified and remains a harmless, idempotent
-- re-assertion when it eventually runs.
--
-- WHY get_meta_lead_crm_ingestion_summary IS NOT IN DBV1E AT ALL (Model A):
-- its body resolves organization_id from auth.uid() + workspace_members,
-- the same human-caller shape as get_meta_lead_ingestion_summary (M4) and
-- every other authenticated-only RPC already hardened this engagement.
-- DBV1E is a service-role-only migration by design and never touches it --
-- it requires its own permanent hardening here (anon revoke only,
-- authenticated grant preserved).
--
-- WHY MODEL B FOR THE OTHER THREE: direct repository call-site audit
-- confirms all three are called exclusively from the service-role Meta
-- lead CRM-ingestion processor, matching each function's own explicit
-- in-body service_role guard. No authenticated or anon caller exists
-- anywhere in the repository.
--
-- WHY A SEPARATE ADDITIVE MIGRATION, NOT AN EDIT TO M5: M5's checksum is
-- already locked and recorded (reconfirmed unchanged in this phase).
--
-- SCOPE: ACL only. No function body, signature, SECURITY DEFINER/
-- search_path setting, table, index, or global default privilege is
-- touched.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- Model B: resolve_or_create_meta_lead_crm_identity
revoke all on function public.resolve_or_create_meta_lead_crm_identity(uuid, text, text, text, text, text, uuid, text, text, uuid, text, text) from public;
revoke all on function public.resolve_or_create_meta_lead_crm_identity(uuid, text, text, text, text, text, uuid, text, text, uuid, text, text) from anon;
revoke all on function public.resolve_or_create_meta_lead_crm_identity(uuid, text, text, text, text, text, uuid, text, text, uuid, text, text) from authenticated;
grant execute on function public.resolve_or_create_meta_lead_crm_identity(uuid, text, text, text, text, text, uuid, text, text, uuid, text, text) to service_role;

-- Model B: ingest_meta_lead_to_crm
revoke all on function public.ingest_meta_lead_to_crm(uuid) from public;
revoke all on function public.ingest_meta_lead_to_crm(uuid) from anon;
revoke all on function public.ingest_meta_lead_to_crm(uuid) from authenticated;
grant execute on function public.ingest_meta_lead_to_crm(uuid) to service_role;

-- Model B: list_meta_lead_crm_pending_batch
revoke all on function public.list_meta_lead_crm_pending_batch(integer) from public;
revoke all on function public.list_meta_lead_crm_pending_batch(integer) from anon;
revoke all on function public.list_meta_lead_crm_pending_batch(integer) from authenticated;
grant execute on function public.list_meta_lead_crm_pending_batch(integer) to service_role;

-- Model A: get_meta_lead_crm_ingestion_summary
revoke all on function public.get_meta_lead_crm_ingestion_summary(uuid) from public;
revoke all on function public.get_meta_lead_crm_ingestion_summary(uuid) from anon;
grant execute on function public.get_meta_lead_crm_ingestion_summary(uuid) to authenticated;

commit;
