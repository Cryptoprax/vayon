import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";
import { fakeClient, propertyRow } from "./helpers/fake-supabase-c2.mjs";

const rd = (p) => readFileSync(p, "utf8");
const migration = rd("supabase/migrations/20261203000000_ads_b0_safety_attribution_prerequisites.sql");
const migrationSql = migration.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");

const campaignId = "11111111-1111-4111-8111-111111111111";
const propertyId = "22222222-2222-4222-8222-222222222222";
const packageId = "55555555-5555-4555-8555-555555555555";
const jobId = "66666666-6666-4666-8666-666666666666";

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

// ---------------------------------------------------------------------------
// PART 8 -- SECURITY: caller model / ACL for claim_creative_generation_quota
// ---------------------------------------------------------------------------
test("claim_creative_generation_quota: Model A+B dual caller -- PUBLIC=false, anon=false, authenticated=true, service_role=true, intentional (not a default-ACL surprise)", () => {
  const fq = "public.claim_creative_generation_quota(uuid, uuid, text)";
  assert.match(migrationSql, new RegExp(`revoke all on function ${escapeRegExp(fq)} from public;`));
  assert.match(migrationSql, new RegExp(`revoke all on function ${escapeRegExp(fq)} from anon;`));
  assert.match(migrationSql, new RegExp(`grant execute on function ${escapeRegExp(fq)} to authenticated;`));
  assert.match(migrationSql, new RegExp(`grant execute on function ${escapeRegExp(fq)} to service_role;`));
});

test("claim_creative_generation_quota: authenticated callers are membership-checked server-side (tenant safety) -- service_role is trusted and bypasses that check, never the reverse", () => {
  assert.match(migrationSql, /if current_setting\('role', true\) <> 'service_role' then\s*\n\s*if public\.current_workspace_role\(p_workspace_id\) is null then\s*\n\s*raise exception 'insufficient workspace permission';/);
  assert.match(migrationSql, /exists \(\s*\n\s*select 1 from public\.workspaces w\s*\n\s*where w\.id = p_workspace_id and w\.organization_id = p_organization_id\s*\n\s*\)/);
});

