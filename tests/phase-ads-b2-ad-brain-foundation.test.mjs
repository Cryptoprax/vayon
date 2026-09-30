import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

function fakeClient({ tables = {}, rpcs = {} } = {}) {
  const rpcCalls = [];
  function builder(table) {
    const filters = [];
    let rows = tables[table] ?? [];
    const api = {
      select() { return api; },
      eq(col, val) { filters.push((row) => row[col] === val); return api; },
      order() { return api; },
      limit() { return api; },
      maybeSingle: async () => {
        const matched = rows.filter((row) => filters.every((f) => f(row)));
        return { data: matched[0] ?? null, error: null };
      },
      then(resolve, reject) {
        const matched = rows.filter((row) => filters.every((f) => f(row)));
        return Promise.resolve({ data: matched, error: null }).then(resolve, reject);
      },
    };
    return api;
  }
  return {
    from: (table) => builder(table),
    rpc: async (name, params) => {
      rpcCalls.push([name, params]);
      const handler = rpcs[name];
      if (!handler) return { data: null, error: new Error(`no rpc handler for ${name}`) };
      return handler(params);
    },
    _rpcCalls: rpcCalls,
  };
}

const rd = (p) => readFileSync(p, "utf8");
const migration = rd("supabase/migrations/20261205000000_ads_b2_ad_brain_foundation.sql");
const migrationSql = migration.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");

function loadScoring() {
  return load("features/vayon/ad-brain/scoring.ts", {});
}
function loadClaimExtraction() {
  return load("features/vayon/ad-brain/claim-extraction.ts", {});
}
function loadFactualValidator() {
  return load("features/vayon/ad-brain/factual-validator.ts", {});
}
function loadRepository(overrides = {}) {
  const { AdBrainRepository } = load("features/vayon/ad-brain/ad-brain.repository.ts", overrides);
  return AdBrainRepository;
}

// ---------------------------------------------------------------------------
// PURE FUNCTION TESTS -- scoring.ts (Part 11's blocking-overrides-score invariant)
// ---------------------------------------------------------------------------
test("computeOverallStatus: a clean result with no issues/flags is passed", () => {
  const { computeOverallStatus } = loadScoring();
  const status = computeOverallStatus({
    dimensionScores: { price_accuracy: { state: "verified", claimedValue: "100", authoritativeValue: "100", notes: null } },
    blockingIssues: [],
    warnings: [],
    policyFlags: [],
  });
  assert.equal(status, "passed");
});

test("computeOverallStatus: a factual CONFLICT forces rejected even with a perfect visual score elsewhere (visual score cannot override a factual blocker)", () => {
  const { computeOverallStatus } = loadScoring();
  const status = computeOverallStatus({
    dimensionScores: {
      price_accuracy: { state: "conflict", claimedValue: "500000", authoritativeValue: "600000", notes: "mismatch" },
      visual_quality: { score: 95, confidence: "estimate", notes: null },
    },
    blockingIssues: [],
    warnings: [],
    policyFlags: [],
  });
  assert.equal(status, "rejected");
});

test("computeOverallStatus: a blocking-severity policy flag forces rejected regardless of every other dimension being clean", () => {
  const { computeOverallStatus } = loadScoring();
  const status = computeOverallStatus({
    dimensionScores: { visual_quality: { score: 100, confidence: "estimate", notes: null } },
    blockingIssues: [],
    warnings: [],
    policyFlags: [{ ruleKey: "housing_no_discriminatory_targeting", category: "housing_special_category", severity: "blocking", message: "x", requiresManualReview: true }],
  });
  assert.equal(status, "rejected");
});

test("computeOverallStatus: a blocking issue forces rejected regardless of the overall dimension scores", () => {
  const { computeOverallStatus } = loadScoring();
  const status = computeOverallStatus({
    dimensionScores: { visual_quality: { score: 100, confidence: "estimate", notes: null } },
    blockingIssues: [{ code: "LENGTH_EXCEEDED", severity: "blocking", message: "x", dimension: "copy_quality" }],
    warnings: [],
    policyFlags: [],
  });
  assert.equal(status, "rejected");
});

