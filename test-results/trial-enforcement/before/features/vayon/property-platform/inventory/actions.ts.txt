"use server";
import { revalidatePath } from "next/cache";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { InventoryService } from "./service";

const allowed = new Set(["organization_owner", "organization_admin", "administrator", "sales_manager", "sales_agent", "project_manager"]);
export async function transitionInventoryUnitAction(formData: FormData) {
  const context = await operationsContext();
  const { data } = await context.client.from("organization_members").select("roles(code)").eq("organization_id", context.organizationId).eq("status", "active").limit(1).maybeSingle();
  const role = (data as unknown as { roles?: { code?: string } } | null)?.roles?.code;
  if (!role || !allowed.has(role)) throw new Error("You do not have permission to change inventory availability.");
  const action = String(formData.get("action"));
  if (action !== "reserve" && action !== "release" && action !== "book") throw new Error("Unsupported inventory action.");
  await (await InventoryService.production()).transitionUnit({ unitId: String(formData.get("unitId")), expectedStatus: String(formData.get("expectedStatus")), action, buyerId: String(formData.get("buyerId") ?? "") || undefined, opportunityRequested: formData.get("opportunityRequested") === "true" });
  revalidatePath("/vayon/properties/inventory");
}
