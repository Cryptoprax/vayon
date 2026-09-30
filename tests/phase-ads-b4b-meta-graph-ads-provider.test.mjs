import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

// ---------------------------------------------------------------------------
// ADS-B4B: MetaGraphAdsProvider is DEAD/UNWIRED code. Every test here uses a
// mocked transport -- no real `fetch`, no real Meta credential, no real
// network activity of any kind. META_MARKETING_WRITES_ENABLED is never set
// to "true" anywhere in this file except transiently, inside a single test,
// specifically to prove a mocked (never real) request is only reachable
// once the flag is exactly "true" -- and even then the transport is a fake
// in-memory object, not a real HTTP client.
// ---------------------------------------------------------------------------

const rd = (p) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const providerSrc = rd("features/vayon/meta-ads/providers/meta-graph-ads.provider.ts");
const errorsSrc = rd("features/vayon/meta-ads/providers/meta-graph-ads-errors.ts");
const interfaceSrc = rd("features/vayon/meta-ads/providers/meta-ads.provider.ts");
const serviceSrc = rd("features/vayon/meta-ads/meta-ads.service.ts");
const liveOAuthTypesSrc = rd("features/platform/integrations/meta-marketing/domain/types.ts");

function loadProvider(overrides = {}) {
  return load("features/vayon/meta-ads/providers/meta-graph-ads.provider.ts", {
    "@/features/platform/integrations/meta-marketing/providers/meta-graph.provider": overrides.writeGuard ?? {
      requireMetaMarketingWritesEnabled: () => {
        if (process.env.META_MARKETING_WRITES_ENABLED !== "true") {
          const err = new Error('Meta Marketing write actions are disabled in this environment (META_MARKETING_WRITES_ENABLED is not "true").');
          err.name = "MetaMarketingWritesDisabledError";
          throw err;
        }
      },
    },
  });
}

function fakeTransport(handler) {
  const calls = [];
  return {
    calls,
    async fetch(url, init) {
      calls.push({ url, ...init });
      return handler(url, init, calls.length);
    },
  };
}
function jsonResponse(status, body, headers = {}) {
  return { status, headers, json: async () => body };
}

const ORG_ACCOUNT_ID = "1234567890";
const CAMPAIGN_INPUT = { adAccountId: ORG_ACCOUNT_ID, name: "Test Campaign", objective: "lead_generation", specialAdCategory: "housing" };
const ADSET_INPUT = {
  providerCampaignId: "cmp-1",
  name: "Test Ad Set",
  dailyBudgetMinorUnits: 5000,
  lifetimeBudgetMinorUnits: null,
  targetingSpec: { geo_locations: { countries: ["US"] } },
  adAccountId: ORG_ACCOUNT_ID,
  pageId: "page-1",
};
const AD_INPUT = { providerAdSetId: "adset-1", providerCreativeId: "creative-1", name: "Test Ad", adAccountId: ORG_ACCOUNT_ID };
const TOKEN = "SECRET-TEST-TOKEN-never-should-leak";

// ---------------------------------------------------------------------------
// PART 3 -- API VERSION ISOLATION
// ---------------------------------------------------------------------------
test("1: the real provider never builds a v23.0 Marketing API URL, and uses v26.0 by default", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = fakeTransport(() => jsonResponse(200, { id: "cmp-1" }));
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    await provider.createCampaign(CAMPAIGN_INPUT, TOKEN);
    assert.equal(transport.calls.length, 1);
    assert.match(transport.calls[0].url, /^https:\/\/graph\.facebook\.com\/v26\.0\//);
    assert.doesNotMatch(transport.calls[0].url, /v23\.0/);
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});
test("2: the provider's API version is isolated from META_GRAPH_VERSION and injectable for tests, independent of the existing provider", () => {
  // Strip block/line comments first -- the class docstring itself documents,
  // in prose, that it never reads this env var, which would otherwise
  // false-positive-match a naive text search of the whole file.
  const codeOnly = providerSrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(codeOnly, /process\.env\.META_GRAPH_VERSION/);
  assert.match(providerSrc, /DEFAULT_ADS_API_VERSION = "v26\.0"/);
  assert.match(providerSrc, /apiVersion\?\??:\s*string/);
});
test("3: existing M1-M8 lead ingestion graph provider is unmodified by this phase", () => {
  const output = execSync("git status --short -- features/platform/integrations/meta-marketing/providers/meta-graph.provider.ts", { cwd: process.cwd() }).toString().trim();
  assert.equal(output, "", "the existing, unrelated Graph provider must show no diff from this phase");
});

