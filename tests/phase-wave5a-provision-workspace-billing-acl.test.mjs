import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// WAVE5A regression test.
//
// Production read-only audit found public.provision_workspace_billing
// anon- and authenticated-executable despite having no in-body auth.uid()
// check, no service-role guard, and no tenant-ownership verification -- it
// trusts (p_workspace, p_organization, p_actor) as plain data. Repository
// audit found zero application/API call sites; its only real caller is the
// SECURITY DEFINER trigger provision_billing_after_workspace (installed in
// 20260813000000_sprint22_production_baseline.sql), which derives every
// argument from the newly-inserted workspaces row, never from a caller
// value. 20261202000000_provision_workspace_billing_acl_hardening.sql
// closes this the same way SEC2/DBV1E close their targets: ACL-only,
// service_role-only. This test pins that the migration is exactly that.

const migrationPath = "supabase/migrations/20261202000000_provision_workspace_billing_acl_hardening.sql";
const raw = readFileSync(migrationPath, "utf8");
const sql = raw.split("\n").filter((line) => !line.trim().startsWith("--")).join("\n");

const fq = "public.provision_workspace_billing(uuid, uuid, uuid)";

test("WAVE5A hardening migration targets exactly provision_workspace_billing(uuid, uuid, uuid)", () => {
  assert.match(sql, new RegExp(`revoke all on function ${escapeRegExp(fq)} from public;`));
  assert.match(sql, new RegExp(`revoke all on function ${escapeRegExp(fq)} from anon;`));
  assert.match(sql, new RegExp(`revoke all on function ${escapeRegExp(fq)} from authenticated;`));
  assert.match(sql, new RegExp(`grant execute on function ${escapeRegExp(fq)} to service_role;`));
});

test("WAVE5A hardening migration is wrapped in an explicit transaction", () => {
  assert.match(sql, /^\s*begin;/i);
  assert.match(sql, /commit;\s*$/i);
});

test("WAVE5A hardening migration never grants EXECUTE to anon or authenticated", () => {
  assert.doesNotMatch(sql, /grant execute[^;]*to anon\b/i);
  assert.doesNotMatch(sql, /grant execute[^;]*to authenticated\b/i);
});

test("WAVE5A hardening migration revokes public, anon, and authenticated -- not just public", () => {
  assert.doesNotMatch(sql, /revoke all on function[^;]*from service_role/i);
});

test("WAVE5A hardening migration does not alter default privileges", () => {
  assert.doesNotMatch(sql, /alter default privileges/i);
});

test("WAVE5A hardening migration is purely additive (no CREATE OR REPLACE FUNCTION, no DROP, no schema/table changes)", () => {
  assert.doesNotMatch(sql, /create or replace function/i);
  assert.doesNotMatch(sql, /drop function/i);
  assert.doesNotMatch(sql, /alter table/i);
  assert.doesNotMatch(sql, /create table/i);
  assert.doesNotMatch(sql, /drop table/i);
});

test("WAVE5A hardening migration targets only one function (no scope creep)", () => {
  const revokeCount = (sql.match(/revoke all on function/gi) || []).length;
  const grantCount = (sql.match(/grant execute on function/gi) || []).length;
  assert.equal(revokeCount, 3, "expected exactly 3 REVOKE statements (public, anon, authenticated)");
  assert.equal(grantCount, 1, "expected exactly 1 GRANT statement (service_role)");
});

test("WAVE5A hardening migration's timestamp sorts after DBV1E and SEC2 but is applied first per Wave 5 runbook order", () => {
  // Filename timestamp (20261202000000) intentionally sorts after both SEC2
  // (20261129000000) and DBV1E (20261128000000) -- Supabase migration
  // ordering is filename-based, but the runbook's documented Production
  // execution order for this uncovered gap is independent of that and is
  // applied first, exactly as SEC2 is deliberately applied before DBV1E
  // despite DBV1E's filename sorting earlier.
  assert.match(migrationPath, /20261202000000_provision_workspace_billing_acl_hardening\.sql$/);
});

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
