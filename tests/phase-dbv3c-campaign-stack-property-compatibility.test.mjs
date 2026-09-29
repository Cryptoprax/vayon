import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

// DBV3C regression test.
//
// DBV4 (real, read-only Production inspection) found that
// 20261123000000_campaign_strategist.sql (C2),
// 20261124000000_campaign_creative_packages.sql (C3),
// 20261125000000_campaign_image_generation.sql (C4) and
// 20261127000000_campaign_meta_lead_forms.sql (C6) all reference
// `property_project_id` -- the column DBV3B's compatibility migration
// deliberately does NOT create on Production (Production keeps
// `project_id` as the live Model-B column, so an app rollback never needs
// a DB change). Applying C2/C3/C4/C6 verbatim against Production would
// fail with "column property_project_id does not exist".
//
// 20261201000000_campaign_stack_property_compatibility.sql is a separate,
// additive, shape-aware migration (none of C1/C2/C3/C4/C6 are modified)
// that reproduces the schema and function effects of C2/C3/C4/C6 for
// Production's compatibility shape, using project_id wherever those files
// use property_project_id. It reuses DBV3B's own two-shape detection
// (post_c1 / compatibility) since it only ever runs after DBV3B has
// already established one of them.
//
// EXACT DEPENDENCY SURFACE (verified by reading all four historical files
// in full): campaign_strategy_versions, campaign_creative_packages and
// campaign_lead_forms carry ONLY the canonical property_id column -- none
// of them has its own project_id/property_project_id column. The only
// property_project_id references anywhere in C2/C3/C4/C6 are one line
// each in save_campaign_strategy_version, save_campaign_creative_package
// and save_campaign_lead_form_draft (a denormalized value carried into a
// creative_timeline insert), plus enqueue_campaign_image_generation and
// complete_creative_generation (which read/write the Model-B column on
// creative_generation_jobs/creative_assets/creative_timeline directly,
// since C1 renamed it there). Every other function in all four files has
// zero project/property_project reference and needed no adaptation.
//
// STRATEGY CHOSEN: (B) -- project_id remains the sole Model-B column
// during Production compatibility; this migration authors Production-
// specific equivalents of the five affected functions rather than adding
// a second, independently-writable Model-B column or performing the
// deferred rename early. No RPC signature changes -- none of the five
// affected functions ever accepted a project/propertyProject parameter
// from the caller; the linkage is always server-side denormalization from
// the parent creative_campaigns row.
//
// Real-Postgres validation performed for this phase (disposable local
// Supabase instances, not committed): (1) a full fresh 82-migration
// replay (post_c1 shape) confirming this migration is a no-op for C2/C3/
// C4/C6 there, with the fresh shape unregressed (property_id +
// property_project_id, no project_id) and DBV1E's ACL hardening on
// complete_creative_generation intact; (2) a separately-constructed
// Production-path simulation (migrations only through 20261121, then
// DBV3B, then this file -- raw C1/C2/C3/C4/C6 never applied) producing a
// working compatibility schema (property_id + project_id, no
// property_project_id); (3) a full synthetic end-to-end campaign flow on
// the compatibility shape -- draft, C2 strategy (save+accept), C3 package
// (save+accept), C4 enqueue+complete (no provider call), asset provenance,
// C6 mocked lead-form workflow (no Meta call), campaign advance -- for
// both a property-only campaign and a property+project campaign, with
// correct attribution and no substitution between the two ids; (4) five
// cross-tenant attack attempts (mismatched propertyId/propertyProjectId
// tenants; cross-tenant strategy/package/generation/lead-form operations
// against another tenant's campaign), all correctly rejected.

const migration = readFileSync("supabase/migrations/20261201000000_campaign_stack_property_compatibility.sql", "utf8");
const sql = migration.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
const c1 = readFileSync("supabase/migrations/20261122000000_creative_campaign_property_alignment.sql", "utf8");
const c2 = readFileSync("supabase/migrations/20261123000000_campaign_strategist.sql", "utf8");
const c3 = readFileSync("supabase/migrations/20261124000000_campaign_creative_packages.sql", "utf8");
const c4 = readFileSync("supabase/migrations/20261125000000_campaign_image_generation.sql", "utf8");
const c6 = readFileSync("supabase/migrations/20261127000000_campaign_meta_lead_forms.sql", "utf8");

const POST_C1_START = sql.indexOf("if v_shape = 'post_c1' then");
const COMPAT_START = sql.indexOf("if v_shape = 'compatibility' then");
const postC1Block = sql.slice(POST_C1_START, COMPAT_START);
const compatBlock = sql.slice(COMPAT_START);