// ---------------------------------------------------------------------------
// PART 5 -- DEFENSE-IN-DEPTH WRITE GUARD (every mutating method x 6 env values)
// ---------------------------------------------------------------------------
const blockedEnvValues = [undefined, "false", "TRUE", "1", "yes"];
const mutatingMethods = [
  ["createCampaign", (p) => p.createCampaign(CAMPAIGN_INPUT, TOKEN)],
  ["createAdSet", (p) => p.createAdSet(ADSET_INPUT, TOKEN)],
  ["createCreative", (p) => p.createCreative({ providerAdSetId: "adset-1", storagePath: "x", format: "single_image" }, TOKEN)],
  ["createAd", (p) => p.createAd(AD_INPUT, TOKEN)],
  ["pauseCampaign", (p) => p.pauseCampaign("cmp-1", TOKEN)],
  ["resumeCampaign", (p) => p.resumeCampaign("cmp-1", TOKEN)],
  ["getCampaignStatus", (p) => p.getCampaignStatus("cmp-1", TOKEN)],
];
for (const [methodName, invoke] of mutatingMethods) {
  for (const envValue of blockedEnvValues) {
    test(`4: ${methodName} is blocked when META_MARKETING_WRITES_ENABLED=${JSON.stringify(envValue)}`, async () => {
      if (envValue === undefined) delete process.env.META_MARKETING_WRITES_ENABLED;
      else process.env.META_MARKETING_WRITES_ENABLED = envValue;
      try {
        const transport = fakeTransport(() => { throw new Error("must never be reached"); });
        const { MetaGraphAdsProvider } = loadProvider();
        const provider = new MetaGraphAdsProvider({ transport });
        await assert.rejects(() => invoke(provider), (e) => e.name === "MetaMarketingWritesDisabledError");
        assert.equal(transport.calls.length, 0, `${methodName} must not reach the transport when writes are disabled`);
      } finally {
        delete process.env.META_MARKETING_WRITES_ENABLED;
      }
    });
  }
}
test("5: exact literal \"true\" is the only value that proceeds past the guard (into the mocked transport only)", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = fakeTransport(() => jsonResponse(200, { id: "cmp-1" }));
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    const result = await provider.createCampaign(CAMPAIGN_INPUT, TOKEN);
    assert.equal(result.providerObjectId, "cmp-1");
    assert.equal(transport.calls.length, 1);
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});
test("6: an unconfigured (no transport injected) provider throws immediately rather than attempting a real network call", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider();
    await assert.rejects(() => provider.createCampaign(CAMPAIGN_INPUT, TOKEN), /no transport configured/);
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});

// ---------------------------------------------------------------------------
// PART 6 -- TOKEN BOUNDARY
// ---------------------------------------------------------------------------
test("7: no new token storage is introduced -- the provider file contains no INSERT/persist/ciphertext logic", () => {
  assert.doesNotMatch(providerSrc, /ciphertext|localStorage|INSERT INTO|\.insert\(/i);
});
test("8: the token is never logged -- no console.log/console.error/logger call anywhere in the provider or error files", () => {
  assert.doesNotMatch(providerSrc, /console\.(log|error|warn)|captureException/);
  assert.doesNotMatch(errorsSrc, /console\.(log|error|warn)|captureException/);
});
test("9: the token never appears inside a thrown/classified error message", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = fakeTransport(() => jsonResponse(400, { error: { message: "Invalid parameter", code: 100, is_transient: false } }));
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    await assert.rejects(
      () => provider.createCampaign(CAMPAIGN_INPUT, TOKEN),
      (e) => { assert.doesNotMatch(String(e.message), new RegExp(TOKEN)); assert.doesNotMatch(JSON.stringify(e), new RegExp(TOKEN)); return true; },
    );
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});
test("10: the token never appears in a successful result object", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = fakeTransport(() => jsonResponse(200, { id: "cmp-1" }));
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    const result = await provider.createCampaign(CAMPAIGN_INPUT, TOKEN);
    assert.doesNotMatch(JSON.stringify(result), new RegExp(TOKEN));
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});
test("11: the token is sent only as the Authorization bearer header, never in the URL or JSON body", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = fakeTransport(() => jsonResponse(200, { id: "cmp-1" }));
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    await provider.createCampaign(CAMPAIGN_INPUT, TOKEN);
    const call = transport.calls[0];
    assert.doesNotMatch(call.url, new RegExp(TOKEN));
    assert.doesNotMatch(call.body ?? "", new RegExp(TOKEN));
    assert.equal(call.headers.authorization, `Bearer ${TOKEN}`);
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});
test("12: the provider source documents that the caller must obtain the token exclusively through the existing encrypted connection infrastructure -- no new token storage", () => {
  assert.match(providerSrc, /getEncryptedToken|TokenCryptoService/);
  assert.match(providerSrc, /No new token[\s\S]{0,15}storage/);
});

