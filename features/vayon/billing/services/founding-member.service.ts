import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { log } from "@/lib/observability/logger";
import { paddleRequest } from "../providers/paddle/paddle-client";
import { foundingMonthlyPriceId, paddleCatalogEntry } from "../providers/paddle/paddle-catalog";
import { unavailableFoundingOffer, type FoundingMemberAvailability } from "./founding-member.types";
import { PaddleSubscriptionSyncService } from "./paddle-subscription-sync.service";

interface Allocation {
  organization_id: string; workspace_id: string; reservation_id: string;
  status: string; reserved_until: string; confirmed_at: string | null;
  paddle_transaction_id: string; paddle_subscription_id: string | null;
  paddle_customer_id: string; founding_price_id: string; standard_price_id: string;
  successful_periods: number;
  excess_periods?: number;
  mutation_token: string | null;
}
interface PaddleItem { price: { id: string }; quantity: number }
interface PaddleEntity {
  id: string; status: string; customer_id: string; subscription_id?: string;
  items: PaddleItem[]; custom_data?: Record<string, unknown> | null;
  updated_at?: string; invoice_id?: string;
}
const table = "professional_founding_allocations";

type ReconciliationStage = "allocation_query" | "reservation_recovery" | "transition_check"
  | "transaction_list" | "payment_record" | "subscription_fetch"
  | "subscription_validation" | "subscription_sync";

function logReconciliationFailure(stage: ReconciliationStage, error: unknown) {
  // Copy only known diagnostic vocabulary; never pass through messages or objects.
  const fields: Record<string, unknown> = { stage, errorCategory: "UnknownError" };
  try {
    if (error && typeof error === "object") {
      const value = error as Record<string, unknown>;
      const name = value.name, code = value.code, status = value.status;
      if (["Error", "TypeError", "RangeError", "AbortError", "TimeoutError", "PaddleApiError"].includes(name as string))
        fields.errorCategory = name;
      if (name === "PaddleApiError") {
        if (typeof status === "number" && Number.isInteger(status) && status >= 100 && status <= 599)
          fields.providerHttpStatus = status;
        if (["authentication_missing", "authentication_malformed", "authentication_invalid", "authorization_denied",
          "not_found", "entity_not_found", "bad_request", "invalid_field", "too_many_requests", "internal_server_error", "service_unavailable"].includes(code as string))
          fields.providerErrorCode = code;
      } else if (typeof code === "string" && /^[0-9A-Z]{5}$/.test(code)) {
        fields.sqlstate = code;
        fields.errorCategory = "DatabaseError";
      }
    }
  } catch { /* Untrusted error properties must not interfere with propagation. */ }
  try { log("billing.founding_offer.reconciliation_failed", fields); }
  catch { /* Diagnostics must not change reconciliation failure handling. */ }
}

export type InvoiceRecoveryStage = "service_init" | "organization_lookup" | "allocation_lookup"
  | "workspace_validation" | "paddle_transaction_fetch" | "transaction_identity_validation"
  | "transaction_status_validation" | "customer_validation" | "subscription_validation"
  | "founding_price_validation" | "invoice_lookup" | "billing_projection";

export function logInvoiceRecoveryFailure(stage: InvoiceRecoveryStage, error: unknown) {
  // Same safe diagnostic vocabulary as logReconciliationFailure: never pass through
  // messages, stacks, payloads, or any request/business identifiers.
  const fields: Record<string, unknown> = { stage, errorCategory: "UnknownError" };
  try {
    if (error && typeof error === "object") {
      const value = error as Record<string, unknown>;
      const name = value.name, code = value.code, status = value.status;
      if (["Error", "TypeError", "RangeError", "AbortError", "TimeoutError", "PaddleApiError"].includes(name as string))
        fields.errorCategory = name;
      if (name === "PaddleApiError") {
        if (typeof status === "number" && Number.isInteger(status) && status >= 100 && status <= 599)
          fields.providerHttpStatus = status;
        if (["authentication_missing", "authentication_malformed", "authentication_invalid", "authorization_denied",
          "not_found", "entity_not_found", "bad_request", "invalid_field", "too_many_requests", "internal_server_error", "service_unavailable"].includes(code as string))
          fields.providerErrorCode = code;
      } else if (typeof code === "string" && /^[0-9A-Z]{5}$/.test(code)) {
        fields.sqlstate = code;
        fields.errorCategory = "DatabaseError";
      }
    }
  } catch { /* Untrusted error properties must not interfere with propagation. */ }
  try { log("founding_invoice_recovery.failed", fields); }
  catch { /* Diagnostics must not change recovery failure handling. */ }
}

