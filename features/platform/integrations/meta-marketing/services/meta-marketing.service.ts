import "server-only";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { TokenCryptoService } from "@/features/platform/integrations/google/services/token-crypto.service";
import { MetaMarketingRepository } from "../repositories/meta-marketing.repository";
import { MetaOAuthStateService, OAuthStateError } from "./meta-oauth-state.service";
import { MetaGraphMarketingProvider, type MetaMarketingProvider } from "../providers/meta-graph.provider";
import { metaMarketingOAuthScopes } from "../domain/types";
import type { MetaAdAccountSummary, MetaInstagramAccountSummary, MetaLeadFormSummary, MetaPageSummary } from "../domain/types";

export class MetaConnectError extends Error {
  constructor(readonly code: "PAGE_NOT_FOUND" | "AD_ACCOUNT_NOT_FOUND" | "FORM_NOT_FOUND" | "OAUTH_DENIED" | "OAUTH_CODE_MISSING") {
    super(code);
    this.name = "MetaConnectError";
  }
}

function redirectUri(): string {
  const uri = process.env.META_OAUTH_REDIRECT_URI;
  if (!uri) throw new Error("META_OAUTH_REDIRECT_URI is not configured.");
  return uri;
}

/**
 * Discovery-and-connect orchestration for Meta Marketing (Lead Ads). This
 * phase never fetches a lead, never creates a CRM lead/property interest,
 * never publishes a campaign/ad, and never spends money -- it only lets a
 * customer authenticate with Meta and map a Lead Form to a public.properties
 * row (Model A, the same property model K4/K6 already resolve against).
 */
export class MetaMarketingService {
  constructor(
    private repository: MetaMarketingRepository,
    private oauthState: MetaOAuthStateService,
    private provider: MetaMarketingProvider,
    private crypto: TokenCryptoService,
    private organizationId: string,
    private workspaceId: string,
    private userId: string,
  ) {}

  static async production() {
    const context = await operationsContext();
    const { data } = await context.client.auth.getUser();
    if (!data.user) throw new Error("Authentication required.");
    return new MetaMarketingService(
      new MetaMarketingRepository(context.client, context.organizationId, context.workspaceId),
      new MetaOAuthStateService(context.client),
      new MetaGraphMarketingProvider(),
      new TokenCryptoService(),
      context.organizationId,
      context.workspaceId,
      data.user.id,
    );
  }

  private tenant() {
    return { organizationId: this.organizationId, workspaceId: this.workspaceId, userId: this.userId };
  }

  connection() {
    return this.repository.connection();
  }

  formMappings() {
    return this.repository.listFormMappings();
  }

  async beginConnect(returnPath: string | null): Promise<string> {
    const state = await this.oauthState.create(this.tenant(), returnPath);
    return this.provider.authorizationUrl(state, redirectUri());
  }

  /** Called from the OAuth callback route. Exchanges the code and parks the encrypted long-lived token under `state` -- it does not select a Page or persist a connection yet. */
  async handleCallback(input: { code: string | null; state: string; error: string | null }): Promise<{ state: string; returnPath: string | null }> {
    if (input.error) throw new MetaConnectError("OAUTH_DENIED");
    if (!input.code) throw new MetaConnectError("OAUTH_CODE_MISSING");
    const short = await this.provider.exchangeCode(input.code, redirectUri());
    const long = await this.provider.exchangeLongLivedToken(short.accessToken);
    const expiresAt = long.expiresInSeconds ? new Date(Date.now() + long.expiresInSeconds * 1000).toISOString() : null;
    const encrypted = this.crypto.encrypt(long.accessToken);
    await this.oauthState.storePendingToken(input.state, this.tenant(), encrypted, expiresAt);
    const pending = await this.oauthState.pendingToken(input.state, this.tenant());
    return { state: input.state, returnPath: pending?.returnPath ?? null };
  }

  /** Read-only discovery for the "select a Page" step -- never marks the pending flow consumed. */
  async discoverPendingPages(state: string): Promise<readonly MetaPageSummary[]> {
    const pending = await this.oauthState.pendingToken(state, this.tenant());
    if (!pending) return [];
    const userToken = this.crypto.decrypt(pending.token);
    return this.provider.listPages(userToken);
  }

  /** Best-effort: empty (not an error) when ads_management was not granted -- ad account selection is optional (Part 25). */
  async discoverPendingAdAccounts(state: string): Promise<readonly MetaAdAccountSummary[]> {
    const pending = await this.oauthState.pendingToken(state, this.tenant());
    if (!pending) return [];
    const userToken = this.crypto.decrypt(pending.token);
    try {
      return await this.provider.listAdAccounts(userToken);
    } catch {
      return [];
    }
  }

