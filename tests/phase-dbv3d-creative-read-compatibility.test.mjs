import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

// DBV3D regression test.
//
// DBV3C found that features/vayon/creative-studio/repository.ts reads
// row.property_project_id directly. Auditing the full read surface for this
// phase (Part 2) found the SAME defect in five more files -- and four of
// them are worse than a silent display gap: they select property_project_id
// by NAME in an explicit PostgREST column list
// (.select("id,property_id,property_project_id[...]")), which returns an
// HTTP 400 ("column does not exist") under Production's compatibility shape
// (DBV3B), where the physical column is project_id, not a silent omission.
//
// Fixed files (read-only; no write path touched):
//   - features/vayon/creative-studio/repository.ts (campaigns, assets)
//   - features/vayon/creative-studio/generation.service.ts (jobs() explicit
//     select; buildAssistantPrompt()'s job.property_project_id, which reads
//     claim_creative_generation's to_jsonb(j) result and therefore reflects
//     whichever physical column name the row actually has)
//   - features/vayon/campaign-strategist/campaign-strategy.service.ts
//     (loadOwnedCampaign)
//   - features/vayon/creative-package/creative-package.service.ts
//     (loadOwnedCampaign)
//   - features/vayon/creative-package/campaign-video-generation.service.ts
//     (loadOwnedCampaign)
//   - features/vayon/creative-studio/growth.service.ts (dashboard)
//
// STRATEGY CHOSEN (Part 5): (D), refined -- every explicit select list that
// named property_project_id was changed to select("*") (matching the
// pattern repository.ts already used safely), which never errors regardless
// of which of the two columns physically exists; the value itself is then
// resolved once as `row.property_project_id ?? row.project_id` (or
// job.property_project_id ?? job.project_id for the claim_creative_
// generation jsonb result) before being exposed under the single,
// unchanged, canonical app-facing field name `propertyProjectId`. No new
// database object, no second source of truth, no runtime schema
// introspection. Rejected (A) shape-aware repository branching -- adds a
// schema round-trip/cache with no benefit over a null-coalescing read.
// Rejected (B) -- DBV3B/DBV3C created no read-abstraction view/RPC to reuse
// (confirmed by reading both migrations again for this phase); inventing
// one now would be a database change for a problem solvable entirely in the
// application layer. Rejected (C) -- a try/select-then-catch/retry pattern
// adds a wasted round trip on every request in one of the two shapes,
// forever, for no benefit over a single "*" select.
//
// No write path was touched: create_creative_campaign_draft's p_input
// payload (repository.ts saveDraft) and every C2/C3/C4/C6 RPC call already
// send `propertyProjectId` as an opaque JSONB key, never a raw column
// reference -- DBV3C already proved server-side handling is correct in both
// shapes; this phase changes nothing about how those calls are made.

const repoSrc = readFileSync("features/vayon/creative-studio/repository.ts", "utf8");
const generationSrc = readFileSync("features/vayon/creative-studio/generation.service.ts", "utf8");
const strategySrc = readFileSync("features/vayon/campaign-strategist/campaign-strategy.service.ts", "utf8");
const packageSrc = readFileSync("features/vayon/creative-package/creative-package.service.ts", "utf8");
const videoSrc = readFileSync("features/vayon/creative-package/campaign-video-generation.service.ts", "utf8");
const growthSrc = readFileSync("features/vayon/creative-studio/growth.service.ts", "utf8");

function fakeClient(table, rows) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    limit: () => chain,
    maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
    single: async () => ({ data: rows[0] ?? null, error: null }),
    then: (resolve) => resolve({ data: rows, error: null }),
  };
  return { from: (t) => (t === table ? chain : fakeClient(t, []).from(t)) };
}

// ---------------------------------------------------------------------------
// PART 7/8/11/12/18: real execution against the actual repository.ts code,
// with rows shaped like each schema state.
// ---------------------------------------------------------------------------
const ORG = "org-1", WS = "ws-1", PROP = "11111111-1111-4111-8111-111111111111", PROJ = "22222222-2222-4222-8222-222222222222";

function campaignRow({ shape, hasProject }) {
  const base = { id: "c1", name: "Campaign", property_id: PROP, status: "draft", payload: {}, brief: {}, created_at: "t", updated_at: "t", created_by: "u1" };
  if (shape === "post_c1") return { ...base, property_project_id: hasProject ? PROJ : null };
  if (shape === "compatibility") return { ...base, project_id: hasProject ? PROJ : null };
  throw new Error("unknown shape");
}
function assetRow({ shape, hasProject }) {
  const base = { id: "a1", campaign_id: "c1", property_id: PROP, name: "Asset", category: "image", format: "Post", platform: "Instagram", language: "English", status: "draft", version: 1, prompt: "p", ai_employee: "AI", edits: [], exports: [], publishing_history: [], generated_at: "t", created_by: "u1" };
  if (shape === "post_c1") return { ...base, property_project_id: hasProject ? PROJ : null };
  if (shape === "compatibility") return { ...base, project_id: hasProject ? PROJ : null };
  throw new Error("unknown shape");
}

