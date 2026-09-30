-- Phase DBV6C: ACL hardening for M6's Meta lead consent RPCs.
--
-- WHY THIS EXISTS: identical default-privilege gap documented in every
-- prior hardening migration this engagement has produced.
--
-- WHY DBV1E (Wave 5) ALREADY CORRECTS 2 OF THESE 4 FUNCTIONS BUT IS NOT
-- SUFFICIENT ON ITS OWN: claim_meta_lead_consent_batch and
-- complete_meta_lead_consent_processing are both named explicitly in
-- DBV1E's own header (line 61), confirmed by direct grep. DBV1E is applied
-- only after M6 has already been live (Wave 3B) through Waves 4A/4B/4C --
-- this migration closes that exposure window immediately. DBV1E is not
-- modified and remains a harmless, idempotent re-assertion when it
-- eventually runs.
--
-- WHY configure_meta_lead_form_consent_rule AND
-- disable_meta_lead_form_consent_rule ARE NOT IN DBV1E AT ALL (Model A):
-- both are gated by can_manage_integrations(), an authenticated-user
-- permission check, not a service_role guard -- the same shape as every
-- other owner-gated Meta Marketing write RPC (M1/M2) already hardened this
-- engagement. DBV1E is a service-role-only migration by design and never
-- touches them -- they require their own permanent hardening here (anon
-- revoke only, authenticated grant preserved).
--
-- WHY MODEL B FOR THE OTHER TWO: direct repository call-site audit confirms
-- claim_meta_lead_consent_batch and complete_meta_lead_consent_processing
-- are called exclusively from the service-role Meta lead consent processor,
-- matching each function's own explicit in-body service_role guard. No
-- authenticated or anon caller exists anywhere in the repository.
--
-- WHY A SEPARATE ADDITIVE MIGRATION, NOT AN EDIT TO M6: M6's checksum is
-- already locked and recorded (reconfirmed unchanged in this phase).
--
-- SCOPE: ACL only. No function body, signature, SECURITY DEFINER/
-- search_path setting, table, index, RLS policy, or global default
-- privilege is touched.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- Model A: configure_meta_lead_form_consent_rule
revoke all on function public.configure_meta_lead_form_consent_rule(uuid, uuid, text, text[], text) from public;
revoke all on function public.configure_meta_lead_form_consent_rule(uuid, uuid, text, text[], text) from anon;
grant execute on function public.configure_meta_lead_form_consent_rule(uuid, uuid, text, text[], text) to authenticated;

-- Model A: disable_meta_lead_form_consent_rule
revoke all on function public.disable_meta_lead_form_consent_rule(uuid, uuid) from public;
revoke all on function public.disable_meta_lead_form_consent_rule(uuid, uuid) from anon;
grant execute on function public.disable_meta_lead_form_consent_rule(uuid, uuid) to authenticated;

-- Model B: claim_meta_lead_consent_batch
revoke all on function public.claim_meta_lead_consent_batch(integer) from public;
revoke all on function public.claim_meta_lead_consent_batch(integer) from anon;
revoke all on function public.claim_meta_lead_consent_batch(integer) from authenticated;
grant execute on function public.claim_meta_lead_consent_batch(integer) to service_role;

-- Model B: complete_meta_lead_consent_processing
revoke all on function public.complete_meta_lead_consent_processing(uuid, text, uuid, text, integer) from public;
revoke all on function public.complete_meta_lead_consent_processing(uuid, text, uuid, text, integer) from anon;
revoke all on function public.complete_meta_lead_consent_processing(uuid, text, uuid, text, integer) from authenticated;
grant execute on function public.complete_meta_lead_consent_processing(uuid, text, uuid, text, integer) to service_role;

commit;
