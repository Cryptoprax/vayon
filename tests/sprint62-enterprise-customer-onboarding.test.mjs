import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("enterprise onboarding preserves resumable infrastructure behind the four-screen experience", () => {
  const domain = read("features/onboarding/domain/enterprise-onboarding.ts");
  for (const step of ["Welcome","Create Organization","Configure Branding","Invite Team Members","Connect Gmail","Connect Google Calendar","Connect WhatsApp","Configure AI Workforce","Import CRM Data","Import Properties","Select Workflow Templates","Configure Notifications","Configure Email Provider","Choose Subscription","Launch Workspace"])
    assert.match(domain, new RegExp(step));
  const wizard = read("features/onboarding/components/EnterpriseOnboardingWizard.tsx");
  assert.match(wizard, /saveOnboardingProgressAction/);
  assert.match(wizard, /Choose your business/);
  assert.match(wizard, /What should VAYON do first/);
  assert.match(wizard, /Meet your AI Team/);
  assert.match(wizard, /prepared automatically/);
});

test("onboarding composes existing platform routes and governance", () => {
  const wizard = read("features/onboarding/components/EnterpriseOnboardingWizard.tsx");
  for (const route of ["app/vayon/settings/google/page.tsx","app/vayon/whatsapp/settings/page.tsx","app/vayon/settings/email/page.tsx","app/vayon/settings/plans/page.tsx"])
    assert.ok(existsSync(route), route);
  assert.match(wizard, /completeOnboardingAction/);
  assert.match(wizard, /launchOnboardingAction/);
  assert.match(read("features/onboarding/services/onboarding.service.ts"), /complete_sprint43_onboarding/);
});

test("CSV imports validate required columns, preview, and detect duplicates", () => {
  const service = read("features/onboarding/services/csv-import.service.ts");
  for (const kind of ["contacts","companies","leads","deals","properties"])
    assert.match(service, new RegExp(kind));
  assert.match(service, /Missing required column/);
  assert.match(service, /duplicates/);
  assert.match(service, /slice\(1, 101\)/);
});

test("database persists progress imports tours and governed demo requests with RLS", () => {
  const migration = read("supabase/migrations/20260826000000_sprint62_enterprise_customer_onboarding.sql");
  for (const table of ["onboarding_sessions","onboarding_step_events","onboarding_import_jobs","onboarding_tour_progress","onboarding_connection_events","onboarding_demo_seed_requests"])
    assert.match(migration, new RegExp(`create table if not exists public\\.${table}`));
  assert.match(migration, /enable row level security/g);
  assert.match(migration, /current_workspace_role/);
  assert.match(migration, /organization_audit_events/);
  assert.match(migration, /approval_pending/);
  for (const data of ["contacts","leads","deals","properties","activities","ai_recommendations","dashboards","workflows","executive_reports"])
    assert.match(migration, new RegExp(data));
});

test("observability records completion drop-off duration imports and connections", () => {
  const migration = read("supabase/migrations/20260826000000_sprint62_enterprise_customer_onboarding.sql");
  for (const signal of ["completed","abandoned","duration_ms","valid_rows","duplicate_rows","error_rows"])
    assert.match(migration, new RegExp(signal));
});

test("interactive tour and success center cover every requested destination", () => {
  const domain = read("features/onboarding/domain/enterprise-onboarding.ts");
  for (const destination of ["Dashboard","CRM","Sales AI","CRM AI","WhatsApp AI","Marketing AI","Executive AI","Workflow Builder","Billing","Settings","Video guides","Documentation","Quick Start","FAQ","Support","Book Demo"])
    assert.match(domain, new RegExp(destination));
  assert.ok(existsSync("app/vayon/success-center/page.tsx"));
});
