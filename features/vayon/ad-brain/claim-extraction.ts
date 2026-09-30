import type { ClaimType, ExtractedClaim } from "./ad-brain.types";

/**
 * Part 6: structured claim extraction from ad copy. Deterministic
 * pattern-matching, not an LLM call -- this is a cheap, synchronous
 * pre-processing step that runs before any real provider is ever involved,
 * so it must work identically in tests and production. Only CHECKABLE
 * claims (a concrete number/currency/named amenity) are ever compared
 * against authoritative facts; subjective marketing language ("luxury",
 * "stunning") is extracted as a marketing_adjective claim and is never
 * treated as an objective fact to verify (Part 6's explicit requirement).
 */

const marketingAdjectives = [
  "luxury", "stunning", "exclusive", "premium", "elegant", "spacious",
  "breathtaking", "unparalleled", "prestigious", "exquisite", "modern",
  "best", "guaranteed", "unbeatable",
];

function extractPrice(text: string): ExtractedClaim[] {
  const claims: ExtractedClaim[] = [];
  // e.g. "$725k", "$725,000", "₹1.85 Cr", "INR 18,500,000"
  const dollarRegex = /\$\s?([\d,]+(?:\.\d+)?)\s?(k|m)?/gi;
  for (const match of text.matchAll(dollarRegex)) {
    const raw = match[0];
    let value = Number(match[1].replace(/,/g, ""));
    const suffix = match[2]?.toLowerCase();
    if (suffix === "k") value *= 1_000;
    if (suffix === "m") value *= 1_000_000;
    claims.push({ type: "price", rawText: raw, extractedValue: value, checkable: true });
  }
  return claims;
}

function extractBedrooms(text: string): ExtractedClaim[] {
  const claims: ExtractedClaim[] = [];
  const regex = /(\d+)\s?(?:BR|bed(?:room)?s?)\b/gi;
  for (const match of text.matchAll(regex)) {
    claims.push({ type: "bedrooms", rawText: match[0], extractedValue: Number(match[1]), checkable: true });
  }
  return claims;
}

function extractAdjectives(text: string): ExtractedClaim[] {
  const claims: ExtractedClaim[] = [];
  const lower = text.toLowerCase();
  for (const adjective of marketingAdjectives) {
    if (lower.includes(adjective)) {
      claims.push({ type: "marketing_adjective", rawText: adjective, extractedValue: adjective, checkable: false });
    }
  }
  return claims;
}

function extractPaymentPlan(text: string): ExtractedClaim[] {
  const claims: ExtractedClaim[] = [];
  const regex = /(\d+)\s?%\s?(?:down|deposit)/gi;
  for (const match of text.matchAll(regex)) {
    claims.push({ type: "payment_plan", rawText: match[0], extractedValue: Number(match[1]), checkable: true });
  }
  return claims;
}

function extractAvailability(text: string): ExtractedClaim[] {
  const claims: ExtractedClaim[] = [];
  const lower = text.toLowerCase();
  if (/\bready to move\b|\bmove[- ]in ready\b|\bavailable now\b/.test(lower)) {
    claims.push({ type: "availability", rawText: text.match(/ready to move|move[- ]in ready|available now/i)?.[0] ?? "available now", extractedValue: "available", checkable: true });
  }
  if (/\bsold out\b|\bfully booked\b/.test(lower)) {
    claims.push({ type: "availability", rawText: text.match(/sold out|fully booked/i)?.[0] ?? "sold out", extractedValue: "unavailable", checkable: true });
  }
  return claims;
}

export function extractClaims(copyText: string): readonly ExtractedClaim[] {
  if (!copyText || copyText.trim().length === 0) return [];
  return [
    ...extractPrice(copyText),
    ...extractBedrooms(copyText),
    ...extractPaymentPlan(copyText),
    ...extractAvailability(copyText),
    ...extractAdjectives(copyText),
  ];
}

export function checkableClaims(claims: readonly ExtractedClaim[]): readonly ExtractedClaim[] {
  return claims.filter((c) => c.checkable);
}

export function claimTypesPresent(claims: readonly ExtractedClaim[]): ReadonlySet<ClaimType> {
  return new Set(claims.map((c) => c.type));
}
