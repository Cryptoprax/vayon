-- Phase WAVE5A: ACL hardening for public.provision_workspace_billing.
--
-- ROOT CAUSE: same default-privilege-layer gap as SEC2/DBV1E -- the
-- schema-level "ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
-- GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role" grants
-- EXECUTE to anon/authenticated by role name, not via PUBLIC, the instant a
-- function is created. This function has been redefined three times
-- (20260813000000_sprint22_production_baseline.sql,
-- 20261030000000_sprint233_workspace_trial.sql,
-- 20261030030000_sprint236_vayon3day_redemption.sql) and only the first of
-- those ever paired the redefinition with an ACL statement -- and even that
-- statement only did "revoke all ... from public", which is a no-op against
-- the separately-named anon/authenticated grants. The two later
-- redefinitions (CREATE OR REPLACE FUNCTION) reset any ACL narrowing
-- entirely, leaving the function anon- and authenticated-executable in
-- Production.
--
-- WHY SERVICE_ROLE_ONLY: repository-wide search found zero application/API
-- call sites. The function's only real caller is the database trigger
-- installed in 20260813000000_sprint22_production_baseline.sql:
--   create trigger provision_billing_after_workspace
--     after insert on public.workspaces
--     for each row execute function public.provision_billing_on_workspace();
-- provision_billing_on_workspace() is itself SECURITY DEFINER and derives
-- every argument (workspace id, organization id, actor) directly from the
-- newly-inserted workspaces row (new.id, new.organization_id,
-- new.created_by) -- never from a caller-supplied value. A SECURITY DEFINER
-- trigger function executes with the privileges of its owner, not the
-- inserting role, so this trigger path needs no anon/authenticated/
-- service_role EXECUTE grant on provision_workspace_billing at all. No
-- legitimate customer-facing or service-role-external flow calls this
-- function directly. Historical intent corroborates this: the original
-- migration's own "revoke ... from public; grant ... to authenticated"
-- statement deliberately excluded provision_workspace_billing from its
-- authenticated-grant list (unlike its four sibling billing functions), and
-- 20261030000000_sprint233_workspace_trial.sql's revoke-from-public
-- statement is commented "Preserve the original privileged-only
-- provisioning boundary."
--
-- IMPACT OF THE GAP BEING CLOSED: without this migration, any anon or
-- authenticated caller could invoke provision_workspace_billing directly
-- with an arbitrary (p_workspace, p_organization, p_actor) triple -- the
-- function body has no auth.uid() check, no service-role guard, and no
-- tenant-ownership verification of any kind; it trusts all three
-- parameters as plain data. Because every insert uses "on conflict ...  do
-- nothing", this cannot overwrite an already-provisioned workspace's
-- billing state, but it could let an unauthenticated caller forge the
-- created_by/updated_by attribution on a not-yet-provisioned workspace's
-- subscription row, or probe workspace/organization id pairings via
-- FK-violation error responses.
--
-- SCOPE: ACL only. No function body, signature, table, index, RLS policy,
-- or global default privilege is touched. The function keeps its exact
-- SECURITY DEFINER, plpgsql language, and pinned search_path=public.

begin;

revoke all on function public.provision_workspace_billing(uuid, uuid, uuid) from public;
revoke all on function public.provision_workspace_billing(uuid, uuid, uuid) from anon;
revoke all on function public.provision_workspace_billing(uuid, uuid, uuid) from authenticated;
grant execute on function public.provision_workspace_billing(uuid, uuid, uuid) to service_role;

commit;
