-- Phase DBV6C: ACL hardening for M7's governed WhatsApp outreach RPCs.
--
-- WHY THIS EXISTS: identical default-privilege gap documented in every
-- prior hardening migration this engagement has produced.
--
-- WHY DBV1E (Wave 5) ALREADY CORRECTS 1 OF THESE 4 FUNCTIONS BUT IS NOT
-- SUFFICIENT ON ITS OWN: flag_stale_whatsapp_outreach_executions is named
-- explicitly in DBV1E's own header (line 62), confirmed by direct grep.
-- DBV1E is applied only after M7 has already been live (Wave 3B) through
-- Waves 4A/4B/4C -- this migration closes that exposure window immediately.
-- DBV1E is not modified and remains a harmless, idempotent re-assertion
-- when it eventually runs.
--
-- WHY claim_whatsapp_outreach_execution, mark_whatsapp_outreach_sent, AND
-- mark_whatsapp_outreach_failed ARE NOT IN DBV1E AT ALL (Model A): all
-- three are human-triggered (auth.uid()-gated), directly mirroring E5's own
-- three authenticated-only functions (Phase DBV6B), which DBV1E also never
-- covers. Each function's own header comment states this explicitly
-- ("mirroring claim_whatsapp_draft_send exactly"). They require their own
-- permanent hardening here (anon revoke only, authenticated grant
-- preserved, service_role left untouched at whatever default-privilege
-- state it already has -- expected-not-blocking, matching E5's precedent
-- exactly). CRITICAL: these three functions must NOT be hardened to
-- authenticated=false -- doing so would break the human "Send" action they
-- exist to gate.
--
-- WHY MODEL B FOR flag_stale_whatsapp_outreach_executions: direct
-- repository call-site audit confirms it is called exclusively from the
-- service-role outreach-execution reconciliation route, matching its own
-- explicit in-body service_role guard, mirroring E6's
-- flag_stale_whatsapp_send_executions exactly. No authenticated or anon
-- caller exists anywhere in the repository.
--
-- WHY A SEPARATE ADDITIVE MIGRATION, NOT AN EDIT TO M7: M7's checksum is
-- already locked and recorded (reconfirmed unchanged in this phase).
--
-- SCOPE: ACL only. No function body, signature, SECURITY DEFINER/
-- search_path setting, table, index, RLS policy, or global default
-- privilege is touched.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- Model A: claim_whatsapp_outreach_execution
revoke all on function public.claim_whatsapp_outreach_execution(uuid, uuid, uuid, uuid, uuid, text, text) from public;
revoke all on function public.claim_whatsapp_outreach_execution(uuid, uuid, uuid, uuid, uuid, text, text) from anon;
grant execute on function public.claim_whatsapp_outreach_execution(uuid, uuid, uuid, uuid, uuid, text, text) to authenticated;

-- Model A: mark_whatsapp_outreach_sent
revoke all on function public.mark_whatsapp_outreach_sent(uuid, uuid, text, text, text) from public;
revoke all on function public.mark_whatsapp_outreach_sent(uuid, uuid, text, text, text) from anon;
grant execute on function public.mark_whatsapp_outreach_sent(uuid, uuid, text, text, text) to authenticated;

-- Model A: mark_whatsapp_outreach_failed
revoke all on function public.mark_whatsapp_outreach_failed(uuid, uuid, text) from public;
revoke all on function public.mark_whatsapp_outreach_failed(uuid, uuid, text) from anon;
grant execute on function public.mark_whatsapp_outreach_failed(uuid, uuid, text) to authenticated;

-- Model B: flag_stale_whatsapp_outreach_executions
revoke all on function public.flag_stale_whatsapp_outreach_executions(timestamptz) from public;
revoke all on function public.flag_stale_whatsapp_outreach_executions(timestamptz) from anon;
revoke all on function public.flag_stale_whatsapp_outreach_executions(timestamptz) from authenticated;
grant execute on function public.flag_stale_whatsapp_outreach_executions(timestamptz) to service_role;

commit;
