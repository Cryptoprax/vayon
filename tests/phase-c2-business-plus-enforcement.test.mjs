import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

const { subscriptionEntitlementCatalog } = load("features/vayon/billing/config/entitlements.ts");
function hasFeature(plan, feature) { return subscriptionEntitlementCatalog[plan].features.includes(feature); }

const executivePage = readFileSync("app/vayon/analytics/executive/page.tsx", "utf8");
const activityPage = readFileSync("app/vayon/settings/activity/page.tsx", "utf8");
const securityRoute = readFileSync("app/api/security/route.ts", "utf8");
const entitlementsSource = readFileSync("features/vayon/billing/config/entitlements.ts", "utf8");
const featureLicensingService = readFileSync("features/vayon/billing/services/feature-licensing.service.ts", "utf8");
const developersPage = readFileSync("app/vayon/developers/page.tsx", "utf8");
const rolesPage = readFileSync("app/vayon/settings/roles/page.tsx", "utf8");
const permissionsPage = readFileSync("app/vayon/settings/permissions/page.tsx", "utf8");
const workspaceRoleCatalog = readFileSync("features/platform/organization/config/workspace-role-catalog.ts", "utf8");
const approvalsPage = readFileSync("app/vayon/approvals/page.tsx", "utf8");
const governanceService = readFileSync("features/vayon/workflow-approval/services/governance.service.ts", "utf8");
const adminAuditPage = readFileSync("app/vayon/admin/audit/page.tsx", "utf8");
const visibilityPolicy = readFileSync("features/platform/visibility/policy.ts", "utf8");

// ---------------------------------------------------------------------------
// 1. Authoritative tier mapping: catalog matches the approved matrix exactly.
//    (No tier placement is changed in this phase -- these assertions merely
//    confirm the pre-existing catalog already matched before any code here ran.)
// ---------------------------------------------------------------------------
for (const feature of ["advanced_ai", "advanced_analytics", "approvals", "api", "priority_support"]) {
  test(`${feature}: Starter denied, Professional denied, Business/Business Plus/Enterprise allowed`, () => {
    assert.equal(hasFeature("starter", feature), false);
    assert.equal(hasFeature("professional", feature), false);
    for (const plan of ["business", "business_plus", "enterprise"]) assert.equal(hasFeature(plan, feature), true);
  });
}
for (const feature of ["audit", "custom_roles"]) {
  test(`${feature}: Starter/Professional/Business denied, Business Plus/Enterprise allowed`, () => {
    for (const plan of ["starter", "professional", "business"]) assert.equal(hasFeature(plan, feature), false);
    for (const plan of ["business_plus", "enterprise"]) assert.equal(hasFeature(plan, feature), true);
  });
}
test("no business_intelligence entitlement key was invented -- advanced_analytics remains the sole canonical BI key", () => {
  assert.doesNotMatch(entitlementsSource, /business_intelligence/);
});