async function loadRepo() {
  const mod = load("features/vayon/creative-studio/repository.ts");
  return mod.SupabaseCreativeStudioRepository;
}

test("1: post-C1 campaign read -- property_project_id column resolves to propertyProjectId", async () => {
  const Repo = await loadRepo();
  const repo = new Repo(fakeClient("creative_campaigns", [campaignRow({ shape: "post_c1", hasProject: true })]), ORG, WS);
  const [campaign] = await repo.campaigns();
  assert.equal(campaign.propertyId, PROP);
  assert.equal(campaign.propertyProjectId, PROJ);
  assert.equal(campaign.brief.propertyProjectId, PROJ);
});

test("2: Production compatibility campaign read -- project_id column resolves to propertyProjectId", async () => {
  const Repo = await loadRepo();
  const repo = new Repo(fakeClient("creative_campaigns", [campaignRow({ shape: "compatibility", hasProject: true })]), ORG, WS);
  const [campaign] = await repo.campaigns();
  assert.equal(campaign.propertyId, PROP);
  assert.equal(campaign.propertyProjectId, PROJ);
  assert.equal(campaign.brief.propertyProjectId, PROJ);
});

test("3: post-C1 asset read -- property_project_id column resolves to propertyProjectId", async () => {
  const Repo = await loadRepo();
  const repo = new Repo(fakeClient("creative_assets", [assetRow({ shape: "post_c1", hasProject: true })]), ORG, WS);
  const [asset] = await repo.assets();
  assert.equal(asset.propertyId, PROP);
  assert.equal(asset.propertyProjectId, PROJ);
});

test("4: Production compatibility asset read -- project_id column resolves to propertyProjectId", async () => {
  const Repo = await loadRepo();
  const repo = new Repo(fakeClient("creative_assets", [assetRow({ shape: "compatibility", hasProject: true })]), ORG, WS);
  const [asset] = await repo.assets();
  assert.equal(asset.propertyId, PROP);
  assert.equal(asset.propertyProjectId, PROJ);
});

test("5: property-only campaign -- propertyProjectId is undefined/null under both shapes, never fabricated", async () => {
  const Repo = await loadRepo();
  for (const shape of ["post_c1", "compatibility"]) {
    const repo = new Repo(fakeClient("creative_campaigns", [campaignRow({ shape, hasProject: false })]), ORG, WS);
    const [campaign] = await repo.campaigns();
    assert.equal(campaign.propertyId, PROP);
    assert.equal(campaign.propertyProjectId, undefined);
  }
});

test("6: property+project campaign -- both ids correct and distinct under both shapes", async () => {
  const Repo = await loadRepo();
  for (const shape of ["post_c1", "compatibility"]) {
    const repo = new Repo(fakeClient("creative_campaigns", [campaignRow({ shape, hasProject: true })]), ORG, WS);
    const [campaign] = await repo.campaigns();
    assert.equal(campaign.propertyId, PROP);
    assert.equal(campaign.propertyProjectId, PROJ);
    assert.notEqual(campaign.propertyId, campaign.propertyProjectId);
  }
});

test("7: no property/project id substitution -- a row with only property_project_id set never leaks into propertyId, and vice versa", async () => {
  const Repo = await loadRepo();
  const row = { ...campaignRow({ shape: "compatibility", hasProject: true }) };
  const repo = new Repo(fakeClient("creative_campaigns", [row]), ORG, WS);
  const [campaign] = await repo.campaigns();
  assert.equal(campaign.propertyId, PROP);
  assert.equal(campaign.propertyProjectId, PROJ);
  assert.notEqual(campaign.propertyId, PROJ);
  assert.notEqual(campaign.propertyProjectId, PROP);
});

test("8: provenance fields (creator/createdAt/status) are unaffected by the select(*) change", async () => {
  const Repo = await loadRepo();
  const repo = new Repo(fakeClient("creative_campaigns", [campaignRow({ shape: "compatibility", hasProject: true })]), ORG, WS);
  const [campaign] = await repo.campaigns();
  assert.equal(campaign.status, "draft");
  assert.equal(campaign.creator, "u1");
  assert.equal(campaign.createdAt, "t");
});

