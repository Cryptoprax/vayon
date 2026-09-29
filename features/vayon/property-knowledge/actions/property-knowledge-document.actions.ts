"use server";
import { revalidatePath } from "next/cache";
import { requireEntitlement } from "@/features/vayon/billing/services/require-entitlement";
import { requireWorkspacePermission } from "@/features/platform/permissions/runtime/permission.service";
import { PropertyKnowledgeDocumentService } from "../services/property-knowledge-document.service";
import { propertyKnowledgeDocumentTypes, type PropertyKnowledgeDocumentType } from "../domain/types";

function isDocumentType(value: string): value is PropertyKnowledgeDocumentType {
  return (propertyKnowledgeDocumentTypes as readonly string[]).includes(value);
}

/**
 * Gated by the `knowledge` entitlement (Starter+), matching K0's finding
 * that knowledge is a Starter+ feature -- deliberately NOT the `ai_workforce`
 * or `whatsapp` entitlements (Professional+), so a Starter customer can
 * still maintain property knowledge even before any AI feature is connected
 * to it. See Part 22.
 */
export async function uploadPropertyKnowledgeDocumentAction(formData: FormData) {
  await requireEntitlement("knowledge");
  await requireWorkspacePermission("knowledge", "create");

  const propertyId = String(formData.get("propertyId") ?? "");
  const documentTypeRaw = String(formData.get("documentType") ?? "");
  const title = String(formData.get("title") ?? "");
  const file = formData.get("file");

  if (!propertyId) throw new Error("A property is required.");
  if (!isDocumentType(documentTypeRaw)) throw new Error("Unsupported document type.");
  if (!(file instanceof File) || file.size === 0) throw new Error("A file is required.");

  const service = await PropertyKnowledgeDocumentService.production();
  await service.upload({ propertyId, documentType: documentTypeRaw, title, file });

  revalidatePath(`/vayon/properties/${propertyId}`);
}

/**
 * Called directly from a client component (not a <form> action) since it
 * returns a value the browser needs to open, rather than redirecting a
 * page. Re-derives tenant scope from the session on every call -- the
 * signed URL is never cached or returned from a broader listing endpoint.
 */
export async function getPropertyKnowledgeDocumentSignedUrlAction(documentId: string): Promise<string> {
  await requireEntitlement("knowledge");
  await requireWorkspacePermission("knowledge", "view");
  if (!documentId) throw new Error("A document is required.");

  const service = await PropertyKnowledgeDocumentService.production();
  return service.signedUrl(documentId);
}

export async function approvePropertyKnowledgeDocumentAction(formData: FormData) {
  await requireEntitlement("knowledge");
  await requireWorkspacePermission("knowledge", "approve");

  const propertyId = String(formData.get("propertyId") ?? "");
  const documentId = String(formData.get("documentId") ?? "");
  if (!documentId) throw new Error("A document is required.");

  const service = await PropertyKnowledgeDocumentService.production();
  await service.approve(documentId);

  if (propertyId) revalidatePath(`/vayon/properties/${propertyId}`);
}

export async function archivePropertyKnowledgeDocumentAction(formData: FormData) {
  await requireEntitlement("knowledge");
  await requireWorkspacePermission("knowledge", "approve");

  const propertyId = String(formData.get("propertyId") ?? "");
  const documentId = String(formData.get("documentId") ?? "");
  if (!documentId) throw new Error("A document is required.");

  const service = await PropertyKnowledgeDocumentService.production();
  await service.archive(documentId);

  if (propertyId) revalidatePath(`/vayon/properties/${propertyId}`);
}
