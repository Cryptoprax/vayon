import type { LucideIcon } from "lucide-react";
import type { WorkspaceRoleCode } from "@/features/platform/organization/config/workspace-role-catalog";

export interface ShellNavigationItem { readonly label: string; readonly href?: string; readonly icon: LucideIcon; readonly disabled?: boolean; readonly description?: string }
export interface ShellNavigationGroup { readonly id: string; readonly label: string; readonly icon: LucideIcon; readonly items: readonly ShellNavigationItem[]; readonly developer?: boolean }
export interface ShellIdentity { readonly userName: string; readonly workspaceName: string; readonly workspaceLogo?: string; readonly organizationDescription?: string; readonly demoWorkspace?: "aurora"; readonly workspaceRole?: WorkspaceRoleCode }
