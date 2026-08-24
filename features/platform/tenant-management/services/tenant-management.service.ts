import "server-only";

import { CustomerGrowthService } from "@/features/platform/customer-growth/services/customer-growth.service";
import { CustomerRepository } from "@/features/platform/customer-success/repositories/customer.repository";
import { founderContext } from "@/features/platform/founder/services/founder-context";
import { FounderService } from "@/features/platform/founder/services/founder.service";
import { log } from "@/lib/observability/logger";

export type TenantLifecycle =
  | "trial"
  | "active"
  | "past_due"
  | "suspended"
  | "cancelled"
  | "archived";

export interface TenantUsage {
  readonly aiTokens: number | null;
  readonly apiUsage: number | null;
  readonly storageBytes: number | null;
  readonly workflowExecutions: number | null;
  readonly activeUsers: number;
  readonly knowledgeUsage: number | null;
  readonly marketingUsage: number | null;
  readonly salesUsage: number | null;
  readonly customerSuccessUsage: number | null;
  readonly creativeUsage: number | null;
}

export interface TenantRecord {
  readonly id: string;
  readonly name: string;
  readonly lifecycle: TenantLifecycle;
  readonly plan: string;
  readonly users: number;
  readonly workspaces: number;
  readonly integrations: number | null;
  readonly health: number;
  readonly healthClass: string;
  readonly healthConfidence: number;
  readonly healthEvidence: readonly string[];
  readonly supportLoad: number;
  readonly renewalConfidence: number;
  readonly renewalDate: string | null;
  readonly billingStatus: string;
  readonly usage: TenantUsage;
  readonly limits: Readonly<{
    ai: string;
    storage: string;
    workspaces: string;
    invites: string;
  }>;
  readonly lastActivity: string | null;
}

export interface TenantManagementSnapshot {
  readonly tenants: readonly TenantRecord[];
  readonly lifecycle: readonly TenantLifecycle[];
  readonly audit: readonly {
    id: string;
    category: string;
    title: string;
    occurredAt: string;
  }[];
  readonly observability: readonly {
    id: string;
    label: string;
    value: number | null;
    unit: string;
  }[];
  readonly provisioning: readonly {
    capability: string;
    owner: string;
    mode: string;
  }[];
  readonly operations: readonly {
    label: string;
    href: string;
    confirmationRequired: boolean;
    availability: "available" | "review-required";
  }[];
  readonly generatedAt: string;
}

const lifecycle = [
  "trial",
  "active",
  "past_due",
  "suspended",
  "cancelled",
  "archived",
] as const;