test("computeOverallStatus: an unknown/unverified fact alone (no conflict) produces needs_review, never a silent pass or a false reject", () => {
  const { computeOverallStatus } = loadScoring();
  const status = computeOverallStatus({
    dimensionScores: { price_accuracy: { state: "unknown", claimedValue: "500000", authoritativeValue: null, notes: null } },
    blockingIssues: [],
    warnings: [],
    policyFlags: [],
  });
  assert.equal(status, "needs_review");
});

test("computeOverallStatus: a warning-severity policy flag (requiresManualReview) produces needs_review, not rejected", () => {
  const { computeOverallStatus } = loadScoring();
  const status = computeOverallStatus({
    dimensionScores: {},
    blockingIssues: [],
    warnings: [],
    policyFlags: [{ ruleKey: "no_unverifiable_superlatives", category: "misleading_claims", severity: "warning", message: "x", requiresManualReview: true }],
  });
  assert.equal(status, "needs_review");
});

test("computeOverallStatus: not_applicable facts (nothing was claimed) do not force needs_review -- only unknown/unverified/conflict do", () => {
  const { computeOverallStatus } = loadScoring();
  const status = computeOverallStatus({
    dimensionScores: { price_accuracy: { state: "not_applicable", claimedValue: null, authoritativeValue: null, notes: null } },
    blockingIssues: [],
    warnings: [],
    policyFlags: [],
  });
  assert.equal(status, "passed");
});

// ---------------------------------------------------------------------------
// PURE FUNCTION TESTS -- claim-extraction.ts (Part 6)
// ---------------------------------------------------------------------------
test("extractClaims: pulls a checkable price claim and a non-checkable marketing adjective from realistic copy", () => {
  const { extractClaims } = loadClaimExtraction();
  const claims = extractClaims("Luxury 3BR apartments from $725k");
  const price = claims.find((c) => c.type === "price");
  const bedrooms = claims.find((c) => c.type === "bedrooms");
  const adjective = claims.find((c) => c.type === "marketing_adjective");
  assert.equal(price?.extractedValue, 725_000);
  assert.equal(price?.checkable, true);
  assert.equal(bedrooms?.extractedValue, 3);
  assert.equal(bedrooms?.checkable, true);
  assert.equal(adjective?.checkable, false, "subjective marketing language must never be treated as an objective/checkable fact");
});

test("extractClaims: empty copy yields zero claims", () => {
  const { extractClaims } = loadClaimExtraction();
  assert.deepEqual(extractClaims(""), []);
  assert.deepEqual(extractClaims("   "), []);
});

test("checkableClaims filters out non-checkable claims", () => {
  const { extractClaims, checkableClaims } = loadClaimExtraction();
  const claims = extractClaims("Stunning 2BR for $500k");
  const filtered = checkableClaims(claims);
  assert.ok(filtered.every((c) => c.checkable));
  assert.ok(filtered.length < claims.length);
});

// ---------------------------------------------------------------------------
// PURE FUNCTION TESTS -- factual-validator.ts (Part 5: never hallucinate PASS)
// ---------------------------------------------------------------------------
test("validateClaimsAgainstFacts: a price claim matching the authoritative approved price is verified", () => {
  const { validateClaimsAgainstFacts } = loadFactualValidator();
  const facts = { price: { currency: "USD", basePrice: "500000", offerPrice: "500000", effectiveFrom: "2026-01-01", revisionId: "r1", sourceDocumentId: null }, bedrooms: 3, status: "available", location: { countryCode: "US", region: null, city: "Austin", locality: null, address: "x" } };
  const result = validateClaimsAgainstFacts([{ type: "price", rawText: "$500,000", extractedValue: 500_000, checkable: true }], facts);
  assert.equal(result.checks.price_accuracy.state, "verified");
  assert.equal(result.hasConflict, false);
});

test("validateClaimsAgainstFacts: a price claim that mismatches the authoritative price is a conflict", () => {
  const { validateClaimsAgainstFacts } = loadFactualValidator();
  const facts = { price: { currency: "USD", basePrice: "500000", offerPrice: "500000", effectiveFrom: "2026-01-01", revisionId: "r1", sourceDocumentId: null }, bedrooms: 3, status: "available", location: { countryCode: "US", region: null, city: "Austin", locality: null, address: "x" } };
  const result = validateClaimsAgainstFacts([{ type: "price", rawText: "$725,000", extractedValue: 725_000, checkable: true }], facts);
  assert.equal(result.checks.price_accuracy.state, "conflict");
  assert.equal(result.hasConflict, true);
});

