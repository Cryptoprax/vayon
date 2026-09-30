-- Phase DBV5E: ACL hardening for D1's four approval-workflow RPCs.
--
-- WHY THIS EXISTS: D1 (20261102000000_business_approval_workflows.sql)
-- grants EXECUTE on all four of its new functions to `authenticated` via
-- `revoke all ... from public; grant execute ... to authenticated;` --
-- but never issues `revoke ... from anon`. This project's default-privilege
-- rule (`alter default privileges for role postgres in schema public grant
-- execute on functions to anon, authenticated, service_role`, confirmed
-- directly against both local and Production `pg_default_acl` in DBV1B-R2/
-- DBV1E/DBV2/DBV4/DBV5A) grants EXECUTE to anon BY NAME at the moment each
-- function is created; `revoke all ... from public` only revokes the
-- PUBLIC pseudo-role's own grant, not anon's separately-established one.
-- D1's four functions are therefore anon-executable today, exactly as
-- DBV5C found and DBV5D independently confirmed by direct code audit.
--
-- WHY A SEPARATE ADDITIVE MIGRATION, NOT AN EDIT TO D1: D1's checksum was
-- already locked and recorded during DBV5A/DBV5C, and D1 already sits
-- inside the independently-validated 82-migration fresh-chain baseline.
-- Editing it now, for a hardening reason unrelated to any replay-breaking
-- defect, would invalidate that checksum and require a full fresh-chain
-- re-validation for no benefit over the pattern already proven safe and
-- effective by DBV1E (20261128000000_service_role_acl_hardening.sql) and
-- SEC2 (20261129000000_sensitive_rpc_acl_hardening.sql): a small, isolated,
-- independently-reviewable ACL-only migration that touches nothing about
-- the target functions except their grants. This migration follows that
-- exact precedent, applied to D1's four functions specifically.
--
-- WHY THIS TIMESTAMP (20261102010000, one hour after D1's own
-- 20261102000000): so that on a fresh chain replay, and within the DBV5
-- Production runbook's own Wave 1 grouping, this hardening lands
-- immediately after D1 and before D2/K1 -- there is no meaningful window,
-- local or Production, during which D1's functions are anon-executable and
-- not yet closed. The DBV5 runbook treats D1 + this migration as one
-- tightly-coupled opening unit within Wave 1, not two independently
-- sign-offable steps.
--
-- WHY NO service_role GRANT: confirmed by direct application-code audit
-- (DBV5D) that all four functions are called exclusively through a real,
-- session-scoped, authenticated Supabase client
-- (GovernanceService.production() -> operationsContext() ->
-- createSupabaseServerClient()) -- there is no service_role caller
-- anywhere in the codebase for any of the four. Adding service_role here
-- would be an unrequested widening, not a hardening. Every one of the
-- three mutation functions also independently rejects a null auth.uid()
-- in its own body regardless of ACL, and can_manage_approvals (the fourth)
-- is a pure STABLE boolean predicate with no side effects, called
-- internally by the other three under their own SECURITY DEFINER context
-- -- it has no direct application caller at all, but is granted to
-- authenticated here for consistency with the other three, matching D1's
-- own original grant shape exactly.
--
-- SCOPE: ACL only. No function body, signature, SECURITY DEFINER/
-- search_path setting, table, RLS policy, or global default privilege is
-- touched.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

revoke all on function public.can_manage_approvals(uuid) from public;
revoke all on function public.can_manage_approvals(uuid) from anon;
grant execute on function public.can_manage_approvals(uuid) to authenticated;

revoke all on function public.request_approval(uuid, jsonb) from public;
revoke all on function public.request_approval(uuid, jsonb) from anon;
grant execute on function public.request_approval(uuid, jsonb) to authenticated;

revoke all on function public.decide_approval(uuid, integer, text, text) from public;
revoke all on function public.decide_approval(uuid, integer, text, text) from anon;
grant execute on function public.decide_approval(uuid, integer, text, text) to authenticated;

revoke all on function public.cancel_approval(uuid, integer) from public;
revoke all on function public.cancel_approval(uuid, integer) from anon;
grant execute on function public.cancel_approval(uuid, integer) to authenticated;

commit;
