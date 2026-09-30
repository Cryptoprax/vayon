-- Phase DBV6C: ACL hardening for M8's WhatsApp inbound consent-revocation RPC.
--
-- WHY THIS EXISTS: identical default-privilege gap documented in every
-- prior hardening migration this engagement has produced -- M8's own grant
-- block only revokes from public, never from the other role default
-- privileges also grant to.
--
-- WHY A HISTORICAL MIGRATION (20261128000000_service_role_acl_hardening.sql,
-- Phase DBV1E) ALREADY CORRECTS THIS BUT IS NOT SUFFICIENT ON ITS OWN:
-- record_whatsapp_consent_revocation is named explicitly in DBV1E's own
-- header (line 63), confirmed by direct grep. DBV1E is applied only after
-- M8 has already been live (Wave 3B) through Waves 4A/4B/4C -- this
-- migration closes that exposure window immediately. DBV1E is not modified
-- and remains a harmless, idempotent re-assertion when it eventually runs.
--
-- WHY MODEL B (service-role-only): direct repository call-site audit
-- confirms record_whatsapp_consent_revocation is called exclusively from
-- the trusted inbound WhatsApp webhook path (whatsapp.service.ts's
-- receive()), matching its own explicit in-body service_role guard. No
-- authenticated or anon caller exists anywhere in the repository -- a
-- client must never be able to submit a lead's revocation directly.
--
-- WHY A SEPARATE ADDITIVE MIGRATION, NOT AN EDIT TO M8: M8's checksum is
-- already locked and recorded (reconfirmed unchanged in this phase).
--
-- SCOPE: ACL only. No function body, signature, SECURITY DEFINER/
-- search_path setting, table, index, or global default privilege is
-- touched.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

revoke all on function public.record_whatsapp_consent_revocation(uuid, uuid, uuid, text) from public;
revoke all on function public.record_whatsapp_consent_revocation(uuid, uuid, uuid, text) from anon;
revoke all on function public.record_whatsapp_consent_revocation(uuid, uuid, uuid, text) from authenticated;
grant execute on function public.record_whatsapp_consent_revocation(uuid, uuid, uuid, text) to service_role;

commit;
