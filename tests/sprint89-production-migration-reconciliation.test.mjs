import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("production catalog audit is transactionally read only and fail closed", () => {
  const audit = read("scripts/audit-production-database.mjs");
  assert.match(audit, /BEGIN TRANSACTION READ ONLY/);
  assert.match(audit, /ROLLBACK/);
  assert.match(audit, /Fail closed/);
  assert.doesNotMatch(audit, /supabase db push|migration repair --status/);
});

test("reconciliation report records every local migration classification", () => {
  const report = read("docs/PRODUCTION_DATABASE_RECONCILIATION.md");
  const migrations = [...report.matchAll(/`(20\d{12}_[^`]+\.sql)`/g)].map((match) => match[1]);
  assert.equal(new Set(migrations).size, 36);
  for (const status of ["Already represented", "Partially represented", "Missing", "Conflicting"])
    assert.match(report, new RegExp(status));
});

test("history initialization and destructive replay remain blocked", () => {
  const report = read("docs/PRODUCTION_DATABASE_RECONCILIATION.md");
  assert.match(report, /do not create, initialize, or repair history yet/i);
  assert.match(report, /Do not run `db push`/);
  assert.match(report, /No executable reconciliation SQL is approved/);
  assert.match(report, /production clone/i);
});

test("report covers schema storage realtime security and recovery", () => {
  const report = read("docs/PRODUCTION_DATABASE_RECONCILIATION.md");
  for (const value of ["77 public tables", "1,045", "RLS", "Storage API", "supabase_realtime", "Deployment order", "Rollback strategy", "point-in-time"])
    assert.match(report, new RegExp(value));
});
