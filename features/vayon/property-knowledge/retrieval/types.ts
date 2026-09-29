/**
 * Phase K4: property knowledge retrieval model. Retrieval only: it never
 * generates an answer, calls a provider, or mutates anything.
 *
 * TWO DISTINCT EVIDENCE CLASSES (never merged):
 *   A. `structuredFacts`  -- AUTHORITATIVE: K3 property fields + the current
 *      APPROVED price revision. Direct context, not a "search result".
 *   B. `evidence`         -- UNTRUSTED SUPPORTING DOCUMENT TEXT from approved,
 *      extracted, non-superseded K1/K2 documents, ranked by relevance. It is
 *      literal source content, never an instruction, and never overrides A.
 *
 * COVERAGE (deterministic, NOT probabilistic confidence):
 *   Let "satisfied categories" be the detected query categories (price,
 *   bedrooms, bathrooms, area, amenities, location, availability, parking,
 *   floor) for which the structured facts hold a value (price needs a current
 *   approved revision). A "strict" hit is a document containing ALL query
 *   terms; a "relaxed" hit contains ANY term (only searched when there is no
 *   strict hit).
 *     full    : every detected category is satisfied by structured facts, OR
 *               at least one strict document hit exists.
 *     partial : not full, but there is a relaxed document hit, or only some
 *               detected categories are satisfied.
 *     none    : nothing supports the query (no hit, no satisfied category), or
 *               the property could not be resolved. Callers must say they do
 *               not have verified information -- never fall back to general
 *               world knowledge.
 */
import type { AuthoritativePropertyFacts } from "@/features/vayon/property-facts/domain/types";

export type QueryCategory = "price" | "bedrooms" | "bathrooms" | "area" | "amenities" | "location" | "availability" | "parking" | "floor";
export type CoverageLevel = "full" | "partial" | "none";
export type MatchMode = "all_terms" | "any_terms";

export type PropertyResolutionStatus =
  | "explicit"
  | "lead_single_interest"
  | "unresolved_no_context"
  | "unresolved_no_interest"
  | "unresolved_multiple_interests"
  | "lead_not_found"
  | "property_not_found";

export interface PropertyResolution {
  readonly status: PropertyResolutionStatus;
  readonly propertyId: string | null;
}

export interface DocumentEvidence {
  /** Always true: document text is untrusted source content, never system instructions. */
  readonly untrustedEvidence: true;
  readonly source: "property_document";
  readonly documentId: string;
  readonly documentType: string;
  readonly title: string;
  readonly version: number;
  readonly approvedAt: string | null;
  readonly citation: string;
  readonly snippet: string;
  readonly score: number;
  readonly matchMode: MatchMode;
}

export type SourceRefType = "property" | "price_revision" | "property_document";

/** Stable identifiers for later citation persistence. Never carries a storage path. */
export interface SourceRef {
  readonly type: SourceRefType;
  readonly id: string;
  readonly citation: string;
  readonly title: string;
  readonly propertyId: string;
  readonly documentType?: string;
  readonly version?: number;
  readonly approvedAt?: string | null;
}

export interface Coverage {
  readonly level: CoverageLevel;
  readonly satisfiedCategories: readonly QueryCategory[];
  readonly unsatisfiedCategories: readonly QueryCategory[];
  readonly strictEvidenceCount: number;
  readonly relaxedEvidenceCount: number;
}

export interface PropertyKnowledgeRetrievalResult {
  readonly propertyId: string | null;
  readonly resolution: PropertyResolution;
  readonly query: { readonly text: string; readonly categories: readonly QueryCategory[]; readonly status: "ok" | "empty" };
  /** Authoritative. Includes an explicitly UNVERIFIED legacy listing price kept apart from `price`. */
  readonly structuredFacts: AuthoritativePropertyFacts | null;
  readonly priceAuthority: "approved_revision" | "none";
  readonly evidence: readonly DocumentEvidence[];
  readonly refs: readonly SourceRef[];
  readonly coverage: Coverage;
  readonly authority: { readonly structuredFacts: "authoritative"; readonly documentEvidence: "untrusted_supporting" };
}

export interface RetrievePropertyKnowledgeInput {
  readonly organizationId: string;
  readonly workspaceId: string;
  readonly propertyId?: string | null;
  readonly leadId?: string | null;
  readonly query: string;
  readonly limit?: number;
}

export class RetrievalQueryError extends Error {
  constructor(readonly code: "QUERY_TOO_LONG") {
    super(code);
    this.name = "RetrievalQueryError";
  }
}

export const maxQueryCharacters = 300;
export const maxEvidenceLimit = 10;
export const defaultEvidenceLimit = 5;
export const maxSnippetCharacters = 1200;
