-- Phase DBV6B: ACL hardening for E1's two service-role-only WhatsApp/CRM
-- identity RPCs.
--
-- WHY THIS EXISTS: this project's default-privilege rule (`alter default
-- privileges for role postgres in schema public grant execute on functions
-- to anon, authenticated, service_role`, confirmed directly against
-- Production pg_default_acl/has_function_privilege throughout this
-- engagement) grants EXECUTE to anon AND authenticated BY NAME at the
-- moment a function is created. E1's own grant blocks only do `revoke all
-- ... from public; grant execute ... to service_role;` for both of its
-- functions -- neither revokes from anon or authenticated, despite each
-- function carrying its own in-body `current_setting('role', true) <>
-- 'service_role'` guard stating the intended model unambiguously.
--
-- WHY A HISTORICAL MIGRATION (20261128000000_service_role_acl_hardening.sql,
-- Phase DBV1E) ALREADY CORRECTS THIS BUT IS NOT SUFFICIENT ON ITS OWN:
-- DBV1E already targets both of these exact function signatures with the
-- correct final ACL. However, DBV1E is timestamped into this runbook's
-- Wave 5 (applied only after Waves 1-4, including the app deploy, are
-- fully live -- see §19 of the runbook for why Wave 5 is deliberately
-- ordered last). If E1 is applied in Wave 3A with no earlier hardening,
-- both functions would remain anon/authenticated-executable via
-- default-privilege for the entire gap between Wave 3A's completion and
-- Wave 5's much later execution -- precisely the "exposure window" this
-- engagement's entire ACL-hardening methodology (DBV5E through DBV6A) was
-- built to eliminate. This migration closes that gap immediately, the
-- same day E1 lands. DBV1E is NOT modified and still runs in Wave 5; by
-- then its own REVOKE/GRANT statements for these two functions are a
-- harmless, idempotent no-op re-assertion of the state this migration
-- already established -- the same "redundant restatement is safe"
-- precedent already proven by K3's `current_property_price` and by
-- DBV6A-M3 overlapping with DBV1E's own `process_meta_leadgen_event`
-- entry.
--
-- WHY MODEL B (service_role-only) FOR BOTH: direct repository call-site
-- audit confirms `resolve_whatsapp_lead_identity` is called exclusively
-- from `lead-identity.service.ts`'s `resolveWhatsAppIdentity()`, and
-- `process_whatsapp_message` is called exclusively from
-- `WhatsAppRepository.persist()` (`whatsapp.repository.ts`) -- both use
-- `createSupabaseServiceClient()` exclusively (`private c =
-- createSupabaseServiceClient()` in the repository; `const client =
-- createSupabaseServiceClient()` in the identity service). No
-- authenticated or anon caller exists anywhere in the repository for
-- either function.
--
-- WHY process_whatsapp_message'S TARGET HERE IS THE VOID-RETURNING (E1)
-- IDENTITY SPECIFICALLY: Phase E3 later `DROP FUNCTION`s and recreates
-- this exact signature with a `jsonb` return type instead of `void`.
-- Postgres function identity for GRANT/REVOKE purposes is name + parameter
-- types only (not return type), so E3's DROP destroys this hardening along
-- with the function object itself, and a FRESH default-privilege grant
-- applies to E3's recreated version. This migration still closes the real,
-- if short-lived, exposure window between E1 landing and E3 landing;
-- Phase E3 receives its own separate hardening migration
-- (20261106010000_e3_whatsapp_ai_draft_acl_hardening.sql) for its
-- recreated identity.
--
-- WHY A SEPARATE ADDITIVE MIGRATION, NOT AN EDIT TO E1: E1's checksum is
-- already locked and recorded (reconfirmed unchanged in this phase).
-- Keeping E1 untouched preserves it as a truthful record of what will
-- actually be applied to Production. This migration follows the exact
-- precedent already proven safe and effective by DBV1E, SEC2, DBV5E
-- through DBV5J, and DBV6A: a small, isolated, independently-reviewable
-- ACL-only migration that touches nothing about the target functions
-- except their grants.
--
-- SCOPE: ACL only. No function body, signature, SECURITY DEFINER/
-- search_path setting, table, index, or global default privilege is
-- touched.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

revoke all on function public.resolve_whatsapp_lead_identity(uuid, text, text) from public;
revoke all on function public.resolve_whatsapp_lead_identity(uuid, text, text) from anon;
revoke all on function public.resolve_whatsapp_lead_identity(uuid, text, text) from authenticated;
grant execute on function public.resolve_whatsapp_lead_identity(uuid, text, text) to service_role;

revoke all on function public.process_whatsapp_message(uuid, uuid, uuid, text, jsonb, text) from public;
revoke all on function public.process_whatsapp_message(uuid, uuid, uuid, text, jsonb, text) from anon;
revoke all on function public.process_whatsapp_message(uuid, uuid, uuid, text, jsonb, text) from authenticated;
grant execute on function public.process_whatsapp_message(uuid, uuid, uuid, text, jsonb, text) to service_role;

commit;