// ---------------------------------------------------------------------------
// 2. advanced_analytics: gated ONLY at the real Business Intelligence surface
//    (/vayon/analytics/executive), not at every page containing "analytics".
// ---------------------------------------------------------------------------
test("advanced_analytics: /vayon/analytics/executive (Executive Command Center / executiveBI) is gated and dynamic", () => {
  assert.match(executivePage, /await requireEntitlement\("advanced_analytics"\)/);
  assert.match(executivePage, /FeatureNotEntitledError/);
  assert.match(executivePage, /EntitlementUpgradeRequired/);
  assert.match(executivePage, /export const dynamic = "force-dynamic";/);
});
test("advanced_analytics: no other page was gated -- basic per-module analytics remain available to every tier", () => {
  let output = "";
  try { output = execSync('git grep -l "requireEntitlement(\\"advanced_analytics\\")" -- ":!tests"', { cwd: process.cwd() }).toString(); } catch { output = ""; }
  assert.deepEqual(output.trim().split("\n").filter(Boolean), ["app/vayon/analytics/executive/page.tsx"]);
});
test("advanced_analytics: the root analytics overview and per-domain pages (sales, crm, deals, properties, conversion, communications, workforce) remain ungated", () => {
  for (const path of ["app/vayon/analytics/page.tsx", "app/vayon/analytics/sales/page.tsx", "app/vayon/analytics/crm/page.tsx", "app/vayon/analytics/deals/page.tsx", "app/vayon/analytics/properties/page.tsx", "app/vayon/analytics/conversion/page.tsx", "app/vayon/analytics/communications/page.tsx", "app/vayon/analytics/workforce/page.tsx"]) {
    const source = readFileSync(path, "utf8");
    assert.doesNotMatch(source, /requireEntitlement/, `${path} must remain accessible to every tier`);
  }
});
test("advanced_analytics: only the dedicated executiveBI() aggregation is used by the gated page -- no other caller exists", () => {
  let output = "";
  try { output = execSync('git grep -l "executiveBI(" -- ":!tests"', { cwd: process.cwd() }).toString(); } catch { output = ""; }
  assert.deepEqual(output.trim().split("\n").filter(Boolean).sort(), ["app/vayon/analytics/executive/page.tsx", "features/vayon/analytics-platform/services/analytics.service.ts"].sort());
});

// ---------------------------------------------------------------------------
// 3. advanced_ai: confirmed config-only. No live feature exists; not enforced.
// ---------------------------------------------------------------------------
test("advanced_ai: remains config-only -- no page/action/API enforces it, and the dead FeatureLicensingService mapping is untouched", () => {
  let output = "";
  try { output = execSync('git grep -l "requireEntitlement(\\"advanced_ai\\")" -- ":!tests"', { cwd: process.cwd() }).toString(); } catch { output = ""; }
  assert.equal(output.trim(), "");
  assert.match(featureLicensingService, /feature === "ai_workforce" \? "advanced_ai"/);
});

// ---------------------------------------------------------------------------
// 4. approvals: NOT enforced in this phase. The reachable /vayon/approvals UI
//    exists, but is backed by a shared, non-tenant-scoped, in-memory singleton
//    (GovernanceService) whose own bundled workflow is self-labeled a "draft"
//    "architecture template" -- not real per-tenant customer software, so it
//    is not gated as a paid differentiator. Founder-only approvals are
//    untouched and remain separately protected.
// ---------------------------------------------------------------------------
test("approvals: not enforced -- no page/action/API calls requireEntitlement(\"approvals\") in this phase", () => {
  let output = "";
  try { output = execSync('git grep -l "requireEntitlement(\\"approvals\\")" -- ":!tests"', { cwd: process.cwd() }).toString(); } catch { output = ""; }
  assert.equal(output.trim(), "");
});
test("approvals: GovernanceService is confirmed non-tenant-scoped (module-level singleton, no operationsContext) -- documents why enforcement was withheld", () => {
  assert.match(governanceService, /const repository = new InMemoryGovernanceRepository\(\)/);
  assert.doesNotMatch(governanceService, /operationsContext/);
  assert.doesNotMatch(approvalsPage, /requireEntitlement/);
});
test("founder-only approvals (/vayon/founder/approvals) remain independently protected and untouched", () => {
  assert.match(visibilityPolicy, /id: "founder-approvals", pathPrefix: "\/vayon\/founder", industries: allIndustries, roles: founderRoles/);
});

