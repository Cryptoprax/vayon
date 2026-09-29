"use server";
import { revalidatePath } from "next/cache";
import { requireEntitlement } from "@/features/vayon/billing/services/require-entitlement";
import { requireWorkspacePermission } from "@/features/platform/permissions/runtime/permission.service";
import { PropertyKnowledgeExtractionService } from "../services/property-knowledge-extraction.service";

/**
 * Triggering extraction is expensive processing, so it requires
 * knowledge:approve (the knowledge manage grant, same authority as the
 * approve/archive actions and the DB-layer can_manage_knowledge() gate) -- a
 * member who can merely view knowledge cannot start it. Accepts only ids; no
 * path, MIME type or tenant value is taken from the browser.
 */
export async function extractPropertyKnowledgeDocumentAction(formData: FormData) {
  await requireEntitlement("knowledge");
  await requireWorkspacePermission("knowledge", "approve");

  const propertyId = String(formData.get("propertyId") ?? "");
  const documentId = String(formData.get("documentId") ?? "");
  if (!documentId) throw new Error("A document is required.");

  const service = await PropertyKnowledgeExtractionService.production();
  await service.extract(documentId);

  if (propertyId) revalidatePath(`/vayon/properties/${propertyId}`);
}
