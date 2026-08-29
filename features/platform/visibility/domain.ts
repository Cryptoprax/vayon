export const platformIndustries = ["REAL_ESTATE", "HEALTHCARE", "LEGAL", "FINANCE", "CONSTRUCTION", "HOSPITALITY", "ECOMMERCE", "GENERAL"] as const;
export type PlatformIndustry = typeof platformIndustries[number];
export const visibilityRoles = ["Founder", "Super Admin", "Admin", "Manager", "Agent", "Employee", "Viewer"] as const;
export type VisibilityRole = typeof visibilityRoles[number];
export interface PlatformVisibilityContext {
  readonly industry: PlatformIndustry;
  readonly role: VisibilityRole;
  readonly founder: boolean;
}