// ---------------------------------------------------------------------------
// 5. api: gated ONLY at the real personal-access-token create/revoke actions
//    inside /api/security -- every other identity/security action (MFA,
//    password, sessions, devices, org switching) remains available to every
//    tier, and /vayon/developers (documentation only) is untouched.
// ---------------------------------------------------------------------------
test("api: create-token and revoke-token are gated behind requireEntitlement(\"api\") with a 403 + Business-plan message on denial", () => {
  const createIndex = securityRoute.indexOf('case "create-token"');
  const revokeIndex = securityRoute.indexOf('case "revoke-token"');
  const createBlock = securityRoute.slice(createIndex, revokeIndex);
  const revokeBlock = securityRoute.slice(revokeIndex, securityRoute.indexOf('case "switch-organization"'));
  for (const block of [createBlock, revokeBlock]) {
    assert.match(block, /await requireEntitlement\("api"\)/);
    assert.match(block, /FeatureNotEntitledError/);
    assert.match(block, /status: 403/);
    assert.match(block, /Business plan/);
  }
});
test("api: every other /api/security action (mfa, password, sessions, devices, org switch) is NOT gated by the api entitlement", () => {
  for (const action of ['case "enroll-mfa"', 'case "verify-mfa"', 'case "disable-mfa"', 'case "change-password"', 'case "change-email"', 'case "revoke-sessions"', 'case "trust-device"', 'case "remove-device"', 'case "switch-organization"']) {
    const start = securityRoute.indexOf(action);
    assert.ok(start !== -1, `missing ${action}`);
    const nextCaseIndex = securityRoute.indexOf("case ", start + action.length);
    const block = securityRoute.slice(start, nextCaseIndex === -1 ? undefined : nextCaseIndex);
    assert.doesNotMatch(block, /requireEntitlement/, `${action} must remain available regardless of plan`);
  }
});
test("api: /vayon/developers (documentation only) is not gated -- reading API docs is not the paid capability", () => {
  assert.doesNotMatch(developersPage, /requireEntitlement/);
});
test("api: no page/action calls requireEntitlement(\"api\") outside the two token actions in /api/security", () => {
  let output = "";
  try { output = execSync('git grep -l "requireEntitlement(\\"api\\")" -- ":!tests"', { cwd: process.cwd() }).toString(); } catch { output = ""; }
  assert.deepEqual(output.trim().split("\n").filter(Boolean), ["app/api/security/route.ts"]);
});

// ---------------------------------------------------------------------------
// 6. audit: gated at the real customer Organization Activity page, NOT the
//    founder/internal /vayon/admin/audit or /platform/audit tools.
// ---------------------------------------------------------------------------
test("audit: /vayon/settings/activity (Organization Activity) is gated and dynamic", () => {
  assert.match(activityPage, /await requireEntitlement\("audit"\)/);
  assert.match(activityPage, /FeatureNotEntitledError/);
  assert.match(activityPage, /EntitlementUpgradeRequired/);
  assert.match(activityPage, /export const dynamic = "force-dynamic";/);
});
test("audit: founder/internal audit tools (/vayon/admin/audit, /platform/audit) are untouched and remain founder-only", () => {
  assert.doesNotMatch(adminAuditPage, /requireEntitlement/);
  assert.match(visibilityPolicy, /id: "administration", pathPrefix: "\/vayon\/admin", industries: allIndustries, roles: founderRoles/);
  assert.match(visibilityPolicy, /id: "platform", pathPrefix: "\/platform", industries: allIndustries, roles: founderRoles/);
});
test("audit: no page/action calls requireEntitlement(\"audit\") outside the one real customer activity page", () => {
  let output = "";
  try { output = execSync('git grep -l "requireEntitlement(\\"audit\\")" -- ":!tests"', { cwd: process.cwd() }).toString(); } catch { output = ""; }
  assert.deepEqual(output.trim().split("\n").filter(Boolean), ["app/vayon/settings/activity/page.tsx"]);
});

