"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireEntitlement } from "@/features/vayon/billing/services/require-entitlement";
import { requireWorkspacePermission } from "@/features/platform/permissions/runtime/permission.service";
import { PropertyPriceRevisionService } from "../services/property-price-revision.service";
import { PriceValidationError } from "../domain/types";

/**
 * Creating, approving and archiving price revisions is property fact
 * management, so it reuses the existing knowledge entitlement (Starter+) and
 * the knowledge:approve manage grant -- the same authority as the DB-layer
 * can_manage_knowledge() gate inside every write RPC. No new permission
 * module exists. Every value comes from a person's form; nothing is derived
 * from extracted document text.
 */
function pricingPath(propertyId: string, suffix = "") {
  return `/vayon/properties/${encodeURIComponent(propertyId)}?tab=pricing${suffix}`;
}

function messageFor(error: unknown): string {
  if (error instanceof PriceValidationError) return error.message;
  const raw = error instanceof Error ? error.message : "";
  const known = /^(PROPERTY_NOT_FOUND|SOURCE_DOCUMENT_INVALID|SOURCE_DOCUMENT_NOT_APPROVED|REVISION_NOT_FOUND|REVISION_NOT_APPROVABLE|REVISION_NOT_ARCHIVABLE): ?(.*)$/.exec(raw);
  return known ? known[2] : "The price revision could not be saved.";
}

async function authorize() {
  await requireEntitlement("knowledge");
  await requireWorkspacePermission("knowledge", "approve");
}

export async function createPriceRevisionAction(formData: FormData) {
  await authorize();
  const propertyId = String(formData.get("propertyId") ?? "");
  let failure: string | null = null;
  try {
    const service = await PropertyPriceRevisionService.production();
    await service.create({
      propertyId,
      currency: String(formData.get("currency") ?? ""),
      basePrice: String(formData.get("basePrice") ?? ""),
      offerPrice: String(formData.get("offerPrice") ?? ""),
      effectiveFrom: String(formData.get("effectiveFrom") ?? ""),
      sourceDocumentId: String(formData.get("sourceDocumentId") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    });
  } catch (error) {
    failure = messageFor(error);
  }
  if (failure) redirect(pricingPath(propertyId, `&error=${encodeURIComponent(failure)}`));
  revalidatePath(`/vayon/properties/${propertyId}`);
}

async function transition(formData: FormData, run: (service: PropertyPriceRevisionService, revisionId: string) => Promise<void>) {
  await authorize();
  const propertyId = String(formData.get("propertyId") ?? "");
  const revisionId = String(formData.get("revisionId") ?? "");
  let failure: string | null = null;
  try {
    await run(await PropertyPriceRevisionService.production(), revisionId);
  } catch (error) {
    failure = messageFor(error);
  }
  if (failure) redirect(pricingPath(propertyId, `&error=${encodeURIComponent(failure)}`));
  revalidatePath(`/vayon/properties/${propertyId}`);
}

export async function approvePriceRevisionAction(formData: FormData) {
  await transition(formData, (service, id) => service.approve(id));
}

export async function archivePriceRevisionAction(formData: FormData) {
  await transition(formData, (service, id) => service.archive(id));
}