// ---------------------------------------------------------------------------
// PART 7 -- VERIFIED CAMPAIGN CONTRACT
// ---------------------------------------------------------------------------
test("13: createCampaign sends exactly the verified payload shape and endpoint", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = fakeTransport(() => jsonResponse(200, { id: "cmp-42" }));
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    const result = await provider.createCampaign(CAMPAIGN_INPUT, TOKEN);
    const call = transport.calls[0];
    assert.equal(call.method, "POST");
    assert.match(call.url, new RegExp(`/act_${ORG_ACCOUNT_ID}/campaigns$`));
    const body = JSON.parse(call.body);
    assert.deepEqual(body, { name: "Test Campaign", objective: "OUTCOME_LEADS", special_ad_categories: ["HOUSING"], status: "PAUSED" });
    assert.equal(result.providerObjectId, "cmp-42");
    assert.equal(result.status, "PAUSED");
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});
test("14: createCampaign rejects any objective other than \"lead_generation\" without an HTTP call", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = fakeTransport(() => { throw new Error("must never be reached"); });
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    await assert.rejects(() => provider.createCampaign({ ...CAMPAIGN_INPUT, objective: "OUTCOME_TRAFFIC" }, TOKEN), (e) => e.name === "MetaGraphAdsUnsupportedOperationError");
    assert.equal(transport.calls.length, 0);
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});
test("15: createCampaign rejects any special_ad_category other than \"housing\" without an HTTP call", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = fakeTransport(() => { throw new Error("must never be reached"); });
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    await assert.rejects(() => provider.createCampaign({ ...CAMPAIGN_INPUT, specialAdCategory: null }, TOKEN), (e) => e.name === "MetaGraphAdsUnsupportedOperationError");
    assert.equal(transport.calls.length, 0);
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});

