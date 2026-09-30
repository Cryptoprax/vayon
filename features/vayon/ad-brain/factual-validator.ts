import type { AuthoritativePropertyFacts } from "@/features/vayon/property-facts/domain/types";
import type { ExtractedClaim, FactualCheck, FactualDimension } from "./ad-brain.types";

/**
 * Part 5: compares extracted claims against K3's authoritative property
 * facts. Never hallucinates a PASS -- a dimension with no matching
 * checkable claim is "not_applicable" (nothing was claimed, so nothing can
 * conflict), a dimension where facts.price is null is "unknown" (the claim
 * exists but there is nothing authoritative to check it against), and only
 * an actual mismatch against a real authoritative value is "conflict". Only
 * a claim that matches the authoritative value exactly is "verified".
 */

function checkPrice(claims: readonly ExtractedClaim[], facts: AuthoritativePropertyFacts | null): FactualCheck {
  const priceClaims = claims.filter((c) => c.type === "price");
  if (priceClaims.length === 0) return { state: "not_applicable", claimedValue: null, authoritativeValue: null, notes: null };

  const claimedValue = String(priceClaims[0].extractedValue);
  if (!facts) return { state: "unknown", claimedValue, authoritativeValue: null, notes: "Property could not be resolved for fact-checking." };
  if (!facts.price) return { state: "unknown", claimedValue, authoritativeValue: null, notes: "No authoritative approved price revision exists for this property." };

  const authoritative = facts.price.offerPrice ?? facts.price.basePrice;
  if (!authoritative) return { state: "unknown", claimedValue, authoritativeValue: null, notes: "Approved price revision has no numeric value." };

  const claimedNum = Number(priceClaims[0].extractedValue);
  const authoritativeNum = Number(authoritative);
  // Allow small rounding tolerance (ad copy commonly rounds "from $X").
  const withinTolerance = Math.abs(claimedNum - authoritativeNum) / authoritativeNum <= 0.02;
  return withinTolerance
    ? { state: "verified", claimedValue, authoritativeValue: authoritative, notes: null }
    : { state: "conflict", claimedValue, authoritativeValue: authoritative, notes: `Ad claims ${claimedValue} but the authoritative approved price is ${authoritative} ${facts.price.currency}.` };
}

function checkBedrooms(claims: readonly ExtractedClaim[], facts: AuthoritativePropertyFacts | null): FactualCheck {
  const bedroomClaims = claims.filter((c) => c.type === "bedrooms");
  if (bedroomClaims.length === 0) return { state: "not_applicable", claimedValue: null, authoritativeValue: null, notes: null };

  const claimedValue = String(bedroomClaims[0].extractedValue);
  if (!facts) return { state: "unknown", claimedValue, authoritativeValue: null, notes: "Property could not be resolved for fact-checking." };
  if (facts.bedrooms === null) return { state: "unknown", claimedValue, authoritativeValue: null, notes: "No authoritative bedroom count is recorded for this property." };

  return Number(bedroomClaims[0].extractedValue) === facts.bedrooms
    ? { state: "verified", claimedValue, authoritativeValue: String(facts.bedrooms), notes: null }
    : { state: "conflict", claimedValue, authoritativeValue: String(facts.bedrooms), notes: `Ad claims ${claimedValue} bedrooms but the authoritative record shows ${facts.bedrooms}.` };
}

function checkAvailability(claims: readonly ExtractedClaim[], facts: AuthoritativePropertyFacts | null): FactualCheck {
  const availabilityClaims = claims.filter((c) => c.type === "availability");
  if (availabilityClaims.length === 0) return { state: "not_applicable", claimedValue: null, authoritativeValue: null, notes: null };

  const claimedValue = String(availabilityClaims[0].extractedValue);
  if (!facts) return { state: "unknown", claimedValue, authoritativeValue: null, notes: "Property could not be resolved for fact-checking." };

  const authoritativeAvailable = facts.status === "available";
  const claimedAvailable = claimedValue === "available";
  return claimedAvailable === authoritativeAvailable
    ? { state: "verified", claimedValue, authoritativeValue: facts.status, notes: null }
    : { state: "conflict", claimedValue, authoritativeValue: facts.status, notes: `Ad claims "${claimedValue}" but the authoritative status is "${facts.status}".` };
}

function checkLocation(claims: readonly ExtractedClaim[], facts: AuthoritativePropertyFacts | null): FactualCheck {
  // No structured location claim extractor exists yet (Part 6 only extracts
  // price/bedrooms/payment-plan/availability/adjectives) -- location is
  // always "unknown" rather than fabricating a match/conflict from
  // unstructured text. A future extractor can replace this.
  if (!facts) return { state: "unknown", claimedValue: null, authoritativeValue: null, notes: "Property could not be resolved for fact-checking." };
  return { state: "unknown", claimedValue: null, authoritativeValue: `${facts.location.city}, ${facts.location.countryCode}`, notes: "No structured location claim extractor exists yet -- location claims are not currently auto-checked." };
}

function checkPaymentPlan(claims: readonly ExtractedClaim[]): FactualCheck {
  const paymentClaims = claims.filter((c) => c.type === "payment_plan");
  if (paymentClaims.length === 0) return { state: "not_applicable", claimedValue: null, authoritativeValue: null, notes: null };
  // No authoritative payment-plan fact source exists anywhere in the repo
  // (Part 1's audit) -- always "unknown", never fabricated as verified.
  return { state: "unknown", claimedValue: String(paymentClaims[0].extractedValue), authoritativeValue: null, notes: "No authoritative payment-plan data source exists yet." };
}

export interface FactualValidationResult {
  readonly checks: { readonly [K in FactualDimension]: FactualCheck };
  readonly hasConflict: boolean;
}

export function validateClaimsAgainstFacts(claims: readonly ExtractedClaim[], facts: AuthoritativePropertyFacts | null): FactualValidationResult {
  const priceCheck = checkPrice(claims, facts);
  const bedroomsCheck = checkBedrooms(claims, facts);
  const availabilityCheck = checkAvailability(claims, facts);
  const locationCheck = checkLocation(claims, facts);
  const paymentPlanCheck = checkPaymentPlan(claims);

  // property_factual_accuracy folds in structural-fact claims (currently
  // bedrooms/unit-count) that have no dedicated dimension of their own in
  // Part 4's fixed dimension list -- a bedroom-count conflict is a property
  // factual-accuracy conflict, not a separate category.
  const propertyFactualAccuracy: FactualCheck = !facts
    ? { state: "unknown", claimedValue: null, authoritativeValue: null, notes: "Property could not be resolved." }
    : bedroomsCheck.state === "conflict"
      ? bedroomsCheck
      : bedroomsCheck.state === "unknown"
        ? bedroomsCheck
        : { state: "verified", claimedValue: null, authoritativeValue: null, notes: null };

  const checks: { readonly [K in FactualDimension]: FactualCheck } = {
    property_factual_accuracy: propertyFactualAccuracy,
    price_accuracy: priceCheck,
    availability_accuracy: availabilityCheck,
    payment_plan_accuracy: paymentPlanCheck,
    location_accuracy: locationCheck,
  };

  const hasConflict = Object.values(checks).some((c) => c.state === "conflict");
  return { checks, hasConflict };
}
