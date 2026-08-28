import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(path, "utf8");
test("Universal Bar remains the single deterministic command palette", () => {
  const source = read(
    "features/vayon/universal-bar/components/UniversalBar.tsx",
  );
  for (const value of [
    "Control\\+K Meta\\+K",
    "ctrlKey",
    "metaKey",
    'role="combobox"',
    "ArrowDown",
    "ArrowUp",
    "Home",
    "End",
    "recent",
    "favorites",
  ])
    assert.match(source, new RegExp(value));
  assert.doesNotMatch(source, /fetch\(|supabase/i);
});
test("enterprise search includes all requested navigation domains", () => {
  const contracts = read("features/vayon/universal-bar/domain/contracts.ts"),
    provider = read(
      "features/vayon/universal-bar/providers/static-navigation.provider.ts",
    );
  for (const value of [
    "properties",
    "leads",
    "deals",
    "communications",
    "employees",
    "workflows",
    "analytics",
    "pages",
    "settings",
    "navigation",
  ]) {
    assert.match(contracts, new RegExp(value));
    assert.match(provider, new RegExp(value));
  }
});
test("global navigation exposes certified cross-module transitions", () => {
  const source = read("features/vayon/product-shell/navigation.ts");
  for (const path of [
    "/vayon/analytics",
    "/vayon/workflows",
    "/vayon/approvals",
    "/vayon/ai/workforce/sales-ai",
    "/vayon/admin",
    "/vayon/system",
  ])
    assert.match(source, new RegExp(path));
});
test("shared table supports enterprise interaction contracts", () => {
  const source = read(
    "features/platform/design-system/components/data/Data.tsx",
  );
  for (const value of [
    "sticky",
    "cursor-col-resize",
    "Visible columns",
    "compact",
    "comfortable",
    "Export CSV",
    "Select all rows",
    "ArrowDown",
    "ArrowUp",
    "Home",
    "End",
    "aria-selected",
    "overflow-x-auto",
    "aria-live",
  ])
    assert.match(source, new RegExp(value));
});
test("dashboard layout supports optional executive density", () => {
  const source = read("features/platform/design-system/layout/Layouts.tsx");
  for (const value of [
    "compact",
    "comfortable",
    "executive",
    "data-dashboard-density",
  ])
    assert.match(source, new RegExp(value));
});
test("system diagnostics exposes non-sensitive route performance and module inventory", () => {
  const service = read(
      "features/platform/quality/services/system-diagnostics.ts",
    ),
    view = read("features/platform/quality/components/SystemDiagnostics.tsx");
  for (const value of [
    "routeCount",
    "authenticatedRouteInventory",
    "server-components-preferred",
    "isolated-client-boundaries",
    "not-collected",
    "sensitiveRuntimeDataIncluded: false",
  ])
    assert.match(service, new RegExp(value));
  for (const value of [
    "Authenticated route inventory",
    "Performance posture",
    "Runtime performance data is not collected",
  ])
    assert.match(view, new RegExp(value));
});
test("UX changes do not introduce backend business or integration access", () => {
  const files = [
    "features/platform/design-system/components/data/Data.tsx",
    "features/platform/design-system/layout/Layouts.tsx",
    "features/vayon/universal-bar/components/UniversalBar.tsx",
    "features/vayon/product-shell/navigation.ts",
    "features/platform/quality/services/system-diagnostics.ts",
  ]
    .map(read)
    .join("\n");
  assert.doesNotMatch(
    files,
    /createSupabase|\.from\(|\.rpc\(|server action|use server|googleapis|graph\.microsoft/i,
  );
});
test("documentation records improvements evidence debt and Sprint 40", () => {
  const source = read("docs/UX_EXCELLENCE.md");
  for (const value of [
    "UX improvements",
    "Table standardization",
    "Accessibility improvements",
    "Performance improvements",
    "Design improvements",
    "Remaining debt",
    "Sprint 40 recommendation",
    "No claim of manual browser",
  ])
    assert.match(source, new RegExp(value, "i"));
});
