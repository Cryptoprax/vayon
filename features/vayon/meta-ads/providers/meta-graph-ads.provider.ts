import "server-only";
import { requireMetaMarketingWritesEnabled } from "@/features/platform/integrations/meta-marketing/providers/meta-graph.provider";
import type { MetaAdsProvider, MetaCampaignInput, MetaAdSetInput, MetaCreativeInput, MetaCreativeCtaType, MetaAdInput, MetaProviderCreateResult, MetaCampaignStatusResult } from "./meta-ads.provider";
import { classifyMetaGraphAdsError, parseMetaGraphAdsRateLimitHeaders, MetaGraphAdsUncertainNetworkOutcomeError, MetaGraphAdsUnsupportedOperationError, type MetaGraphAdsRateLimitSnapshot } from "./meta-graph-ads-errors";

/**
 * ADS-B4B: a real Meta Marketing API provider implementation.
 *
 * DEAD / UNWIRED CODE. No production route, action, service, worker, or
 * factory instantiates this class anywhere in this commit --
 * MetaPublishWorker's default remains `new FakeMetaAdsProvider()`
 * (meta-ads.service.ts) and is unchanged. This class exists only to be
 * exercised directly by unit tests, all of which inject a mocked
 * MetaGraphTransport (see below) -- no real `fetch` is ever reachable from a
 * test. Wiring this in requires a separately-authorized phase, which itself
 * requires OAuth scopes VAYON does not yet request (ads_management,
 * pages_manage_ads -- see future-oauth-scopes.ts), Business Verification,
 * and App Review, none of which exist yet either.
 *
 * Every mutating method independently calls requireMetaMarketingWritesEnabled()
 * before touching the token or constructing a request, in addition to (not
 * instead of) MetaPublishWorker's own existing worker-level guard -- so a
 * future refactor that accidentally constructs this provider outside the
 * worker still fails closed.
 *
 * Token handling: this class never stores, derives, or logs a token. Every
 * method receives an already-decrypted access token from its caller, which
 * per this phase's own instruction must obtain it exclusively through the
 * existing encrypted Meta Marketing connection infrastructure
 * (MetaMarketingRepository.getEncryptedToken() + TokenCryptoService.decrypt(),
 * both already committed, both untouched by this phase). No new token
 * storage is introduced.
 */

export interface MetaGraphTransportResponse {
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  json(): Promise<unknown>;
}

export interface MetaGraphTransport {
  fetch(url: string, init: { readonly method: string; readonly headers: Readonly<Record<string, string>>; readonly body?: string }): Promise<MetaGraphTransportResponse>;
}

/**
 * The default transport when none is injected. It always throws rather than
 * ever attempting a real network call -- this is what makes "tests must fail
 * if an actual network request is attempted" true even for a test that
 * forgets to inject a mock: it fails immediately and loudly, not silently
 * over the network.
 */
const unconfiguredTransport: MetaGraphTransport = {
  async fetch(): Promise<MetaGraphTransportResponse> {
    throw new Error("MetaGraphAdsProvider: no transport configured. This would be a real network call. Tests must inject a mock MetaGraphTransport; production code must never construct this class at all.");
  },
};

/**
 * ADS-B4A2 found the Marketing API's version deprecation window is separate
 * from (and much shorter than) the general Graph API's 2-year policy, and
 * that v23.0 (the existing META_GRAPH_VERSION default used by M1-M8 lead
 * ingestion, untouched by this phase) is already stale for Marketing API
 * calls specifically. This provider therefore has its OWN, fully isolated
 * version default -- it never reads process.env.META_GRAPH_VERSION.
 */
const DEFAULT_ADS_API_VERSION = "v26.0";

export interface MetaGraphAdsProviderOptions {
  readonly apiVersion?: string;
  readonly transport?: MetaGraphTransport;
}

export class MetaGraphAdsProvider implements MetaAdsProvider {
  private readonly apiVersion: string;
  private readonly transport: MetaGraphTransport;
  private lastRateLimitSnapshot: MetaGraphAdsRateLimitSnapshot | null = null;

  constructor(options: MetaGraphAdsProviderOptions = {}) {
    this.apiVersion = options.apiVersion ?? DEFAULT_ADS_API_VERSION;
    this.transport = options.transport ?? unconfiguredTransport;
  }

