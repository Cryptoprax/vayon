import { maxQueryCharacters, RetrievalQueryError, type QueryCategory } from "./types";

/**
 * Cleans a plain user query. Control characters are stripped and whitespace
 * collapsed; an oversized query is rejected rather than truncated. The text
 * is only ever passed to websearch_to_tsquery as a bound parameter -- never
 * concatenated into SQL -- and websearch_to_tsquery never raises on operators
 * or punctuation.
 */
export function sanitizeQuery(raw: string): { text: string; status: "ok" | "empty" } {
  const text = String(raw ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length > maxQueryCharacters) throw new RetrievalQueryError("QUERY_TOO_LONG");
  return { text, status: text === "" ? "empty" : "ok" };
}

/** Distinct alphanumeric tokens (max 12) used to build the relaxed any-term query. */
export function queryTokens(text: string): string[] {
  const tokens = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  return [...new Set(tokens)].slice(0, 12);
}

export function relaxedQuery(text: string): string {
  return queryTokens(text).join(" or ");
}

const categoryPatterns: ReadonlyArray<readonly [QueryCategory, RegExp]> = [
  ["price", /\b(price|prices|pricing|cost|costs|offer|offers|how much|rate|rates|budget|discount)\b/i],
  ["bedrooms", /\b(bedroom|bedrooms|bhk|beds?|rooms?)\b/i],
  ["bathrooms", /\b(bathroom|bathrooms|baths?|toilets?|washrooms?)\b/i],
  ["area", /\b(area|size|sq\.?\s?ft|sqft|square (feet|foot|meters?|metres?)|sqm|carpet|built[- ]?up)\b/i],
  ["amenities", /\b(amenit(y|ies)|facilit(y|ies)|pool|gym|clubhouse|garden)\b/i],
  ["location", /\b(location|located|where|address|city|locality|neighbou?rhood|area map|nearby|near)\b/i],
  ["availability", /\b(available|availability|still available|sold|reserved|vacant)\b/i],
  ["parking", /\b(parking|garage|car ?park)\b/i],
  ["floor", /\b(floor|storey|story|level)\b/i],
];

/** Deterministic keyword categorization only -- no model, no intent classifier. */
export function categorizeQuery(text: string): QueryCategory[] {
  return categoryPatterns.filter(([, pattern]) => pattern.test(text)).map(([category]) => category);
}

/** Small (10%) explainable boost for document types that match a detected category. */
export const documentTypeBoosts: Readonly<Record<QueryCategory, readonly string[]>> = {
  price: ["price_sheet", "payment_plan"],
  bedrooms: ["floor_plan", "specification"],
  bathrooms: ["floor_plan", "specification"],
  area: ["floor_plan", "specification"],
  amenities: ["amenities", "brochure"],
  location: ["location", "master_plan"],
  availability: [],
  parking: ["specification"],
  floor: ["floor_plan"],
};
export const documentTypeBoostFactor = 1.1;

export function boostFor(documentType: string, categories: readonly QueryCategory[]): number {
  return categories.some((category) => documentTypeBoosts[category].includes(documentType)) ? documentTypeBoostFactor : 1;
}
