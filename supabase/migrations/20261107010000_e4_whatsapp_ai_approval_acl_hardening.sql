-- Phase DBV6B: ACL hardening for E4's single service-role-only draft
-- approval RPC.
--
-- WHY THIS EXISTS: this project's default-privilege rule grants EXECUTE to
-- anon AND authenticated BY NAME at CREATE FUNCTION time. E4's own grant
-- block only does `revoke all ... from public; grant execute ... to
-- service_role;` -- it never revokes from anon or authenticated, despite
-- the function's own in-body `current_setting('role', true) <>
-- 'service_role'` guard stating the intended model unambiguously.
--
-- WHY A HISTORICAL MIGRATION (20261128000000_service_role_acl_hardening.sql,
-- Phase DBV1E) ALREADY CORRECTS THIS BUT IS NOT SUFFICIENT ON ITS OWN: see
-- the identical reasoning in the E1/E2/E3 hardening migrations' own
-- headers -- DBV1E is Wave 5, applied only after E4 has already been live
-- (Wave 3A) through the rest of Waves 3B/4A/4B/4C. This migration closes
-- the exposure window immediately. DBV1E is not modified and remains a
-- harmless, idempotent re-assertion when it eventually runs.
--
-- WHY MODEL B (service_role-only): direct repository call-site audit
-- confirms request_whatsapp_draft_approval is called exclusively from
-- whatsapp-draft-approval.service.ts, which uses
-- createSupabaseServiceClient() exclusively (`const client =
-- createSupabaseServiceClient()`). No authenticated or anon caller exists
-- anywhere in the repository. decide_approval()/request_approval()/
-- can_manage_approvals() (Phase D1, reused by E4's human approve/reject
-- actions) are untouched by this migration -- they are a wholly separate,
-- already-hardened authenticated-only surface (DBV5E).
--
-- WHY A SEPARATE ADDITIVE MIGRATION, NOT AN EDIT TO E4: E4's checksum is
-- already locked and recorded (reconfirmed unchanged in this phase).
-- Keeping E4 untouched preserves it as a truthful record of what will
-- actually be applied to Production.
--
-- SCOPE: ACL only. No function body, signature, SECURITY DEFINER/
-- search_path setting, table, index, or global default privilege is
-- touched.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

revoke all on function public.request_whatsapp_draft_approval(uuid, uuid, uuid, uuid, uuid, text) from public;
revoke all on function public.request_whatsapp_draft_approval(uuid, uuid, uuid, uuid, uuid, text) from anon;
revoke all on function public.request_whatsapp_draft_approval(uuid, uuid, uuid, uuid, uuid, text) from authenticated;
grant execute on function public.request_whatsapp_draft_approval(uuid, uuid, uuid, uuid, uuid, text) to service_role;

commit;