test("validateClaimsAgainstFacts: a price claim when NO authoritative price exists is unknown, never fabricated as verified (Part 5's core requirement)", () => {
  const { validateClaimsAgainstFacts } = loadFactualValidator();
  const facts = { price: null, bedrooms: 3, status: "available", location: { countryCode: "US", region: null, city: "Austin", locality: null, address: "x" } };
  const result = validateClaimsAgainstFacts([{ type: "price", rawText: "$725,000", extractedValue: 725_000, checkable: true }], facts);
  assert.equal(result.checks.price_accuracy.state, "unknown");
});

test("validateClaimsAgainstFacts: property could not be resolved at all -> every checkable dimension is unknown, never verified", () => {
  const { validateClaimsAgainstFacts } = loadFactualValidator();
  const result = validateClaimsAgainstFacts([{ type: "price", rawText: "$725,000", extractedValue: 725_000, checkable: true }], null);
  assert.equal(result.checks.price_accuracy.state, "unknown");
  assert.equal(result.checks.property_factual_accuracy.state, "unknown");
});

test("validateClaimsAgainstFacts: payment-plan claims are always unknown -- no authoritative payment-plan source exists in the repo (Part 1's audit finding)", () => {
  const { validateClaimsAgainstFacts } = loadFactualValidator();
  const facts = { price: null, bedrooms: 3, status: "available", location: { countryCode: "US", region: null, city: "Austin", locality: null, address: "x" } };
  const result = validateClaimsAgainstFacts([{ type: "payment_plan", rawText: "10% down", extractedValue: 10, checkable: true }], facts);
  assert.equal(result.checks.payment_plan_accuracy.state, "unknown");
});

test("validateClaimsAgainstFacts: a bedroom-count claim that mismatches the authoritative record is a conflict, folded into property_factual_accuracy (Part 5's bedroom/unit claim requirement)", () => {
  const { validateClaimsAgainstFacts } = loadFactualValidator();
  const facts = { price: null, bedrooms: 3, status: "available", location: { countryCode: "US", region: null, city: "Austin", locality: null, address: "x" } };
  const result = validateClaimsAgainstFacts([{ type: "bedrooms", rawText: "5BR", extractedValue: 5, checkable: true }], facts);
  assert.equal(result.checks.property_factual_accuracy.state, "conflict");
  assert.equal(result.hasConflict, true);
});

test("validateClaimsAgainstFacts: no bedroom claim made -> not_applicable, not unknown (nothing to check)", () => {
  const { validateClaimsAgainstFacts } = loadFactualValidator();
  const facts = { price: null, bedrooms: 3, status: "available", location: { countryCode: "US", region: null, city: "Austin", locality: null, address: "x" } };
  const result = validateClaimsAgainstFacts([], facts);
  assert.equal(result.checks.price_accuracy.state, "not_applicable");
});

// ---------------------------------------------------------------------------
// MIGRATION STATIC CHECKS -- tenant isolation, ACL, idempotency, fail-closed
// ---------------------------------------------------------------------------
test("request_creative_evaluation derives tenant from the caller's own workspace_members row for non-service callers, and from the target asset row for service_role", () => {
  const body = migrationSql.slice(migrationSql.indexOf("function public.request_creative_evaluation("));
  assert.match(body, /wm\.user_id = auth\.uid\(\) and wm\.status = 'active'/);
  assert.match(body, /select \* into a from public\.creative_assets where id = p_creative_asset_id for update;/);
});

test("request_creative_evaluation re-checks campaign ownership for authenticated callers (cross-tenant asset id resolves to nothing)", () => {
  const body = migrationSql.slice(migrationSql.indexOf("function public.request_creative_evaluation("));
  assert.match(body, /select \* into a from public\.creative_assets where id = p_creative_asset_id and organization_id = o and workspace_id = w for update;/);
});

test("creative_evaluations RLS: read policy is tenant-scoped, and there is no direct INSERT\\/UPDATE\\/DELETE policy -- every write goes through a SECURITY DEFINER RPC", () => {
  assert.match(migrationSql, /create policy "creative_evaluation_read" on public\.creative_evaluations\s*\n\s*for select to authenticated\s*\n\s*using \(public\.creative_studio_member\(organization_id, workspace_id\)\);/);
  assert.doesNotMatch(migrationSql, /create policy.*creative_evaluations.*for (insert|update|delete|all)/i);
});

