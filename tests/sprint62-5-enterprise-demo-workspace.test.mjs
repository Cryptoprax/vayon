import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(path, "utf8");

test("demo provisioning reuses canonical records through deterministic Prime Properties projections", () => {
  const repository = read(
    "features/vayon/demo-experience/repository/aurora-enterprise.repository.ts",
  );
  assert.match(repository, /auroraCompanies/);
  assert.match(repository, /auroraContacts/);
  assert.match(repository, /auroraLeads/);
  assert.match(repository, /auroraDeals/);
  assert.match(repository, /auroraProperties/);
  assert.match(repository, /datasetVersion:\s*"prime-properties-v1"/);
  assert.match(repository, /demoData:\s*true/);
  assert.doesNotMatch(repository, /Math\.random|faker|supabase|fetch\(/);
});
test("sample graph has validated cross links and exceeds requested inventory", () => {
  const crm = read(
      "features/vayon/demo-workspace/crm-network/network.service.ts",
    ),
    sales = read("features/vayon/demo-workspace/sales-operations/records.ts"),
    properties = read(
      "features/vayon/demo-workspace/property-portfolio/properties.ts",
    );
  assert.match(crm, /Orphan Aurora contact/);
  assert.match(crm, /Invalid primary contact/);
  assert.match(sales, /length:300/);
  assert.match(sales, /length:120/);
  assert.match(properties, /apartments|apartment/i);
  for (const type of [
    "luxury-villa",
    "commercial-office",
    "plot",
    "rental-property",
  ])
    assert.match(properties, new RegExp(type));
});
test("enterprise projections cover team workflows AI notifications billing and analytics", () => {
  const source = read(
    "features/vayon/demo-experience/repository/aurora-enterprise.repository.ts",
  );
  for (const role of [
    "CEO",
    "Sales Manager",
    "Sales Executive",
    "Marketing Manager",
    "Operations Manager",
    "Finance Manager",
    "Support Manager",
    "Administrator",
  ])
    assert.match(source, new RegExp(role));
  for (const area of [
    "running",
    "completed",
    "failed",
    "approval_pending",
    "Sales AI",
    "CRM AI",
    "WhatsApp AI",
    "Marketing AI",
    "Executive AI",
    "AI Collaboration Engine",
    "Professional trial",
    "Invoice",
    "Revenue chart",
    "Pipeline value",
    "Lead sources",
    "AI usage",
    "Workflow metrics",
  ])
    assert.match(source, new RegExp(area));
});
test("communications and timeline remain cross-linked deterministic fixtures", () => {
  const source = read(
      "features/vayon/demo-workspace/business-activity/records.ts",
    ),
    meetings = read(
      "features/vayon/demo-workspace/sales-operations/records.ts",
    ),
    timeline = read(
      "features/vayon/demo-workspace/business-activity/timeline.history.ts",
    );
  assert.match(source, /length:600/);
  for (const channel of ["email", "whatsapp", "phone-call", "internal-note"])
    assert.match(source, new RegExp(channel));
  assert.match(meetings, /auroraMeetings/);
  assert.match(source, /dealId:deal\.id/);
  assert.match(source, /leadId:lead\.id/);
  assert.match(timeline, /InMemoryAppendOnlyTimelineStore/);
});
test("demo UI renders enterprise dashboards tour and deterministic lifecycle controls", () => {
  const source = read(
    "features/vayon/demo-experience/components/DemoExperience.tsx",
  );
  for (const tab of [
    "team",
    "workflows",
    "ai",
    "notifications",
    "billing",
    "analytics",
    "calendar",
    "tasks",
    "founder",
  ])
    assert.match(source, new RegExp(`"${tab}"`));
  for (const action of ["Reset Demo", "Reload Demo", "Generate New Demo"])
    assert.match(source, new RegExp(action));
  assert.match(source, /Start tour/);
  assert.match(source, /Demo Mode — Changes are not saved/);
  assert.match(source, /setTab\("dashboard"\)/);
});
test("observability follows provider service boundaries and tracks required engagement", () => {
  const provider = read(
      "features/vayon/demo-experience/providers/browser-demo-observability.provider.ts",
    ),
    service = read(
      "features/vayon/demo-experience/services/demo-observability.service.ts",
    );
  assert.match(provider, /sessionStorage/);
  for (const signal of ["launches", "resets", "tourCompletions", "pageViews"])
    assert.match(provider, new RegExp(signal));
  for (const method of ["launch", "view", "reset", "completeTour"])
    assert.match(service, new RegExp(method));
  assert.doesNotMatch(provider, /cookie|email|userId/);
});
test("public demo remains isolated read-only and recommendation governed", () => {
  const ui = read(
      "features/vayon/demo-experience/components/DemoExperience.tsx",
    ),
    repository = read(
      "features/vayon/demo-experience/repository/aurora-demo.repository.ts",
    ),
    enterprise = read(
      "features/vayon/demo-experience/repository/aurora-enterprise.repository.ts",
    );
  assert.match(ui, /Demo Workspace/);
  assert.match(ui, /No production information/);
  assert.match(ui, /event\.preventDefault/);
  assert.match(repository, /readOnly:\s*true/);
  assert.match(enterprise, /recommendation|approval_pending/);
  assert.doesNotMatch(
    [repository, enterprise].join("\n"),
    /client\.from\(|insert\(|update\(|delete\(/,
  );
});
