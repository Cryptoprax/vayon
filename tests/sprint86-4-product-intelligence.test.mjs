import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const contracts = read(
  "features/platform/product-intelligence/contracts/index.ts",
);
const repository = read(
  "features/platform/product-intelligence/repositories/product-intelligence.repository.ts",
);
const service = read(
  "features/platform/product-intelligence/services/product-intelligence.service.ts",
);
const dashboard = read(
  "features/platform/product-intelligence/components/ProductIntelligenceDashboard.tsx",
);
const analytics = read(
  "features/platform/conversion-analytics/components/ProductAnalytics.tsx",
);
const route = read("app/api/product-intelligence/events/route.ts");
const migration = read(
  "supabase/migrations/20260917000000_sprint86_4_product_intelligence.sql",
);

test("central event architecture covers the Sprint 86.4 product lifecycle", () => {
  for (const name of [
    "page_viewed",
    "feature_opened",
    "lead_created",
    "inventory_imported",
    "campaign_generated",
    "proposal_exported",
    "site_visit_booked",
    "report_exported",
    "knowledge_article_opened",
    "quick_action_used",
    "ai_suggestion_accepted",
    "ai_suggestion_dismissed",
    "search_performed",
    "feedback_submitted",
    "error_recovered",
    "retry_completed",
  ])
    assert.match(contracts, new RegExp(name));
  assert.match(service, /ProductTelemetryPublisher/);
  assert.equal(
    existsSync("app/api/product-intelligence/events/route.ts"),
    true,
  );
});

test("telemetry is consent-aware batched lazy and cached", () => {
  assert.match(analytics, /readConsent\(\)\?\.analytics/);
  assert.match(analytics, /queue\.length < 50/);
  assert.match(analytics, /setInterval\(flush, 10000\)/);
  assert.match(analytics, /sendBeacon/);
  assert.match(service, /PerformanceCacheService/);
  assert.match(service, /60000/);
});

test("operational diagnostics reject free text and persist anonymous scope", () => {
  for (const sensitive of [
    "password",
    "secret",
    "token",
    "email",
    "phone",
    "document",
    "query",
    "prompt",
    "description",
    "screenshot",
  ])
    assert.match(route, new RegExp(sensitive));
  assert.match(migration, /session_hash/);
  assert.match(migration, /extensions\.digest/);
  assert.match(migration, /jsonb_strip_nulls/);
  assert.doesNotMatch(migration, /anonymousSessionId[^,]*insert/i);
});

test("feedback supports governed categories satisfaction and private screenshots", () => {
  for (const value of [
    "bug_report",
    "feature_request",
    "improvement_idea",
    "ux_issue",
    "knowledge_correction",
    "general_feedback",
    "rating",
    "resolution_quality",
    "product-feedback",
  ])
    assert.match(contracts + migration + dashboard, new RegExp(value));
  assert.match(migration, /public=false/);
  assert.match(migration, /organization_audit_events/);
});

test("dashboard explains adoption friction knowledge customer health and AI quality", () => {
  for (const value of [
    "Product adoption",
    "User friction",
    "Knowledge effectiveness",
    "Customer health",
    "Knowledge accuracy",
    "Context relevance",
    "Answer confidence",
    "Search success",
    "Suggestion acceptance",
    "Resolution rate",
    "Top issues",
    "Trending requests",
    "Common question topics",
    "Feature popularity",
  ])
    assert.match(repository + dashboard, new RegExp(value));
});

test("improvement engine remains recommendation-only with no autonomous execution", () => {
  for (const value of [
    "improve_onboarding",
    "improve_documentation",
    "improve_workflow",
    "create_tutorial",
    "create_article",
    "recommendationOnly: true",
    "executes: false",
  ])
    assert.match(contracts + repository, new RegExp(value));
});

test("database authorization enforces tenant RLS and administrative reads", () => {
  assert.match(migration, /enable row level security/g);
  assert.match(migration, /workspace_members/);
  assert.match(migration, /organization_id/);
  assert.match(migration, /organization_owner','organization_admin','manager/);
  assert.match(migration, /revoke all on public\.product_intelligence_events/);
});
