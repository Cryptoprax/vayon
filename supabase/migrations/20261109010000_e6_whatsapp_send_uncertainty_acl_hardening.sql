-- Phase DBV6B: ACL hardening for E6's single service-role-only
-- reconciliation RPC.
--
-- WHY THIS EXISTS: this project's default-privilege rule grants EXECUTE to
-- anon AND authenticated BY NAME at CREATE FUNCTION time. E6's own grant
-- block only does `revoke all ... from public; grant execute ... to
-- service_role;` -- it never revokes from anon or authenticated, despite
-- the function's own in-body `current_setting('role', true) <>
-- 'service_role'` guard stating the intended model unambiguously.
--
-- WHY A HISTORICAL MIGRATION (20261128000000_service_role_acl_hardening.sql,
-- Phase DBV1E) ALREADY CORRECTS THIS BUT IS NOT SUFFICIENT ON ITS OWN: see
-- the identical reasoning in the E1/E2/E3/E4 hardening migrations' own
-- headers -- DBV1E is Wave 5, applied only after E6 has already been live
-- (Wave 3A) through the rest of Waves 3B/4A/4B/4C. This migration closes
-- the exposure window immediately. DBV1E is not modified and remains a
-- harmless, idempotent re-assertion when it eventually runs.
--
-- WHY MODEL B (service_role-only): direct repository call-site audit
-- confirms flag_stale_whatsapp_send_executions is called exclusively from
-- whatsapp-send-reconciliation.service.ts, which uses
-- createSupabaseServiceClient() exclusively for both of its call sites
-- (a scheduled/cron-triggered reconciliation route, per E6's own migration
-- comment, not an interactive user action). No authenticated or anon
-- caller exists anywhere in the repository.
--
-- WHY A SEPARATE ADDITIVE MIGRATION, NOT AN EDIT TO E6: E6's checksum is
-- already locked and recorded (reconfirmed unchanged in this phase).
-- Keeping E6 untouched preserves it as a truthful record of what will
-- actually be applied to Production.
--
-- SCOPE: ACL only. No function body, signature, SECURITY DEFINER/
-- search_path setting, table, index, or global default privilege is
-- touched.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

revoke all on function public.flag_stale_whatsapp_send_executions(timestamptz) from public;
revoke all on function public.flag_stale_whatsapp_send_executions(timestamptz) from anon;
revoke all on function public.flag_stale_whatsapp_send_executions(timestamptz) from authenticated;
grant execute on function public.flag_stale_whatsapp_send_executions(timestamptz) to service_role;

commit;