// ---------------------------------------------------------------------------
// PART 8 -- VERIFIED AD SET CONTRACT
// ---------------------------------------------------------------------------
test("16: createAdSet sends exactly the verified payload shape and endpoint", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = fakeTransport(() => jsonResponse(200, { id: "adset-42" }));
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    const result = await provider.createAdSet(ADSET_INPUT, TOKEN);
    const call = transport.calls[0];
    assert.match(call.url, new RegExp(`/act_${ORG_ACCOUNT_ID}/adsets$`));
    const body = JSON.parse(call.body);
    assert.deepEqual(body, {
      name: "Test Ad Set",
      campaign_id: "cmp-1",
      optimization_goal: "LEAD_GENERATION",
      targeting: { geo_locations: { countries: ["US"] } },
      promoted_object: { page_id: "page-1" },
      status: "PAUSED",
      daily_budget: 5000,
    });
    assert.equal(result.providerObjectId, "adset-42");
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});
test("17: createAdSet rejects when neither daily nor lifetime budget is supplied, without an HTTP call", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = fakeTransport(() => { throw new Error("must never be reached"); });
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    await assert.rejects(() => provider.createAdSet({ ...ADSET_INPUT, dailyBudgetMinorUnits: null, lifetimeBudgetMinorUnits: null }, TOKEN), (e) => e.name === "MetaGraphAdsUnsupportedOperationError");
    assert.equal(transport.calls.length, 0);
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});
test("18: createAdSet rejects when pageId is missing, without an HTTP call", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = fakeTransport(() => { throw new Error("must never be reached"); });
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    await assert.rejects(() => provider.createAdSet({ ...ADSET_INPUT, pageId: undefined }, TOKEN), (e) => e.name === "MetaGraphAdsUnsupportedOperationError");
    assert.equal(transport.calls.length, 0);
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});
test("19: Housing fail-closed -- custom age is rejected without an HTTP call", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = fakeTransport(() => { throw new Error("must never be reached"); });
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    const poisoned = { ...ADSET_INPUT, targetingSpec: { geo_locations: { countries: ["US"] }, age_min: 25, age_max: 45 } };
    await assert.rejects(() => provider.createAdSet(poisoned, TOKEN), (e) => e.name === "MetaGraphAdsUnsupportedOperationError");
    assert.equal(transport.calls.length, 0);
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});
test("20: Housing fail-closed -- custom gender is rejected without an HTTP call", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = fakeTransport(() => { throw new Error("must never be reached"); });
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    const poisoned = { ...ADSET_INPUT, targetingSpec: { geo_locations: { countries: ["US"] }, genders: [1] } };
    await assert.rejects(() => provider.createAdSet(poisoned, TOKEN), (e) => e.name === "MetaGraphAdsUnsupportedOperationError");
    assert.equal(transport.calls.length, 0);
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});
test("21: Housing fail-closed -- lookalike audience is rejected without an HTTP call", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = fakeTransport(() => { throw new Error("must never be reached"); });
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    const poisoned = { ...ADSET_INPUT, targetingSpec: { geo_locations: { countries: ["US"] }, lookalike_audiences: ["123"] } };
    await assert.rejects(() => provider.createAdSet(poisoned, TOKEN), (e) => e.name === "MetaGraphAdsUnsupportedOperationError");
    assert.equal(transport.calls.length, 0);
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});
test("22: unsupported/city-level targeting is rejected rather than fabricating a provider ID", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = fakeTransport(() => { throw new Error("must never be reached"); });
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    const poisoned = { ...ADSET_INPUT, targetingSpec: { geo_locations: { countries: ["US"], cities: [{ key: "2418779" }] } } };
    await assert.rejects(() => provider.createAdSet(poisoned, TOKEN), (e) => e.name === "MetaGraphAdsUnsupportedOperationError");
    assert.equal(transport.calls.length, 0);
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});
test("23: createAdSet payload never contains destination_type, billing_event, or bid_strategy", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = fakeTransport(() => jsonResponse(200, { id: "adset-1" }));
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    await provider.createAdSet(ADSET_INPUT, TOKEN);
    const body = JSON.parse(transport.calls[0].body);
    assert.ok(!("destination_type" in body));
    assert.ok(!("billing_event" in body));
    assert.ok(!("bid_strategy" in body));
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});

