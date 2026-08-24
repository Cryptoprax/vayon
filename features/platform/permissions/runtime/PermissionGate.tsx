"use client";
import type { ReactNode } from "react";
import type { WorkspaceRoleCode } from "@/features/platform/organization/config/workspace-role-catalog";
import { evaluateWorkspacePermission } from "./policy";
import type { PermissionAction,PermissionModule } from "./types";
export function PermissionGate({role,module,action,mode="hide",children,fallback=null}:{readonly role:WorkspaceRoleCode;readonly module:PermissionModule;readonly action:PermissionAction;readonly mode?:"hide"|"disable";readonly children:ReactNode;readonly fallback?:ReactNode}){const allowed=evaluateWorkspacePermission(role,{module,action}).allowed;if(allowed)return children;if(mode==="disable")return <span aria-disabled="true" title="You do not have permission for this action" className="pointer-events-none opacity-50">{children}</span>;return fallback}
