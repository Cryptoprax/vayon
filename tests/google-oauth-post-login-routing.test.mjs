import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Google signup and login use the shared authenticated callback", async () => {
  const [actions, service, callback] = await Promise.all([
    read("features/authentication/actions/auth.actions.ts"),
    read("features/authentication/services/authentication.service.ts"),
    read("app/auth/callback/route.ts"),
  ]);
  assert.match(actions, /googleLoginAction/);
  assert.match(service, /signInWithOAuth/);
  assert.match(service, /auth\/callback\?next=/);
  assert.match(callback, /exchangeCodeForSession/);
  assert.match(callback, /safeAuthenticatedPath\(next\)/);
});

test("obsolete Founder home OAuth destination resolves through the canonical entry route", async () => {
  const security = await read("features/authentication/security/oauth.ts");
  assert.match(security, /obsoletePostLoginPaths/);
  assert.match(security, /"\/vayon\/home"/);
  assert.match(security, /return defaultAuthenticatedPath/);
});

test("new Google users enter onboarding before workspace creation", async () => {
  const entry = await read("app/vayon/page.tsx");
  assert.match(entry, /WorkspaceService/);
  assert.match(entry, /if \(!workspace\) redirect\("\/onboarding"\)/);
  assert.ok(existsSync(new URL("../app/onboarding/page.tsx", import.meta.url)));
});

test("returning Google users land on the canonical dashboard", async () => {
  const entry = await read("app/vayon/page.tsx");
  assert.match(entry, /redirect\(query\.welcome === "1" \? "\/vayon\/dashboard\?welcome=1" : "\/vayon\/dashboard"\)/);
  assert.ok(existsSync(new URL("../app/vayon/dashboard/page.tsx", import.meta.url)));
});

for (const role of ["Founder", "Admin", "Agent"]) {
  test(`${role} post-login entry never defaults to a role-hidden route`, async () => {
    const [entry, policy] = await Promise.all([
      read("app/vayon/page.tsx"),
      read("features/platform/visibility/policy.ts"),
    ]);
    assert.doesNotMatch(entry, /redirect\([^\n]*\/vayon\/home/);
    assert.match(entry, /\/vayon\/dashboard/);
    assert.match(policy, /founder-home.*\/vayon\/home/);
  });
}

test("middleware preserves the canonical authenticated entry and blocks only role-hidden pages", async () => {
  const proxy = await read("lib/supabase/proxy.ts");
  assert.match(proxy, /target\.pathname = "\/vayon"/);
  assert.match(proxy, /canViewPath/);
  assert.match(proxy, /target\.pathname = "\/_not-found"/);
});