// ---------------------------------------------------------------------------
// PART 9 -- CREATIVE: NOT YET CERTIFIED
// ---------------------------------------------------------------------------
test("24: createCreative is implemented only to a typed not-yet-certified error -- no HTTP call, no guessed payload", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = fakeTransport(() => { throw new Error("must never be reached"); });
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    await assert.rejects(
      () => provider.createCreative({ providerAdSetId: "adset-1", storagePath: "x", format: "single_image" }, TOKEN),
      (e) => e.name === "MetaGraphAdsUnsupportedOperationError",
    );
    assert.equal(transport.calls.length, 0);
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});
test("25: no video creative, no carousel, no image upload, no legal_content construction exists anywhere in the provider source", () => {
  assert.doesNotMatch(providerSrc, /video_data|carousel/i);
  assert.doesNotMatch(providerSrc, /adimages|advideos|image_hash\s*[:=]\s*["'`][^"'`]/i);
  assert.doesNotMatch(providerSrc, /legal_content|privacy_policy|custom_disclaimer/i);
});

// ---------------------------------------------------------------------------
// PART 10 -- AD CONTRACT
// ---------------------------------------------------------------------------
test("26: createAd sends exactly the verified payload shape and endpoint, status always PAUSED", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = fakeTransport(() => jsonResponse(200, { id: "ad-42" }));
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    const result = await provider.createAd(AD_INPUT, TOKEN);
    const call = transport.calls[0];
    assert.match(call.url, new RegExp(`/act_${ORG_ACCOUNT_ID}/ads$`));
    const body = JSON.parse(call.body);
    assert.deepEqual(body, { name: "Test Ad", adset_id: "adset-1", creative: { creative_id: "creative-1" }, status: "PAUSED" });
    assert.equal(result.providerObjectId, "ad-42");
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});
test("27: no ACTIVE status is ever sent by any create method", () => {
  for (const methodName of ["createCampaign", "createAdSet", "createAd"]) {
    const start = providerSrc.indexOf(`async ${methodName}(`);
    assert.ok(start >= 0, `${methodName} must exist`);
    const nextMethod = providerSrc.indexOf("\n  async ", start + 1);
    const body = nextMethod >= 0 ? providerSrc.slice(start, nextMethod) : providerSrc.slice(start);
    assert.doesNotMatch(body, /status:\s*"ACTIVE"/, `${methodName} must never set status to ACTIVE`);
  }
});

// ---------------------------------------------------------------------------
// PART 11 -- STATUS READ
// ---------------------------------------------------------------------------
test("28: getCampaignStatus reads the verified fields via GET", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = fakeTransport(() => jsonResponse(200, { effective_status: "ACTIVE", status: "ACTIVE" }));
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    const result = await provider.getCampaignStatus("cmp-1", TOKEN);
    assert.equal(transport.calls[0].method, "GET");
    assert.match(transport.calls[0].url, /\/cmp-1\?fields=effective_status,status$/);
    assert.equal(result.status, "ACTIVE");
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});
test("29: every known effective_status value maps to itself, not to a fabricated success", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const known = ["ACTIVE", "PAUSED", "DELETED", "ARCHIVED", "IN_PROCESS", "WITH_ISSUES", "PENDING_REVIEW", "DISAPPROVED", "PREAPPROVED", "PENDING_BILLING_INFO", "CAMPAIGN_PAUSED", "ADSET_PAUSED"];
    const { MetaGraphAdsProvider } = loadProvider();
    for (const status of known) {
      const transport = fakeTransport(() => jsonResponse(200, { effective_status: status }));
      const provider = new MetaGraphAdsProvider({ transport });
      const result = await provider.getCampaignStatus("cmp-1", TOKEN);
      assert.equal(result.status, status);
    }
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});
test("30: an unrecognized/unknown effective_status value MUST NOT become success -- it maps to \"uncertain\"", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = fakeTransport(() => jsonResponse(200, { effective_status: "SOME_FUTURE_STATUS_VALUE_NOT_YET_SEEN" }));
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    const result = await provider.getCampaignStatus("cmp-1", TOKEN);
    assert.equal(result.status, "uncertain");
    assert.notEqual(result.status, "ACTIVE");
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});
test("31: a missing/absent effective_status field also maps to \"uncertain\", never to success", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = fakeTransport(() => jsonResponse(200, {}));
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    const result = await provider.getCampaignStatus("cmp-1", TOKEN);
    assert.equal(result.status, "uncertain");
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});

// ---------------------------------------------------------------------------
// PART 12 -- PAUSE / RESUME
// ---------------------------------------------------------------------------
test("32: pauseCampaign sends status=PAUSED to the object-scoped endpoint", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = fakeTransport(() => jsonResponse(200, { success: true }));
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    await provider.pauseCampaign("cmp-1", TOKEN);
    assert.match(transport.calls[0].url, /\/cmp-1$/);
    assert.deepEqual(JSON.parse(transport.calls[0].body), { status: "PAUSED" });
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});
test("33: resumeCampaign sends status=ACTIVE to the object-scoped endpoint", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = fakeTransport(() => jsonResponse(200, { success: true }));
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    await provider.resumeCampaign("cmp-1", TOKEN);
    assert.deepEqual(JSON.parse(transport.calls[0].body), { status: "ACTIVE" });
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});

