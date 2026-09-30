/**
 * Part 9: Meta ADS provider interface -- deliberately separate from the
 * existing, unmodified MetaMarketingProvider (features/platform/
 * integrations/meta-marketing/providers/meta-graph.provider.ts), which is
 * discovery/lead-form-only by its own documented design. No real
 * implementation exists in ADS-B3 -- FakeMetaAdsProvider is deterministic
 * and used everywhere; a future real implementation must call
 * requireMetaMarketingWritesEnabled() (the existing, reused guard) before
 * any network request, exactly like createLeadForm already does.
 */

export interface MetaCampaignInput {
  readonly adAccountId: string;
  readonly name: string;
  readonly objective: string;
  readonly specialAdCategory: string | null;
}
export interface MetaAdSetInput {
  readonly providerCampaignId: string;
  readonly name: string;
  readonly dailyBudgetMinorUnits: number | null;
  readonly lifetimeBudgetMinorUnits: number | null;
  readonly targetingSpec: unknown;
  /** ADS-B4B: optional, unused by FakeMetaAdsProvider. A real provider needs the ad account (adsets are account-scoped: POST /act_{id}/adsets) and the Page (promoted_object.page_id, required for lead-gen ad sets) that the fake provider never had to know about. */
  readonly adAccountId?: string;
  readonly pageId?: string;
}
/** ADS-B4D: the Meta-verified call_to_action.type allowlist for the certified static-image Instant Form creative contract. */
export type MetaCreativeCtaType = "APPLY_NOW" | "DOWNLOAD" | "GET_QUOTE" | "LEARN_MORE" | "SIGN_UP" | "SUBSCRIBE";

export interface MetaCreativeInput {
  readonly providerAdSetId: string;
  readonly storagePath: string;
  readonly format: string;
  /**
   * ADS-B4D: optional, unused by FakeMetaAdsProvider. Required by
   * MetaGraphAdsProvider.createCreative() for the certified static-image
   * Instant Form creative contract only -- object_story_spec.page_id,
   * link_data.message/description/image_hash, and
   * call_to_action.value.lead_gen_form_id. description is the one optional
   * field in this set; the rest are required and fail closed before any
   * HTTP call.
   */
  readonly adAccountId?: string;
  readonly pageId?: string;
  readonly primaryText?: string;
  readonly description?: string;
  readonly imageHash?: string;
  readonly leadGenFormId?: string;
  readonly ctaType?: MetaCreativeCtaType;
}
export interface MetaAdInput {
  readonly providerAdSetId: string;
  readonly providerCreativeId: string;
  readonly name: string;
  /** ADS-B4B: optional, unused by FakeMetaAdsProvider. Ads are account-scoped (POST /act_{id}/ads). */
  readonly adAccountId?: string;
}
export interface MetaProviderCreateResult {
  readonly providerObjectId: string;
  readonly status: string;
}
export interface MetaCampaignStatusResult {
  readonly providerObjectId: string;
  readonly status: string;
  readonly reviewFeedback: string | null;
}

export interface MetaAdsProvider {
  createCampaign(input: MetaCampaignInput, accessToken: string): Promise<MetaProviderCreateResult>;
  createAdSet(input: MetaAdSetInput, accessToken: string): Promise<MetaProviderCreateResult>;
  createCreative(input: MetaCreativeInput, accessToken: string): Promise<MetaProviderCreateResult>;
  createAd(input: MetaAdInput, accessToken: string): Promise<MetaProviderCreateResult>;
  pauseCampaign(providerCampaignId: string, accessToken: string): Promise<void>;
  resumeCampaign(providerCampaignId: string, accessToken: string): Promise<void>;
  getCampaignStatus(providerCampaignId: string, accessToken: string): Promise<MetaCampaignStatusResult>;
}

/**
 * Deterministic, in-memory, no-network fake. Every id is derived from its
 * input so tests are reproducible; nothing here ever calls fetch or reads
 * an env var.
 */
export class FakeMetaAdsProvider implements MetaAdsProvider {
  private counter = 0;
  private nextId(prefix: string): string {
    this.counter += 1;
    return `fake:${prefix}:${this.counter}`;
  }

  async createCampaign(input: MetaCampaignInput): Promise<MetaProviderCreateResult> {
    return { providerObjectId: this.nextId(`${input.adAccountId}:campaign`), status: "PAUSED" };
  }
  async createAdSet(input: MetaAdSetInput): Promise<MetaProviderCreateResult> {
    return { providerObjectId: this.nextId(`${input.providerCampaignId}:adset`), status: "PAUSED" };
  }
  async createCreative(input: MetaCreativeInput): Promise<MetaProviderCreateResult> {
    return { providerObjectId: this.nextId(`${input.providerAdSetId}:creative`), status: "ACTIVE" };
  }
  async createAd(input: MetaAdInput): Promise<MetaProviderCreateResult> {
    return { providerObjectId: this.nextId(`${input.providerAdSetId}:ad`), status: "PAUSED" };
  }
  async pauseCampaign(): Promise<void> {}
  async resumeCampaign(): Promise<void> {}
  async getCampaignStatus(providerCampaignId: string): Promise<MetaCampaignStatusResult> {
    return { providerObjectId: providerCampaignId, status: "PAUSED", reviewFeedback: null };
  }
}
