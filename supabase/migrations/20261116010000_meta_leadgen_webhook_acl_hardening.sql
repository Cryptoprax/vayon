-- Phase DBV6A: ACL hardening for M3's single leadgen-webhook processing RPC.
--
-- WHY THIS EXISTS: this project's default-privilege rule (`alter default
-- privileges for role postgres in schema public grant execute on functions
-- to anon, authenticated, service_role`, confirmed directly against
-- Production pg_default_acl/has_function_privilege throughout this
-- engagement) grants EXECUTE to anon AND authenticated BY NAME at the
-- moment a function is created, regardless of which roles its own grant
-- block later mentions. M3's own grant block only does `revoke all ...
-- from public; grant execute ... to service_role;` -- it never revokes
-- from anon or authenticated. M3's own comment states the intended model
-- explicitly ("this is service-role-only: it is never granted to
-- authenticated, so no ordinary customer session can call it"), but the
-- SQL as written does not achieve that: with only PUBLIC revoked, both
-- anon and authenticated retain their default-privilege EXECUTE grant
-- unless separately revoked. This migration closes that gap.
--
-- WHY MODEL B (service_role-only), NOT MODEL A/C: direct repository
-- call-site audit found process_meta_leadgen_event has exactly one call
-- site in the entire repository -- process-leadgen-webhook.ts's
-- processOneChange(), reached only from app/api/webhooks/meta-leadgen/
-- route.ts's POST handler, which constructs its Supabase client via
-- createSupabaseServiceClient() ONLY AFTER verifying the inbound request's
-- Meta HMAC signature (verifyMetaSignature). No authenticated or anon
-- caller exists anywhere. This mirrors the identical, already-proven-safe
-- pattern of process_whatsapp_message()/resolve_whatsapp_ai_conversation()
-- that M3's own comment cites as precedent (those two functions predate
-- this Wave-2 audit and are out of this phase's scope; they were not
-- created or modified here).
--
-- WHY THE FUNCTION'S OWN IN-BODY GUARD (`if current_setting('role', true)
-- <> 'service_role' then raise exception`) IS NOT A SUBSTITUTE FOR ACL
-- HARDENING: it is a second, defense-in-depth layer, not a replacement.
-- Reaching that check still means an unauthorized caller got past
-- PostgreSQL's own privilege system into function execution; closing the
-- ACL means an anon/authenticated PostgREST call is rejected at the
-- privilege layer (HTTP 401 / SQLSTATE 42501) before the function body
-- ever runs, matching every other hardening in this engagement's stated
-- goal: prove a genuine ACL rejection, not merely an in-body business-logic
-- rejection.
--
-- WHY A SEPARATE ADDITIVE MIGRATION, NOT AN EDIT TO M3: M3's checksum is
-- already locked and recorded (reconfirmed unchanged in this phase).
-- Keeping M3 untouched preserves it as a truthful record of what will
-- actually be applied to Production. This migration follows the exact
-- precedent already proven safe and effective by DBV1E, SEC2, DBV5E,
-- DBV5G, DBV5H, DBV5I, DBV5J, and this same phase's DBV6A-D2/
-- DBV6A-META migrations: a small, isolated, independently-reviewable
-- ACL-only migration that touches nothing about the target function
-- except its grants.
--
-- WHY THIS TIMESTAMP (20261116010000, one hour after M3's own
-- 20261116000000): so that on a fresh chain replay, and within the DBV5
-- Production runbook's own Wave 2 grouping, this hardening lands
-- immediately after M3 -- matching the "no exposure window" discipline
-- established throughout Wave 1, and completing Wave 2.
--
-- SCOPE: ACL only. No function body, signature, SECURITY DEFINER/
-- search_path setting, table, RLS policy, dedup logic, or global default
-- privilege is touched.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

revoke all on function public.process_meta_leadgen_event(text, text, text, text, text, timestamptz, uuid, uuid, uuid, uuid, uuid) from public;
revoke all on function public.process_meta_leadgen_event(text, text, text, text, text, timestamptz, uuid, uuid, uuid, uuid, uuid) from anon;
revoke all on function public.process_meta_leadgen_event(text, text, text, text, text, timestamptz, uuid, uuid, uuid, uuid, uuid) from authenticated;
grant execute on function public.process_meta_leadgen_event(text, text, text, text, text, timestamptz, uuid, uuid, uuid, uuid, uuid) to service_role;

commit;
