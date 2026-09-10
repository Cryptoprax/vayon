import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
const read = (p) => readFileSync(p, "utf8");
test("authentication routes and refresh proxy exist", () => {
  for (const path of [
    "app/login/page.tsx",
    "app/signup/page.tsx",
    "app/forgot-password/page.tsx",
    "app/reset-password/page.tsx",
    "app/auth/callback/route.ts",
    "proxy.ts",
  ])
    assert.ok(existsSync(path), path);
});
test("onboarding is atomic and owner-scoped", () => {
  const sql = read("database/001_sprint8_auth_onboarding.sql");
  assert.match(sql, /complete_organization_onboarding/);
  assert.match(sql, /organization_owner/);
  assert.match(sql, /auth\.uid\(\)/);
  assert.match(sql, /enable row level security/);
});
test("vayon navigation uses the shared product shell catalog", () => {
  const shell = read("features/vayon/components/VayonShell.tsx");
  assert.match(shell, /product-shell navigation catalog/);
  assert.doesNotMatch(shell, /const navigation\s*=/);
});
test("protected routes redirect through proxy", () => {
  const proxy = read("lib/supabase/proxy.ts");
  assert.match(proxy, /if\s*\(\s*!user\s*&&\s*!isPublic\s*\)/);
  assert.match(proxy, /pathname\s*=\s*"\/login"/);
});