test("1: fresh post-C1 shape (post_c1) is recognized and produces a no-op -- C2/C3/C4/C6 already correct", () => {
  assert.match(postC1Block, /raise notice 'DBV3C: post_c1 shape detected/);
  assert.doesNotMatch(postC1Block, /create or replace function|create table/i);
});

test("2: Production compatibility shape is recognized and drives schema/function creation", () => {
  assert.match(compatBlock, /create table if not exists public\.campaign_strategy_versions/);
  assert.match(compatBlock, /create table if not exists public\.campaign_creative_packages/);
  assert.match(compatBlock, /create table if not exists public\.campaign_lead_forms/);
});

test("3: unknown/inconsistent shape is rejected -- fails closed, no guessing", () => {
  assert.match(sql, /raise exception 'DBV3C: unrecognized creative_campaigns schema shape/);
});

test("4: raw C2 is not required on the Production path -- this migration reproduces save/accept_campaign_strategy_version", () => {
  assert.match(compatBlock, /create or replace function public\.save_campaign_strategy_version\(/);
  assert.match(compatBlock, /create or replace function public\.accept_campaign_strategy_version\(/);
});

test("5: raw C3 is not required -- this migration reproduces save/accept_campaign_creative_package", () => {
  assert.match(compatBlock, /create or replace function public\.save_campaign_creative_package\(/);
  assert.match(compatBlock, /create or replace function public\.accept_campaign_creative_package\(/);
});

test("6: raw C4 is not required -- this migration reproduces the linkage columns, indexes, enqueue and complete functions", () => {
  assert.match(compatBlock, /alter table public\.creative_generation_jobs add column if not exists creative_package_id/);
  assert.match(compatBlock, /alter table public\.creative_assets add column if not exists generation_job_id/);
  assert.match(compatBlock, /create or replace function public\.enqueue_campaign_image_generation\(/);
  assert.match(compatBlock, /create or replace function public\.complete_creative_generation\(/);
});

test("7: raw C6 is not required -- this migration reproduces the full campaign_lead_forms workflow", () => {
  for (const fn of ["save_campaign_lead_form_draft", "claim_campaign_lead_form_creation", "complete_campaign_lead_form_creation", "mark_campaign_lead_form_mapped", "mark_campaign_lead_form_mapping_failed", "mark_campaign_lead_form_consent_configured", "mark_campaign_lead_form_consent_failed", "flag_stale_campaign_lead_form_creations"]) {
    assert.match(compatBlock, new RegExp(`create or replace function public\\.${fn}\\(`));
  }
});

test("8: C2 equivalence -- save_campaign_strategy_version uses project_id, not property_project_id, in the compatibility branch", () => {
  const start = compatBlock.indexOf("create or replace function public.save_campaign_strategy_version");
  const end = compatBlock.indexOf("create or replace function public.accept_campaign_strategy_version");
  const body = compatBlock.slice(start, end);
  assert.match(body, /c\.project_id/);
  assert.doesNotMatch(body, /property_project_id/);
});

test("9: C3 equivalence -- save_campaign_creative_package uses project_id, and re-validates the accepted-strategy/property-match rules verbatim", () => {
  const start = compatBlock.indexOf("create or replace function public.save_campaign_creative_package");
  const end = compatBlock.indexOf("create or replace function public.accept_campaign_creative_package");
  const body = compatBlock.slice(start, end);
  assert.match(body, /c\.project_id/);
  assert.doesNotMatch(body, /property_project_id/);
  assert.match(body, /strategy version does not belong to this campaign/);
  assert.match(body, /strategy version is not accepted/);
  assert.match(body, /strategy version property does not match campaign property/);
});

test("10: C4 equivalence -- enqueue/complete use project_id, preserve extensions.gen_random_bytes(16), and propagate creative_package_id/creative_brief_id/generation_job_id", () => {
  const start = compatBlock.indexOf("create or replace function public.enqueue_campaign_image_generation");
  const end = compatBlock.indexOf("-- ---- C6:");
  const body = compatBlock.slice(start, end);
  assert.doesNotMatch(body, /\bproperty_project_id\b/);
  assert.match(body, /extensions\.gen_random_bytes\(16\)/);
  assert.match(body, /creative_package_id,creative_brief_id,generation_job_id/);
  assert.match(body, /an accepted creative package is required/);
});

test("11: C6 equivalence -- save_campaign_lead_form_draft uses project_id; governance/status functions are untouched and Meta-call-free", () => {
  const start = compatBlock.indexOf("create or replace function public.save_campaign_lead_form_draft");
  const end = compatBlock.indexOf("create or replace function public.claim_campaign_lead_form_creation");
  const body = compatBlock.slice(start, end);
  assert.match(body, /c\.project_id/);
  assert.doesNotMatch(body, /property_project_id/);
  assert.match(compatBlock, /an accepted campaign strategy is required/);
  assert.match(compatBlock, /an accepted creative package is required/);
  assert.match(compatBlock, /a connected Meta Marketing Page is required/);
  assert.doesNotMatch(sql, /graph\.facebook|fetch\(|https?:\/\//i);
});

test("12/13: no dual source of truth -- the three new tables carry only property_id, never a second Model-B column", () => {
  for (const table of ["campaign_strategy_versions", "campaign_creative_packages", "campaign_lead_forms"]) {
    const tableDef = compatBlock.slice(compatBlock.indexOf(`create table if not exists public.${table}(`), compatBlock.indexOf(`create table if not exists public.${table}(`) + 2500);
    const createSection = tableDef.slice(0, tableDef.indexOf(");"));
    assert.doesNotMatch(createSection, /\bproject_id\b|\bproperty_project_id\b/, `${table} must not carry a second Model-B column`);
    assert.match(createSection, /property_id uuid not null references public\.properties\(id\)/);
  }
});

test("14: idempotency -- every DDL statement in the compatibility branch uses IF NOT EXISTS/IF EXISTS/CREATE OR REPLACE, safe to re-run", () => {
  assert.doesNotMatch(compatBlock, /create table public\./);
  assert.doesNotMatch(compatBlock, /create index (?!if not exists)/);
  const policyCreates = compatBlock.match(/create policy "[^"]+" on public\.\w+/g) ?? [];
  for (const stmt of policyCreates) {
    const policyName = stmt.match(/"([^"]+)"/)[1];
    assert.match(compatBlock, new RegExp(`drop policy if exists "${policyName}"`));
  }
});

test("15: SECURITY DEFINER and search_path=public preserved on every redefined function", () => {
  const defs = compatBlock.match(/create or replace function public\.\w+\([^)]*\)[^;]*?as \$function\$/gs) ?? [];
  assert.equal(defs.length, 14, "expected all 14 C2/C3/C4/C6 functions to be redefined in the compatibility branch");
  for (const def of defs) {
    assert.match(def, /security definer/);
    assert.match(def, /set search_path\s*=\s*public/);
  }
});

test("16: service-role guards preserved on complete_creative_generation and flag_stale_campaign_lead_form_creations", () => {
  assert.match(compatBlock, /complete_creative_generation[\s\S]*?current_setting\('role',true\)<>'service_role'/);
  assert.match(compatBlock, /flag_stale_campaign_lead_form_creations[\s\S]{0,400}current_setting\('role',true\)<>'service_role'/);
});

test("17: historical C1/C2/C3/C4/C6 files are never modified by this migration and remain the fresh-database path", () => {
  for (const historical of [c1, c2, c3, c4, c6]) {
    assert.doesNotMatch(historical, /DBV3C|campaign_stack_property_compatibility/i);
  }
});

test("18: no provider call anywhere in this migration -- Meta/OpenAI/Sora/WhatsApp/Paddle safety", () => {
  assert.doesNotMatch(sql, /graph\.facebook|api\.openai|sora|whatsapp\.com|paddle\.com|fetch\(|https?:\/\//i);
});

test("19: this migration never touches Production migration history (no db push / migration repair / schema_migrations / deployment_migration_history statements)", () => {
  assert.doesNotMatch(sql, /supabase_migrations\.schema_migrations|deployment_migration_history|db push|migration repair/i);
});

test("20: migration count, timestamp uniqueness, and this file is present", () => {
  // Not asserted: that 20261201000000 remains the newest migration overall --
  // that was only ever true at the moment DBV3C was authored, and breaks the
  // instant any later phase legitimately adds a migration with a greater
  // timestamp (as WAVE5A's 20261202000000 does). What this test durably
  // guarantees instead: no two migrations share a timestamp, and DBV3C's own
  // file is present in the directory.
  const files = readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql"));
  const timestamps = files.map((f) => f.slice(0, 14));
  assert.equal(new Set(timestamps).size, timestamps.length, "no duplicate migration timestamps");
  assert.ok(files.includes("20261201000000_campaign_stack_property_compatibility.sql"));
});

test("21: this migration is wrapped in begin/commit for whole-file atomicity", () => {
  assert.match(sql, /^begin;/m);
  assert.match(sql, /^commit;\s*$/m);
});

test("22: ALTER TABLE additions for C4 linkage are purely additive (IF NOT EXISTS) and never touch project_id/property_project_id columns", () => {
  const alters = compatBlock.match(/alter table public\.(creative_generation_jobs|creative_assets) add column if not exists \w+/g) ?? [];
  assert.ok(alters.length >= 5, "expected creative_package_id/creative_brief_id (x2 tables) + generation_job_id");
  assert.doesNotMatch(compatBlock, /alter table public\.(creative_generation_jobs|creative_assets) alter column (project_id|property_project_id)/);
});