// ---------------------------------------------------------------------------
// 7. custom_roles: confirmed config-only. Only a fixed, hardcoded role catalog
//    exists (no tenant-defined custom role creation anywhere); basic role
//    viewing/assignment pages remain ungated for every tier.
// ---------------------------------------------------------------------------
test("custom_roles: remains config-only -- no page/action enforces it", () => {
  let output = "";
  try { output = execSync('git grep -l "requireEntitlement(\\"custom_roles\\")" -- ":!tests"', { cwd: process.cwd() }).toString(); } catch { output = ""; }
  assert.equal(output.trim(), "");
});
test("custom_roles: the workspace role catalog is a fixed, hardcoded union with no tenant-defined role creation", () => {
  assert.match(workspaceRoleCatalog, /export const workspaceRoleCodes = \[/);
  assert.doesNotMatch(workspaceRoleCatalog, /custom_role|customRole|createRole/i);
  const organizationService = readFileSync("features/platform/organization/services/organization.service.ts", "utf8");
  assert.doesNotMatch(organizationService, /createRole|updateRole|deleteRole|manageRole/i, "no mutation exists to create/edit/delete a tenant-defined role -- changeRole only assigns one of the fixed catalog roles");
  assert.match(organizationService, /async changeRole\(memberId:string,role:OrganizationRole\)/);
});
test("custom_roles: basic role viewing/assignment pages remain available to every tier (not broken by this phase)", () => {
  assert.doesNotMatch(rolesPage, /requireEntitlement/);
  assert.doesNotMatch(permissionsPage, /requireEntitlement/);
  assert.match(rolesPage, /enforcePagePermission\("team_management"\)/, "the existing role/permission check must remain in place");
});

// ---------------------------------------------------------------------------
// 8. priority_support: confirmed contractual/service-only. No software gate.
// ---------------------------------------------------------------------------
test("priority_support: remains a pricing-display label only -- no software behavior exists to gate", () => {
  let output = "";
  try { output = execSync('git grep -l "requireEntitlement(\\"priority_support\\")" -- ":!tests"', { cwd: process.cwd() }).toString(); } catch { output = ""; }
  assert.equal(output.trim(), "");
  const commercialPlatform = readFileSync("features/vayon/billing/components/CommercialPlatform.tsx", "utf8");
  assert.match(commercialPlatform, /priority_support/);
});

// ---------------------------------------------------------------------------
// 9. Founding Professional parity: identical to standard Professional for
//    every Phase C2 key -- plan_code based, no founding-price influence.
// ---------------------------------------------------------------------------
test("Founding Professional resolves identically to standard Professional for every Phase C2 feature", () => {
  for (const feature of ["advanced_ai", "advanced_analytics", "approvals", "api", "priority_support", "audit", "custom_roles"]) assert.equal(hasFeature("professional", feature), false);
  assert.doesNotMatch(entitlementsSource, /founding/i);
});

// ---------------------------------------------------------------------------
// 10. Direct bypass proofs: page/API gates cannot be bypassed by tampered
//     client state -- the server-side check runs before any paid data access.
// ---------------------------------------------------------------------------
test("direct API bypass: create-token is denied before the token is generated when api is not entitled", async () => {
  let tokenCreated = false;
  class FeatureNotEntitledError extends Error {}
  const { POST } = load("app/api/security/route.ts", {
    "@/features/platform/enterprise-security": {
      EnterpriseSecurityService: { production: async () => ({ createToken: async () => { tokenCreated = true; return { id: "x", token: "y", prefix: "z" }; } }) },
    },
    "@/features/vayon/billing/services/require-entitlement": {
      requireEntitlement: async () => { throw new FeatureNotEntitledError("denied"); },
      FeatureNotEntitledError,
    },
    zod: await import("zod"),
  });
  const response = await POST(new Request("https://example.test/api/security", { method: "POST", body: JSON.stringify({ action: "create-token", name: "test", scopes: ["crm.read"] }) }));
  assert.equal(response.status, 403);
  assert.equal(tokenCreated, false, "the token must never be created once the api entitlement is denied");
});
test("direct API bypass: revoke-token is denied before revocation runs when api is not entitled", async () => {
  let tokenRevoked = false;
  class FeatureNotEntitledError extends Error {}
  const { POST } = load("app/api/security/route.ts", {
    "@/features/platform/enterprise-security": {
      EnterpriseSecurityService: { production: async () => ({ revokeToken: async () => { tokenRevoked = true; } }) },
    },
    "@/features/vayon/billing/services/require-entitlement": {
      requireEntitlement: async () => { throw new FeatureNotEntitledError("denied"); },
      FeatureNotEntitledError,
    },
    zod: await import("zod"),
  });
  const response = await POST(new Request("https://example.test/api/security", { method: "POST", body: JSON.stringify({ action: "revoke-token", id: "00000000-0000-0000-0000-000000000000" }) }));
  assert.equal(response.status, 403);
  assert.equal(tokenRevoked, false, "the token must never be revoked once the api entitlement is denied");
});
test("direct API: MFA/password/session actions are unaffected when api entitlement would be denied (different feature, must not cross-block)", async () => {
  let mfaCalled = false;
  const { POST } = load("app/api/security/route.ts", {
    "@/features/platform/enterprise-security": {
      EnterpriseSecurityService: { production: async () => ({ disableMfa: async () => { mfaCalled = true; } }) },
    },
    "@/features/vayon/billing/services/require-entitlement": {
      requireEntitlement: async () => { throw new Error("should never be called for disable-mfa"); },
      FeatureNotEntitledError: class extends Error {},
    },
    zod: await import("zod"),
  });
  const response = await POST(new Request("https://example.test/api/security", { method: "POST", body: JSON.stringify({ action: "disable-mfa", factorId: "abc" }) }));
  assert.equal(response.status, 200);
  assert.equal(mfaCalled, true, "disable-mfa must run normally regardless of the api entitlement");
});
test("direct URL bypass: /vayon/analytics/executive checks advanced_analytics strictly before calling executiveBI() or ExecutiveAIService", () => {
  const entitlementIndex = executivePage.indexOf('requireEntitlement("advanced_analytics")');
  const biIndex = executivePage.indexOf("AnalyticsService.production()");
  const aiIndex = executivePage.indexOf("ExecutiveAIService.production()");
  assert.ok(entitlementIndex !== -1 && biIndex !== -1 && aiIndex !== -1);
  assert.ok(entitlementIndex < biIndex, "the entitlement check must run before the BI aggregation is fetched");
  assert.ok(entitlementIndex < aiIndex, "the entitlement check must run before the AI dashboard is fetched");
});
test("direct URL bypass: /vayon/settings/activity checks audit strictly before calling EnterpriseOrganizationService().snapshot()", () => {
  const entitlementIndex = activityPage.indexOf('requireEntitlement("audit")');
  const snapshotIndex = activityPage.indexOf("new EnterpriseOrganizationService().snapshot()");
  assert.ok(entitlementIndex !== -1 && snapshotIndex !== -1);
  assert.ok(entitlementIndex < snapshotIndex, "the entitlement check must run before the organization snapshot is fetched");
});

// ---------------------------------------------------------------------------
// 11. No regression in previously-enforced families or unrelated systems.
// ---------------------------------------------------------------------------
test("no regression: AI Workforce, Customer Success, and Automation gates are unchanged", () => {
  const aiActions = readFileSync("features/vayon/ai-workforce/actions/ai.actions.ts", "utf8");
  const customerSuccessActions = readFileSync("features/platform/customer-success-workspace/actions/customer-success.actions.ts", "utf8");
  const workflowActions = readFileSync("features/platform/workflows/actions/index.ts", "utf8");
  assert.match(aiActions, /await requireEntitlement\("ai_workforce"\)/);
  assert.match(customerSuccessActions, /await requireEntitlement\("customer_success"\)/);
  assert.match(workflowActions, /await requireEntitlement\("automation"\)/);
});
test("no regression: no pricing, Paddle, founding, or quota file was touched in this phase", () => {
  let output = "";
  try { output = execSync("git status --short -- features/marketing/components/PricingTable.tsx features/platform/commercial-pricing.ts features/vayon/billing/providers", { cwd: process.cwd() }).toString(); } catch { output = ""; }
  assert.equal(output.trim(), "");
});
test("no checkout is triggered by any Phase C2 denial path", () => {
  for (const source of [executivePage, activityPage, securityRoute]) assert.doesNotMatch(source, /checkout\(|paddle\.com|openCheckoutOverlay/i);
});
