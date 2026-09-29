import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { getAuthoritativePropertyFacts } from "@/features/vayon/property-facts/services/authoritative-property-facts.service";
import type { AuthoritativePropertyFacts } from "@/features/vayon/property-facts/domain/types";
import { priceRevisionCitation, propertyCitation, propertyDocumentCitation } from "./citations";
import { boostFor, categorizeQuery, relaxedQuery, sanitizeQuery } from "./query";
import { cleanSnippet } from "./snippets";
import {
  defaultEvidenceLimit,
  maxEvidenceLimit,
  type Coverage,
  type DocumentEvidence,
  type MatchMode,
  type PropertyKnowledgeRetrievalResult,
  type PropertyResolution,
  type QueryCategory,
  type RetrievePropertyKnowledgeInput,
  type SourceRef,
} from "./types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Scope = { organizationId: string; workspaceId: string };
type Row = Record<string, unknown>;

/**
 * LEAD -> PROPERTY POLICY. An explicit propertyId always wins. Otherwise a
 * leadId resolves ONLY when the lead exists in this tenant and has exactly
 * one active property interest (a lead_property_interests row of this
 * organization+workspace whose property exists in this tenant and is not
 * soft-deleted). Zero or several interests leave the property unresolved --
 * this never guesses or picks among multiple interests.
 */
export async function resolveLeadProperty(client: SupabaseClient, scope: Scope, leadId: string): Promise<PropertyResolution> {
  if (!uuidPattern.test(leadId)) return { status: "lead_not_found", propertyId: null };
  const lead = await client.from("leads").select("id").eq("id", leadId).eq("organization_id", scope.organizationId).eq("workspace_id", scope.workspaceId).is("deleted_at", null).maybeSingle();
  if (lead.error) throw lead.error;
  if (!lead.data) return { status: "lead_not_found", propertyId: null };

  const interests = await client.from("lead_property_interests").select("property_id").eq("lead_id", leadId).eq("organization_id", scope.organizationId).eq("workspace_id", scope.workspaceId).limit(50);
  if (interests.error) throw interests.error;
  const ids = [...new Set(((interests.data ?? []) as Row[]).map((row) => String(row.property_id)))];
  if (ids.length === 0) return { status: "unresolved_no_interest", propertyId: null };

  const properties = await client.from("properties").select("id").in("id", ids).eq("organization_id", scope.organizationId).eq("workspace_id", scope.workspaceId).is("deleted_at", null);
  if (properties.error) throw properties.error;
  const active = ((properties.data ?? []) as Row[]).map((row) => String(row.id));
  if (active.length === 0) return { status: "unresolved_no_interest", propertyId: null };
  if (active.length > 1) return { status: "unresolved_multiple_interests", propertyId: null };
  return { status: "lead_single_interest", propertyId: active[0] };
}

async function searchDocuments(client: SupabaseClient, scope: Scope, propertyId: string, query: string, limit: number): Promise<Row[]> {
  const { data, error } = await client.rpc("search_property_knowledge_documents", {
    p_organization_id: scope.organizationId,
    p_workspace_id: scope.workspaceId,
    p_property_id: propertyId,
    p_query: query,
    p_limit: limit,
  });
  if (error) throw error;
  return (data ?? []) as Row[];
}

function toEvidence(rows: Row[], mode: MatchMode, categories: readonly QueryCategory[]): DocumentEvidence[] {
  return rows
    .map((row) => {
      const documentType = String(row.document_type);
      return {
        untrustedEvidence: true as const,
        source: "property_document" as const,
        documentId: String(row.document_id),
        documentType,
        title: String(row.title),
        version: Number(row.version),
        approvedAt: row.approved_at ? String(row.approved_at) : null,
        citation: propertyDocumentCitation(String(row.document_id), Number(row.version)),
        snippet: cleanSnippet(row.snippet as string | null),
        score: Number(row.rank) * boostFor(documentType, categories),
        matchMode: mode,
      };
    })
    .sort((a, b) => b.score - a.score || a.documentId.localeCompare(b.documentId));
}

function factSatisfies(facts: AuthoritativePropertyFacts, category: QueryCategory): boolean {
  switch (category) {
    case "price": return facts.price !== null;
    case "bedrooms": return facts.bedrooms !== null;
    case "bathrooms": return facts.bathrooms !== null;
    case "area": return facts.area !== null;
    case "amenities": return facts.amenities.length > 0;
    case "parking": return facts.parking !== null;
    case "floor": return facts.floor !== null;
    case "location":
    case "availability": return true;
  }
}

export function computeCoverage(facts: AuthoritativePropertyFacts | null, categories: readonly QueryCategory[], strictCount: number, relaxedCount: number): Coverage {
  const satisfied = facts ? categories.filter((category) => factSatisfies(facts, category)) : [];
  const unsatisfied = categories.filter((category) => !satisfied.includes(category));
  const allSatisfied = categories.length > 0 && unsatisfied.length === 0;
  const level = !facts ? "none" : allSatisfied || strictCount > 0 ? "full" : relaxedCount > 0 || satisfied.length > 0 ? "partial" : "none";
  return { level, satisfiedCategories: satisfied, unsatisfiedCategories: unsatisfied, strictEvidenceCount: strictCount, relaxedEvidenceCount: relaxedCount };
}