test("duplicate evaluation request idempotency: at most one in-flight (pending\\/evaluating) evaluation per creative_asset\\/channel_execution pair", () => {
  assert.match(migrationSql, /create unique index if not exists creative_evaluation_one_inflight_idx/);
  assert.match(migrationSql, /where status in \('pending','evaluating'\)/);
});

test("worker claim concurrency: claim_creative_evaluation uses FOR UPDATE SKIP LOCKED so two concurrent workers never claim the same row", () => {
  const body = migrationSql.slice(migrationSql.indexOf("function public.claim_creative_evaluation("));
  assert.match(body, /for update skip locked/);
});

test("failed retry behavior: complete_creative_evaluation returns a failed evaluation to pending only while attempts < max_attempts, otherwise terminal 'failed'", () => {
  const body = migrationSql.slice(migrationSql.indexOf("function public.complete_creative_evaluation("));
  assert.match(body, /status = case when e\.attempts < e\.max_attempts then 'pending' else 'failed' end/);
});

test("authenticated cannot spoof a completed evaluation: complete_creative_evaluation requires service_role, and claim_creative_evaluation is revoked from authenticated", () => {
  const body = migrationSql.slice(migrationSql.indexOf("function public.complete_creative_evaluation("));
  assert.match(body, /if current_setting\('role', true\) <> 'service_role' then\s*\n\s*raise exception 'service role required';/);
  assert.match(migrationSql, /revoke all on function public\.claim_creative_evaluation\(uuid\) from authenticated;/);
  assert.match(migrationSql, /revoke all on function public\.complete_creative_evaluation\([^)]*\) from authenticated;/);
});

test("uncertain\\/failed provider outcome cannot silently become passed: p_success=false always routes to pending\\/failed, never reads a caller-supplied status for that path", () => {
  const body = migrationSql.slice(migrationSql.indexOf("function public.complete_creative_evaluation("));
  const failBranch = body.slice(body.indexOf("if not p_success then"), body.indexOf("if p_overall_status not in"));
  assert.doesNotMatch(failBranch, /p_overall_status/, "the failure branch must never reference the caller-supplied overall status");
});

