-- Phase DBV6A: ACL hardening for M1/M2's four Meta Marketing connection/
-- form-mapping RPCs.
--
-- WHY THIS EXISTS: this project's default-privilege rule (`alter default
-- privileges for role postgres in schema public grant execute on functions
-- to anon, authenticated, service_role`, confirmed directly against
-- Production pg_default_acl/has_function_privilege throughout this
-- engagement) grants EXECUTE to anon BY NAME at the moment each function is
-- created. M1/M2's own grant blocks only do `revoke all ... from public;
-- grant execute ... to authenticated;` for all four of their functions --
-- none of them revoke from anon. This is the identical gap already found
-- and closed for D1 (DBV5E), K1 (DBV5G), K2 (DBV5H), K3 (DBV5I), K4
-- (DBV5J), and D2 (this same phase, DBV6A-D2), audited and pre-hardened
-- here before M1/M2 ever reach Production.
--
-- WHY ALL FOUR ARE AUTHENTICATED-ONLY: direct repository call-site audit
-- found all four are called exclusively through MetaMarketingRepository,
-- reached only via MetaMarketingService.production()/
-- CampaignLeadFormService.production(), both using operationsContext() ->
-- createSupabaseServerClient() (an authenticated session client). Each
-- function independently re-verifies can_manage_integrations(p_workspace_id)
-- in its own body (organization_owner or super_admin), the same DB-layer
-- gate WhatsApp connect/disconnect already use. No service_role caller
-- exists anywhere in the codebase for any of the four -- the separate
-- webhook-facing tenant resolver (resolveMetaLeadTenant, in
-- resolve-meta-lead-tenant.ts) reads meta_lead_form_mappings/
-- meta_marketing_connections directly via table SELECT, never through
-- these RPCs, so it does not change this classification.
--
-- WHY A SEPARATE ADDITIVE MIGRATION, NOT AN EDIT TO M1/M2: the M1/M2
-- checksum is already locked and recorded (reconfirmed unchanged in this
-- phase). Keeping M1/M2 untouched preserves it as a truthful record of
-- what will actually be applied to Production. This migration follows the
-- exact precedent already proven safe and effective by DBV1E, SEC2,
-- DBV5E, DBV5G, DBV5H, DBV5I, and DBV5J: a small, isolated,
-- independently-reviewable ACL-only migration that touches nothing about
-- the target functions except their grants.
--
-- WHY THIS TIMESTAMP (20261115010000, one hour after M1/M2's own
-- 20261115000000): so that on a fresh chain replay, and within the DBV5
-- Production runbook's own Wave 2 grouping, this hardening lands
-- immediately after M1/M2 and before M3 -- matching the "no exposure
-- window" discipline established throughout Wave 1.
--
-- SCOPE: ACL only. No function body, signature, SECURITY DEFINER/
-- search_path setting, table, RLS policy, OAuth/token-encryption logic, or
-- global default privilege is touched.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

revoke all on function public.connect_meta_marketing_page(uuid, text, text, text, text, text, text, text, text, text, timestamptz, text[]) from public;
revoke all on function public.connect_meta_marketing_page(uuid, text, text, text, text, text, text, text, text, text, timestamptz, text[]) from anon;
grant execute on function public.connect_meta_marketing_page(uuid, text, text, text, text, text, text, text, text, text, timestamptz, text[]) to authenticated;

revoke all on function public.disconnect_meta_marketing(uuid) from public;
revoke all on function public.disconnect_meta_marketing(uuid) from anon;
grant execute on function public.disconnect_meta_marketing(uuid) to authenticated;

revoke all on function public.create_meta_lead_form_mapping(uuid, uuid, text, text, text, uuid, uuid) from public;
revoke all on function public.create_meta_lead_form_mapping(uuid, uuid, text, text, text, uuid, uuid) from anon;
grant execute on function public.create_meta_lead_form_mapping(uuid, uuid, text, text, text, uuid, uuid) to authenticated;

revoke all on function public.disable_meta_lead_form_mapping(uuid, uuid) from public;
revoke all on function public.disable_meta_lead_form_mapping(uuid, uuid) from anon;
grant execute on function public.disable_meta_lead_form_mapping(uuid, uuid) to authenticated;

commit;
