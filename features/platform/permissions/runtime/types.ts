import type { WorkspaceRoleCode } from "@/features/platform/organization/config/workspace-role-catalog";

export const permissionActions = ["view","create","update","delete","approve","export","manage","admin"] as const;
export type PermissionAction = typeof permissionActions[number];

export const permissionModules = ["crm","leads","contacts","companies","deals","calendar","marketing","campaigns","creative_studio","knowledge","customer_success","billing","invoices","reports","analytics","ai_employees","workflow_automation","integrations","team_management","organization_settings"] as const;
export type PermissionModule = typeof permissionModules[number];
export type PermissionKey = `${PermissionModule}.${PermissionAction}`;
export interface PermissionRequest { readonly module:PermissionModule;readonly action:PermissionAction;readonly resourceOwnerId?:string;readonly actorId?:string;readonly explicitlyShared?:boolean }
export interface PermissionDecision { readonly allowed:boolean;readonly permission:PermissionKey;readonly role:WorkspaceRoleCode;readonly reason:"granted"|"not_granted"|"owner_scope_required"|"explicit_share_required" }
