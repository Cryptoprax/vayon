import "server-only";

import { log } from "@/lib/observability/logger";
import { BillingRepository } from "../repositories/billing.repository";
import { CommercialBillingRepository } from "../repositories/commercial.repository";
import { InvoiceRepository } from "../repositories/invoice.repository";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { UsageRepository } from "../repositories/usage.repository";
import type { BillingDashboard } from "../types";
import type { PaddleCatalogPrice } from "../providers/paddle/paddle-catalog.types";
import { PaddleCatalogService } from "./paddle-catalog.service";
import { billingContext } from "./billing-context";

export type BillingRecoveryCategory = "BILLING_NOT_INITIALIZED"|"PADDLE_NOT_CONFIGURED"|"SUBSCRIPTION_NOT_FOUND"|"CUSTOMER_NOT_FOUND"|"PORTAL_UNAVAILABLE"|"RPC_FAILURE"|"SUPABASE_FAILURE"|"RLS_FAILURE"|"PROVIDER_UNAVAILABLE"|"UNKNOWN";
export interface BillingFailure { category: BillingRecoveryCategory; source: string; recovery: string; }
export interface BillingProviderState { environment: "sandbox"|"live"|"unconfigured"; paddle: "connected"|"unavailable"|"not_configured"; webhook: "healthy"|"missing"; portal: "available"|"not_configured"; missing: readonly string[]; }
export interface StableBillingSnapshot { dashboard: BillingDashboard; catalog: PaddleCatalogPrice[]; organizationId: string; workspaceId: string; customerExists: boolean; provider: BillingProviderState; failures: BillingFailure[]; }

const empty: BillingDashboard = { plans: [], subscription: null, usage: [], invoices: [], paymentMethods: [], events: [], contact: null };

export class BillingStabilityService {
  async safeSnapshot(): Promise<StableBillingSnapshot> {
    try { return await this.snapshot(); }
    catch (error) { const category = classify(error), recovery = recoveryFor(category, "billingContext"); log("billing.context.recovered", { workspaceId: null, organizationId: null, userId: null, billingCustomerExists: false, subscriptionExists: false, environment: process.env.PADDLE_ENVIRONMENT ?? "unconfigured", provider: "paddle", repository: "workspace_members", service: "BillingStabilityService", rpcName: null, errorCode: errorCode(error), httpStatus: httpStatus(error), recoveryPathUsed: recovery }); return { dashboard: empty, catalog: [], organizationId: "", workspaceId: "", customerExists: false, provider: inspectPaddle(), failures: [{ category, source: "billingContext", recovery }] }; }
  }
  async snapshot(): Promise<StableBillingSnapshot> {
    const context = await billingContext();
    const { data: { user } } = await context.client.auth.getUser();
    const failures: BillingFailure[] = [];
    const billing = new BillingRepository(context.client, context.organizationId, context.workspaceId);
    const commercial = new CommercialBillingRepository(context.client, context.organizationId, context.workspaceId);
    const subscriptions = new SubscriptionRepository(context.client, context.organizationId, context.workspaceId);
    const usage = new UsageRepository(context.client, context.organizationId, context.workspaceId);
    const invoices = new InvoiceRepository(context.client, context.organizationId, context.workspaceId);
    const recover = async <T>(source: string, fallback: T, task: () => Promise<T>) => { try { return await task(); } catch (error) { const category = classify(error); const recovery = recoveryFor(category, source); failures.push({ category, source, recovery }); log("billing.read.recovered", { workspaceId: context.workspaceId, organizationId: context.organizationId, userId: user?.id ?? null, billingCustomerExists: null, subscriptionExists: null, environment: process.env.PADDLE_ENVIRONMENT ?? "unconfigured", provider: "paddle", repository: source.includes("Repository") ? source : null, service: "BillingStabilityService", rpcName: null, errorCode: errorCode(error), httpStatus: httpStatus(error), recoveryPathUsed: recovery }); return fallback; } };
    const [plans, subscription, usageItems, invoiceItems, paymentMethods, events, contact, customer] = await Promise.all([
      recover("SubscriptionRepository.plans", empty.plans, () => subscriptions.plans()),
      recover("SubscriptionRepository.current", empty.subscription, () => subscriptions.current()),
      recover("UsageRepository.list", empty.usage, () => usage.list()),
      recover("InvoiceRepository.list", empty.invoices, () => invoices.list()),
      recover("CommercialBillingRepository.paymentMethods", empty.paymentMethods, () => commercial.paymentMethods()),
      recover("CommercialBillingRepository.events", empty.events, () => commercial.events()),
      recover("BillingRepository.contact", empty.contact, () => billing.contact()),
      recover("billing_customers.optional", null, async () => { const { data, error } = await context.client.from("billing_customers").select("id").eq("organization_id", context.organizationId).eq("workspace_id", context.workspaceId).maybeSingle(); if (error) throw error; return data; }),
    ]);
    if (!subscription) failures.push({ category: "SUBSCRIPTION_NOT_FOUND", source: "subscriptions", recovery: "subscription_onboarding" });
    if (!customer) failures.push({ category: "CUSTOMER_NOT_FOUND", source: "billing_customers", recovery: "empty_billing_state" });
    const provider = inspectPaddle();
    let catalog: PaddleCatalogPrice[] = [];
    if (!provider.missing.length) catalog = await recover("PaddleCatalogService.list", [], () => new PaddleCatalogService().list());
    else failures.push({ category: "PADDLE_NOT_CONFIGURED", source: "Paddle environment", recovery: "configuration_required" });
    const resolvedProvider = catalog.length ? { ...provider, paddle: "connected" as const, portal: "available" as const } : provider;
    log("billing.snapshot.completed", { workspaceId: context.workspaceId, organizationId: context.organizationId, userId: user?.id ?? null, billingCustomerExists: Boolean(customer), subscriptionExists: Boolean(subscription), environment: resolvedProvider.environment, provider: "paddle", repository: "billing projections", service: "BillingStabilityService", rpcName: null, errorCode: failures[0]?.category ?? null, httpStatus: null, recoveryPathUsed: failures.map((item) => item.recovery) });
    return { dashboard: { plans, subscription, usage: usageItems, invoices: invoiceItems, paymentMethods, events, contact }, catalog, organizationId: context.organizationId, workspaceId: context.workspaceId, customerExists: Boolean(customer), provider: resolvedProvider, failures };
  }
}