// ---------------------------------------------------------------------------
// PART 9/10: static structural verification for the other 5 fix sites and
// the write paths (regex-based, matching this repo's established convention
// for verifying source-level changes without a full DI harness per class).
// ---------------------------------------------------------------------------
test("9: no explicit PostgREST select list names property_project_id alone anywhere in the fixed files (the HTTP 400 risk DBV4 would hit under Production compatibility)", () => {
  for (const src of [repoSrc, generationSrc, strategySrc, packageSrc, videoSrc, growthSrc]) {
    assert.doesNotMatch(src, /\.select\([^)]*property_project_id/);
  }
});

test("10: every previously-hardcoded read site now resolves the Model-B column via a null-coalescing fallback, not a bare property_project_id reference", () => {
  const readSites = [
    [strategySrc, /const propertyProjectId = row\.property_project_id \?\? row\.project_id;/],
    [packageSrc, /const propertyProjectId = row\.property_project_id \?\? row\.project_id;/],
    [videoSrc, /const propertyProjectId = row\.property_project_id \?\? row\.project_id;/],
    [generationSrc, /\(row\.property_project_id \?\? row\.project_id\)/],
    [generationSrc, /const propertyProjectId = job\.property_project_id \?\? job\.project_id,/],
    [growthSrc, /\(row\.property_project_id \?\? row\.project_id\)/],
    [repoSrc, /const v=row\.property_project_id\?\?row\.project_id/],
  ];
  for (const [src, pattern] of readSites) assert.match(src, pattern);
});

test("11: buildAssistantPrompt's downstream property_projects/property_units/property_documents lookups use the resolved fallback value, not the raw job.property_project_id", () => {
  const start = generationSrc.indexOf("async function buildAssistantPrompt");
  const end = generationSrc.indexOf("async function buildCampaignBriefPrompt");
  const body = generationSrc.slice(start, end);
  // exactly one legitimate reference: the fallback resolution itself
  assert.equal((body.match(/job\.property_project_id/g) ?? []).length, 1);
  assert.match(body, /const propertyProjectId = job\.property_project_id \?\? job\.project_id,/);
  assert.match(body, /String\(propertyProjectId\)/g);
  assert.equal((body.match(/String\(propertyProjectId\)/g) ?? []).length, 3, "all three downstream lookups (property_projects, property_units, property_documents) must use the resolved value");
});

test("12: write paths are untouched -- create_creative_campaign_draft and every C2/C3/C4/C6 RPC call still send propertyProjectId as an opaque payload key, never a raw column reference", () => {
  assert.match(repoSrc, /propertyProjectId:input\.brief\.propertyProjectId\?\?null/);
  const c2Repo = readFileSync("features/vayon/campaign-strategist/campaign-strategy.repository.ts", "utf8");
  const c3Repo = readFileSync("features/vayon/creative-package/creative-package.repository.ts", "utf8");
  assert.doesNotMatch(c2Repo, /property_project_id/);
  assert.doesNotMatch(c3Repo, /property_project_id/);
});

test("13: DBV3C's compatibility assumptions are preserved -- C2/C3/C4/C6's write-path RPC signatures are unchanged by this phase", () => {
  const dbv3c = readFileSync("supabase/migrations/20261201000000_campaign_stack_property_compatibility.sql", "utf8");
  for (const sig of [
    "create or replace function public.save_campaign_strategy_version(",
    "create or replace function public.save_campaign_creative_package(",
    "create or replace function public.enqueue_campaign_image_generation(",
    "create or replace function public.save_campaign_lead_form_draft(",
  ]) {
    assert.match(dbv3c, new RegExp(sig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("14: C5 (video generation write path) remains untouched and independent -- it never reads or writes property_project_id/project_id at all", () => {
  const c5 = readFileSync("features/vayon/video-studio/actions.ts", "utf8");
  assert.doesNotMatch(c5, /property_project_id|\bproject_id\b/);
  assert.match(c5, /property_id:\s*input\.projectId/);
});

test("15: no database migration was created for this phase -- purely an application-layer read fix", () => {
  // Not asserted: that DBV3C's timestamp remains the newest in the directory
  // overall -- that breaks the instant any later, unrelated phase adds a
  // migration with a greater timestamp (as WAVE5A's 20261202000000 does).
  // What this test durably guarantees instead: no migration file anywhere in
  // the directory was authored for DBV3D specifically.
  const files = readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql"));
  for (const file of files) {
    const content = readFileSync(`supabase/migrations/${file}`, "utf8");
    assert.doesNotMatch(content, /Phase DBV3D/, `${file} must not be a DBV3D migration -- DBV3D is a read-only application fix`);
  }
});
