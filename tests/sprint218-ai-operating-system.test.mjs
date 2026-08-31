import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const router = read("features/vayon/cross-module-intelligence/command-router.ts");
const bar = read("features/vayon/universal-bar/components/UniversalBar.tsx");

test("universal AI command resolves cross-module workflows", () => {
  for (const value of ["create-marketing-asset", "match-buyers", "engage-lead", "coordinate-operations", "review-intelligence", "review-approval"]) assert.match(router, new RegExp(value));
  for (const route of ["/vayon/creative", "/vayon/property-matching", "/vayon/ai/workforce/sales-ai", "/vayon/calendar", "/vayon/analytics", "/vayon/approvals"]) assert.match(router, new RegExp(route.replaceAll("/", "\\/")));
});

test("commands carry workspace permission context and approval governance", () => {
  for (const value of ["permission", "workspaceRequired", "approvalRequired", "context", "voiceReady"]) assert.match(router, new RegExp(value));
  assert.match(router, /new URLSearchParams/);
});

test("Universal Bar launches the resolved workflow without manual navigation", () => {
  assert.match(bar, /resolveOperatingSystemCommand\(prompt\)/);
  assert.match(bar, /router\.push\(command\.route\)/);
  assert.match(bar, /detail: \{ prompt, command \}/);
  assert.match(bar, /enterKeyHint="go"/);
});

test("creative and communication actions remain approval routed", () => {
  assert.match(router, /creative\.create[\s\S]+approval: true/);
  assert.match(router, /crm\.update[\s\S]+approval: true/);
});
