-- Phase DBV6B: ACL hardening for E2's two service-role-only trusted AI
-- conversation RPCs.
--
-- WHY THIS EXISTS: this project's default-privilege rule grants EXECUTE to
-- anon AND authenticated BY NAME at CREATE FUNCTION time. E2's own grant
-- blocks only do `revoke all ... from public; grant execute ... to
-- service_role;` for both of its functions -- neither revokes from anon or
-- authenticated, despite each carrying its own in-body
-- `current_setting('role', true) <> 'service_role'` guard.
--
-- WHY A HISTORICAL MIGRATION (20261128000000_service_role_acl_hardening.sql,
-- Phase DBV1E) ALREADY CORRECTS THIS BUT IS NOT SUFFICIENT ON ITS OWN: see
-- the identical reasoning in 20261104010000_e1_whatsapp_crm_identity_acl_
-- hardening.sql's own header -- DBV1E is Wave 5, applied only after E2 has
-- already been live (Wave 3A) for the duration of Waves 3B/4A/4B/4C. This
-- migration closes the exposure window immediately. DBV1E is not modified
-- and remains a harmless, idempotent re-assertion when it eventually runs.
--
-- WHY MODEL B (service_role-only) FOR BOTH: direct repository call-site
-- audit confirms both `resolve_whatsapp_ai_conversation` and
-- `append_trusted_ai_message` are called exclusively via
-- `WorkforceConversationRepository.resolveTrustedConversation()`/
-- `appendTrusted()` (openai/runtime/repository.ts), reached only through
-- `TrustedWorkforceRuntime.create()` (openai/runtime/trusted-runtime.ts),
-- which uses `createSupabaseServiceClient()` exclusively -- the same
-- genuine service_role client already confirmed for K3's
-- `current_property_price` and K4's `search_property_knowledge_documents`
-- in DBV5I/DBV5J. The separate interactive `append()` method on the same
-- repository class uses `auth.uid()` via `operationsContext()` and calls a
-- different, untouched code path (`.from("ai_workforce_messages").insert()`
-- directly, not this RPC) -- so no authenticated caller exists for either
-- of these two functions specifically.
--
-- WHY append_trusted_ai_message'S TARGET HERE IS THE 4-ARG (E2) IDENTITY
-- SPECIFICALLY: Phase E3 later `DROP FUNCTION`s and recreates this name
-- with two additional trailing parameters (p_source_message_id,
-- p_delivery_state) -- a genuinely different function identity for
-- GRANT/REVOKE purposes (parameter list changed, not just return type).
-- E3's DROP destroys this hardening along with the function object, and a
-- FRESH default-privilege grant applies to E3's 6-arg recreation. This
-- migration still closes the real, if short-lived, exposure window
-- between E2 landing and E3 landing; Phase E3 receives its own separate
-- hardening migration (20261106010000_e3_whatsapp_ai_draft_acl_
-- hardening.sql) for its recreated 6-arg identity.
--
-- WHY A SEPARATE ADDITIVE MIGRATION, NOT AN EDIT TO E2: E2's checksum is
-- already locked and recorded (reconfirmed unchanged in this phase).
-- Keeping E2 untouched preserves it as a truthful record of what will
-- actually be applied to Production.
--
-- SCOPE: ACL only. No function body, signature, SECURITY DEFINER/
-- search_path setting, table, index, or global default privilege is
-- touched.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

revoke all on function public.resolve_whatsapp_ai_conversation(uuid, text, uuid, uuid) from public;
revoke all on function public.resolve_whatsapp_ai_conversation(uuid, text, uuid, uuid) from anon;
revoke all on function public.resolve_whatsapp_ai_conversation(uuid, text, uuid, uuid) from authenticated;
grant execute on function public.resolve_whatsapp_ai_conversation(uuid, text, uuid, uuid) to service_role;

revoke all on function public.append_trusted_ai_message(uuid, uuid, text, text) from public;
revoke all on function public.append_trusted_ai_message(uuid, uuid, text, text) from anon;
revoke all on function public.append_trusted_ai_message(uuid, uuid, text, text) from authenticated;
grant execute on function public.append_trusted_ai_message(uuid, uuid, text, text) to service_role;

commit;