// ---------------------------------------------------------------------------
// PART 13 -- ERROR CLASSIFICATION
// ---------------------------------------------------------------------------
const { classifyMetaGraphAdsError } = load("features/vayon/meta-ads/providers/meta-graph-ads-errors.ts");
test("34: is_transient:true classifies as TRANSIENT regardless of code", () => {
  const e = classifyMetaGraphAdsError(500, { error: { message: "x", code: 2, is_transient: true } });
  assert.equal(e.classification, "TRANSIENT");
});
test("35: code 190/102 classifies as AUTH_INVALID", () => {
  assert.equal(classifyMetaGraphAdsError(401, { error: { message: "x", code: 190 } }).classification, "AUTH_INVALID");
  assert.equal(classifyMetaGraphAdsError(401, { error: { message: "x", code: 102 } }).classification, "AUTH_INVALID");
});
test("36: code 10/200/294 classifies as PERMISSION_DENIED", () => {
  for (const code of [10, 200, 294]) assert.equal(classifyMetaGraphAdsError(403, { error: { message: "x", code } }).classification, "PERMISSION_DENIED");
});
test("37: code 4/17 or HTTP 429 classifies as RATE_LIMITED", () => {
  assert.equal(classifyMetaGraphAdsError(400, { error: { message: "x", code: 4 } }).classification, "RATE_LIMITED");
  assert.equal(classifyMetaGraphAdsError(400, { error: { message: "x", code: 17 } }).classification, "RATE_LIMITED");
  assert.equal(classifyMetaGraphAdsError(429, { error: { message: "x", code: 999 } }).classification, "RATE_LIMITED");
});
test("38: an unrecognized error shape classifies as UNKNOWN_PROVIDER_ERROR, never something safe", () => {
  assert.equal(classifyMetaGraphAdsError(500, {}).classification, "UNKNOWN_PROVIDER_ERROR");
  assert.equal(classifyMetaGraphAdsError(500, null).classification, "UNKNOWN_PROVIDER_ERROR");
});
test("39: classification never depends on error_user_title/error_user_msg/fbtrace_id (these names may appear only in prose comments explaining the exclusion, never as an actual property access)", () => {
  assert.doesNotMatch(errorsSrc, /\.error_user_title|\.error_user_msg|\.fbtrace_id|err\?\.(error_user_title|error_user_msg|fbtrace_id)/);
});
test("40: no exhaustive hardcoded policy-subcode list exists", () => {
  assert.doesNotMatch(errorsSrc, /2490427|2490468|1404163/);
});
test("41: a network-level throw during dispatch classifies as UNCERTAIN_NETWORK_OUTCOME, never success, never auto-retried", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = { async fetch() { throw new Error("ECONNRESET"); } };
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    await assert.rejects(() => provider.createCampaign(CAMPAIGN_INPUT, TOKEN), (e) => e.name === "MetaGraphAdsUncertainNetworkOutcomeError" && e.classification === "UNCERTAIN_NETWORK_OUTCOME");
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});
test("42: an unparseable response body also classifies as UNCERTAIN_NETWORK_OUTCOME", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = { async fetch() { return { status: 200, headers: {}, json: async () => { throw new Error("bad json"); } }; } };
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    await assert.rejects(() => provider.createCampaign(CAMPAIGN_INPUT, TOKEN), (e) => e.classification === "UNCERTAIN_NETWORK_OUTCOME");
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});

// ---------------------------------------------------------------------------
// PART 14 -- RATE-LIMIT PARSING
// ---------------------------------------------------------------------------
const { parseMetaGraphAdsRateLimitHeaders } = load("features/vayon/meta-ads/providers/meta-graph-ads-errors.ts");
test("43: rate-limit headers are parsed when present, without any hardcoded numeric constant", () => {
  const snapshot = parseMetaGraphAdsRateLimitHeaders({ "x-ad-account-usage": JSON.stringify({ acc_id_util_pct: 12 }), "x-business-use-case-usage": JSON.stringify({ call_count: 3 }) });
  assert.deepEqual(snapshot.adAccountUsage, { acc_id_util_pct: 12 });
  assert.deepEqual(snapshot.businessUseCaseUsage, { call_count: 3 });
});
test("44: missing rate-limit headers parse safely to null, not an assumed default", () => {
  const snapshot = parseMetaGraphAdsRateLimitHeaders({});
  assert.equal(snapshot.adAccountUsage, null);
  assert.equal(snapshot.businessUseCaseUsage, null);
});
test("45: no numeric quota constant is hardcoded anywhere in provider or error source", () => {
  assert.doesNotMatch(providerSrc, /190000|600\s*\*|400\s*\*/);
  assert.doesNotMatch(errorsSrc, /190000|600\s*\*|400\s*\*/);
});
test("46: the provider exposes the last parsed rate-limit snapshot for a future worker policy to consume", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = fakeTransport(() => jsonResponse(200, { id: "cmp-1" }, { "x-ad-account-usage": JSON.stringify({ acc_id_util_pct: 50 }) }));
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    await provider.createCampaign(CAMPAIGN_INPUT, TOKEN);
    assert.deepEqual(provider.rateLimitSnapshot().adAccountUsage, { acc_id_util_pct: 50 });
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});

