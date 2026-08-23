import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const patch = await readFile("supabase/reconciliation/VERSION1_PRODUCTION_PATCH.sql", "utf8");
const validation = await readFile("supabase/reconciliation/VERSION1_POST_DEPLOY_CHECK.sql", "utf8");
const deploymentStatements = patch.replace(/\$vayon_sql\$[\s\S]*?\$vayon_sql\$/g, "GUARDED_DEFINITION");

test("Sprint 90 patch is additive and does not manipulate migration history", () => {
  assert.doesNotMatch(deploymentStatements, /\bdrop\s+table\b/i);
  assert.doesNotMatch(deploymentStatements, /^\s*(delete|truncate|update)\b/im);
  assert.doesNotMatch(patch, /supabase_migrations|migration\s+repair|db\s+push/i);
  assert.match(patch, /create table if not exists/i);
  assert.match(patch, /add column if not exists/i);
});

test("Sprint 90 guards policies, functions, and triggers", () => {
  assert.doesNotMatch(patch, /^\s*create policy\b/im);
  assert.doesNotMatch(patch, /^\s*create or replace function\b/im);
  assert.doesNotMatch(patch, /^\s*create trigger\b/im);
  assert.match(patch, /pg_policies/);
  assert.match(patch, /pg_proc/);
  assert.match(patch, /pg_trigger/);
});

test("Sprint 90 post-deploy validation is read only and fail closed", () => {
  assert.match(validation, /begin transaction read only/i);
  assert.match(validation, /raise exception/i);
  assert.match(validation, /rollback/i);
  assert.doesNotMatch(validation, /\b(insert|update|delete|truncate|alter|create|drop)\b/i);
});
