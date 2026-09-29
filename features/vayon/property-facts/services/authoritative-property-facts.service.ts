import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthoritativePropertyFacts } from "../domain/types";

const factColumns =
  "id,reference,title,property_type,listing_type,status,country_code,region,city,locality,address,bedrooms,bathrooms,area,area_unit,parking,floor,amenities,sale_price::text,rental_price::text,currency";

type Row = Record<string, unknown>;
const orNull = <T,>(value: T | undefined | null): T | null => (value === undefined ? null : value);
const numOrNull = (value: unknown): number | null => (value === null || value === undefined ? null : Number(value));

/**
 * The structured-fact source for later retrieval (K4/K5). Returns structured
 * facts only: never extracted document text, marketing copy, commission,
 * agent, or publish flags. Every query carries explicit organization,
 * workspace and property predicates, so a raw property id from another tenant
 * resolves to null. The client is injected so a trusted server context can
 * supply its own; RLS remains the structural backstop for interactive users.
 * Where a current approved revision exists it is the authoritative price; the
 * legacy properties.sale_price/rental_price is exposed separately as
 * unverified and must never be preferred over `price`.
 */
export async function getAuthoritativePropertyFacts(
  client: SupabaseClient,
  scope: { organizationId: string; workspaceId: string; propertyId: string },
): Promise<AuthoritativePropertyFacts | null> {
  const { data, error } = await client
    .from("properties")
    .select(factColumns)
    .eq("id", scope.propertyId)
    .eq("organization_id", scope.organizationId)
    .eq("workspace_id", scope.workspaceId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as Row;

  const priceResult = await client.rpc("current_property_price", {
    p_organization_id: scope.organizationId,
    p_workspace_id: scope.workspaceId,
    p_property_id: scope.propertyId,
  });
  if (priceResult.error) throw priceResult.error;
  const current = ((priceResult.data ?? []) as Row[])[0];

  const sale = orNull(row.sale_price as string | null | undefined);
  const rental = orNull(row.rental_price as string | null | undefined);

  return {
    propertyId: String(row.id),
    reference: String(row.reference),
    title: String(row.title),
    propertyType: String(row.property_type),
    listingType: String(row.listing_type),
    status: String(row.status),
    location: {
      countryCode: String(row.country_code),
      region: orNull(row.region as string | null | undefined),
      city: String(row.city),
      locality: orNull(row.locality as string | null | undefined),
      address: String(row.address),
    },
    bedrooms: numOrNull(row.bedrooms),
    bathrooms: numOrNull(row.bathrooms),
    area: row.area === null || row.area === undefined ? null : String(row.area),
    areaUnit: String(row.area_unit),
    parking: numOrNull(row.parking),
    floor: numOrNull(row.floor),
    amenities: Array.isArray(row.amenities) ? (row.amenities as unknown[]).map(String) : [],
    price: current
      ? {
          currency: String(current.currency),
          basePrice: current.base_price === null || current.base_price === undefined ? null : String(current.base_price),
          offerPrice: current.offer_price === null || current.offer_price === undefined ? null : String(current.offer_price),
          effectiveFrom: String(current.effective_from),
          revisionId: String(current.revision_id),
          sourceDocumentId: current.source_document_id ? String(current.source_document_id) : null,
        }
      : null,
    unverifiedListingPrice:
      sale !== null
        ? { amount: sale, currency: String(row.currency), kind: "sale" }
        : rental !== null
          ? { amount: rental, currency: String(row.currency), kind: "rental" }
          : null,
  };
}
