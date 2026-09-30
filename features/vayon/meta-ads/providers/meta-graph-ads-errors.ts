/**
 * ADS-B4B (Part 13): typed Meta provider error classification. Built ONLY on
 * the fields ADS-B4A2 confirmed (message, type, code, error_subcode,
 * is_transient). error_user_title/error_user_msg/fbtrace_id are deliberately
 * never consulted for classification correctness -- ADS-B4A2 left them
 * unverified. Known example policy-rejection codes are NOT hardcoded as an
 * exhaustive list; unrecognized error shapes fall through to
 * UNKNOWN_PROVIDER_ERROR rather than being misclassified as something safe.
 */

export type MetaGraphAdsErrorCode =
  | "AUTH_INVALID"
  | "PERMISSION_DENIED"
  | "RATE_LIMITED"
  | "TRANSIENT"
  | "PROVIDER_REJECTED"
  | "UNKNOWN_PROVIDER_ERROR"
  | "UNCERTAIN_NETWORK_OUTCOME";

export class MetaGraphAdsProviderError extends Error {
  constructor(
    public readonly classification: MetaGraphAdsErrorCode,
    message: string,
    public readonly providerErrorCode?: number,
  ) {
    super(message);
    this.name = "MetaGraphAdsProviderError";
  }
}

/** A network timeout/drop/unparseable response after the request was dispatched -- never treated as success, never auto-retried. */
export class MetaGraphAdsUncertainNetworkOutcomeError extends MetaGraphAdsProviderError {
  constructor(message: string) {
    super("UNCERTAIN_NETWORK_OUTCOME", message);
    this.name = "MetaGraphAdsUncertainNetworkOutcomeError";
  }
}

/** A capability this provider deliberately does not implement (unverified payload shape, missing input data) -- never attempts an HTTP call. */
export class MetaGraphAdsUnsupportedOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MetaGraphAdsUnsupportedOperationError";
  }
}

interface RawMetaErrorBody {
  readonly error?: {
    readonly message?: unknown;
    readonly type?: unknown;
    readonly code?: unknown;
    readonly error_subcode?: unknown;
    readonly is_transient?: unknown;
  };
}

/** Verified fields only: message, type, code, error_subcode, is_transient. */
export function classifyMetaGraphAdsError(httpStatus: number, body: unknown): MetaGraphAdsProviderError {
  const err = (body as RawMetaErrorBody | null)?.error;
  const message = typeof err?.message === "string" ? err.message : `http_${httpStatus}`;
  const code = typeof err?.code === "number" ? err.code : undefined;
  const isTransient = err?.is_transient === true;

  if (isTransient) return new MetaGraphAdsProviderError("TRANSIENT", message, code);
  if (code === 190 || code === 102) return new MetaGraphAdsProviderError("AUTH_INVALID", message, code);
  if (code === 10 || code === 200 || code === 294) return new MetaGraphAdsProviderError("PERMISSION_DENIED", message, code);
  if (code === 4 || code === 17 || httpStatus === 429) return new MetaGraphAdsProviderError("RATE_LIMITED", message, code);
  if (httpStatus >= 400 && httpStatus < 500 && err) return new MetaGraphAdsProviderError("PROVIDER_REJECTED", message, code);
  return new MetaGraphAdsProviderError("UNKNOWN_PROVIDER_ERROR", message, code);
}

/**
 * ADS-B4B (Part 14): parses X-Ad-Account-Usage / X-Business-Use-Case-Usage
 * when present. No numeric quota constant is ever hardcoded here -- both
 * fields are dynamic per Meta's own documented model (ADS-B4A2 Part 14),
 * exposed as-is for a future worker-level backoff policy to consume.
 */
export interface MetaGraphAdsRateLimitSnapshot {
  readonly adAccountUsage: Record<string, unknown> | null;
  readonly businessUseCaseUsage: Record<string, unknown> | null;
}

export function parseMetaGraphAdsRateLimitHeaders(headers: Readonly<Record<string, string>>): MetaGraphAdsRateLimitSnapshot {
  const parse = (raw: string | undefined): Record<string, unknown> | null => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  };
  return {
    adAccountUsage: parse(headers["x-ad-account-usage"]),
    businessUseCaseUsage: parse(headers["x-business-use-case-usage"]),
  };
}
