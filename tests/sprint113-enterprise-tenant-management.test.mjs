import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("tenant center is Founder-only and fails closed", async () => {
  const [route, service] = await Promise.all([
    read("app/platform/founder/tenants/page.tsx"),
    read("features/platform/tenant-management/services/tenant-management.service.ts"),
  ]);
  assert.match(route, /FounderAccessError/);
  assert.match(route, /notFound\(\)/);
  assert.match(service, /founderContext\(\)/);
});

test("tenant service reuses authoritative platform services", async () => {
  const source = await read("features/platform/tenant-management/services/tenant-management.service.ts");
  for (const contract of ["CustomerRepository", "CustomerGrowthService", "FounderService"]) assert.match(source, new RegExp(contract));
  assert.doesNotMatch(source, /new Stripe|new OpenAI|fetch\(/);
});

test("all required lifecycle states and tenant evidence are represented", async () => {
  const source = await read("features/platform/tenant-management/services/tenant-management.service.ts");
  for (const state of ["trial", "active", "past_due", "suspended", "cancelled", "archived"]) assert.match(source, new RegExp(`"${state}"`));
  for (const field of ["aiTokens", "apiUsage", "storageBytes", "workflowExecutions", "knowledgeUsage", "marketingUsage", "salesUsage", "customerSuccessUsage", "creativeUsage"]) assert.match(source, new RegExp(field));
});

test("missing tenant measurements stay explicitly unavailable", async () => {
  const [service, component] = await Promise.all([
    read("features/platform/tenant-management/services/tenant-management.service.ts"),
    read("features/platform/tenant-management/components/TenantManagementCenter.tsx"),
  ]);
  assert.match(service, /integrations: null/);
  assert.match(service, /storageBytes: null/);
  assert.match(component, /Unavailable — no authoritative tenant measurement/);
});

test("sensitive tenant operations require confirmation and delegate", async () => {
  const source = await read("features/platform/tenant-management/services/tenant-management.service.ts");
  for (const action of ["Suspend tenant", "Reactivate tenant", "Reset onboarding", "Transfer ownership", "Export metadata", "Trigger health review", "View audit history"]) assert.match(source, new RegExp(action));
  assert.match(source, /confirmationRequired: true/);
  assert.doesNotMatch(source, /\.update\(|\.delete\(|\.insert\(/);
});

test("tenant UI provides search filtering audit provisioning and responsive loading", async () => {
  const [component, loading] = await Promise.all([
    read("features/platform/tenant-management/components/TenantManagementCenter.tsx"),
    read("app/platform/founder/tenants/loading.tsx"),
  ]);
  for (const label of ["Founder tenant center", "Usage analytics", "Provisioning engine", "Audit center", "Founder operations", "SaaS observability"]) assert.match(component, new RegExp(label));
  assert.match(component, /role="search"/);
  assert.match(component, /overflow-x-auto/);
  assert.match(loading, /aria-busy="true"/);
});

test("tenant center is registered in Founder navigation and documented", async () => {
  const [navigation, documentation] = await Promise.all([
    read("features/platform/founder/components/FounderDashboard.tsx"),
    read("docs/ENTERPRISE_TENANT_MANAGEMENT.md"),
  ]);
  assert.match(navigation, /\/platform\/founder\/tenants/);
  assert.match(documentation, /No live provider was connected/);
  assert.match(documentation, /No deployment or commit/);
});

test("Sprint 113 does not alter protected SQL surfaces", async () => {
  const source = await read("features/platform/tenant-management/services/tenant-management.service.ts");
  assert.doesNotMatch(source, /supabase\/reconciliation|supabase\/migrations|migration history/i);
});
