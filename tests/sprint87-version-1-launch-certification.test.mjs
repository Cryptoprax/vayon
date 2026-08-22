import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { result as migrationAudit } from "../scripts/audit-version-1-readiness.mjs";
import { groups as environmentGroups } from "../scripts/audit-production-environment.mjs";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const certification = read("docs/VAYON_VERSION_1_CERTIFICATION.md");
const checklist = read("docs/VERSION_1_LAUNCH_CHECKLIST.md");
const runbook = read("docs/OPERATIONS_RUNBOOK.md");
const backups = read("docs/BACKUP_AND_RECOVERY_RUNBOOK.md");
const health = read(
  "features/platform/deployment/providers/platform-health.provider.ts",
);
const deployment = read(
  "features/platform/deployment/components/DeploymentDashboard.tsx",
);
const launch = read(
  "features/platform/launch-readiness/services/launch-readiness.service.ts",
);
const demo = read(
  "features/vayon/demo-experience/components/DemoExperience.tsx",
);
const demoRepository = read(
  "features/vayon/demo-experience/repository/aurora-demo.repository.ts",
);

test("Version 1.0 certification covers every commercial platform surface", () => {
  for (const surface of [
    "Application",
    "Database",
    "Security",
    "AI",
    "Billing",
    "Communications",
    "Creative Studio",
    "Growth Studio",
    "Knowledge Platform",
    "Continuous Learning",
    "Product Intelligence",
  ])
    assert.match(certification, new RegExp(surface));
  assert.match(certification, /CONDITIONAL/);
  assert.match(certification, /does not claim/i);
});

test("migration certification detects ordering duplicates RLS RPC storage indexes and policies", () => {
  assert.equal(migrationAudit.duplicateVersions.length, 0);
  assert.equal(migrationAudit.malformed.length, 0);
  assert.equal(migrationAudit.outOfOrder.length, 0);
  assert.equal(migrationAudit.missingLatest.length, 0);
  assert.ok(migrationAudit.rlsTables > 0);
  assert.ok(migrationAudit.rpcCalls > 0);
  assert.ok(migrationAudit.storageBuckets.length > 0);
  assert.ok(migrationAudit.indexes > 0);
  assert.ok(migrationAudit.policies > 0);
});

test("production environment verification covers every required provider without values", () => {
  for (const group of [
    "application",
    "supabase",
    "openai",
    "stripe",
    "razorpay",
    "google_workspace",
    "email",
    "whatsapp",
    "monitoring",
  ])
    assert.ok(environmentGroups[group]);
  const source = read("scripts/audit-production-environment.mjs");
  assert.doesNotMatch(source, /console\.log\([^)]*process\.env\[/);
});

test("one existing deployment dashboard exposes unified launch health", () => {
  for (const component of [
    "application",
    "database",
    "openai",
    "stripe",
    "razorpay",
    "email",
    "google_workspace",
    "google_calendar",
    "whatsapp",
    "storage",
    "workflow",
    "notifications",
    "knowledge",
    "queues",
    "background_jobs",
  ])
    assert.match(health, new RegExp(`"${component}"`));
  for (const value of [
    "Environment",
    "Version",
    "Build",
    "Commit SHA",
    "Deployment time",
    "Migration status",
    "Provider and platform health",
  ])
    assert.match(deployment, new RegExp(value));
});

test("operational and recovery runbooks cover deployment rollback incidents rotation migration and restore", () => {
  for (const value of [
    "Deployment and migration process",
    "Application rollback",
    "Incident response",
    "Database restore",
    "Key rotation",
    "disaster recovery",
  ])
    assert.match(
      (runbook + backups).toLowerCase(),
      new RegExp(value.toLowerCase()),
    );
  for (const value of [
    "daily",
    "point-in-time",
    "checksum",
    "isolated",
    "recovery validation",
  ])
    assert.match(backups.toLowerCase(), new RegExp(value));
});

test("launch checklist includes commercial infrastructure and operational sign-off", () => {
  for (const value of [
    "Domain",
    "DNS",
    "SSL",
    "Google Workspace",
    "SPF",
    "DKIM",
    "DMARC",
    "Stripe live",
    "Razorpay live",
    "OpenAI billing",
    "Supabase production",
    "Monitoring",
    "alerts",
    "analytics",
    "Support email",
  ])
    assert.match(checklist.toLowerCase(), new RegExp(value.toLowerCase()));
  assert.match(launch, /Continuous Learning/);
  assert.match(launch, /Product Intelligence/);
});

test("investor tours reuse only the isolated read-only Aurora demo", () => {
  assert.match(demo, /Investor tours/);
  assert.match(demo, /Read-only demo/);
  assert.match(demo, /Seeded, isolated fixtures/);
  assert.match(demoRepository, /AuroraDemoRepository/);
  assert.match(demoRepository, /seeded-json-fixtures/);
  assert.doesNotMatch(
    demoRepository,
    /createSupabase|operationsContext|\.from\(["']/,
  );
});

test("Sprint 87 introduces certification artifacts rather than a product module", () => {
  for (const artifact of [
    "docs/VAYON_VERSION_1_CERTIFICATION.md",
    "docs/VERSION_1_LAUNCH_CHECKLIST.md",
    "docs/BACKUP_AND_RECOVERY_RUNBOOK.md",
    "docs/VERSION_1_PERFORMANCE_REPORT.md",
    "scripts/audit-version-1-readiness.mjs",
    "scripts/audit-production-environment.mjs",
    "scripts/audit-version-1-performance.mjs",
  ])
    assert.equal(existsSync(artifact), true);
  assert.equal(existsSync("features/platform/version-1"), false);
});
