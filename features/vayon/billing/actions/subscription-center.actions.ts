"use server";
import { revalidatePath } from "next/cache";
import { billingContext } from "../services/billing-context";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { PaddleSubscriptionService } from "../services/paddle-subscription.service";
import { paddleRequest } from "../providers/paddle/paddle-client";
import { isPaddlePlanCode } from "../providers/paddle/paddle-catalog";

export async function manageSubscription(form: FormData) {
  try {
    const context = await billingContext("manage");
    const subscription = await new SubscriptionRepository(context.client, context.organizationId, context.workspaceId).current();
    if (!subscription?.providerSubscriptionId) return { ok: false, message: "Choose a plan to start your subscription." };
    const version = Number(form.get("version"));
    if (!Number.isSafeInteger(version) || version !== subscription.version) return { ok: false, message: "Your subscription has changed. Refresh before trying again." };
    const intent = String(form.get("intent"));
    const service = new PaddleSubscriptionService();
    if (intent === "payment") {
      const transaction = await paddleRequest<{ id: string }>(`/subscriptions/${encodeURIComponent(subscription.providerSubscriptionId)}/update-payment-method-transaction`);
      return { ok: true, transactionId: transaction.id, message: "Update your payment details securely." };
    }
    if (intent === "change") {
      const plan = String(form.get("plan")), period = String(form.get("period"));
      if (!isPaddlePlanCode(plan) || (period !== "monthly" && period !== "annual")) return { ok: false, message: "Choose a valid plan and billing period." };
      await service.change(plan, period, subscription.seatQuantity, version);
    } else if (intent === "cancel") await service.cancel(version);
    else if (intent === "resume") await service.resume(version);
    else return { ok: false, message: "Choose a subscription action." };
    revalidatePath("/vayon", "layout");
    return { ok: true, message: "Your request was received. Subscription details update after confirmation." };
  } catch { return { ok: false, message: "We could not update your subscription. Refresh and try again, or ask your workspace owner for help." }; }
}

export async function refreshSubscriptionState(expectedWorkspaceId: string) {
  const context = await billingContext();
  if (context.workspaceId !== expectedWorkspaceId) throw new Error("Workspace changed. Refresh the Subscription Center.");
  const subscription = await new SubscriptionRepository(context.client, context.organizationId, context.workspaceId).current();
  return { status: subscription?.status ?? null, version: subscription?.version ?? null, plan: subscription?.planCode ?? null };
}
