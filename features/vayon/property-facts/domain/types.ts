/**
 * Phase K3: authoritative structured property facts + price versioning.
 *
 * FACT TRUST HIERARCHY (future precedence for K4/K5 -- documented, not
 * implemented here; no AI resolution exists yet). A higher rank is never
 * overridden by a lower one:
 *   1. approved structured property fact     (public.properties columns below)
 *   2. approved structured price revision    (property_price_revisions_v2)
 *   3. approved property knowledge document  (K1)
 *   4. extracted document text               (K2, untrusted source content)
 *   5. customer / user conversation content
 *
 * FIELD CLASSIFICATION of public.properties (Model A):
 *   AUTHORITATIVE STRUCTURED FACT: reference, title, property_type, listing_type,
 *     status, country_code, region, city, locality, address, area, area_unit
 *   OPTIONAL STRUCTURED FACT: bedrooms, bathrooms, parking, floor, amenities
 *   LEGACY / UNVERIFIED (never authoritative): sale_price, rental_price, currency --
 *     the wizard's simple listing price; the authoritative price is the current
 *     approved revision. Exposed only as `unverifiedListingPrice`.
 *   MARKETING COPY (not a fact): description
 *   NOT SUITABLE FOR AI FACT USE: commission, assigned_agent_id, created_by,
 *     updated_by, featured, published, version, deleted_at, timestamps
 *   DERIVED: none stored (aiScore lives elsewhere and is not a fact)
 *
 * AVAILABILITY LIMITATION: properties.status is the only V1 availability
 * signal. No unit-level inventory exists in Model A; Model B stays separate.
 */
export const priceRevisionStatuses = ["draft", "approved", "archived"] as const;
export type PriceRevisionStatus = (typeof priceRevisionStatuses)[number];

/** Decimal money is always a string end-to-end; it never becomes a float. */
export interface PriceRevision {
  readonly id: string;
  readonly version: number;
  readonly status: PriceRevisionStatus;
  readonly currency: string;
  readonly basePrice: string | null;
  readonly offerPrice: string | null;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly sourceDocumentId: string | null;
  readonly createdAt: string;
  readonly approvedAt: string | null;
  readonly supersededBy: string | null;
  readonly notes: string | null;
}

export interface CurrentPrice {
  readonly revisionId: string;
  readonly currency: string;
  readonly basePrice: string | null;
  readonly offerPrice: string | null;
  readonly effectiveFrom: string;
  readonly sourceDocumentId: string | null;
}

export interface AuthoritativePropertyFacts {
  readonly propertyId: string;
  readonly reference: string;
  readonly title: string;
  readonly propertyType: string;
  readonly listingType: string;
  readonly status: string;
  readonly location: {
    readonly countryCode: string;
    readonly region: string | null;
    readonly city: string;
    readonly locality: string | null;
    readonly address: string;
  };
  readonly bedrooms: number | null;
  readonly bathrooms: number | null;
  readonly area: string | null;
  readonly areaUnit: string;
  readonly parking: number | null;
  readonly floor: number | null;
  readonly amenities: readonly string[];
  /** Current APPROVED revision, or null when none is approved and effective today. */
  readonly price: {
    readonly currency: string;
    readonly basePrice: string | null;
    readonly offerPrice: string | null;
    readonly effectiveFrom: string;
    readonly revisionId: string;
    readonly sourceDocumentId: string | null;
  } | null;
  /** Legacy properties.sale_price/rental_price: unverified, never to be preferred over `price`. */
  readonly unverifiedListingPrice: { readonly amount: string; readonly currency: string; readonly kind: "sale" | "rental" } | null;
}

export interface CreatePriceRevisionInput {
  readonly propertyId: string;
  readonly currency: string;
  readonly basePrice: string;
  readonly offerPrice: string;
  readonly effectiveFrom: string;
  readonly sourceDocumentId: string;
  readonly notes: string;
}

export interface ValidatedPriceRevisionInput {
  readonly propertyId: string;
  readonly currency: string;
  readonly basePrice: string | null;
  readonly offerPrice: string | null;
  readonly effectiveFrom: string;
  readonly sourceDocumentId: string | null;
  readonly notes: string | null;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const moneyPattern = /^\d{1,16}(\.\d{1,2})?$/;

export class PriceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PriceValidationError";
  }
}

function validateMoney(raw: string, label: string): string | null {
  const value = raw.trim();
  if (value === "") return null;
  if (!moneyPattern.test(value) || !(Number(value) > 0)) {
    throw new PriceValidationError(`${label} must be a positive amount with at most 2 decimal places.`);
  }
  return value;
}

function validateDate(raw: string): string {
  const value = raw.trim();
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : null;
  if (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new PriceValidationError("Effective date must be a valid date (YYYY-MM-DD).");
  }
  const year = parsed.getUTCFullYear();
  if (year < 2000 || year > 2100) throw new PriceValidationError("Effective date is out of range.");
  return value;
}

export function validatePriceRevisionInput(input: CreatePriceRevisionInput): ValidatedPriceRevisionInput {
  if (!uuidPattern.test(input.propertyId)) throw new PriceValidationError("A valid property is required.");
  const currency = input.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new PriceValidationError("Currency must be a 3-letter code.");
  const basePrice = validateMoney(input.basePrice, "Base price");
  const offerPrice = validateMoney(input.offerPrice, "Offer price");
  if (basePrice === null && offerPrice === null) throw new PriceValidationError("Enter a base price or an offer price.");
  if (basePrice !== null && offerPrice !== null && Number(offerPrice) > Number(basePrice)) {
    throw new PriceValidationError("Offer price cannot be higher than the base price.");
  }
  const sourceDocumentId = input.sourceDocumentId.trim();
  if (sourceDocumentId !== "" && !uuidPattern.test(sourceDocumentId)) throw new PriceValidationError("Source document is invalid.");
  const notes = input.notes.trim();
  if (notes.length > 1000) throw new PriceValidationError("Notes must be 1000 characters or fewer.");
  return {
    propertyId: input.propertyId,
    currency,
    basePrice,
    offerPrice,
    effectiveFrom: validateDate(input.effectiveFrom),
    sourceDocumentId: sourceDocumentId === "" ? null : sourceDocumentId,
    notes: notes === "" ? null : notes,
  };
}

export function assertRevisionId(value: string): string {
  if (!uuidPattern.test(value)) throw new PriceValidationError("A valid revision is required.");
  return value;
}
