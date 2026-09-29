import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CurrentPrice, PriceRevision, PriceRevisionStatus, ValidatedPriceRevisionInput } from "../domain/types";

type Row = Record<string, unknown>;
const text = (value: unknown): string | null => (value === null || value === undefined ? null : String(value));

function toRevision(row: Row): PriceRevision {
  return {
    id: String(row.revision_id),
    version: Number(row.version),
    status: row.status as PriceRevisionStatus,
    currency: String(row.currency),
    basePrice: text(row.base_price),
    offerPrice: text(row.offer_price),
    effectiveFrom: String(row.effective_from),
    effectiveTo: text(row.effective_to),
    sourceDocumentId: text(row.source_document_id),
    createdAt: String(row.created_at),
    approvedAt: text(row.approved_at),
    supersededBy: text(row.superseded_by),
    notes: text(row.notes),
  };
}

/**
 * Reads pass explicit organization/workspace/property predicates to SECURITY
 * INVOKER SQL functions (RLS is the structural backstop for interactive
 * users); writes go through SECURITY DEFINER RPCs that derive the
 * organization themselves. Money crosses the boundary as text, never a float.
 */
export class PropertyPriceRevisionRepository {
  constructor(
    private client: SupabaseClient,
    private organizationId: string,
    private workspaceId: string,
  ) {}

  async list(propertyId: string): Promise<readonly PriceRevision[]> {
    const { data, error } = await this.client.rpc("list_property_price_revisions", {
      p_organization_id: this.organizationId,
      p_workspace_id: this.workspaceId,
      p_property_id: propertyId,
    });
    if (error) throw error;
    return ((data ?? []) as Row[]).map(toRevision);
  }

  async current(propertyId: string): Promise<CurrentPrice | null> {
    const { data, error } = await this.client.rpc("current_property_price", {
      p_organization_id: this.organizationId,
      p_workspace_id: this.workspaceId,
      p_property_id: propertyId,
    });
    if (error) throw error;
    const row = ((data ?? []) as Row[])[0];
    if (!row) return null;
    return {
      revisionId: String(row.revision_id),
      currency: String(row.currency),
      basePrice: text(row.base_price),
      offerPrice: text(row.offer_price),
      effectiveFrom: String(row.effective_from),
      sourceDocumentId: text(row.source_document_id),
    };
  }

  async create(input: ValidatedPriceRevisionInput): Promise<string> {
    const { data, error } = await this.client.rpc("create_property_price_revision", {
      p_workspace_id: this.workspaceId,
      p_property_id: input.propertyId,
      p_currency: input.currency,
      p_base_price: input.basePrice,
      p_offer_price: input.offerPrice,
      p_effective_from: input.effectiveFrom,
      p_source_document_id: input.sourceDocumentId,
      p_notes: input.notes,
    });
    if (error) throw error;
    return String(data);
  }

  async approve(revisionId: string): Promise<void> {
    const { error } = await this.client.rpc("approve_property_price_revision", {
      p_workspace_id: this.workspaceId,
      p_revision_id: revisionId,
    });
    if (error) throw error;
  }

  async archive(revisionId: string): Promise<void> {
    const { error } = await this.client.rpc("archive_property_price_revision", {
      p_workspace_id: this.workspaceId,
      p_revision_id: revisionId,
    });
    if (error) throw error;
  }
}
