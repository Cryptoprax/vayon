import type { PlatformIndustry, PlatformVisibilityContext, VisibilityRole } from "./domain";

const allIndustries: readonly PlatformIndustry[] = ["REAL_ESTATE", "HEALTHCARE", "LEGAL", "FINANCE", "CONSTRUCTION", "HOSPITALITY", "ECOMMERCE", "GENERAL"];
const allRoles: readonly VisibilityRole[] = ["Founder", "Super Admin", "Admin", "Manager", "Agent", "Employee", "Viewer"];
const founderRoles: readonly VisibilityRole[] = ["Founder", "Super Admin"];
const companyRoles: readonly VisibilityRole[] = ["Admin", "Manager"];
const realEstateRoles: readonly VisibilityRole[] = ["Admin", "Manager", "Agent", "Employee", "Viewer"];

export interface VisibilityRule {
  readonly id: string;
  readonly pathPrefix: string;
  readonly industries: readonly PlatformIndustry[];
  readonly roles: readonly VisibilityRole[];
}

export const platformVisibilityRules: readonly VisibilityRule[] = [
  { id: "platform", pathPrefix: "/platform", industries: allIndustries, roles: founderRoles },
  { id: "developer-brain", pathPrefix: "/vayon/brain", industries: allIndustries, roles: founderRoles },
  { id: "developer-runtime", pathPrefix: "/vayon/runtime", industries: allIndustries, roles: founderRoles },
  { id: "developer-cognitive", pathPrefix: "/vayon/cognitive", industries: allIndustries, roles: founderRoles },
  { id: "developer-context", pathPrefix: "/vayon/context", industries: allIndustries, roles: founderRoles },
  { id: "developer-objects", pathPrefix: "/vayon/objects", industries: allIndustries, roles: founderRoles },
  { id: "system-diagnostics", pathPrefix: "/vayon/system", industries: allIndustries, roles: founderRoles },
  { id: "launch-readiness", pathPrefix: "/vayon/platform/launch-readiness", industries: allIndustries, roles: founderRoles },
  { id: "product-intelligence", pathPrefix: "/vayon/settings/product-intelligence", industries: allIndustries, roles: founderRoles },
  { id: "founder-approvals", pathPrefix: "/vayon/founder", industries: allIndustries, roles: founderRoles },
  { id: "ai-company-orchestration", pathPrefix: "/vayon/ai/collaboration", industries: allIndustries, roles: founderRoles },
  { id: "ai-playground", pathPrefix: "/vayon/ai/playground", industries: allIndustries, roles: founderRoles },
  { id: "platform-ai-team", pathPrefix: "/vayon/ai", industries: allIndustries, roles: founderRoles },
  { id: "platform-ai-workforce", pathPrefix: "/vayon/workforce", industries: allIndustries, roles: founderRoles },
  { id: "workflow-designer", pathPrefix: "/vayon/workflows", industries: allIndustries, roles: founderRoles },
  { id: "creative-operating-system", pathPrefix: "/vayon/creative", industries: allIndustries, roles: founderRoles },
  { id: "customer-success-platform", pathPrefix: "/vayon/customer-success", industries: allIndustries, roles: founderRoles },
  { id: "growth-generic-campaigns", pathPrefix: "/vayon/growth/campaigns", industries: allIndustries, roles: founderRoles },
  { id: "growth-content-calendar", pathPrefix: "/vayon/growth/content-calendar", industries: allIndustries, roles: founderRoles },
  { id: "growth-brand-assets", pathPrefix: "/vayon/growth/brand-assets", industries: allIndustries, roles: founderRoles },
  { id: "growth-generic-seo", pathPrefix: "/vayon/growth/seo", industries: allIndustries, roles: founderRoles },
  { id: "growth-pr", pathPrefix: "/vayon/growth/pr", industries: allIndustries, roles: founderRoles },
  { id: "growth-community", pathPrefix: "/vayon/growth/community", industries: allIndustries, roles: founderRoles },
  { id: "growth-influencers", pathPrefix: "/vayon/growth/influencers", industries: allIndustries, roles: founderRoles },
  { id: "growth-generic-referrals", pathPrefix: "/vayon/growth/referrals", industries: allIndustries, roles: founderRoles },
  { id: "growth-investor-relations", pathPrefix: "/vayon/growth/investor-relations", industries: allIndustries, roles: founderRoles },
  { id: "growth-platform-settings", pathPrefix: "/vayon/growth/settings", industries: allIndustries, roles: founderRoles },
  { id: "administration", pathPrefix: "/vayon/admin", industries: allIndustries, roles: founderRoles },
  { id: "team", pathPrefix: "/vayon/team", industries: allIndustries, roles: [...founderRoles, ...companyRoles] },
  { id: "settings-configuration", pathPrefix: "/vayon/settings/configuration", industries: allIndustries, roles: [...founderRoles, ...companyRoles] },
  { id: "settings", pathPrefix: "/vayon/settings", industries: ["REAL_ESTATE"], roles: [...founderRoles, ...companyRoles] },
  { id: "growth", pathPrefix: "/vayon/growth", industries: ["REAL_ESTATE"], roles: [...founderRoles, ...realEstateRoles] },
  { id: "creative", pathPrefix: "/vayon/creative", industries: ["REAL_ESTATE"], roles: [...founderRoles, "Admin", "Manager", "Employee"] },
  { id: "communications", pathPrefix: "/vayon/communications", industries: ["REAL_ESTATE"], roles: [...founderRoles, "Admin", "Manager", "Employee"] },
  { id: "operations", pathPrefix: "/vayon/operations", industries: ["REAL_ESTATE"], roles: [...founderRoles, "Admin", "Manager", "Employee"] },
  { id: "customer-success", pathPrefix: "/vayon/customer-success", industries: ["REAL_ESTATE"], roles: [...founderRoles, "Admin", "Manager", "Employee"] },
  { id: "knowledge", pathPrefix: "/vayon/knowledge", industries: allIndustries, roles: founderRoles },
  { id: "real-estate-workspace", pathPrefix: "/vayon", industries: ["REAL_ESTATE"], roles: [...founderRoles, ...realEstateRoles] },
] as const;

