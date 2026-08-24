export const businessTypes = [
  "Startup",
  "Agency",
  "Real Estate",
  "Solar",
  "Healthcare",
  "Hotel",
  "Restaurant",
  "Construction",
  "Manufacturing",
  "Software",
  "Education",
  "Retail",
  "Other",
] as const;
export const businessGoals = [
  "Generate Leads",
  "Increase Sales",
  "Brand Awareness",
  "Investor Ready",
  "Recruit Employees",
  "Launch Product",
  "Expand Internationally",
  "Custom",
] as const;
export const targetAudiences = [
  "B2B",
  "B2C",
  "Government",
  "Residential",
  "Commercial",
  "Industrial",
  "Investors",
  "Partners",
  "Custom",
] as const;
export const launchDeliverables = [
  "Brand Identity",
  "CRM Workspace",
  "AI Workforce",
  "Company Profile",
  "Brochure",
  "Pitch Deck",
  "Website",
  "Landing Page",
  "Marketing Campaign",
  "Product Images",
  "Promotional Video",
  "Social Media Starter Pack",
  "Email Templates",
  "Sales Proposal",
] as const;
export type BusinessType = (typeof businessTypes)[number];
export type BusinessGoal = (typeof businessGoals)[number];
export type TargetAudience = (typeof targetAudiences)[number];
export type LaunchDeliverable = (typeof launchDeliverables)[number];
export type LaunchItemState =
  "Planned" | "Waiting Approval" | "Ready" | "Blocked" | "Completed" | "Failed";
export interface BusinessLaunchInput {
  readonly businessName: string;
  readonly industry: string;
  readonly country: string;
  readonly primaryLanguage: string;
  readonly website: string;
  readonly businessType: BusinessType;
  readonly goals: readonly BusinessGoal[];
  readonly customGoal: string;
  readonly audiences: readonly TargetAudience[];
  readonly customAudience: string;
  readonly deliverables: readonly LaunchDeliverable[];
}
export interface BusinessLaunchItem {
  readonly id: string;
  readonly deliverable: LaunchDeliverable;
  readonly owner: string;
  readonly route: string;
  readonly state: LaunchItemState;
  readonly approvalRequired: boolean;
  readonly warning: string | null;
}
export interface BusinessLaunchProject {
  readonly id: string;
  readonly name: string;
  readonly state:
    | "Draft"
    | "Prepared"
    | "In Progress"
    | "Completed"
    | "Completed With Warnings";
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly input: BusinessLaunchInput;
  readonly items: readonly BusinessLaunchItem[];
  readonly readiness: { readonly business: number; readonly creative: number };
  readonly estimatedMinutes: number;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}
export interface BusinessLaunchSnapshot {
  readonly project: BusinessLaunchProject | null;
  readonly brands: readonly {
    readonly id: string;
    readonly name: string;
    readonly score: number;
  }[];
  readonly campaigns: number;
  readonly existingAssets: number;
  readonly executionAvailable: boolean;
  readonly systems: readonly string[];
}