export class TenantManagementService {
  async snapshot(): Promise<TenantManagementSnapshot> {
    const started = performance.now();
    const { client, user } = await founderContext();
    const [directory, growth, founder] = await Promise.all([
      new CustomerRepository(client).list().catch(() => []),
      new CustomerGrowthService().snapshot(),
      new FounderService().snapshot(),
    ]);
    const health = new Map(growth.organizations.map((item) => [item.id, item]));
    const renewal = new Map(growth.renewals.map((item) => [item.organizationId, item]));
    const tenants = directory.map((customer): TenantRecord => {
      const customerHealth = health.get(customer.id);
      const customerRenewal = renewal.get(customer.id);
      const state = normalizeLifecycle(customer.status, customerRenewal?.status);
      return {
        id: customer.id,
        name: customer.name,
        lifecycle: state,
        plan: customer.plan,
        users: customer.users,
        workspaces: customer.workspaceCount,
        integrations: null,
        health: customerHealth?.score ?? customer.healthScore,
        healthClass: customerHealth?.classification ?? "Unavailable",
        healthConfidence: customerHealth?.confidence ?? 0,
        healthEvidence: customerHealth?.reasons ?? ["Customer directory health score."],
        supportLoad: customer.supportTickets,
        renewalConfidence: customerHealth
          ? Math.max(0, 1 - customerHealth.churnProbability)
          : 0,
        renewalDate: customerRenewal?.renewsAt ?? null,
        billingStatus: customerRenewal?.status ?? state,
        usage: {
          aiTokens: customer.aiUsage,
          apiUsage: null,
          storageBytes: null,
          workflowExecutions: null,
          activeUsers: customer.users,
          knowledgeUsage: null,
          marketingUsage: null,
          salesUsage: null,
          customerSuccessUsage: null,
          creativeUsage: null,
        },
        limits: planLimits(customer.plan),
        lastActivity: customer.lastLogin ?? null,
      };
    });
    const metric = (id: string, label: string, unit: string) => ({
      id,
      label,
      value: founder.kpis.find((item) => item.id === id)?.value ?? null,
      unit,
    });
    log("founder.tenant_center.viewed", {
      actorId: user.id,
      tenants: tenants.length,
      latencyMs: Math.round(performance.now() - started),
    });
    return {
      tenants,
      lifecycle,
      audit: founder.activity.map((item) => ({
        id: item.id,
        category: item.kind,
        title: item.title,
        occurredAt: item.occurredAt,
      })),
      observability: [
        metric("organizations", "Tenant growth", "organizations"),
        metric("mrr", "MRR", "currency"),
        metric("arr", "ARR", "currency"),
        metric("trials", "Active trials", "organizations"),
        metric("conversion", "Conversion rate", "percent"),
        { id: "renewal", label: "Renewal rate", value: growth.kpis.find((item) => item.id === "nrr")?.value ?? null, unit: "percent" },
        { id: "expansion", label: "Expansion opportunities", value: growth.organizations.filter((item) => item.expansionOpportunities.length > 0).length, unit: "organizations" },
      ],
      provisioning: [
        { capability: "Workspace provisioning", owner: "Existing onboarding service", mode: "Approval governed" },
        { capability: "Default roles", owner: "Existing organization RBAC", mode: "Tenant scoped" },
        { capability: "Default AI configuration", owner: "Existing AI Workforce", mode: "Recommendation only" },
        { capability: "Feature entitlements", owner: "Existing billing limits", mode: "Plan enforced" },
        { capability: "Plan assignment", owner: "Existing subscription service", mode: "Billing governed" },
        { capability: "Starter templates", owner: "Existing onboarding workflows", mode: "No provider calls" },
      ],
      operations: [
        { label: "Suspend tenant", href: "/platform/customers", confirmationRequired: true, availability: "review-required" },
        { label: "Reactivate tenant", href: "/platform/customers", confirmationRequired: true, availability: "review-required" },
        { label: "Reset onboarding", href: "/platform/customer-success", confirmationRequired: true, availability: "review-required" },
        { label: "Transfer ownership", href: "/platform/organizations", confirmationRequired: true, availability: "available" },
        { label: "Export metadata", href: "/platform/customers", confirmationRequired: true, availability: "review-required" },
        { label: "Trigger health review", href: "/platform/founder/customer-success", confirmationRequired: true, availability: "available" },
        { label: "View audit history", href: "/platform/audit", confirmationRequired: false, availability: "available" },
      ],
      generatedAt: new Date().toISOString(),
    };
  }
}

function normalizeLifecycle(status: string, subscription?: string): TenantLifecycle {
  const value = (subscription ?? status).toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
  if (value === "trialing" || value === "trial") return "trial";
  if (value === "past_due") return "past_due";
  if (value === "suspended") return "suspended";
  if (value === "cancelled" || value === "canceled") return "cancelled";
  if (value === "archived" || value === "expired") return "archived";
  return "active";
}

function planLimits(plan: string) {
  const key = plan.toLowerCase();
  if (key === "enterprise") return { ai: "Contract entitlement", storage: "Contract entitlement", workspaces: "Unlimited", invites: "Unlimited" };
  if (key === "professional" || key === "business") return { ai: "Plan entitlement", storage: "Plan entitlement", workspaces: "Plan entitlement", invites: "Unlimited users" };
  return { ai: "Starter entitlement", storage: "Starter entitlement", workspaces: "Plan entitlement", invites: "3 users" };
}
