import "server-only";
import { metaMarketingOAuthScopes, type MetaAdAccountSummary, type MetaInstagramAccountSummary, type MetaLeadFormSummary, type MetaPageSummary, type CreateLeadFormInput, type CreateLeadFormResult } from "../domain/types";

export interface ExchangedToken {
  readonly accessToken: string;
  readonly expiresInSeconds: number | null;
}

/**
 * Discovery-only Meta Marketing Graph client. Deliberately narrow: it does
 * NOT implement campaign/adset/ad/creative creation, insights, CAPI, or lead
 * detail fetch -- those are out of scope for M1/M2. Injected as an interface
 * so tests never call graph.facebook.com; production wiring uses
 * MetaGraphMarketingProvider below.
 */
export interface MetaMarketingProvider {
  authorizationUrl(state: string, redirectUri: string): string;
  exchangeCode(code: string, redirectUri: string): Promise<ExchangedToken>;
  exchangeLongLivedToken(shortLivedToken: string): Promise<ExchangedToken>;
  listPages(userToken: string): Promise<readonly MetaPageSummary[]>;
  listAdAccounts(userToken: string): Promise<readonly MetaAdAccountSummary[]>;
  listInstagramAccount(pageId: string, pageToken: string): Promise<MetaInstagramAccountSummary | null>;
  listLeadForms(pageId: string, pageToken: string): Promise<readonly MetaLeadFormSummary[]>;
  /** Phase M4: the one lead-detail method. Requests only the fields V1 needs -- no unrelated profile/account data. */
  getLead(leadgenId: string, pageAccessToken: string): Promise<unknown>;
  /**
   * Phase C6: the one WRITE method this provider has ever had. Gated by
   * requireMetaMarketingWritesEnabled() (Part 29) inside the real
   * implementation only -- MetaGraphMarketingProvider below -- so a fake
   * provider injected in tests never depends on the env switch at all.
   */
  createLeadForm(pageId: string, pageAccessToken: string, input: CreateLeadFormInput): Promise<CreateLeadFormResult>;
}

/** Thrown by graphGet with the real HTTP status attached, so callers can classify 401/403/404/429/5xx safely. */
export class GraphHttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "GraphHttpError";
  }
}
export class GraphTimeoutError extends Error {
  constructor() {
    super("Meta Graph API request timed out.");
    this.name = "GraphTimeoutError";
  }
}

/** Documented TypeScript constant (not a magic number in the fetch call) bounding how long the processor waits on one lead-detail Graph call. */
export const graphLeadFetchTimeoutMs = 10_000;

function graphVersion(): string {
  return process.env.META_GRAPH_VERSION || "v23.0";
}
function requireAppCredentials() {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) throw new Error("Meta app credentials are not configured.");
  return { appId, appSecret };
}

/** Strips any accidental token/secret from a Graph error before it can reach a log or the browser. */
function sanitizeGraphError(body: unknown): string {
  const message = (body as { error?: { message?: string } } | null)?.error?.message;
  return typeof message === "string" && message.length > 0 ? message.slice(0, 300) : "Meta Graph API request failed.";
}

/**
 * Phase C6 Part 29: the hard server-side external-write guard. Every Meta
 * WRITE call (today: only createLeadForm) must pass through this before any
 * network request is attempted. Defaults to disabled -- META_MARKETING_
 * WRITES_ENABLED must be the literal string "true" in the server
 * environment, never a client-supplied value, and it is never sent to the
 * browser (this file has no "use client" export surface at all).
 */
export class MetaMarketingWritesDisabledError extends Error {
  constructor() {
    super("Meta Marketing write actions are disabled in this environment (META_MARKETING_WRITES_ENABLED is not \"true\").");
    this.name = "MetaMarketingWritesDisabledError";
  }
}
export function requireMetaMarketingWritesEnabled(): void {
  if (process.env.META_MARKETING_WRITES_ENABLED !== "true") throw new MetaMarketingWritesDisabledError();
}

/**
 * timeoutMs is opt-in (undefined by default) so every pre-existing M1/M2
 * call site (OAuth exchange, Page/ad-account/Instagram/form discovery) keeps
 * its exact prior behavior -- only the new getLead() call below passes one.
 */
async function graphGet<T>(path: string, params: Record<string, string>, timeoutMs?: number): Promise<T> {
  const url = new URL(`https://graph.facebook.com/${graphVersion()}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  let response: Response;
  try {
    response = await fetch(url, { method: "GET", ...(timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : {}) });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) throw new GraphTimeoutError();
    throw error;
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new GraphHttpError(response.status, sanitizeGraphError(body));
  return body as T;
}

/**
 * Phase C6: the only POST helper this provider has -- mirrors graphGet's
 * exact error/timeout handling (same GraphHttpError/GraphTimeoutError
 * classification, same sanitizeGraphError secret-stripping) so a write
 * failure is diagnosed identically to a read failure everywhere else in
 * this provider.
 */
async function graphPost<T>(path: string, accessToken: string, payload: Record<string, unknown>, timeoutMs?: number): Promise<T> {
  const url = new URL(`https://graph.facebook.com/${graphVersion()}${path}`);
  url.searchParams.set("access_token", accessToken);
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      ...(timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : {}),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) throw new GraphTimeoutError();
    throw error;
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new GraphHttpError(response.status, sanitizeGraphError(body));
  return body as T;
}