// ---------------------------------------------------------------------------
// PART 15 -- IDEMPOTENCY / RECONCILIATION
// ---------------------------------------------------------------------------
test("47: no Meta idempotency-key header is invented anywhere in the provider source", () => {
  assert.doesNotMatch(providerSrc, /idempotency|Idempotency-Key|client_mutation_id|creation_token/i);
});
test("48: no blind create retry loop exists in the provider source", () => {
  assert.doesNotMatch(providerSrc, /for\s*\(.*retry|while\s*\(.*retry|retryCount|maxRetries/i);
});
test("49: an ambiguous network outcome is never automatically re-sent as a second create by this provider (single dispatch per call)", async () => {
  process.env.META_MARKETING_WRITES_ENABLED = "true";
  try {
    const transport = { calls: 0, async fetch() { this.calls += 1; throw new Error("timeout"); } };
    const { MetaGraphAdsProvider } = loadProvider();
    const provider = new MetaGraphAdsProvider({ transport });
    await assert.rejects(() => provider.createCampaign(CAMPAIGN_INPUT, TOKEN));
    assert.equal(transport.calls, 1, "exactly one dispatch attempt -- no automatic retry");
  } finally {
    delete process.env.META_MARKETING_WRITES_ENABLED;
  }
});

// ---------------------------------------------------------------------------
// PART 16 -- AD ACCOUNT PUBLISH-READINESS HELPER (pure, no API call)
// ---------------------------------------------------------------------------
const { isAdAccountPublishReady } = load("features/vayon/meta-ads/publish-readiness.ts");
test("50: ACTIVE + MANAGE -> true", () => {
  assert.equal(isAdAccountPublishReady({ accountStatus: 1, userTasks: ["MANAGE"] }), true);
});
test("51: ACTIVE + ADVERTISE/ANALYZE/DRAFT (no MANAGE) -> false", () => {
  assert.equal(isAdAccountPublishReady({ accountStatus: 1, userTasks: ["ADVERTISE"] }), false);
  assert.equal(isAdAccountPublishReady({ accountStatus: 1, userTasks: ["ANALYZE"] }), false);
  assert.equal(isAdAccountPublishReady({ accountStatus: 1, userTasks: ["DRAFT"] }), false);
});
test("52: DISABLED/UNSETTLED/PENDING_RISK_REVIEW + MANAGE -> false", () => {
  assert.equal(isAdAccountPublishReady({ accountStatus: 2, userTasks: ["MANAGE"] }), false);
  assert.equal(isAdAccountPublishReady({ accountStatus: 3, userTasks: ["MANAGE"] }), false);
  assert.equal(isAdAccountPublishReady({ accountStatus: 7, userTasks: ["MANAGE"] }), false);
});
test("53: an unknown account status -> false", () => {
  assert.equal(isAdAccountPublishReady({ accountStatus: 9999, userTasks: ["MANAGE"] }), false);
});
test("54: this helper makes no API call and is not wired into M1/M2's existing connection flow", () => {
  const helperSrc = rd("features/vayon/meta-ads/publish-readiness.ts");
  assert.doesNotMatch(helperSrc, /fetch\(|\.rpc\(|from\(/);
  const m1m2ServiceSrc = rd("features/platform/integrations/meta-marketing/services/meta-marketing.service.ts");
  assert.doesNotMatch(m1m2ServiceSrc, /isAdAccountPublishReady/);
});

// ---------------------------------------------------------------------------
// PART 17 -- OAUTH SCOPE CONSTANTS (unwired)
// ---------------------------------------------------------------------------
const { futureMetaAdsPublishingOAuthScopes } = load("features/vayon/meta-ads/future-oauth-scopes.ts");
test("55: the future publishing scope set is exactly pages_show_list, leads_retrieval, ads_management, pages_manage_ads", () => {
  assert.deepEqual([...futureMetaAdsPublishingOAuthScopes], ["pages_show_list", "leads_retrieval", "ads_management", "pages_manage_ads"]);
});
test("56: business_management, ads_read, and instagram_basic are NOT in the future scope set", () => {
  assert.ok(!futureMetaAdsPublishingOAuthScopes.includes("business_management"));
  assert.ok(!futureMetaAdsPublishingOAuthScopes.includes("ads_read"));
  assert.ok(!futureMetaAdsPublishingOAuthScopes.includes("instagram_basic"));
});
test("57: the LIVE OAuth flow's scope constant is untouched by this phase -- still exactly pages_show_list, leads_retrieval", () => {
  assert.match(liveOAuthTypesSrc, /metaMarketingOAuthScopes = \["pages_show_list", "leads_retrieval"\] as const/);
});
test("58: the live OAuth callback/authorization-url builder never references the future scope constant", () => {
  const callbackSrc = rd("app/integrations/meta/callback/route.ts");
  assert.doesNotMatch(callbackSrc, /futureMetaAdsPublishingOAuthScopes/);
});

// ---------------------------------------------------------------------------
// PART 19 -- ADDITIONAL NEGATIVE CONTRACT TESTS
// ---------------------------------------------------------------------------
test("59: no real fetch/XMLHttpRequest is ever called directly by the provider -- it only calls this.transport.fetch()", () => {
  // Distinguish an *invocation* (await fetch(, = fetch(, return fetch() from a
  // *declaration* (interface method signature `fetch(url...)`, or the
  // unconfiguredTransport object's `async fetch(): Promise<...>` shorthand).
  const invocationLike = [...providerSrc.matchAll(/(?:await|return|=)\s*fetch\(/g)];
  assert.equal(invocationLike.length, 0, "the provider must never invoke the global fetch() directly");
  assert.doesNotMatch(providerSrc, /XMLHttpRequest/);
  assert.match(providerSrc, /this\.transport\.fetch\(/);
});
test("60: the provider never reads business_management/ads_read/instagram_basic anywhere in its own source", () => {
  assert.doesNotMatch(providerSrc, /business_management|ads_read|instagram_basic/);
});

// ---------------------------------------------------------------------------
// PART 20 -- WIRING PROOF
// ---------------------------------------------------------------------------
test("61: FakeMetaAdsProvider remains the only provider MetaPublishWorker's default constructs", () => {
  assert.match(serviceSrc, /private provider: MetaAdsProvider = new FakeMetaAdsProvider\(\)/);
  assert.doesNotMatch(serviceSrc, /MetaGraphAdsProvider/);
});
test("62: MetaGraphAdsProvider has zero production call sites -- no route/action/service/worker/factory constructs it", () => {
  let output = "";
  try {
    // Anchored on the literal "(" so this never substring-matches the unrelated
    // MetaGraphAdsProviderError/MetaGraphAdsUncertainNetworkOutcomeError classes.
    output = execSync('git grep -ln "new MetaGraphAdsProvider(" -- app features', { cwd: process.cwd() }).toString().trim();
  } catch (error) {
    if (error.status !== 1) throw error; // exit 1 = no matches found, which is the required/expected outcome
  }
  const files = output.split("\n").filter(Boolean);
  assert.deepEqual(files, [], `MetaGraphAdsProvider must only be constructed by tests, found in: ${files.join(", ")}`);
});
test("63: the provider file itself carries an explicit dead/unwired disclosure comment", () => {
  assert.match(providerSrc, /DEAD \/ UNWIRED CODE/);
});
test("64: MetaAdsProvider interface additions are optional and do not break FakeMetaAdsProvider's existing method signatures", () => {
  assert.match(interfaceSrc, /adAccountId\?:\s*string/);
  assert.match(interfaceSrc, /pageId\?:\s*string/);
  // FakeMetaAdsProvider's methods are unmodified -- still destructure only their original fields.
  assert.match(interfaceSrc, /async createAdSet\(input: MetaAdSetInput\): Promise<MetaProviderCreateResult> \{\s*return \{ providerObjectId: this\.nextId\(`\$\{input\.providerCampaignId\}:adset`\), status: "PAUSED" \};/);
});

// ---------------------------------------------------------------------------
// PART 21 -- NO MIGRATION
// ---------------------------------------------------------------------------
test("65: no new migration file is part of this phase", () => {
  const output = execSync("git status --short -- supabase/migrations/", { cwd: process.cwd() }).toString();
  assert.doesNotMatch(output, /2026120[7-9]|202612[1-9]/, "no ADS-B4B-dated migration should exist");
});