  /** Exposes the most recently parsed rate-limit snapshot for a future worker-level backoff policy. Never a hardcoded constant. */
  rateLimitSnapshot(): MetaGraphAdsRateLimitSnapshot | null {
    return this.lastRateLimitSnapshot;
  }

  private url(path: string): string {
    return `https://graph.facebook.com/${this.apiVersion}${path}`;
  }

  private async send(method: "POST" | "GET", path: string, accessToken: string, body?: Record<string, unknown>): Promise<Record<string, unknown>> {
    let response: MetaGraphTransportResponse;
    try {
      response = await this.transport.fetch(this.url(path), {
        method,
        headers: { "content-type": "application/json", authorization: `Bearer ${accessToken}` },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
    } catch (error) {
      // Dispatch failed or was interrupted -- the object may or may not have
      // been created on Meta's side. Never treated as success, never retried here.
      throw new MetaGraphAdsUncertainNetworkOutcomeError(error instanceof Error ? error.message : "network_error");
    }
    this.lastRateLimitSnapshot = parseMetaGraphAdsRateLimitHeaders(response.headers);
    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw new MetaGraphAdsUncertainNetworkOutcomeError("unparseable_response");
    }
    if (response.status >= 200 && response.status < 300) return (json ?? {}) as Record<string, unknown>;
    throw classifyMetaGraphAdsError(response.status, json);
  }

  async createCampaign(input: MetaCampaignInput, accessToken: string): Promise<MetaProviderCreateResult> {
    requireMetaMarketingWritesEnabled();
    if (input.objective !== "lead_generation") {
      throw new MetaGraphAdsUnsupportedOperationError(`createCampaign: objective "${input.objective}" is not certified -- only "lead_generation" (maps to Meta's OUTCOME_LEADS) is implemented`);
    }
    if (input.specialAdCategory !== "housing") {
      throw new MetaGraphAdsUnsupportedOperationError(`createCampaign: specialAdCategory "${String(input.specialAdCategory)}" is not certified -- only "housing" (maps to Meta's HOUSING) is implemented`);
    }
    const body = {
      name: input.name,
      objective: "OUTCOME_LEADS",
      special_ad_categories: ["HOUSING"],
      status: "PAUSED",
    };
    const result = await this.send("POST", `/act_${input.adAccountId}/campaigns`, accessToken, body);
    return { providerObjectId: String(result.id), status: "PAUSED" };
  }

  async createAdSet(input: MetaAdSetInput, accessToken: string): Promise<MetaProviderCreateResult> {
    requireMetaMarketingWritesEnabled();
    if (!input.adAccountId) throw new MetaGraphAdsUnsupportedOperationError("createAdSet: adAccountId is required (ad sets are account-scoped: POST /act_{id}/adsets)");
    if (!input.pageId) throw new MetaGraphAdsUnsupportedOperationError("createAdSet: pageId is required (promoted_object.page_id, required for lead-gen ad sets)");
    if (input.dailyBudgetMinorUnits == null && input.lifetimeBudgetMinorUnits == null) {
      throw new MetaGraphAdsUnsupportedOperationError("createAdSet: either dailyBudgetMinorUnits or lifetimeBudgetMinorUnits is required");
    }
    const targeting = certifyHousingSafeTargeting(input.targetingSpec);
    const body: Record<string, unknown> = {
      name: input.name,
      campaign_id: input.providerCampaignId,
      optimization_goal: "LEAD_GENERATION",
      // ADS-B4C officially verified these two fixed values for VAYON's
      // certified V1 flow (OUTCOME_LEADS + LEAD_GENERATION + Instant Form):
      // billing_event is always "IMPRESSIONS", destination_type is always
      // "ON_AD" (the Instant Form opens on the ad itself, never off-platform).
      // Both are fixed provider-side constants, never caller-controlled.
      billing_event: "IMPRESSIONS",
      destination_type: "ON_AD",
      targeting,
      promoted_object: { page_id: input.pageId },
      status: "PAUSED",
      // bid_strategy is deliberately OMITTED -- still unverified (ADS-B4C Part 8).
    };
    if (input.dailyBudgetMinorUnits != null) body.daily_budget = input.dailyBudgetMinorUnits;
    if (input.lifetimeBudgetMinorUnits != null) body.lifetime_budget = input.lifetimeBudgetMinorUnits;
    const result = await this.send("POST", `/act_${input.adAccountId}/adsets`, accessToken, body);
    return { providerObjectId: String(result.id), status: "PAUSED" };
  }

  /**
   * ADS-B4D: implements ONLY the ADS-B4C-certified static-image Instant Form
   * creative contract (object_story_spec.link_data with a fixed
   * "https://fb.me/" link and call_to_action.value.lead_gen_form_id). Other
   * creative formats, image upload, and lead-form creation remain out of
   * scope -- this method consumes an already-uploaded imageHash and an
   * already-created leadGenFormId, it never creates either. Every required
   * field is validated before any HTTP call; nothing is fabricated.
   */
  async createCreative(input: MetaCreativeInput, accessToken: string): Promise<MetaProviderCreateResult> {
    requireMetaMarketingWritesEnabled();
    if (!input.adAccountId) throw new MetaGraphAdsUnsupportedOperationError("createCreative: adAccountId is required (ad creatives are account-scoped: POST /act_{id}/adcreatives)");
    if (isBlank(input.pageId)) throw new MetaGraphAdsUnsupportedOperationError("createCreative: pageId is required (object_story_spec.page_id)");
    if (isBlank(input.primaryText)) throw new MetaGraphAdsUnsupportedOperationError("createCreative: primaryText is required (link_data.message)");
    if (isBlank(input.imageHash)) throw new MetaGraphAdsUnsupportedOperationError("createCreative: imageHash is required (link_data.image_hash) -- this method never uploads an image, it only consumes an existing hash");
    if (isBlank(input.leadGenFormId)) throw new MetaGraphAdsUnsupportedOperationError("createCreative: leadGenFormId is required (call_to_action.value.lead_gen_form_id) -- this method never creates a lead form, it only consumes an existing form id");
    if (!input.ctaType || !CERTIFIED_CTA_TYPES.has(input.ctaType)) {
      throw new MetaGraphAdsUnsupportedOperationError(`createCreative: ctaType "${String(input.ctaType)}" is not certified -- only ${[...CERTIFIED_CTA_TYPES].join(", ")} are implemented`);
    }
    const linkData: Record<string, unknown> = {
      message: input.primaryText,
      image_hash: input.imageHash,
      // Fixed per the certified Instant Form contract (ADS-B4C Part 6) --
      // lead ads never send the user off-platform; the Instant Form opens
      // in-app. This is never a caller-controlled/arbitrary destination URL.
      link: "https://fb.me/",
      call_to_action: {
        type: input.ctaType,
        value: { lead_gen_form_id: input.leadGenFormId },
      },
    };
    if (!isBlank(input.description)) linkData.description = input.description;
    const body = {
      object_story_spec: {
        page_id: input.pageId,
        link_data: linkData,
      },
    };
    const result = await this.send("POST", `/act_${input.adAccountId}/adcreatives`, accessToken, body);
    // Ad creatives have no PAUSED/ACTIVE lifecycle of their own (unlike
    // campaigns/ad sets/ads) -- "CREATED" is used rather than PAUSED to
    // avoid implying a status concept that doesn't apply to this object type.
    return { providerObjectId: String(result.id), status: "CREATED" };
  }

  async createAd(input: MetaAdInput, accessToken: string): Promise<MetaProviderCreateResult> {
    requireMetaMarketingWritesEnabled();
    if (!input.adAccountId) throw new MetaGraphAdsUnsupportedOperationError("createAd: adAccountId is required (ads are account-scoped: POST /act_{id}/ads)");
    const body = {
      name: input.name,
      adset_id: input.providerAdSetId,
      creative: { creative_id: input.providerCreativeId },
      status: "PAUSED",
    };
    const result = await this.send("POST", `/act_${input.adAccountId}/ads`, accessToken, body);
    return { providerObjectId: String(result.id), status: "PAUSED" };
  }

  async pauseCampaign(providerCampaignId: string, accessToken: string): Promise<void> {
    requireMetaMarketingWritesEnabled();
    await this.send("POST", `/${providerCampaignId}`, accessToken, { status: "PAUSED" });
  }

  async resumeCampaign(providerCampaignId: string, accessToken: string): Promise<void> {
    requireMetaMarketingWritesEnabled();
    await this.send("POST", `/${providerCampaignId}`, accessToken, { status: "ACTIVE" });
  }

  /**
   * Read-only, but still gated behind the same write-enabled flag, matching
   * the existing worker-level precedent (meta-ads.service.ts's
   * reconcileMetaExecution() already gates its own getCampaignStatus() call
   * the same way) -- defense in depth, not a weakening of the read path.
   */
  async getCampaignStatus(providerCampaignId: string, accessToken: string): Promise<MetaCampaignStatusResult> {
    requireMetaMarketingWritesEnabled();
    const result = await this.send("GET", `/${providerCampaignId}?fields=effective_status,status`, accessToken);
    const effectiveStatus = typeof result.effective_status === "string" ? result.effective_status : null;
    return {
      providerObjectId: providerCampaignId,
      status: mapEffectiveStatus(effectiveStatus),
      reviewFeedback: null,
    };
  }
}

/**
 * ADS-B4A2 Part 15's fully verified effective_status vocabulary (Campaign +
 * Ad union). Any value outside this set -- including a value this provider
 * simply doesn't recognize -- maps to "uncertain", never to a success state.
 */
const KNOWN_EFFECTIVE_STATUSES = new Set([
  "ACTIVE",
  "PAUSED",
  "DELETED",
  "ARCHIVED",
  "IN_PROCESS",
  "WITH_ISSUES",
  "PENDING_REVIEW",
  "DISAPPROVED",
  "PREAPPROVED",
  "PENDING_BILLING_INFO",
  "CAMPAIGN_PAUSED",
  "ADSET_PAUSED",
]);

function mapEffectiveStatus(effectiveStatus: string | null): string {
  if (effectiveStatus === null || !KNOWN_EFFECTIVE_STATUSES.has(effectiveStatus)) return "uncertain";
  return effectiveStatus;
}

/** ADS-B4C's verified call_to_action.type allowlist for lead-gen creatives. Runtime defense in depth -- the MetaCreativeCtaType TS type alone does not stop a non-typed/JS caller. */
const CERTIFIED_CTA_TYPES: ReadonlySet<MetaCreativeCtaType> = new Set(["APPLY_NOW", "DOWNLOAD", "GET_QUOTE", "LEARN_MORE", "SIGN_UP", "SUBSCRIBE"]);

function isBlank(value: string | undefined): boolean {
  return value === undefined || value.trim().length === 0;
}

/**
 * ADS-B4B (Part 8): Housing fail-closed targeting allowlist. Accepts ONLY
 * `{ geo_locations: { countries: string[] } }` -- no other key anywhere in
 * the structure. This rejects custom age, custom gender, lookalike/custom
 * audiences, city/region/zip precision, and any detailed-targeting field by
 * construction, rather than trying to enumerate and strip forbidden fields
 * (an allowlist fails closed on anything new Meta might add; a denylist
 * would not).
 */
export function certifyHousingSafeTargeting(spec: unknown): { readonly geo_locations: { readonly countries: readonly string[] } } {
  if (spec === null || typeof spec !== "object" || Array.isArray(spec)) {
    throw new MetaGraphAdsUnsupportedOperationError("targetingSpec must be an object");
  }
  const topKeys = Object.keys(spec as Record<string, unknown>);
  for (const key of topKeys) {
    if (key !== "geo_locations") {
      throw new MetaGraphAdsUnsupportedOperationError(`targetingSpec key "${key}" is not certified -- Housing fail-closed permits only geo_locations (no age, gender, detailed targeting, or lookalike/custom audiences)`);
    }
  }
  const geo = (spec as { geo_locations?: unknown }).geo_locations;
  if (geo === null || typeof geo !== "object" || Array.isArray(geo)) {
    throw new MetaGraphAdsUnsupportedOperationError("targetingSpec.geo_locations is required and must be an object");
  }
  const geoKeys = Object.keys(geo as Record<string, unknown>);
  for (const key of geoKeys) {
    if (key !== "countries") {
      throw new MetaGraphAdsUnsupportedOperationError(`targetingSpec.geo_locations key "${key}" is not certified -- Housing fail-closed permits only country-level geo (city/region/zip precision is unsupported under Housing per ADS-B4A2 Part 8)`);
    }
  }
  const countries = (geo as { countries?: unknown }).countries;
  if (!Array.isArray(countries) || countries.length === 0 || !countries.every((c) => typeof c === "string" && c.length > 0)) {
    throw new MetaGraphAdsUnsupportedOperationError("targetingSpec.geo_locations.countries must be a non-empty array of strings");
  }
  return { geo_locations: { countries: countries as readonly string[] } };
}
