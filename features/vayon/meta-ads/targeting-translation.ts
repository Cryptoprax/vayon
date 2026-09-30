import type { TargetingTranslationResult } from "./meta-ads.types";

/**
 * Part 15: translates ADS-B1's provider-neutral campaign_targeting_intents
 * into Meta targeting. No current Meta targeting-restriction spec exists
 * anywhere in this repository (Part 1's audit), so every field resolves to
 * "external_policy_verification_required" or "requires_review" -- never
 * "verified" -- until a real, checked Meta targeting spec is wired in. No
 * API call. metaTargetingSpec is always null in ADS-B3.
 */
export interface TargetingIntentInput {
  readonly country: string | null;
  readonly region: string | null;
  readonly city: string | null;
  readonly language: string | null;
  readonly buyerPersona: string | null;
  readonly propertyType: string | null;
  readonly objective: string | null;
}

export function translateTargetingIntent(intent: TargetingIntentInput | null): TargetingTranslationResult {
  if (!intent) {
    return {
      overallStatus: "external_policy_verification_required",
      fields: {},
      metaTargetingSpec: null,
    };
  }

  const fields: Record<string, { status: TargetingTranslationResult["fields"][string]["status"]; notes: string }> = {
    geography: {
      status: intent.country || intent.city ? "requires_review" : "unsupported",
      notes: "Meta geo-targeting requires resolving country/city to Meta's own location keys -- not implemented; needs a verified lookup against current Meta Marketing API geo-targeting search.",
    },
    language: {
      status: intent.language ? "requires_review" : "unsupported",
      notes: "Meta locale targeting requires a Meta locale code, not a free-text language string -- mapping not implemented.",
    },
    buyerPersona: {
      status: "external_policy_verification_required",
      notes: "No structured mapping exists from a free-text buyer persona to Meta detailed-targeting interests/behaviors -- requires_review at minimum, and current housing special-ad-category rules may further restrict detailed targeting for real-estate ads.",
    },
    propertyType: {
      status: "external_policy_verification_required",
      notes: "Not a native Meta targeting dimension -- would need to be expressed as a custom audience or interest, unverified.",
    },
    objective: {
      status: intent.objective ? "requires_review" : "unsupported",
      notes: "Maps loosely to a Meta campaign objective enum value, but the current valid enum set must be re-verified against live API docs before use.",
    },
  };

  const statuses = Object.values(fields).map((f) => f.status);
  const overallStatus: TargetingTranslationResult["overallStatus"] = statuses.includes("external_policy_verification_required")
    ? "external_policy_verification_required"
    : statuses.includes("unsupported")
      ? "unsupported"
      : "requires_review";

  return { overallStatus, fields, metaTargetingSpec: null };
}