export class FoundingMemberService {
  constructor(private client = createSupabaseServiceClient(), private request = paddleRequest) {}

  static create(): FoundingMemberService {
    try { return new FoundingMemberService(); }
    catch (error) { logInvoiceRecoveryFailure("service_init", error); throw error; }
  }

  async assertCheckoutAllowed(organizationId: string) {
    const paid = await this.client.from("subscriptions").select("id")
      .eq("organization_id", organizationId).not("provider_subscription_id", "is", null).neq("status", "cancelled").limit(1);
    if (paid.error) throw paid.error;
    if (paid.data?.length) throw new Error("Manage your existing organization subscription from the Subscription Center.");
    const reserved = await this.client.from(table).select("status").eq("organization_id", organizationId).eq("status", "reserved").maybeSingle();
    if (reserved.error) throw reserved.error;
    if (reserved.data) throw new Error("A founding checkout is already in progress. Try again after it expires.");
  }

  async availability(organizationId?: string): Promise<FoundingMemberAvailability> {
    const configured = Boolean(foundingMonthlyPriceId() && process.env.CRON_SECRET);
    if (!configured && !organizationId) return { ...unavailableFoundingOffer };
    const { data, error } = await this.client.rpc("professional_founding_eligibility", { p_organization_id: organizationId ?? null });
    if (error) throw error;
    const result = data as FoundingMemberAvailability;
    return { ...result, eligible: configured && result.eligible, remaining: configured ? result.remaining : 0 };
  }

  async reserve(input: { organizationId: string; workspaceId: string; customerId: string; transactionId: string }) {
    const founding = foundingMonthlyPriceId();
    if (!founding || !process.env.CRON_SECRET) return null;
    const { data, error } = await this.client.rpc("reserve_professional_founding", {
      p_organization_id: input.organizationId, p_workspace_id: input.workspaceId,
      p_customer_id: input.customerId, p_transaction_id: input.transactionId,
      p_founding_price_id: founding,
      p_standard_price_id: paddleCatalogEntry("professional", "monthly").priceId,
    });
    if (error) throw error;
    const allocation = data as Allocation | null;
    log(allocation ? "billing.founding_offer.reserved" : "billing.founding_offer.exhausted", {});
    return allocation;
  }

  async applyPrice(a: Allocation, quantity: number) {
    // This transaction was persisted BEFORE it could ever carry the founding price.
    await this.request(`/transactions/${encodeURIComponent(a.paddle_transaction_id)}`, {
      method: "PATCH", body: JSON.stringify({
        items: [{ price_id: a.founding_price_id, quantity }],
        custom_data: { organization_id: a.organization_id, workspace_id: a.workspace_id,
          plan_code: "professional", billing_period: "monthly", founding_offer: true,
          founding_reservation: a.reservation_id },
      }),
    });
  }

  async cancelReservation(a: Allocation) {
    const path = `/transactions/${encodeURIComponent(a.paddle_transaction_id)}`;
    let transaction = await this.request<PaddleEntity>(path);
    if (transaction.status === "completed") {
      const confirmed = await this.recordPayment(transaction);
      if (confirmed?.paddle_subscription_id) await this.syncSubscription(confirmed.paddle_subscription_id);
      else if (!transaction.items.some(item => item.price.id === a.founding_price_id)) await this.release(a);
      else throw new Error("Completed founding payment requires reconciliation.");
      return;
    }
    if (transaction.status === "paid") return; // Paddle is still processing; keep the slot.
    if (transaction.status !== "canceled") {
      transaction = await this.request<PaddleEntity>(path, { method: "PATCH", body: JSON.stringify({ status: "canceled" }) });
    }
    if (transaction.status !== "canceled") throw new Error("Founding transaction cancellation not confirmed.");
    await this.release(a);
  }

