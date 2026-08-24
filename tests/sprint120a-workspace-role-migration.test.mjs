import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync("supabase/migrations/20260919000000_sprint120a_workspace_role_catalog.sql", "utf8");

const legacy = ["organization_admin", "manager", "sales", "marketing", "operations", "finance", "support", "read_only"];
const added = ["operations_manager", "sales_manager", "sales_representative", "marketing_manager", "marketing_specialist", "customer_success_manager", "support_agent", "finance_manager", "hr_manager", "knowledge_manager", "product_manager", "ai_manager", "analyst", "standard_member", "viewer", "guest"];

test("workspace role migration preserves every legacy role and adds the enterprise catalog", () => {
  for (const role of [...legacy, ...added, "organization_owner"]) assert.match(migration, new RegExp(`'${role}'`));
  assert.match(migration, /on conflict \(code\) do nothing/i);
});

test("invitation and member role RPC signatures remain stable", () => {
  assert.match(migration, /invite_organization_member\(\s*p_workspace_id uuid,\s*p_name text,\s*p_email text,\s*p_role text\s*\) returns uuid/s);
  assert.match(migration, /change_organization_member_role\(\s*p_workspace_id uuid,\s*p_member_id uuid,\s*p_role text\s*\) returns void/s);
  for (const role of [...legacy, ...added]) {
    assert.equal((migration.match(new RegExp(`'${role}'`, "g")) ?? []).length >= 3, true, `${role} is inserted and accepted by both RPCs`);
  }
});

test("owner elevation remains confirmation-gated and platform roles stay excluded", () => {
  assert.match(migration, /owner role cannot be changed/);
  assert.doesNotMatch(migration, /'super_admin'/);
  const rpcSection = migration.slice(migration.indexOf("create or replace function"));
  assert.equal((rpcSection.match(/'organization_owner'/g) ?? []).length, 1);
});

test("migration is transactional, additive, and assignment safe", () => {
  assert.match(migration, /begin;[\s\S]*commit;/i);
  assert.match(migration, /set local lock_timeout/i);
  assert.match(migration, /set local statement_timeout/i);
  assert.doesNotMatch(migration, /drop\s+(table|column|constraint)|truncate|delete\s+from|update\s+public\.roles/i);
  assert.doesNotMatch(migration, /update\s+public\.(workspace_members|organization_members)[\s\S]*where\s+(?!id|organization_id)/i);
});
