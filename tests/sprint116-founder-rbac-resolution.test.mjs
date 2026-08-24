import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

test("Founder authorization uses the canonical platform role without an orphaned claim", () => {
  const context = read("features/platform/founder/services/founder-context.ts");
  assert.match(context, /role === "founder" \|\| role === "super_admin"/);
  assert.doesNotMatch(context, /app_metadata\?\.founder|founderClaim/);
  assert.match(context, /!isFounder\(user\)/);
});

test("platform navigation reuses the same Founder authorization predicate", () => {
  const layout = read("app/platform/layout.tsx");
  assert.match(layout, /import \{ isFounder \}/);
  assert.match(layout, /showFounder=\{isFounder\(user\)\}/);
  assert.doesNotMatch(layout, /app_metadata\?\.founder|founderClaim/);
});

test("all Founder routes fail closed through FounderAccessError", () => {
  const routes = [
    "app/platform/founder/page.tsx",
    "app/platform/founder/ai/page.tsx",
    "app/platform/founder/command-center/page.tsx",
    "app/platform/founder/marketing/page.tsx",
    "app/platform/founder/sales/page.tsx",
    "app/platform/founder/customer-success/page.tsx",
    "app/platform/founder/intelligence/page.tsx",
    "app/platform/founder/memory/page.tsx",
    "app/platform/founder/operations/page.tsx",
    "app/platform/founder/workflows/page.tsx",
    "app/platform/founder/integrations/page.tsx",
    "app/platform/founder/tenants/page.tsx",
  ];

  for (const route of routes) {
    const source = read(route);
    assert.match(source, /FounderAccessError/, route);
    assert.match(source, /notFound\(\)/, route);
  }
});

test("organization and workspace roles cannot satisfy Founder authorization", () => {
  const context = read("features/platform/founder/services/founder-context.ts");
  assert.doesNotMatch(context, /organization_owner|organization_admin|workspace_members|organization_members/);
});