function buildRefs(facts: AuthoritativePropertyFacts, evidence: readonly DocumentEvidence[]): SourceRef[] {
  const refs: SourceRef[] = [{ type: "property", id: facts.propertyId, citation: propertyCitation(facts.propertyId), title: facts.title, propertyId: facts.propertyId }];
  if (facts.price) {
    refs.push({ type: "price_revision", id: facts.price.revisionId, citation: priceRevisionCitation(facts.price.revisionId), title: "Current approved price", propertyId: facts.propertyId });
  }
  for (const item of evidence) {
    refs.push({ type: "property_document", id: item.documentId, citation: item.citation, title: item.title, propertyId: facts.propertyId, documentType: item.documentType, version: item.version, approvedAt: item.approvedAt });
  }
  return refs;
}

/**
 * Channel- and cookie-independent retrieval core. The Supabase client and the
 * tenant identifiers are injected: an interactive adapter supplies the
 * session client (RLS applies), a future trusted context supplies its own with
 * explicit predicates. Every query carries organization + workspace + property,
 * and a property that is not in the tenant fails closed (no documents are
 * ever searched). No generation, no provider call, no side effects.
 */
export async function retrievePropertyKnowledge(client: SupabaseClient, input: RetrievePropertyKnowledgeInput): Promise<PropertyKnowledgeRetrievalResult> {
  const scope: Scope = { organizationId: input.organizationId, workspaceId: input.workspaceId };
  const cleaned = sanitizeQuery(input.query);
  const categories = categorizeQuery(cleaned.text);
  const limit = Math.min(Math.max(Math.trunc(input.limit ?? defaultEvidenceLimit) || defaultEvidenceLimit, 1), maxEvidenceLimit);
  const query = { text: cleaned.text, categories, status: cleaned.status } as const;

  let resolution: PropertyResolution;
  if (input.propertyId) {
    resolution = uuidPattern.test(input.propertyId) ? { status: "explicit", propertyId: input.propertyId } : { status: "property_not_found", propertyId: null };
  } else if (input.leadId) {
    resolution = await resolveLeadProperty(client, scope, input.leadId);
  } else {
    resolution = { status: "unresolved_no_context", propertyId: null };
  }

  const empty = (next: PropertyResolution): PropertyKnowledgeRetrievalResult => ({
    propertyId: null,
    resolution: next,
    query,
    structuredFacts: null,
    priceAuthority: "none",
    evidence: [],
    refs: [],
    coverage: computeCoverage(null, categories, 0, 0),
    authority: { structuredFacts: "authoritative", documentEvidence: "untrusted_supporting" },
  });

  if (!resolution.propertyId) return empty(resolution);

  const facts = await getAuthoritativePropertyFacts(client, { ...scope, propertyId: resolution.propertyId });
  if (!facts) return empty({ status: "property_not_found", propertyId: null });

  let evidence: DocumentEvidence[] = [];
  let strictCount = 0;
  let relaxedCount = 0;
  if (cleaned.status === "ok") {
    const strict = await searchDocuments(client, scope, facts.propertyId, cleaned.text, limit);
    if (strict.length > 0) {
      evidence = toEvidence(strict, "all_terms", categories);
      strictCount = evidence.length;
    } else {
      const relaxed = relaxedQuery(cleaned.text);
      if (relaxed !== "") {
        evidence = toEvidence(await searchDocuments(client, scope, facts.propertyId, relaxed, limit), "any_terms", categories);
        relaxedCount = evidence.length;
      }
    }
  }

  return {
    propertyId: facts.propertyId,
    resolution,
    query,
    structuredFacts: facts,
    priceAuthority: facts.price ? "approved_revision" : "none",
    evidence,
    refs: buildRefs(facts, evidence),
    coverage: computeCoverage(facts, categories, strictCount, relaxedCount),
    authority: { structuredFacts: "authoritative", documentEvidence: "untrusted_supporting" },
  };
}

/** Interactive adapter (cookie session). A trusted adapter can call retrievePropertyKnowledge() directly with its own client. */
export class PropertyKnowledgeRetrievalService {
  constructor(private client: SupabaseClient, private organizationId: string, private workspaceId: string) {}

  static async production() {
    const context = await operationsContext();
    return new PropertyKnowledgeRetrievalService(context.client, context.organizationId, context.workspaceId);
  }

  retrieve(input: Omit<RetrievePropertyKnowledgeInput, "organizationId" | "workspaceId">) {
    return retrievePropertyKnowledge(this.client, { ...input, organizationId: this.organizationId, workspaceId: this.workspaceId });
  }
}
