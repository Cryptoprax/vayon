"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guardSubscriptionAction } from "@/features/vayon/billing/services/subscription-write-guard";
import { requireEntitlement } from "@/features/vayon/billing/services/require-entitlement";
import { requireWorkspacePermission } from "@/features/platform/permissions/runtime/permission.service";
import { GovernanceService } from "../services/governance.service";

function fail(path: string, error: unknown): never {
  redirect(`${path}?error=${encodeURIComponent(error instanceof Error ? error.message : String(error))}`);
}

export async function requestApprovalAction(formData: FormData) {
  await guardSubscriptionAction();
  await requireEntitlement("approvals");
  await requireWorkspacePermission("approvals", "create");
  const sourceType = String(formData.get("sourceType") ?? ""),
    actionType = String(formData.get("actionType") ?? ""),
    sourceId = String(formData.get("sourceId") ?? "") || undefined;
  if (!sourceType.trim() || !actionType.trim()) fail("/vayon/approvals", "sourceType and actionType are required.");
  try {
    await (await GovernanceService.production()).requestApproval({ sourceType, actionType, sourceId });
  } catch (error) {
    fail("/vayon/approvals", error);
  }
  revalidatePath("/vayon/approvals");
}

async function decide(id: string, expectedVersion: number, decision: "approved" | "rejected", reason: string | undefined, redirectPath: string) {
  await guardSubscriptionAction();
  await requireEntitlement("approvals");
  await requireWorkspacePermission("approvals", "approve");
  try {
    await (await GovernanceService.production()).decideApproval(id, expectedVersion, decision, reason);
  } catch (error) {
    fail(redirectPath, error);
  }
  revalidatePath("/vayon/approvals");
  revalidatePath(`/vayon/approvals/${id}`);
}

export async function approveApprovalAction(formData: FormData) {
  const id = String(formData.get("approvalId") ?? ""),
    version = Number(formData.get("version") ?? 0),
    reason = String(formData.get("reason") ?? "") || undefined;
  await decide(id, version, "approved", reason, `/vayon/approvals/${id}`);
}

export async function rejectApprovalAction(formData: FormData) {
  const id = String(formData.get("approvalId") ?? ""),
    version = Number(formData.get("version") ?? 0),
    reason = String(formData.get("reason") ?? "") || undefined;
  await decide(id, version, "rejected", reason, `/vayon/approvals/${id}`);
}

export async function cancelApprovalAction(formData: FormData) {
  await guardSubscriptionAction();
  await requireEntitlement("approvals");
  await requireWorkspacePermission("approvals", "update");
  const id = String(formData.get("approvalId") ?? ""),
    version = Number(formData.get("version") ?? 0);
  try {
    await (await GovernanceService.production()).cancelApproval(id, version);
  } catch (error) {
    fail(`/vayon/approvals/${id}`, error);
  }
  revalidatePath("/vayon/approvals");
  revalidatePath(`/vayon/approvals/${id}`);
}