  /**
   * Final step: consumes the pending OAuth state (single-use), re-verifies
   * the chosen Page/ad account/Instagram account against a fresh provider
   * discovery call (never trusts a browser-submitted id on its own), and
   * persists the connection with the PAGE-scoped token, never the user token.
   */
  async saveConnection(input: { state: string; pageId: string; adAccountId: string | null }): Promise<{ connectionId: string; returnPath: string | null }> {
    const { token, returnPath } = await this.oauthState.consume(input.state, this.tenant());
    const userToken = this.crypto.decrypt(token);

    const pages = await this.provider.listPages(userToken);
    const page = pages.find((item) => item.id === input.pageId);
    if (!page) throw new MetaConnectError("PAGE_NOT_FOUND");

    let adAccounts: readonly MetaAdAccountSummary[] = [];
    try {
      adAccounts = await this.provider.listAdAccounts(userToken);
    } catch {
      // ads_management is not in metaMarketingOAuthScopes for this phase -- optional, never fatal.
    }
    const adAccount = input.adAccountId ? adAccounts.find((item) => item.id === input.adAccountId) : undefined;
    if (input.adAccountId && !adAccount) throw new MetaConnectError("AD_ACCOUNT_NOT_FOUND");

    // Instagram business account is always auto-detected from the chosen Page's own
    // token, server-side, never a separate user-submitted id -- see Part 25.
    let instagram: MetaInstagramAccountSummary | null = null;
    try {
      instagram = await this.provider.listInstagramAccount(page.id, page.accessToken);
    } catch {
      // instagram_basic is not in metaMarketingOAuthScopes for this phase -- optional, never fatal.
    }

    const encrypted = this.crypto.encrypt(page.accessToken);
    const connectionId = await this.repository.connect({
      businessId: null,
      pageId: page.id,
      pageName: page.name,
      adAccountId: adAccount?.id ?? null,
      adAccountName: adAccount?.name ?? null,
      instagramBusinessAccountId: instagram?.id ?? null,
      tokenCiphertext: encrypted.ciphertext,
      tokenIv: encrypted.iv,
      tokenTag: encrypted.tag,
      tokenExpiresAt: null,
      scopes: metaMarketingOAuthScopes,
    });
    return { connectionId, returnPath };
  }

  async disconnect(): Promise<void> {
    await this.repository.disconnect();
  }

  /** Live discovery from the connection's own stored Page token -- used to populate the Lead Form mapping form and to re-verify a submitted form id (Part 24). */
  async discoverLeadForms(): Promise<readonly MetaLeadFormSummary[]> {
    const connection = await this.repository.connection();
    if (!connection || connection.status !== "connected") return [];
    const encrypted = await this.repository.getEncryptedToken(connection.id);
    if (!encrypted) return [];
    const pageToken = this.crypto.decrypt(encrypted);
    return this.provider.listLeadForms(connection.pageId, pageToken);
  }

  async createFormMapping(input: { formId: string; propertyId: string; campaignId: string | null }): Promise<string> {
    const connection = await this.repository.connection();
    if (!connection || connection.status !== "connected") throw new Error("Connect Meta before mapping a Lead Form.");
    const forms = await this.discoverLeadForms();
    const form = forms.find((item) => item.id === input.formId);
    if (!form) throw new MetaConnectError("FORM_NOT_FOUND");
    return this.repository.createFormMapping({
      connectionId: connection.id,
      pageId: connection.pageId,
      formId: form.id,
      formName: form.name,
      propertyId: input.propertyId,
      campaignId: input.campaignId,
    });
  }

  async disableFormMapping(mappingId: string): Promise<void> {
    await this.repository.disableFormMapping(mappingId);
  }

  /** Part 17: counts only ("Lead event received / Lead details fetched / Fetch failed") -- no PII surface. */
  leadIngestionSummary() {
    return this.repository.leadIngestionSummary();
  }

  /** Part 30: counts only ("CRM imported / Needs review / Failed") -- no PII surface. */
  crmIngestionSummary() {
    return this.repository.crmIngestionSummary();
  }

  /** Phase M6, Part 21: consent-rule configuration for a Lead Form mapping. */
  activeConsentRule(formMappingId: string) {
    return this.repository.activeConsentRule(formMappingId);
  }

  async configureConsentRule(input: { formMappingId: string; consentFieldName: string; acceptedValues: readonly string[]; consentStatement: string }): Promise<string> {
    return this.repository.configureConsentRule(input);
  }

  async disableConsentRule(ruleId: string): Promise<void> {
    await this.repository.disableConsentRule(ruleId);
  }
}

export { OAuthStateError };