  private async release(a: Allocation) {
    const { error } = await this.client.rpc("release_professional_founding", {
      p_reservation_id: a.reservation_id, p_transaction_id: a.paddle_transaction_id,
    });
    if (error) throw error;
  }

  async prepareResume(subscriptionId: string) {
    const { data, error } = await this.client.from(table).select("*").eq("paddle_subscription_id", subscriptionId).maybeSingle();
    if (error) throw error;
    if (data?.status === "transition_pending") await this.transition(data as Allocation);
  }

  async recordPayment(transaction: PaddleEntity) {
    const { data, error } = await this.client.rpc("record_professional_founding_payment", { p_payload: transaction });
    if (error) throw error;
    const allocation = data as Allocation | null;
    if (allocation) {
      if (allocation.excess_periods) log("billing.founding_offer.excess_payment_detected", { excessPeriods: allocation.excess_periods });
      log("billing.founding_offer.confirmed", { successfulPeriods: allocation.successful_periods });
      if (allocation.status === "transition_pending") await this.transition(allocation);
    }
    return allocation;
  }

  async transition(a: Allocation) {
    if (!a.paddle_subscription_id) return;
    return this.withSubscriptionMutation(a.paddle_subscription_id, async latest => {
      if (!latest || latest.status === "ended") return;
      await this.applyTransition(latest);
    });
  }

  async withSubscriptionMutation<T>(subscriptionId: string, operation: (allocation: Allocation | null) => Promise<T>): Promise<T> {
    const { data, error } = await this.client.rpc("lock_professional_founding_subscription", { p_subscription_id: subscriptionId });
    if (error) throw error;
    const a = data as Allocation | null;
    try { return await operation(a); }
    finally {
      if (a) {
        const result = await this.client.rpc("unlock_professional_founding_subscription", { p_reservation_id: a.reservation_id, p_token: a.mutation_token });
        if (result.error) throw result.error;
      }
    }
  }

  private async applyTransition(a: Allocation) {
    const path = `/subscriptions/${encodeURIComponent(a.paddle_subscription_id!)}`;
    const current = await this.request<PaddleEntity>(path);
    if (current.customer_id !== a.paddle_customer_id) throw new Error("Founding subscription mismatch.");
    const hasFounding = current.items.some(item => item.price.id === a.founding_price_id);
    if (current.status === "canceled" || (!hasFounding && !current.items.some(item => item.price.id === a.standard_price_id))) {
      await this.update(a, { status: "ended" }); return;
    }
    if (hasFounding) {
      // The 12th period is already fully paid. Change renewal items without charging
      // or changing next_billed_at, so renewal 13 uses standard pricing.
      await this.request(path, { method: "PATCH", body: JSON.stringify({
        items: current.items.map(item => ({ price_id: item.price.id === a.founding_price_id ? a.standard_price_id : item.price.id, quantity: item.quantity })),
        proration_billing_mode: "do_not_bill",
      }) });
    }
    await this.update(a, { status: "transitioned", transitioned_at: new Date().toISOString() });
    log("billing.founding_offer.transition_scheduled", {});
  }

  private async update(a: Allocation, values: Record<string, unknown>) {
    const { error } = await this.client.from(table).update(values).eq("reservation_id", a.reservation_id);
    if (error) throw error;
  }

