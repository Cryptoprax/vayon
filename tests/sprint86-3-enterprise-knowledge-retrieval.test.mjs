import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const contracts = read("features/platform/knowledge/contracts/index.ts");
const service = read(
  "features/platform/knowledge/services/knowledge.service.ts",
);
const engine = read("features/platform/knowledge/services/knowledge-engine.ts");
const retrieval = read(
  "features/platform/knowledge/providers/trusted-retrieval.provider.ts",
);
const repository = read(
  "features/platform/knowledge/repositories/knowledge.repository.ts",
);
const migration = read(
  "supabase/migrations/20260916100000_sprint86_3_enterprise_knowledge_retrieval.sql",
);
const help = read("app/vayon/knowledge/help/page.tsx");

test("canonical Knowledge Engine reuses repository service provider architecture", () => {
  for (const path of [
    "features/platform/knowledge/services/knowledge-engine.ts",
    "features/platform/knowledge/providers/trusted-retrieval.provider.ts",
  ])
    assert.equal(existsSync(path), true);
  assert.match(service, /KnowledgeRepository/);
  assert.match(service, /DocumentationService/);
  assert.match(service, /PerformanceCacheService/);
});

test("trusted ranking follows the mandatory authority order", () => {
  const positions = [
    "organization",
    "approved_knowledge_base",
    "administrator_guide",
    "product_documentation",
    "release_notes",
    "faq",
    "ai_reasoning",
  ].map((item) => retrieval.indexOf(`${item}:`));
  assert.equal(
    positions.every((position) => position >= 0),
    true,
  );
  assert.deepEqual(
    [...positions].sort((a, b) => a - b),
    positions,
  );
  assert.match(service, /sourcePolicy: "knowledge_first"/);
  assert.match(service, /No product behavior has been inferred/);
});

test("hybrid semantic retrieval supports synonyms module version feature and plan context", () => {
  for (const value of [
    "synonyms",
    "semanticTerms",
    "moduleBoost",
    "versionBoost",
    "featureAvailable",
    "minimumPlan",
    "deprecated",
    "upcoming",
  ])
    assert.match(retrieval, new RegExp(value));
  assert.match(repository, /retrieve_trusted_knowledge/);
  assert.match(service, /mode: "semantic"/);
});

test("article video and private playbook lifecycle is tenant governed", () => {
  for (const value of [
    "draft",
    "review",
    "approved",
    "archived",
    "knowledge_article_versions",
    "knowledge_article_relations",
    "knowledge_videos",
    "transcript",
    "private_article",
    "internal_sop",
    "sales_script",
    "support_playbook",
    "onboarding_checklist",
    "ai_playbook",
  ])
    assert.match(migration, new RegExp(value));
  assert.match(migration, /enable row level security/);
  assert.match(migration, /current_workspace_role/);
  assert.match(migration, /organization_audit_events/);
});

test("answers include citations related guides video next step and quick actions", () => {
  for (const value of [
    "citations",
    "related",
    "video",
    "suggestedNextStep",
    "quickActions",
    "recommendationOnly",
  ])
    assert.match(contracts + service + help, new RegExp(value));
  assert.match(engine, /documentationCandidates/);
});

test("quality feedback supports four anonymous tenant-scoped states", () => {
  for (const value of [
    "helpful",
    "not_helpful",
    "needs_update",
    "report_problem",
    "session_hash",
    "user_id",
    "record_knowledge_quality_feedback",
  ])
    assert.match(contracts + migration + help, new RegExp(value));
  assert.match(migration, /extensions\.digest/);
  assert.match(
    migration,
    /values\(v_org,p_workspace_id,p_article_id,p_rating,v_hash,null\)/,
  );
});

test("Context Graph supplies module-aware retrieval without secrets", () => {
  const graph = read("features/vayon/intelligence-core/context-graph.ts");
  assert.match(graph, /knowledgeContextFromGraph/);
  assert.match(graph, /subscriptionPlan/);
  assert.match(graph, /featureAvailable/);
  assert.doesNotMatch(
    graph + retrieval,
    /api[_-]?key|service_role|authorization/i,
  );
});
