-- Phase DBV6B: ACL hardening for E5's three authenticated-only WhatsApp
-- send-execution RPCs.
--
-- WHY THIS EXISTS: this project's default-privilege rule grants EXECUTE to
-- anon BY NAME at CREATE FUNCTION time. E5's own grant blocks only do
-- `revoke all ... from public; grant execute ... to authenticated;` for
-- all three of its functions -- none revokes from anon. This is the
-- identical gap already found and closed for D1, K1-K5, K2-K4, D2, and
-- M1/M2 throughout this engagement.
--
-- WHY E5 IS NOT IN 20261128000000_service_role_acl_hardening.sql
-- (Phase DBV1E)'S INVENTORY: DBV1E's own scope was explicitly limited to
-- functions classified SERVICE_ROLE_ONLY by their own in-body
-- `current_setting('role', true) <> 'service_role'` guard. E5's three
-- functions -- claim_whatsapp_draft_send, mark_whatsapp_send_succeeded,
-- mark_whatsapp_send_failed -- are deliberately different from every other
-- E-phase RPC: each checks `auth.uid()` and raises 'authentication
-- required' when it is null, exactly like D1's decide_approval() or D2's
-- accept_organization_invitation(). They are genuine
-- AUTHENTICATED_CUSTOMER_RPCs (the human-triggered "Send Approved Reply"
-- action, per E5's own migration comment: "Human-triggered (to
-- authenticated, not service_role) -- unlike E1-E4's webhook-triggered
-- functions"), which is exactly the class of function DBV1E's own header
-- says it intentionally left untouched. This is therefore a genuinely new
-- gap DBV1E was never meant to close, not an omission in DBV1E.
--
-- WHY MODEL A (authenticated-only) FOR ALL THREE: direct repository
-- call-site audit confirms all three are called exclusively through
-- whatsapp-send-execution.service.ts, which uses operationsContext()
-- (`const context = await operationsContext()`) -- an authenticated
-- session client. Each function independently re-derives and re-verifies
-- organization/workspace membership and (for claim_whatsapp_draft_send)
-- can_manage_approvals() in its own body. No service_role caller exists
-- anywhere in the repository for any of the three.
--
-- WHY A SEPARATE ADDITIVE MIGRATION, NOT AN EDIT TO E5: E5's checksum is
-- already locked and recorded (reconfirmed unchanged in this phase).
-- Keeping E5 untouched preserves it as a truthful record of what will
-- actually be applied to Production. This migration follows the exact
-- precedent already proven safe and effective by DBV5E through DBV5J and
-- DBV6A-D2/DBV6A-META: a small, isolated, independently-reviewable
-- ACL-only migration that touches nothing about the target functions
-- except their grants.
--
-- SCOPE: ACL only. No function body, signature, SECURITY DEFINER/
-- search_path setting, table, RLS policy, or global default privilege is
-- touched.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

revoke all on function public.claim_whatsapp_draft_send(uuid, uuid) from public;
revoke all on function public.claim_whatsapp_draft_send(uuid, uuid) from anon;
grant execute on function public.claim_whatsapp_draft_send(uuid, uuid) to authenticated;

revoke all on function public.mark_whatsapp_send_succeeded(uuid, uuid, text, text, text) from public;
revoke all on function public.mark_whatsapp_send_succeeded(uuid, uuid, text, text, text) from anon;
grant execute on function public.mark_whatsapp_send_succeeded(uuid, uuid, text, text, text) to authenticated;

revoke all on function public.mark_whatsapp_send_failed(uuid, uuid, text) from public;
revoke all on function public.mark_whatsapp_send_failed(uuid, uuid, text) from anon;
grant execute on function public.mark_whatsapp_send_failed(uuid, uuid, text) to authenticated;

commit;