  private async syncSubscription(subscriptionId: string) {
    const current = await this.request<PaddleEntity>(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
    // Stable synthetic key shares the existing idempotent projection, so recovery
    // after a missing webhook cannot grant access twice or resurrect stale state.
    await new PaddleSubscriptionSyncService().project(`founding-reconcile:${current.id}:${current.updated_at}`, "subscription.updated", current);
  }

  /** Run after signature verification, before the existing entitlement projection. */
  async webhook(type: string, payload: unknown): Promise<unknown> {
    if (!type.startsWith("transaction.") && !type.startsWith("subscription.")) return payload;
    const event = payload as PaddleEntity;
    if (!event?.id) throw new Error("Missing Paddle entity ID.");
    // Retrieve current provider state: late failed/canceled notifications cannot
    // reverse a newer completed payment or resumed subscription.
    const transactionEvent = type.startsWith("transaction.");
    const current = await this.request<PaddleEntity>(`/${transactionEvent ? "transactions" : "subscriptions"}/${encodeURIComponent(event.id)}`);
    let query = this.client.from(table).select("*");
    if (transactionEvent) query = query.eq("paddle_transaction_id", current.id);
    else query = query.eq("paddle_subscription_id", current.id);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    let a = data as Allocation | null;
    if (!a && transactionEvent && current.subscription_id) {
      const lookup = await this.client.from(table).select("*").eq("paddle_subscription_id", current.subscription_id).maybeSingle();
      if (lookup.error) throw lookup.error;
      a = lookup.data as Allocation | null;
    }
    if (!a && current.custom_data?.founding_reservation) {
      const lookup = await this.client.from(table).select("*").eq("reservation_id", current.custom_data.founding_reservation).maybeSingle();
      if (lookup.error) throw lookup.error;
      a = lookup.data as Allocation | null;
    }
    const usesFounding = current.items?.some(item => item.price.id === (a?.founding_price_id ?? foundingMonthlyPriceId()));
    if (usesFounding && !a) throw new Error("Unallocated founding subscription rejected.");
    if (a) {
      if (current.customer_id !== a.paddle_customer_id) throw new Error("Invalid founding reservation.");
      if (a.status === "expired") {
        if (transactionEvent && current.status === "canceled") return current;
        throw new Error("Invalid founding reservation.");
      }
      if (!a.paddle_subscription_id) {
        const initial = transactionEvent && current.id === a.paddle_transaction_id ? current :
          await this.request<PaddleEntity>(`/transactions/${encodeURIComponent(a.paddle_transaction_id)}`);
        const confirmed = await this.recordPayment(initial);
        if (!transactionEvent && (!confirmed || confirmed.paddle_subscription_id !== current.id))
          throw new Error("Founding payment confirmation pending.");
        if (confirmed) a = confirmed;
      }
      if (transactionEvent && current.status === "completed") await this.recordPayment(current);
      if (!transactionEvent) {
        if (a.paddle_subscription_id !== current.id) throw new Error("Founding subscription mismatch.");
        if (current.status === "canceled" || (!usesFounding && a.successful_periods < 12)) await this.update(a, { status: "ended" });
        if (a.status === "transition_pending") await this.transition(a);
      }
      current.custom_data = { ...current.custom_data, organization_id: a.organization_id, workspace_id: a.workspace_id,
        ...(usesFounding ? { plan_code: "professional", billing_period: "monthly" } : {}) };
    } else if (transactionEvent && current.status === "completed" && current.subscription_id) {
      // Renewal transactions need not retain custom_data; the durable subscription
      // binding is sufficient and is validated again inside the payment RPC.
      await this.recordPayment(current);
    }
    return current;
  }

  /** Independent scheduled recovery: no browser, login, or webhook delivery required. */
  async reconcile() {
    let result;
    try {
      result = await this.client.from(table).select("*").in("status", ["reserved", "confirmed", "transition_pending"]);
    } catch (error) { logReconciliationFailure("allocation_query", error); throw error; }
    const { data, error } = result;
    if (error) { logReconciliationFailure("allocation_query", error); throw error; }
    let failures = 0;
    for (const a of (data ?? []) as Allocation[]) {
      let stage: ReconciliationStage = "reservation_recovery";
      try {
        if (a.status === "reserved") {
          if (Date.parse(a.reserved_until) <= Date.now()) await this.cancelReservation(a);
          continue;
        }
        if (a.status === "transition_pending") { stage = "transition_check"; await this.transition(a); continue; }
        // Catch missed payment notifications; pagination uses Paddle's ID cursor.
        let after = "";
        for (let page = 0; page < 100; page++) {
          stage = "transaction_list";
          const transactions = await this.request<PaddleEntity[]>(`/transactions?subscription_id=${encodeURIComponent(a.paddle_subscription_id!)}&status=completed&per_page=30${after ? `&after=${encodeURIComponent(after)}` : ""}`);
          for (const transaction of transactions) { stage = "payment_record"; await this.recordPayment(transaction); }
          stage = "transaction_list";
          if (transactions.length < 30) break;
          after = transactions[transactions.length - 1].id;
          if (page === 99) throw new Error("Founding reconciliation pagination exceeded.");
        }
        stage = "subscription_fetch";
        const current = await this.request<PaddleEntity>(`/subscriptions/${encodeURIComponent(a.paddle_subscription_id!)}`);
        stage = "subscription_validation";
        if (current.status === "canceled" || !current.items.some(item => item.price.id === a.founding_price_id)) {
          // Do not overwrite a transition that recordPayment just completed.
          const result = await this.client.from(table).update({ status: "ended" }).eq("reservation_id", a.reservation_id).eq("status", "confirmed");
          if (result.error) throw result.error;
        }
        stage = "subscription_sync";
        await this.syncSubscription(a.paddle_subscription_id!);
      } catch (error) { failures++; logReconciliationFailure(stage, error); }
    }
    if (failures) throw new Error("Founding reconciliation requires retry.");
  }

  async organizationIdByName(name: string): Promise<string | null> {
    try {
      const { data, error } = await this.client.from("organizations").select("id").eq("name", name).maybeSingle();
      if (error) throw error;
      const id = (data as { id: string } | null)?.id ?? null;
      if (!id) logInvoiceRecoveryFailure("organization_lookup", new Error("Organization not found."));
      return id;
    } catch (error) {
      logInvoiceRecoveryFailure("organization_lookup", error);
      throw error;
    }
  }

  /** One-time gap recovery: reconcile() only ever projects subscription.updated, so a
   *  confirmed founding payment can be missing its invoice if the original transaction
   *  webhook was never delivered. This projects the existing, freshly fetched completed
   *  transaction through the same idempotent billing projection the webhook would have
   *  used; it never touches record_professional_founding_payment, so successful_periods
   *  cannot change here. */
  async recoverFoundingInvoice(organizationId: string): Promise<{ recovered: boolean }> {
    let stage: InvoiceRecoveryStage = "allocation_lookup";
    try {
      const { data, error } = await this.client.from(table).select("*").eq("organization_id", organizationId).maybeSingle();
      if (error) throw error;
      const a = data as Allocation | null;
      if (!a || a.status !== "confirmed") throw new Error("Founding allocation is not confirmed.");

      stage = "workspace_validation";
      const workspace = await this.client.from("workspaces").select("organization_id").eq("id", a.workspace_id).maybeSingle();
      if (workspace.error) throw workspace.error;
      const workspaceOrganizationId = (workspace.data as { organization_id: string } | null)?.organization_id;
      if (workspaceOrganizationId !== a.organization_id) throw new Error("Founding allocation organization/workspace mismatch.");

      stage = "paddle_transaction_fetch";
      const transaction = await this.request<PaddleEntity>(`/transactions/${encodeURIComponent(a.paddle_transaction_id)}`);

      stage = "transaction_identity_validation";
      if (transaction.id !== a.paddle_transaction_id) throw new Error("Unexpected founding transaction identity.");

      stage = "transaction_status_validation";
      if (transaction.status !== "completed") throw new Error("Founding transaction is not completed.");

      stage = "customer_validation";
      if (transaction.customer_id !== a.paddle_customer_id) throw new Error("Founding transaction customer mismatch.");

      stage = "subscription_validation";
      if (transaction.subscription_id !== a.paddle_subscription_id) throw new Error("Founding transaction subscription mismatch.");

      stage = "founding_price_validation";
      if (!transaction.items.some(item => item.price.id === a.founding_price_id))
        throw new Error("Founding transaction does not carry the founding price.");

      stage = "invoice_lookup";
      const invoiceId = transaction.invoice_id || transaction.id;
      const existing = await this.client.from("invoices").select("provider_invoice_id").eq("provider_invoice_id", invoiceId).maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data) return { recovered: false };

      stage = "billing_projection";
      await new PaddleSubscriptionSyncService().project(`founding-invoice-recover:${transaction.id}`, "transaction.completed", transaction);
      return { recovered: true };
    } catch (error) {
      logInvoiceRecoveryFailure(stage, error);
      throw error;
    }
  }
}

/** Rendering fails closed; missing optional configuration never disables standard checkout. */
export async function foundingAvailability(organizationId?: string): Promise<FoundingMemberAvailability> {
  try { return await new FoundingMemberService().availability(organizationId); }
  catch { return { ...unavailableFoundingOffer }; }
}