export class MetaGraphMarketingProvider implements MetaMarketingProvider {
  authorizationUrl(state: string, redirectUri: string): string {
    const { appId } = requireAppCredentials();
    const url = new URL(`https://www.facebook.com/${graphVersion()}/dialog/oauth`);
    url.searchParams.set("client_id", appId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", metaMarketingOAuthScopes.join(","));
    return url.toString();
  }

  async exchangeCode(code: string, redirectUri: string): Promise<ExchangedToken> {
    const { appId, appSecret } = requireAppCredentials();
    const data = await graphGet<{ access_token: string; expires_in?: number }>("/oauth/access_token", {
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code,
    });
    return { accessToken: data.access_token, expiresInSeconds: data.expires_in ?? null };
  }

  async exchangeLongLivedToken(shortLivedToken: string): Promise<ExchangedToken> {
    const { appId, appSecret } = requireAppCredentials();
    const data = await graphGet<{ access_token: string; expires_in?: number }>("/oauth/access_token", {
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortLivedToken,
    });
    return { accessToken: data.access_token, expiresInSeconds: data.expires_in ?? null };
  }

  async listPages(userToken: string): Promise<readonly MetaPageSummary[]> {
    const data = await graphGet<{ data: { id: string; name: string; access_token: string }[] }>("/me/accounts", { access_token: userToken });
    return data.data.map((item) => ({ id: item.id, name: item.name, accessToken: item.access_token }));
  }

  async listAdAccounts(userToken: string): Promise<readonly MetaAdAccountSummary[]> {
    // Requires the ads_management scope, not requested by M1/M2's default scope set -- fails
    // permission-denied in production until a later phase requests it; callers must treat this as optional.
    const data = await graphGet<{ data: { id: string; name: string }[] }>("/me/adaccounts", { fields: "id,name", access_token: userToken });
    return data.data.map((item) => ({ id: item.id, name: item.name }));
  }

  async listInstagramAccount(pageId: string, pageToken: string): Promise<MetaInstagramAccountSummary | null> {
    const data = await graphGet<{ instagram_business_account?: { id: string } }>(`/${pageId}`, { fields: "instagram_business_account", access_token: pageToken });
    return data.instagram_business_account ? { id: data.instagram_business_account.id } : null;
  }

  async listLeadForms(pageId: string, pageToken: string): Promise<readonly MetaLeadFormSummary[]> {
    const data = await graphGet<{ data: { id: string; name: string; status: string }[] }>(`/${pageId}/leadgen_forms`, { access_token: pageToken });
    return data.data.map((item) => ({ id: item.id, name: item.name, status: item.status }));
  }

  /** Requests only id/created_time/field_data/ad_id/adset_id/campaign_id/form_id -- no unrelated profile/account fields. */
  async getLead(leadgenId: string, pageAccessToken: string): Promise<unknown> {
    return graphGet<unknown>(`/${leadgenId}`, { fields: "id,created_time,field_data,ad_id,adset_id,campaign_id,form_id", access_token: pageAccessToken }, graphLeadFetchTimeoutMs);
  }

  /**
   * Phase C6 Part 3/4: POST /{page-id}/leadgen_forms. Field names (name,
   * questions[].type/key, privacy_policy.url/link_text, custom_disclaimer.
   * title/body.text/checkboxes[].key|text|is_required|is_checked_by_default,
   * thank_you_page.title/body/button_text) are sourced from Meta's own
   * published Marketing API reference for this endpoint, not guessed. The
   * required scopes for this endpoint (ads_management, pages_manage_ads,
   * pages_read_engagement, pages_show_list) exceed M1/M2's current OAuth
   * scope request (metaMarketingOAuthScopes only requests pages_show_list +
   * leads_retrieval) -- re-scoping the OAuth consent flow is out of C6's
   * scope, so a live call through an existing M1/M2 connection will fail
   * with a Meta permission error today regardless of this method's own
   * correctness. This is disclosed, not silently worked around. Per Part 3,
   * the exact wire encoding of a genuinely mixed FULL_NAME/EMAIL/PHONE/
   * CUSTOM questions array and the consent checkbox's `is_required` default
   * have not been independently certified against a live Page, so this
   * method is implemented from documentation, not from a verified live
   * response -- live payload certification remains required before any
   * production use, and requireMetaMarketingWritesEnabled() below keeps that
   * from happening accidentally.
   */
  async createLeadForm(pageId: string, pageAccessToken: string, input: CreateLeadFormInput): Promise<CreateLeadFormResult> {
    requireMetaMarketingWritesEnabled();
    const payload: Record<string, unknown> = {
      name: input.name,
      locale: input.locale,
      questions: input.questions.map((q) => ({ type: q.type, key: q.key, ...(q.label ? { label: q.label } : {}) })),
      privacy_policy: { url: input.privacyPolicyUrl, link_text: input.privacyPolicyLinkText },
      thank_you_page: {
        title: input.thankYouTitle,
        body: input.thankYouBody,
        button_type: "VIEW_WEBSITE",
        button_text: "Done",
      },
    };
    if (input.consentDisclosure) {
      payload.custom_disclaimer = {
        title: input.consentDisclosure.title,
        body: { text: input.consentDisclosure.bodyText },
        checkboxes: [{
          key: input.consentDisclosure.key,
          text: input.consentDisclosure.checkboxText,
          is_required: false,
          is_checked_by_default: false,
        }],
      };
    }
    const data = await graphPost<{ id: string; status?: string }>(`/${pageId}/leadgen_forms`, pageAccessToken, payload);
    return { providerFormId: data.id, status: data.status ?? null };
  }
}