export function visibilityRuleForPath(path: string) {
  return platformVisibilityRules.find((rule) => path === rule.pathPrefix || path.startsWith(`${rule.pathPrefix}/`));
}

export function isFounderOnlyPath(path: string): boolean {
  const rule = visibilityRuleForPath(path);
  return Boolean(rule && rule.roles.length === founderRoles.length && rule.roles.every((role) => founderRoles.includes(role)));
}

export function canViewPath(context: PlatformVisibilityContext, path: string): boolean {
  if (context.founder) return true;
  const rule = visibilityRuleForPath(path);
  return !rule || (rule.industries.includes(context.industry) && rule.roles.includes(context.role));
}

export function filterVisibleItems<T extends { readonly href?: string }>(context: PlatformVisibilityContext, items: readonly T[]): T[] {
  return items.filter((item) => !item.href || canViewPath(context, item.href));
}

export function normalizeVisibilityRole(platformRole: unknown, workspaceRole: unknown): VisibilityRole {
  if (platformRole === "founder" || platformRole === "platform_owner") return "Founder";
  if (platformRole === "super_admin" || platformRole === "super_platform_admin") return "Super Admin";
  const role = String(workspaceRole ?? "");
  if (["organization_owner", "organization_admin", "administrator"].includes(role)) return "Admin";
  if (["manager", "branch_manager", "sales_manager", "operations_manager", "marketing_manager", "customer_success_manager", "finance_manager", "hr_manager", "knowledge_manager", "product_manager", "ai_manager"].includes(role)) return "Manager";
  if (["agent", "sales", "sales_agent", "sales_representative"].includes(role)) return "Agent";
  if (["viewer", "read_only"].includes(role)) return "Viewer";
  return "Employee";
}

export function normalizeIndustry(value: unknown): PlatformIndustry {
  const normalized = String(value ?? "REAL_ESTATE").trim().toUpperCase().replaceAll(/[^A-Z0-9]+/g, "_");
  return allIndustries.includes(normalized as PlatformIndustry) ? normalized as PlatformIndustry : "REAL_ESTATE";
}

export { allIndustries, allRoles };
