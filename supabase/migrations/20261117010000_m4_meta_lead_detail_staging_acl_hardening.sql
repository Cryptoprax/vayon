-- Phase DBV6C: ACL hardening for M4's Meta Lead Ads detail-fetch RPCs.
--
-- WHY THIS EXISTS: this project's default-privilege rule grants EXECUTE to
-- anon AND authenticated BY NAME at CREATE FUNCTION time. M4's own grant
-- blocks only do `revoke all ... from public; grant execute ... to
-- <role>;` -- they never revoke from the OTHER role default privileges also
-- grant to, despite four of the five functions' own in-body
-- `current_setting('role', true) <> 'service_role'` guards stating the
-- intended model unambiguously, and the fifth's own auth.uid()-based
-- workspace-membership check stating an authenticated-only model just as
-- unambiguously.
--
-- WHY A HISTORICAL MIGRATION (20261128000000_service_role_acl_hardening.sql,
-- Phase DBV1E) ALREADY CORRECTS 4 OF THESE 5 FUNCTIONS BUT IS NOT SUFFICIENT
-- ON ITS OWN: see the identical reasoning in every prior E1-E6/D2/M1-M3
-- hardening migration's own header -- DBV1E is Wave 5, applied only after
-- M4 has already been live (Wave 3B) through the rest of Waves 4A/4B/4C.
-- This migration closes the exposure window immediately. DBV1E is not
-- modified and remains a harmless, idempotent re-assertion when it
-- eventually runs. DBV1E's own header comment (line 57-58) explicitly lists
-- these same 4 M4 functions as in its scope, confirmed by direct grep.
--
-- WHY get_meta_lead_ingestion_summary IS NOT IN DBV1E AT ALL (Model A, not
-- Model B): DBV1E is a service-role-only hardening migration by design and
-- name -- it never touches a function whose legitimate caller is
-- authenticated, exactly mirroring E5's own three functions (Phase DBV6B),
-- which DBV1E also never covers. get_meta_lead_ingestion_summary's own body
-- resolves organization_id from auth.uid() + workspace_members, matching
-- the exact same human-caller shape as every other authenticated-only RPC
-- this project has hardened. It requires ITS OWN permanent hardening here
-- (anon revoke only, authenticated grant preserved, service_role left
-- untouched) -- it will never be corrected by any later wave.
--
-- WHY MODEL B FOR THE OTHER FOUR (service_role-only): direct repository
-- call-site audit confirms claim_meta_lead_detail_batch,
-- complete_meta_lead_detail_fetch, fail_meta_lead_detail_fetch, and
-- mark_meta_connection_token_invalid are called exclusively from the
-- service-role Meta lead detail-fetch processor, matching each function's
-- own explicit in-body service_role guard. No authenticated or anon caller
-- exists anywhere in the repository.
--
-- WHY A SEPARATE ADDITIVE MIGRATION, NOT AN EDIT TO M4: M4's checksum is
-- already locked and recorded (reconfirmed unchanged in this phase).
-- Keeping M4 untouched preserves it as a truthful record of what will
-- actually be applied to Production.
--
-- SCOPE: ACL only. No function body, signature, SECURITY DEFINER/
-- search_path setting, table, index, or global default privilege is
-- touched.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- Model B: claim_meta_lead_detail_batch
revoke all on function public.claim_meta_lead_detail_batch(integer) from public;
revoke all on function public.claim_meta_lead_detail_batch(integer) from anon;
revoke all on function public.claim_meta_lead_detail_batch(integer) from authenticated;
grant execute on function public.claim_meta_lead_detail_batch(integer) to service_role;

-- Model B: complete_meta_lead_detail_fetch
revoke all on function public.complete_meta_lead_detail_fetch(uuid, text, text, text, text, text, text, text, jsonb) from public;
revoke all on function public.complete_meta_lead_detail_fetch(uuid, text, text, text, text, text, text, text, jsonb) from anon;
revoke all on function public.complete_meta_lead_detail_fetch(uuid, text, text, text, text, text, text, text, jsonb) from authenticated;
grant execute on function public.complete_meta_lead_detail_fetch(uuid, text, text, text, text, text, text, text, jsonb) to service_role;

-- Model B: fail_meta_lead_detail_fetch
revoke all on function public.fail_meta_lead_detail_fetch(uuid, text, text) from public;
revoke all on function public.fail_meta_lead_detail_fetch(uuid, text, text) from anon;
revoke all on function public.fail_meta_lead_detail_fetch(uuid, text, text) from authenticated;
grant execute on function public.fail_meta_lead_detail_fetch(uuid, text, text) to service_role;

-- Model B: mark_meta_connection_token_invalid
revoke all on function public.mark_meta_connection_token_invalid(uuid) from public;
revoke all on function public.mark_meta_connection_token_invalid(uuid) from anon;
revoke all on function public.mark_meta_connection_token_invalid(uuid) from authenticated;
grant execute on function public.mark_meta_connection_token_invalid(uuid) to service_role;

-- Model A: get_meta_lead_ingestion_summary (anon revoke only; authenticated
-- grant preserved; service_role left at whatever default-privilege state it
-- already has, expected-not-blocking, matching E5's precedent exactly)
revoke all on function public.get_meta_lead_ingestion_summary(uuid) from public;
revoke all on function public.get_meta_lead_ingestion_summary(uuid) from anon;
grant execute on function public.get_meta_lead_ingestion_summary(uuid) to authenticated;

commit;
