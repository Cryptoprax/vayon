import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const script = readFileSync("scripts/bootstrap-founders.ts", "utf8");

test("initial provisioning targets only the four approved Founder emails", () => {
  for (const email of ["prakyathaiagent@gmail.com", "vpprakyath@gmail.com", "vsukanya1969@gmail.com", "prakyathvp@gmail.com"]) assert.match(script, new RegExp(email));
  assert.equal((script.match(/@gmail\.com/g) ?? []).length, 4);
});

test("utility requires server credentials without exposing their values", () => {
  assert.match(script, /loadEnvConfig\(process\.cwd\(\)\)/);
  assert.match(script, /process\.env\.SUPABASE_URL\s*\?\?\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(script, /process\.env\.SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(script, /serviceRoleKey\}|console\.(?:log|error)\([^\n]*serviceRoleKey/);
});

test("role update preserves app metadata and is idempotent", () => {
  assert.match(script, /user\.app_metadata\?\.role === "super_admin"/);
  assert.match(script, /app_metadata: \{ \.\.\.user\.app_metadata, role: "super_admin" \}/);
  assert.match(script, /updateUserById\(user\.id/);
  assert.match(script, /role already configured/);
});

test("missing users skip while failed updates produce a non-zero exit", () => {
  assert.match(script, /authenticated user does not exist/);
  assert.match(script, /summary\.failed > 0/);
  assert.match(script, /process\.exitCode = 1/);
  for (const status of ["FOUND", "UPDATED", "SKIPPED", "FAILED"]) assert.match(script, new RegExp(`\\b${status}\\b`));
});

test("utility has no SQL, migration, browser, or automatic application integration", () => {
  assert.doesNotMatch(script, /from\(|rpc\(|insert\(|update\(|delete\(|window|document|localStorage/);
  const packageJson = readFileSync("package.json", "utf8");
  assert.doesNotMatch(packageJson, /bootstrap-founders/);
});
