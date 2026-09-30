-- Phase DBV6B: ACL hardening for E3's two redefined service-role-only RPCs.
--
-- WHY THIS EXISTS: E3 `DROP FUNCTION`s and recreates both
-- `append_trusted_ai_message` (adding two trailing parameters,
-- p_source_message_id/p_delivery_state) and `process_whatsapp_message`
-- (changing its return type from void to jsonb). In PostgreSQL, DROP
-- FUNCTION destroys the function object -- including every grant ever made
-- on it -- and CREATE (OR REPLACE, which after a DROP is simply a CREATE)
-- establishes fresh default-privilege grants to anon/authenticated/
-- service_role again. This means even though
-- 20261105010000_e2_ai_workforce_channel_acl_hardening.sql and
-- 20261104010000_e1_whatsapp_crm_identity_acl_hardening.sql already closed
-- the anon/authenticated gap for the PRE-E3 4-arg append_trusted_ai_message
-- and void-returning process_whatsapp_message identities respectively, E3's
-- redefinition resets both to the exposed-by-default state again. E3's own
-- grant blocks only do `revoke all ... from public; grant execute ... to
-- service_role;` for both -- neither revokes from anon or authenticated.
--
-- WHY A HISTORICAL MIGRATION (20261128000000_service_role_acl_hardening.sql,
-- Phase DBV1E) ALREADY CORRECTS THIS BUT IS NOT SUFFICIENT ON ITS OWN:
-- DBV1E's own REVOKE/GRANT statements target exactly these two final
-- (post-E3) signatures -- `append_trusted_ai_message(uuid, uuid, text,
-- text, text, text)` and `process_whatsapp_message(uuid, uuid, uuid, text,
-- jsonb, text)` -- correctly, since GRANT/REVOKE identity does not depend
-- on return type. However, DBV1E is Wave 5, applied only after E3 has
-- already been live (Wave 3A) through the rest of Waves 3B/4A/4B/4C. This
-- migration closes the exposure window immediately, the same day E3
-- lands. DBV1E is not modified and remains a harmless, idempotent
-- re-assertion of this exact state when it eventually runs.
--
-- WHY MODEL B (service_role-only) FOR BOTH: identical caller audit to
-- 20261104010000/20261105010000 -- both functions are reached exclusively
-- through TrustedWorkforceRuntime.create() -> createSupabaseServiceClient()
-- (openai/runtime/trusted-runtime.ts / repository.ts), and
-- process_whatsapp_message is reached exclusively through
-- WhatsAppRepository.persist() -> createSupabaseServiceClient()
-- (whatsapp.repository.ts). Redefining a function's body/signature does
-- not change who legitimately calls it -- both remain service-role-only.
--
-- WHY A SEPARATE ADDITIVE MIGRATION, NOT AN EDIT TO E3: E3's checksum is
-- already locked and recorded (reconfirmed unchanged in this phase).
-- Keeping E3 untouched preserves it as a truthful record of what will
-- actually be applied to Production.
--
-- SCOPE: ACL only. No function body, signature, SECURITY DEFINER/
-- search_path setting, table, index, or global default privilege is
-- touched.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

revoke all on function public.append_trusted_ai_message(uuid, uuid, text, text, text, text) from public;
revoke all on function public.append_trusted_ai_message(uuid, uuid, text, text, text, text) from anon;
revoke all on function public.append_trusted_ai_message(uuid, uuid, text, text, text, text) from authenticated;
grant execute on function public.append_trusted_ai_message(uuid, uuid, text, text, text, text) to service_role;

revoke all on function public.process_whatsapp_message(uuid, uuid, uuid, text, jsonb, text) from public;
revoke all on function public.process_whatsapp_message(uuid, uuid, uuid, text, jsonb, text) from anon;
revoke all on function public.process_whatsapp_message(uuid, uuid, uuid, text, jsonb, text) from authenticated;
grant execute on function public.process_whatsapp_message(uuid, uuid, uuid, text, jsonb, text) to service_role;

commit;