function inspectPaddle(): BillingProviderState { const required = ["PADDLE_ENVIRONMENT","PADDLE_API_KEY","PADDLE_WEBHOOK_SECRET","PADDLE_CLIENT_TOKEN",...(["STARTER","PROFESSIONAL","BUSINESS","BUSINESS_PLUS"] as const).flatMap((plan) => [`PADDLE_PRODUCT_${plan}`,`PADDLE_PRICE_${plan}_MONTHLY`,`PADDLE_PRICE_${plan}_ANNUAL`])]; const missing = required.filter((name) => !process.env[name]); const environment = process.env.PADDLE_ENVIRONMENT === "live" ? "live" : process.env.PADDLE_ENVIRONMENT === "sandbox" ? "sandbox" : "unconfigured"; return { environment, paddle: missing.length ? "not_configured" : "unavailable", webhook: process.env.PADDLE_WEBHOOK_SECRET ? "healthy" : "missing", portal: "not_configured", missing }; }
function classify(error: unknown): BillingRecoveryCategory { const value = `${errorCode(error)} ${error instanceof Error ? error.message : ""}`.toLowerCase(); if (/42501|permission|rls|row.level/.test(value)) return "RLS_FAILURE"; if (/paddle.*(required|configured|environment|catalog)/.test(value)) return "PADDLE_NOT_CONFIGURED"; if (/paddle|fetch|timeout|network|429|5\d\d/.test(value)) return "PROVIDER_UNAVAILABLE"; if (/rpc|function/.test(value)) return "RPC_FAILURE"; if (/supabase|postgrest|relation|column|22p02|42p01/.test(value)) return "SUPABASE_FAILURE"; return "UNKNOWN"; }
function recoveryFor(category: BillingRecoveryCategory, source: string) { if (source.includes("Invoice")) return "zero_invoices"; if (source.includes("Usage")) return "zero_usage"; if (source.includes("paymentMethods")) return "zero_payment_methods"; if (source.includes("events")) return "zero_billing_history"; return ({ RLS_FAILURE:"restricted_data_unavailable", SUPABASE_FAILURE:"empty_projection", RPC_FAILURE:"retry_later", PADDLE_NOT_CONFIGURED:"configuration_required", PROVIDER_UNAVAILABLE:"provider_unavailable", UNKNOWN:"safe_billing_shell" } as Partial<Record<BillingRecoveryCategory,string>>)[category] ?? "safe_billing_shell"; }
function errorCode(error: unknown) { return typeof error === "object" && error && "code" in error ? String(error.code) : error instanceof Error ? error.name : "UNKNOWN"; }
function httpStatus(error: unknown) { if (typeof error === "object" && error && "status" in error) { const status = Number(error.status); return Number.isFinite(status) ? status : null; } return null; }