test("claim_creative_generation_quota: fails closed on every configuration edge case (no fail-open behavior)", () => {
  assert.match(migrationSql, /if p_metric not in \('image_generations', 'video_generations'\) then\s*\n\s*raise exception 'QUOTA_CONFIGURATION_ERROR/);
  assert.match(migrationSql, /if v_plan_code is null then\s*\n\s*raise exception 'SUBSCRIPTION_STATE_ERROR/);
  assert.match(migrationSql, /if v_limit = -1 then\s*\n\s*raise exception 'QUOTA_CONFIGURATION_ERROR/);
  assert.match(migrationSql, /if v_current_usage >= v_limit then\s*\n\s*raise exception 'QUOTA_EXCEEDED/);
});

test("claim_creative_generation_quota: hardcoded quota values are byte-identical to entitlements.ts's creative_assets bucket, not read from organization_limits (D2's own documented staleness finding)", () => {
  const entitlements = rd("features/vayon/billing/config/entitlements.ts");
  for (const [plan, value, tsLiteral] of [["starter", 25, "25"], ["professional", 500, "500"], ["business", 2500, "2_500"], ["business_plus", 7500, "7_500"]]) {
    assert.match(entitlements, new RegExp(`creative_assets: ${tsLiteral}\\b`), `entitlements.ts drift: expected creative_assets: ${tsLiteral} for ${plan}`);
    assert.match(migrationSql, new RegExp(`when '${plan}' then ${value}\\b`), `migration drift: expected '${plan}' then ${value}`);
  }
  assert.match(migrationSql, /when 'enterprise' then null/);
  assert.doesNotMatch(migrationSql, /from organization_limits/);
});

test("claim_creative_generation_quota: atomic via advisory lock, keyed by workspace+period (same tool/reasoning as D2's pg_advisory_xact_lock)", () => {
  assert.match(migrationSql, /perform pg_advisory_xact_lock\(hashtext\('creative_quota:' \|\| p_workspace_id::text \|\| ':' \|\| v_period_start::text\)\)/);
});

test("claim_creative_generation_quota: usage tracked as two separate metrics (image_generations, video_generations) even though the enforcement ceiling is currently combined", () => {
  assert.match(migrationSql, /metric in \('image_generations', 'video_generations'\)/);
  assert.match(migrationSql, /values \(p_organization_id, p_workspace_id, p_metric, 1, v_period_start, v_period_end\)/);
});

// ---------------------------------------------------------------------------
// C4 -- image generation quota guard (real generation.service.ts code, fake client/provider)
// ---------------------------------------------------------------------------
class FakeImageProvider {
  constructor(result) { this.result = result ?? { bytes: new Uint8Array([1, 2, 3, 4]), mimeType: "image/png", model: "gpt-image-2-fake", latencyMs: 10 }; this.calls = []; }
  async generate(input) { this.calls.push(input); return this.result; }
}

function loadGenerationService(clientOverride) {
  return load("features/vayon/creative-studio/generation.service.ts", {
    "@/lib/supabase/service": { createSupabaseServiceClient: () => clientOverride },
    "@/features/vayon/billing/services/subscription-write.service": { SubscriptionWriteService: class { async requireJobWorkspace() {} } },
  });
}

function c4Worker({ quota } = {}) {
  const tables = {
    creative_generation_jobs: [{
      id: jobId, organization_id: "org-1", workspace_id: "ws-1", campaign_id: campaignId, property_id: propertyId, property_project_id: null,
      creative_package_id: null, creative_brief_id: null, prompt: "A modern apartment", format: "1:1 Instagram Post", layout_style: "Premium",
      status: "queued", attempts: 0, max_attempts: 3,
    }],
    properties: [propertyRow({ id: propertyId })],
    creative_brand_kits: [],
    subscriptions: [{ workspace_id: "ws-1", status: "active", deleted_at: null }],
    creative_assets: [],
  };
  const quotaCalls = [];
  const c = fakeClient({
    tables,
    rpcs: {
      claim_creative_generation: async () => {
        const job = tables.creative_generation_jobs.find((j) => j.id === jobId && j.status === "queued");
        if (!job) return { data: null, error: null };
        job.attempts += 1;
        job.status = "processing";
        return { data: { ...job }, error: null };
      },
      claim_creative_generation_quota: async (params) => {
        quotaCalls.push(params);
        if (quota === "exceeded") return { data: null, error: new Error("QUOTA_EXCEEDED: creative generation limit reached for the starter plan (25 of 25 used this period)") };
        return { data: { metric: params.p_metric, planCode: "starter", usage: 1, limit: 25, periodStart: "2026-01-01" }, error: null };
      },
      complete_creative_generation: async (params) => {
        const job = tables.creative_generation_jobs.find((j) => j.id === params.p_job_id);
        job.status = params.p_success ? "completed" : (job.attempts < job.max_attempts ? "queued" : "failed");
        job.diagnostic = params.p_diagnostic ?? null;
        return { data: null, error: null };
      },
    },
  });
  return { client: c, tables, quotaCalls };
}

test("quota exhausted -> image provider is never called (C4)", async () => {
  const { client, tables } = c4Worker({ quota: "exceeded" });
  const provider = new FakeImageProvider();
  const { CreativeGenerationWorker } = loadGenerationService(client);
  await new CreativeGenerationWorker(provider).process(jobId);
  assert.equal(provider.calls.length, 0, "the expensive image provider must never be invoked once quota is exhausted");
  assert.equal(tables.creative_generation_jobs[0].status, "queued", "job is retried, not silently dropped -- attempts=1 < max_attempts=3");
  assert.match(String(tables.creative_generation_jobs[0].diagnostic), /Error/);
});

test("quota allowed -> execution proceeds to the mocked provider boundary exactly once (C4)", async () => {
  const { client, tables, quotaCalls } = c4Worker({ quota: "allowed" });
  const provider = new FakeImageProvider();
  const { CreativeGenerationWorker } = loadGenerationService(client);
  await new CreativeGenerationWorker(provider).process(jobId);
  assert.equal(provider.calls.length, 1, "exactly one provider invocation for one allowed generation");
  assert.equal(quotaCalls.length, 1);
  assert.equal(quotaCalls[0].p_workspace_id, "ws-1");
  assert.equal(quotaCalls[0].p_organization_id, "org-1");
  assert.equal(quotaCalls[0].p_metric, "image_generations");
  assert.equal(tables.creative_generation_jobs[0].status, "completed");
});

test("quota claim precedes the provider call, not the job claim -- workspace/organization ids come from the claimed job row, never client input (C4)", () => {
  const source = rd("features/vayon/creative-studio/generation.service.ts");
  const claimIdx = source.indexOf('client.rpc("claim_creative_generation_quota"');
  const providerIdx = source.indexOf("this.provider.generate(");
  assert.ok(claimIdx > 0 && providerIdx > claimIdx, "quota claim must appear before the provider call in source order");
  assert.match(source, /p_workspace_id: String\(job\.workspace_id\)/);
  assert.match(source, /p_organization_id: String\(job\.organization_id\)/);
});

// ---------------------------------------------------------------------------
// C5 -- video generation quota guard (real campaign-video-generation.service.ts code)
// ---------------------------------------------------------------------------
function videoBrief(over = {}) {
  return {
    id: "brief-2", type: "video", angle: "Walkthrough", objective: "Tour the property",
    visualConcept: "Short walkthrough", propertyFactsToShow: ["title"], requiredAssets: [], textOverlay: [], brandInstructions: [],
    formatRecommendation: "9:16 Reel",
    evidenceRefs: [{ type: "property", id: propertyId }],
    prohibitedClaims: [],
    videoDetails: { hook: "See this home.", sceneSequence: ["Exterior"], durationSeconds: 15, aspectRatio: "9:16", onScreenText: [], cta: "Book a visit" },
    ...over,
  };
}
function packageRow(over = {}) {
  return {
    id: packageId, organization_id: "org-1", workspace_id: "ws-1", campaign_id: campaignId, property_id: propertyId,
    version: 1, status: "accepted",
    output: { copyVariants: [], creativeBriefs: [videoBrief()], complianceReviewRequired: false, complianceReviewReason: null, assumptions: [], cautions: [], evidenceRefs: [] },
    ...over,
  };
}
function c5Client({ quota } = {}) {
  const tables = {
    creative_campaigns: [{ id: campaignId, organization_id: "org-1", workspace_id: "ws-1", property_id: propertyId, property_project_id: null, name: "Aurora Campaign" }],
    campaign_creative_packages: [packageRow()],
    properties: [propertyRow({ id: propertyId })],
    creative_brand_kits: [],
    creative_assets: [],
    creative_timeline: [],
  };
  const quotaCalls = [];
  const c = fakeClient({
    tables,
    rpcs: {
      current_property_price: async () => ({ data: [], error: null }),
      search_property_knowledge_documents: async () => ({ data: [], error: null }),
      claim_creative_generation_quota: async (params) => {
        quotaCalls.push(params);
        if (quota === "exceeded") return { data: null, error: new Error("QUOTA_EXCEEDED: creative generation limit reached for the starter plan (25 of 25 used this period)") };
        return { data: { metric: params.p_metric, planCode: "starter", usage: 1, limit: 25, periodStart: "2026-01-01" }, error: null };
      },
    },
  });
  const originalFrom = c.from.bind(c);
  c.from = (table) => {
    const builder = originalFrom(table);
    if (table === "creative_assets" || table === "creative_timeline") {
      builder.insert = (row) => { tables[table].push(row); return { error: null }; };
    }
    return builder;
  };
  return { client: c, tables, quotaCalls };
}
function c5Service(c, over = {}) {
  const { CampaignVideoGenerationService } = load("features/vayon/creative-package/campaign-video-generation.service.ts", {
    "@/features/platform/permissions/runtime/permission.service": {},
    "@/features/vayon/creative-studio/access.service": {},
    "@/features/vayon/creative-providers/execution.factory": { createLiveCreativeExecutionService: () => over.execution },
  });
  return new CampaignVideoGenerationService(c, "org-1", "ws-1");
}

test("quota exhausted -> video provider (execution.accept) is never called (C5)", async () => {
  let calls = 0;
  const trackedExecution = { accept: async () => { calls++; return { status: "WaitingApproval", provider: "openai-video", capability: "Video", metadata: {}, warnings: [], errors: [], outputs: [] }; } };
  const { client: c } = c5Client({ quota: "exceeded" });
  await assert.rejects(c5Service(c, { execution: trackedExecution }).generate(campaignId, propertyId, packageId, "brief-2"));
  assert.equal(calls, 0, "the expensive Sora video provider must never be invoked once quota is exhausted");
});

test("quota allowed -> execution proceeds to the mocked provider boundary exactly once (C5)", async () => {
  let calls = 0;
  const trackedExecution = { accept: async () => { calls++; return { status: "WaitingApproval", provider: "openai-video", capability: "Video", metadata: {}, warnings: [], errors: [], outputs: [{ id: "o1", workspaceId: "ws-1", projectId: propertyId, campaignId, brandId: null, creativeDirectorTaskId: "t1", assetLibraryId: null, providerId: "openai-video", metadata: { storagePath: "org-1/ws-1/creative-assets/t1/video.mp4", mimeType: "video/mp4" } }] }; } };
  const { client: c, tables, quotaCalls } = c5Client({ quota: "allowed" });
  const result = await c5Service(c, { execution: trackedExecution }).generate(campaignId, propertyId, packageId, "brief-2");
  assert.equal(calls, 1);
  assert.equal(quotaCalls.length, 1);
  assert.equal(quotaCalls[0].p_metric, "video_generations");
  assert.equal(result.assetId !== null, true);
  assert.equal(tables.creative_assets.length, 1);
});

test("quota tenant isolation: the RPC is always called with THIS workspace/organization's own ids, never a caller-supplied cross-tenant id (C4 + C5 source check)", () => {
  const c4 = rd("features/vayon/creative-studio/generation.service.ts");
  assert.match(c4, /p_workspace_id: String\(job\.workspace_id\),\s*\n\s*p_organization_id: String\(job\.organization_id\)/);
  const c5 = rd("features/vayon/creative-package/campaign-video-generation.service.ts");
  assert.match(c5, /p_workspace_id: this\.workspaceId,\s*\n\s*p_organization_id: this\.organizationId/);
  const videoStudio = rd("features/vayon/video-studio/actions.ts");
  assert.match(videoStudio, /p_workspace_id: context\.workspaceId,\s*\n\s*p_organization_id: context\.organizationId/);
});

test("video-studio/actions.ts (the wizard path) also claims quota, in the correct position, before the expensive capability:\"Video\" accept() call and after the cheap capability:\"Document\" storyboard call", () => {
  const source = rd("features/vayon/video-studio/actions.ts");
  const storyboardIdx = source.indexOf('capability: "Document"');
  const quotaIdx = source.indexOf('access.client.rpc("claim_creative_generation_quota"');
  const videoAcceptIdx = source.indexOf('capability: "Video"');
  assert.ok(storyboardIdx > 0 && quotaIdx > storyboardIdx, "quota claim must come after the cheap storyboard call");
  assert.ok(videoAcceptIdx > 0 && videoAcceptIdx > quotaIdx, "quota claim must come before the expensive video accept() call");
  assert.match(source, /p_metric: "video_generations"/);
});

// ---------------------------------------------------------------------------
// C3 -- deliberately NOT gated (inexpensive LLM copy generation, no authoritative quota exists)
// ---------------------------------------------------------------------------
test("C3 (creative-package generation) is deliberately not quota-gated -- no authoritative numeric limit exists for copy/strategy LLM calls, and inventing one is out of scope", () => {
  for (const path of ["features/vayon/creative-package/creative-package.service.ts", "features/vayon/campaign-strategist/campaign-strategy.service.ts"]) {
    const source = rd(path);
    assert.doesNotMatch(source, /claim_creative_generation_quota/);
  }
});

// ---------------------------------------------------------------------------
// PART 4 -- meta_lead_crm_links RLS (migration-content check; behavioral
// tenant-isolation proof runs against real disposable Postgres, see Part 11)
// ---------------------------------------------------------------------------
test("meta_lead_crm_links: exactly one new SELECT policy, scoped identically to the established lead_property_interests pattern; no INSERT/UPDATE/DELETE policy added (service-role ingestion boundary preserved)", () => {
  assert.match(migrationSql, /create policy "meta_lead_crm_links_workspace_read"\s*\n\s*on public\.meta_lead_crm_links\s*\n\s*for select\s*\n\s*to authenticated\s*\n\s*using \(\s*\n\s*public\.is_organization_member\(organization_id\)\s*\n\s*and exists \(\s*\n\s*select 1 from public\.workspace_members wm\s*\n\s*where wm\.workspace_id = meta_lead_crm_links\.workspace_id\s*\n\s*and wm\.user_id = auth\.uid\(\)\s*\n\s*and wm\.status = 'active'\s*\n\s*\)\s*\n\s*\)/);
  assert.doesNotMatch(migrationSql, /for insert on public\.meta_lead_crm_links|for update on public\.meta_lead_crm_links|for delete on public\.meta_lead_crm_links|for all on public\.meta_lead_crm_links/);
});

// ---------------------------------------------------------------------------
// PART 5/6 -- deals.campaign_id, tenant-integrity trigger, attribution write path
// ---------------------------------------------------------------------------
test("deals.campaign_id: nullable, additive-only column addition", () => {
  assert.match(migrationSql, /alter table public\.deals\s*\n\s*add column if not exists campaign_id uuid references public\.creative_campaigns\(id\);/);
});

test("cross-tenant attribution is blocked by a trigger, not left to a bare FK, mirroring this repository's raise-exception-on-violated-invariant pattern", () => {
  assert.match(migrationSql, /function public\.enforce_deal_campaign_tenant_match\(\)/);
  assert.match(migrationSql, /raise exception 'CROSS_TENANT_ATTRIBUTION_BLOCKED/);
  assert.match(migrationSql, /before insert or update of campaign_id, organization_id, workspace_id\s*\n\s*on public\.deals/);
});

test("create_deal attribution write path: exactly one campaign auto-attributes, multiple distinct campaigns never fabricate an attribution, no campaign leaves it null, and campaign_id is never client-settable", () => {
  assert.match(migrationSql, /select case when count\(distinct campaign_id\) = 1 then \(array_agg\(distinct campaign_id\)\)\[1\] else null end\s*\n\s*into v_campaign_id\s*\n\s*from meta_lead_crm_links\s*\n\s*where lead_id = v_lead_id\s*\n\s*and campaign_id is not null;/);
  assert.doesNotMatch(migrationSql, /p_input->>'campaignId'/);
  assert.match(migrationSql, /insert into deals\([^)]*campaign_id[^)]*\)/);
});

test("create_deal: every other column/permission-check/property-existence-check from the sprint22 baseline is preserved verbatim (this is an evolution, not a rewrite)", () => {
  for (const fragment of [
    "select organization_id into v_org from workspace_members where workspace_id = p_workspace_id and user_id = auth.uid() and status = 'active';",
    "if v_org is null or not can_manage_deal(p_workspace_id) then",
    "where exists (select 1 from properties p where p.id = (p_input->>'propertyId')::uuid and p.organization_id = v_org and p.workspace_id = p_workspace_id and p.deleted_at is null)",
    "if v_id is null then",
    "raise exception 'invalid property';",
  ]) {
    assert.ok(migrationSql.includes(fragment), `create_deal dropped or altered baseline logic: ${fragment}`);
  }
});

test("migration is fresh-replay safe: no ALTER DEFAULT PRIVILEGES, no migration-history statement, no provider/network reference", () => {
  assert.doesNotMatch(migrationSql, /alter default privileges/i);
  assert.doesNotMatch(migrationSql, /supabase_migrations\.schema_migrations|deployment_migration_history|db push|migration repair/i);
  assert.doesNotMatch(migrationSql, /graph\.facebook|api\.openai|sora|whatsapp\.com|paddle\.com|googleads|fetch\(|https?:\/\//i);
});
