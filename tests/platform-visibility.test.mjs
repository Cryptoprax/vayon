import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const domain = await read("features/platform/visibility/domain.ts");
const policy = await read("features/platform/visibility/policy.ts");
const service = await read("features/platform/visibility/service.ts");
const migration = await read("supabase/migrations/20260927000000_sprint195_platform_visibility.sql");

test("visibility catalog supports every governed industry and commercial role", () => {
  for (const industry of ["REAL_ESTATE", "HEALTHCARE", "LEGAL", "FINANCE", "CONSTRUCTION", "HOSPITALITY", "ECOMMERCE", "GENERAL"]) assert.match(domain, new RegExp(industry));
  for (const role of ["Founder", "Super Admin", "Admin", "Manager", "Agent", "Employee", "Viewer"]) assert.match(domain, new RegExp(`"${role}"`));
  assert.match(policy, /REAL_ESTATE.*default|REAL_ESTATE/s);
});

test("Founder and Super Admin receive unrestricted visibility", async () => {
  assert.match(policy, /if \(context\.founder\) return true/);
  assert.match(policy, /platformRole === "founder"/);
  assert.match(policy, /platformRole === "super_admin"/);
  assert.match(await read("app/platform/layout.tsx"), /if \(!isFounder\(user\)\) notFound\(\)/);
});

test("founder platform routes and customer real estate navigation are filtered centrally", async () => {
  const navigation = await read("features/platform/permissions/runtime/navigation.ts");
  const sidebar = await read("features/vayon/product-shell/ShellSidebar.tsx");
  assert.match(policy, /id: "administration".*founderRoles/);
  assert.match(policy, /id: "growth".*realEstateRoles/);
  for (const allowed of ["/vayon/properties", "/vayon/leads", "/vayon/deals", "/vayon/calendar", "/vayon/tasks", "/vayon/approvals", "/vayon/analytics", "/vayon/ai"]) assert.match(await read("features/vayon/product-shell/navigation.ts"), new RegExp(allowed.replaceAll("/", "\\/")));
  assert.match(navigation, /canViewPath\(visibility,item\.href\)/);
  assert.match(sidebar, /filterNavigationForRole\(shellNavigation,role,visibility\)/);
});

test("navigation, universal search, menus, and quick create share the visibility policy", async () => {
  assert.match(await read("features/vayon/product-shell/ShellHeader.tsx"), /filterVisibleItems\(visibility,vayonNavigation\)/);
  assert.match(await read("features/vayon/product-shell/QuickCreate.tsx"), /filterVisibleItems\(visibility,actions\)/);
  assert.match(await read("features/vayon/product-shell/ShellMenus.tsx"), /canViewPath\(visibility,href\)/);
});

test("direct platform and hidden product routes return a concealed 404 boundary", async () => {
  const proxy = await read("lib/supabase/proxy.ts");
  assert.match(proxy, /isFounderOnlyPath\(path\)/);
  assert.match(proxy, /canViewPath\(visibility, path\)/);
  assert.match(proxy, /target\.pathname = "\/_not-found"/);
  assert.match(proxy, /status: 404/);
  assert.doesNotMatch(proxy, /^\s*"\/platform",\s*$/m);
});

test("workspace industry storage is additive, tenant scoped, and defaults to Real Estate", () => {
  for (const table of ["workspace_industry", "platform_features", "industry_visibility", "role_visibility"]) assert.match(migration, new RegExp(`create table if not exists public\\.${table}`));
  assert.match(migration, /default 'REAL_ESTATE'/);
  assert.match(migration, /current_workspace_role\(workspace_id\)is not null/);
  assert.match(service, /PlatformVisibilityRepository/);
});

test("customer workflow templates are Real Estate-only while generic templates are founder-only", async () => {
  const templates = await read("features/platform/workflows/library/templates.ts");
  const automation = await read("features/platform/workflows/services/automation.service.ts");
  for (const name of ["Buyer Qualification", "Seller Onboarding", "Property Listing", "Property Verification", "Lead Qualification", "Property Matching", "Site Visit", "Offer Management", "Negotiation", "Booking", "Loan Processing", "Registration", "Property Handover", "After Sales Follow-up", "Referral Campaign"]) assert.match(templates, new RegExp(name));
  assert.match(templates, /category === "Real Estate" \? \["REAL_ESTATE"\]/);
  assert.match(templates, /\["Founder", "Super Admin"\]/);
  assert.match(automation, /template\.industryVisibility\.includes\(visibility\.industry\)/);
  assert.match(automation, /template\.roleVisibility\.includes\(visibility\.role\)/);
});