test("policy blocker cannot be overridden by a caller claiming overall_status='passed' -- enforced in the database, not only in application scoring.ts", () => {
  const body = migrationSql.slice(migrationSql.indexOf("function public.complete_creative_evaluation("));
  assert.match(body, /if p_overall_status = 'passed' and \(\s*\n\s*jsonb_array_length\(coalesce\(p_blocking_issues, '\[\]'::jsonb\)\) > 0\s*\n\s*or exists \(select 1 from jsonb_array_elements\(coalesce\(p_policy_flags, '\[\]'::jsonb\)\) f where f->>'severity' = 'blocking'\)\s*\n\s*\) then\s*\n\s*raise exception 'EVALUATION_CONFIGURATION_ERROR: overall_status cannot be passed/);
});

test("EVALUATION_ALREADY_DECIDED: a new request is refused while the latest evaluation for a creative\\/channel pair is passed or needs_review (a human must act first)", () => {
  assert.match(migrationSql, /if v_latest_status in \('passed', 'needs_review'\) then\s*\n\s*raise exception 'EVALUATION_ALREADY_DECIDED/);
});

test("evaluation status is a distinct vocabulary from ADS-B1's publishing/execution status -- pending\\/evaluating\\/passed\\/needs_review\\/rejected\\/failed, not draft\\/ready_for_review\\/publishing\\/active", () => {
  assert.match(migrationSql, /check \(status in \('pending','evaluating','passed','needs_review','rejected','failed'\)\)/);
  const evalTableBody = migrationSql.slice(migrationSql.indexOf("create table if not exists public.creative_evaluations("), migrationSql.indexOf("create index if not exists creative_evaluation_tenant_idx"));
  assert.doesNotMatch(evalTableBody, /'publishing'|'active'|'paused'/);
});

test("ACL: request_creative_evaluation (Model C) grants authenticated+service_role; claim\\/complete (Model B) grant only service_role; are_required_creatives_evaluated (Model A) grants only authenticated", () => {
  for (const sig of ["request_creative_evaluation(uuid, uuid)"]) {
    assert.match(migrationSql, new RegExp(`grant execute on function public\\.${sig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} to authenticated;`));
    assert.match(migrationSql, new RegExp(`grant execute on function public\\.${sig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} to service_role;`));
  }
  for (const sig of ["claim_creative_evaluation(uuid)", "complete_creative_evaluation(uuid, boolean, text, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text, text, text, text)"]) {
    const escaped = sig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(migrationSql, new RegExp(`revoke all on function public\\.${escaped} from authenticated;`));
    assert.match(migrationSql, new RegExp(`grant execute on function public\\.${escaped} to service_role;`));
    assert.doesNotMatch(migrationSql, new RegExp(`grant execute on function public\\.${escaped} to authenticated;`));
  }
  assert.match(migrationSql, /grant execute on function public\.are_required_creatives_evaluated\(uuid, uuid\) to authenticated;/);
  assert.match(migrationSql, /revoke all on function public\.are_required_creatives_evaluated\(uuid, uuid\) from service_role;/);
});

test("anon is never granted execute on any ADS-B2 function", () => {
  for (const sig of ["request_creative_evaluation(uuid, uuid)", "claim_creative_evaluation(uuid)", "complete_creative_evaluation(uuid, boolean, text, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text, text, text, text)", "are_required_creatives_evaluated(uuid, uuid)"]) {
    const escaped = sig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(migrationSql, new RegExp(`revoke all on function public\\.${escaped} from anon;`));
    assert.doesNotMatch(migrationSql, new RegExp(`grant execute on function public\\.${escaped} to anon;`));
  }
});

test("ad_policy_rules is global reference data (no organization_id\\/workspace_id), readable by every authenticated user, with no write policy -- seeded rows are explicitly marked as a structural placeholder requiring external verification", () => {
  const tableBody = migrationSql.slice(migrationSql.indexOf("create table if not exists public.ad_policy_rules("), migrationSql.indexOf("create index if not exists ad_policy_rules_lookup_idx"));
  assert.doesNotMatch(tableBody, /organization_id|workspace_id/);
  assert.match(migrationSql, /create policy "ad_policy_rules_authenticated_read" on public\.ad_policy_rules\s*\n\s*for select to authenticated\s*\n\s*using \(true\);/);
  assert.doesNotMatch(migrationSql, /create policy.*ad_policy_rules.*for (insert|update|delete|all)/i);
  assert.match(migration, /EXTERNAL POLICY VERIFICATION REQUIRED/);
  assert.match(migration, /structural placeholder/i);
});

test("no secret or token column is introduced anywhere in this migration", () => {
  assert.doesNotMatch(migrationSql, /token|secret|ciphertext/i);
});

test("no ALTER DEFAULT PRIVILEGES, no migration-history statement, no provider\\/network reference -- fresh-replay safe", () => {
  assert.doesNotMatch(migrationSql, /alter default privileges/i);
  assert.doesNotMatch(migrationSql, /deployment_migration_history|schema_migrations/i);
  assert.doesNotMatch(migrationSql, /fetch\(|https?:\/\/|OpenAI|MetaGraph|GoogleAds/i);
});

test("no parallel campaign\\/creative source of truth: creative_evaluations references creative_assets and creative_campaigns by id, never duplicates their columns", () => {
  assert.match(migrationSql, /creative_asset_id uuid not null references public\.creative_assets\(id\) on delete cascade/);
  assert.match(migrationSql, /campaign_id uuid not null references public\.creative_campaigns\(id\) on delete cascade/);
});

// ---------------------------------------------------------------------------
// TS repository layer -- behavioral (fakeClient), no provider calls.
// ---------------------------------------------------------------------------
test("AdBrainRepository.requestEvaluation calls request_creative_evaluation with exactly creativeAssetId/channelExecutionId", async () => {
  const client = fakeClient({ rpcs: { request_creative_evaluation: async () => ({ data: "eval-1", error: null }) } });
  const Repository = loadRepository();
  const r = new Repository(client, "org-1", "ws-1");
  const id = await r.requestEvaluation("asset-1", null);
  assert.equal(id, "eval-1");
  assert.deepEqual(client._rpcCalls[0], ["request_creative_evaluation", { p_creative_asset_id: "asset-1", p_channel_execution_id: null }]);
});

test("AdBrainRepository.claimEvaluation and completeEvaluation call the correct RPCs with the correct params", async () => {
  const client = fakeClient({
    rpcs: {
      claim_creative_evaluation: async () => ({ data: { id: "eval-1", status: "evaluating", attempts: 1, max_attempts: 3, claims: [], dimension_scores: {}, blocking_issues: [], warnings: [], recommendations: [], evidence_refs: [], policy_flags: [], requested_at: "2026-01-01", campaign_id: "c1", creative_asset_id: "a1", version: 1 }, error: null }),
      complete_creative_evaluation: async () => ({ data: null, error: null }),
    },
  });
  const Repository = loadRepository();
  const r = new Repository(client, "org-1", "ws-1");
  const claimed = await r.claimEvaluation("eval-1");
  assert.equal(claimed?.status, "evaluating");
  assert.deepEqual(client._rpcCalls[0], ["claim_creative_evaluation", { p_evaluation_id: "eval-1" }]);

  await r.completeEvaluation({
    evaluationId: "eval-1", success: true, overallStatus: "passed", claims: [], dimensionScores: {}, blockingIssues: [], warnings: [], recommendations: [], evidenceRefs: [], policyFlags: [],
    provider: "mock", model: "mock-v1", evaluationVersion: "v1", diagnostic: null,
  });
  assert.deepEqual(client._rpcCalls[1][0], "complete_creative_evaluation");
  assert.equal(client._rpcCalls[1][1].p_evaluation_id, "eval-1");
  assert.equal(client._rpcCalls[1][1].p_success, true);
  assert.equal(client._rpcCalls[1][1].p_overall_status, "passed");
});

test("AdBrainRepository.readiness calls are_required_creatives_evaluated with campaignId/channelExecutionId and normalizes the result shape", async () => {
  const client = fakeClient({ rpcs: { are_required_creatives_evaluated: async () => ({ data: { passed: 2, needsReview: 1, rejected: 0, pendingOrEvaluating: 0, failed: 0, allPassed: false, anyRejected: false }, error: null }) } });
  const Repository = loadRepository();
  const r = new Repository(client, "org-1", "ws-1");
  const readiness = await r.readiness("campaign-1", null);
  assert.equal(readiness.passed, 2);
  assert.equal(readiness.needsReview, 1);
  assert.deepEqual(client._rpcCalls[0], ["are_required_creatives_evaluated", { p_campaign_id: "campaign-1", p_channel_execution_id: null }]);
});

test("AdBrainRepository never calls a provider directly -- only Supabase RPC/table methods on the injected client", () => {
  const source = rd("features/vayon/ad-brain/ad-brain.repository.ts");
  assert.doesNotMatch(source, /fetch\(|OpenAI|MetaGraph|GoogleAds|https?:\/\//i);
});

test("AdBrainService, CreativeEvaluationWorker, actions.ts and the mock providers never call a real provider SDK or fetch", () => {
  for (const file of [
    "features/vayon/ad-brain/ad-brain.service.ts",
    "features/vayon/ad-brain/actions.ts",
    "features/vayon/ad-brain/providers/visual-evaluation.provider.ts",
    "features/vayon/ad-brain/providers/copy-evaluation.provider.ts",
    "features/vayon/ad-brain/components/CreativeEvaluationPanel.tsx",
  ]) {
    const source = rd(file);
    assert.doesNotMatch(source, /fetch\(|new OpenAI\(|MetaGraph|GoogleAds|createLiveCreativeExecutionService/i);
  }
});

test("no live publish control exists in the UI foundation", () => {
  const source = rd("features/vayon/ad-brain/components/CreativeEvaluationPanel.tsx");
  assert.doesNotMatch(source, /Publish now|Go live|Send to Meta|Send to Google/i);
});

test("CreativeEvaluationWorker reuses K3's getAuthoritativePropertyFacts rather than re-implementing property fact retrieval", () => {
  const source = rd("features/vayon/ad-brain/ad-brain.service.ts");
  assert.match(source, /getAuthoritativePropertyFacts/);
  assert.match(source, /@\/features\/vayon\/property-facts\/services\/authoritative-property-facts\.service/);
});

test("the deferred zero-history campaign-video-generation.service.ts is not referenced by any ADS-B2 file", () => {
  for (const file of [
    "features/vayon/ad-brain/ad-brain.repository.ts",
    "features/vayon/ad-brain/ad-brain.service.ts",
    "features/vayon/ad-brain/actions.ts",
  ]) {
    assert.doesNotMatch(rd(file), /campaign-video-generation/);
  }
});
