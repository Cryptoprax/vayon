import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const contracts = read(
  "features/platform/continuous-learning/contracts/index.ts",
);
const repository = read(
  "features/platform/continuous-learning/repositories/continuous-learning.repository.ts",
);
const service = read(
  "features/platform/continuous-learning/services/continuous-learning.service.ts",
);
const dashboard = read(
  "features/platform/continuous-learning/components/ContinuousLearningDashboard.tsx",
);
const actions = read("features/platform/continuous-learning/actions/index.ts");
const migration = read(
  "supabase/migrations/20260918000000_sprint86_5_continuous_learning.sql",
);
const page = read("app/vayon/settings/product-intelligence/page.tsx");

test("continuous learning extends the existing Product Intelligence architecture", () => {
  for (const path of [
    "features/platform/continuous-learning/contracts/index.ts",
    "features/platform/continuous-learning/repositories/continuous-learning.repository.ts",
    "features/platform/continuous-learning/services/continuous-learning.service.ts",
  ])
    assert.equal(existsSync(path), true);
  assert.match(page, /ProductIntelligenceDashboard/);
  assert.match(page, /ContinuousLearningDashboard/);
  assert.match(service, /PerformanceCacheService/);
});

test("organization and user memory cover all governed preference types", () => {
  for (const key of [
    "preferred_terminology",
    "frequent_workflows",
    "favorite_reports",
    "frequent_questions",
    "pinned_knowledge",
    "frequent_campaigns",
    "preferred_proposal_templates",
    "default_property_filters",
    "saved_ai_prompt_templates",
    "support_language",
    "favorite_dashboards",
    "recent_searches",
    "pinned_projects",
    "frequent_ai_prompts",
    "preferred_layouts",
    "notification_preferences",
    "assistant_preferences",
  ])
    assert.match(contracts + migration, new RegExp(key));
  assert.match(migration, /scope='organization' and user_id is null/);
  assert.match(migration, /scope='user' and user_id is not null/);
  assert.match(repository, /row\.user_id === userId/);
});

test("learning uses anonymized trends and bounded incremental evidence", () => {
  for (const value of [
    "Repeated question topics",
    "Successful workflows",
    "Unused capabilities",
    "weeklyChange",
    "monthlyChange",
    "priorMonth",
    "limit(20000)",
    "refresh_continuous_learning_aggregates",
    "incremental_aggregation",
  ])
    assert.match(
      contracts + repository + dashboard + migration,
      new RegExp(value.replace(/[()]/g, "\\$&")),
    );
  assert.doesNotMatch(
    repository,
    /email|phone|password|secret|document_content/i,
  );
});

test("executive intelligence reports requested adoption and operational evidence", () => {
  for (const value of [
    "Product adoption",
    "AI adoption",
    "Feature adoption",
    "Campaign effectiveness",
    "Sales productivity",
    "Operational trends",
    "weekly",
    "monthly",
    "quarterly",
    "customer_success",
    "ai_adoption",
    "knowledge_health",
  ])
    assert.match(repository + contracts + dashboard, new RegExp(value));
});

test("AI quality remains evidence-backed and exposes unavailable freshness", () => {
  for (const value of [
    "Answer accuracy",
    "Context relevance",
    "Retrieval quality",
    "Knowledge freshness",
    "Response usefulness",
    "Resolution rate",
    "Time to resolution",
    "Suggestion acceptance",
    "Unavailable until article review evidence exists",
  ])
    assert.match(repository, new RegExp(value));
});

test("knowledge and product evolution recommendations cannot execute", () => {
  for (const value of [
    "update_article",
    "create_faq",
    "record_tutorial",
    "improve_onboarding",
    "improve_workflow",
    "improve_documentation",
    "recommendationOnly: true",
    "executionAllowed: false",
  ])
    assert.match(contracts + repository, new RegExp(value));
  assert.match(dashboard, /Recommendation only/);
});

test("executive briefings reuse the governed OpenAI workforce and label fallback honestly", () => {
  assert.match(service, /OpenAIWorkforceService/);
  assert.match(service, /summarize\(\s*"executive-ai"/);
  assert.match(service, /result\.provider === "openai"/);
  assert.match(dashboard, /AI-generated/);
  assert.match(dashboard, /Deterministic fallback/);
  assert.match(migration, /executive_intelligence\.briefing_generated/);
});

test("RLS RBAC audit consent and data minimization boundaries are preserved", () => {
  assert.match(migration, /enable row level security/g);
  assert.match(migration, /organization_owner','organization_admin','manager/);
  assert.match(migration, /organization_audit_events/);
  assert.match(migration, /value_count/);
  assert.doesNotMatch(migration, /jsonb_build_object\([^)]*memory_value/i);
  assert.match(actions, /max\(2000\)/);
  assert.match(actions, /slice\(0, 50\)/);
});

test("observability tracks jobs latency evidence failures and audit operations", () => {
  for (const value of [
    "continuous_learning_jobs",
    "knowledge_refresh",
    "briefing_generation",
    "recommendation_generation",
    "failed",
    "latency_ms",
    "failure_code",
    "evidence_count",
    "started_at",
    "completed_at",
  ])
    assert.match(migration, new RegExp(value));
});
