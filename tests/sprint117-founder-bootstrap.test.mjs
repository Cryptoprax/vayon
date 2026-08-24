import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

test("Founder bootstrap ships the initial configurable allowlist", () => {
  const config = read("features/platform/founder-bootstrap/config.ts");
  for (const email of ["prakyathaiagent@gmail.com", "vpprakyath@gmail.com", "vsukanya1969@gmail.com", "prakyathvp@gmail.com"]) assert.match(config, new RegExp(email));
  assert.match(config, /FOUNDER_EMAIL_ALLOWLIST/);
});

test("bootstrap requires a trusted super_admin caller and allowlisted existing target", () => {
  const service = read("features/platform/founder-bootstrap/founder-bootstrap.service.ts");
  assert.match(service, /founderContext\(\)/);
  assert.match(service, /!== "super_admin"/);
  assert.match(service, /allowlist\.has\(normalizedEmail\)/);
  assert.match(service, /No authenticated account exists/);
  assert.doesNotMatch(service, /user_metadata/);
});

test("grant preserves app metadata and revocation restores the previous role", () => {
  const service = read("features/platform/founder-bootstrap/founder-bootstrap.service.ts");
  assert.match(service, /\.\.\.target\.app_metadata/);
  assert.match(service, /role: "super_admin"/);
  assert.match(service, /previousRole: currentRole/);
  assert.match(service, /role: record\.previousRole/);
  assert.match(service, /target\.id === actor\.id/);
});

test("Founder role mutations are server-only, audited, and idempotent", () => {
  const service = read("features/platform/founder-bootstrap/founder-bootstrap.service.ts");
  const repository = read("features/platform/founder-bootstrap/founder-bootstrap.repository.ts");
  assert.match(service, /import "server-only"/);
  assert.match(repository, /import "server-only"/);
  assert.match(service, /founder\.bootstrap\.granted/);
  assert.match(service, /founder\.bootstrap\.revoked/);
  assert.match(service, /founder\.bootstrap\.grant_skipped/);
  assert.match(service, /founder\.bootstrap\.revoke_skipped/);
  assert.match(service, /changed: false/);
  assert.match(repository, /updateUserById/);
});

test("Founder Portal exposes grant revoke list and status capabilities", () => {
  assert.ok(existsSync("app/platform/founder/access/page.tsx"));
  const panel = read("features/platform/founder-bootstrap/FounderBootstrapPanel.tsx");
  for (const label of ["Grant Founder", "Revoke Founder", "Founder access", "No platform role"]) assert.match(panel, new RegExp(label));
});
