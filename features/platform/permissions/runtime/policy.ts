import { workspaceRoleByCode, type WorkspaceRoleCode } from "@/features/platform/organization/config/workspace-role-catalog";
import { permissionActions, permissionModules, type PermissionAction, type PermissionDecision, type PermissionModule, type PermissionRequest } from "./types";

type ModuleGrant = readonly PermissionAction[] | "all";
type RoleGrant = Readonly<Partial<Record<PermissionModule, ModuleGrant>>>;
const read:readonly PermissionAction[]=["view"];
const work:readonly PermissionAction[]=["view","create","update"];
const manage:readonly PermissionAction[]=["view","create","update","delete","approve","export","manage"];
const all:RoleGrant=Object.fromEntries(permissionModules.map(module=>[module,"all"])) as RoleGrant;

export const workspacePermissionMatrix:Readonly<Record<WorkspaceRoleCode,RoleGrant>>={
  organization_owner:all,
  organization_admin:{crm:manage,leads:manage,contacts:manage,companies:manage,deals:manage,calendar:manage,marketing:manage,campaigns:manage,creative_studio:manage,knowledge:manage,customer_success:manage,reports:manage,analytics:manage,ai_employees:manage,workflow_automation:manage,integrations:manage,team_management:"all",organization_settings:manage},
  operations_manager:{calendar:manage,workflow_automation:manage,ai_employees:work,reports:read,analytics:read},
  sales_manager:{crm:manage,leads:manage,contacts:manage,companies:manage,deals:manage,calendar:manage,reports:["view","export"],analytics:read,ai_employees:work},
  sales_representative:{crm:read,leads:work,contacts:work,companies:read,deals:work,calendar:work,ai_employees:work},
  marketing_manager:{marketing:manage,campaigns:manage,creative_studio:manage,reports:["view","export"],analytics:read,ai_employees:work},
  marketing_specialist:{marketing:work,campaigns:work,creative_studio:work,ai_employees:work},
  customer_success_manager:{customer_success:manage,crm:read,contacts:read,companies:read,calendar:work,reports:["view","export"],analytics:read,ai_employees:work},
  support_agent:{customer_success:work,crm:read,contacts:read,knowledge:read},
  finance_manager:{billing:manage,invoices:manage,reports:["view","export"],analytics:read},
  hr_manager:{team_management:manage,organization_settings:read},
  knowledge_manager:{knowledge:manage,ai_employees:read},
  product_manager:{analytics:manage,reports:["view","export"],knowledge:read,ai_employees:read},
  ai_manager:{ai_employees:manage,workflow_automation:manage,knowledge:read,integrations:read,reports:read,analytics:read},
  analyst:{reports:["view","export"],analytics:["view","export"],crm:read,leads:read,contacts:read,companies:read,deals:read,calendar:read,marketing:read,campaigns:read,customer_success:read,billing:read,invoices:read},
  standard_member:{crm:read,leads:work,contacts:work,companies:read,deals:work,calendar:work,knowledge:read,customer_success:read,ai_employees:read,workflow_automation:read},
  viewer:Object.fromEntries(permissionModules.map(module=>[module,read])) as RoleGrant,
  guest:{},
  manager:{crm:manage,leads:manage,contacts:manage,companies:manage,deals:manage,calendar:manage,marketing:manage,campaigns:manage,creative_studio:manage,customer_success:manage,reports:read,analytics:read,workflow_automation:manage},
  sales:{crm:read,leads:work,contacts:work,companies:read,deals:work,calendar:work,ai_employees:work},
  marketing:{marketing:work,campaigns:work,creative_studio:work,ai_employees:work},
  operations:{calendar:manage,workflow_automation:manage,ai_employees:work},
  finance:{billing:manage,invoices:manage,reports:["view","export"],analytics:read},
  support:{customer_success:work,crm:read,contacts:read,knowledge:read},
  read_only:Object.fromEntries(permissionModules.map(module=>[module,read])) as RoleGrant,
};

export function permissionKey(module:PermissionModule,action:PermissionAction){return `${module}.${action}` as const}
export function evaluateWorkspacePermission(role:WorkspaceRoleCode,request:PermissionRequest):PermissionDecision{const permission=permissionKey(request.module,request.action);if(!workspaceRoleByCode.has(role))return{allowed:false,permission,role,reason:"not_granted"};if(role==="guest"&&!request.explicitlyShared)return{allowed:false,permission,role,reason:"explicit_share_required"};const grant=workspacePermissionMatrix[role][request.module],allowed=grant==="all"||!!grant?.includes(request.action);if(allowed&&role==="sales_representative"&&["leads","deals"].includes(request.module)&&request.resourceOwnerId&&request.actorId!==request.resourceOwnerId)return{allowed:false,permission,role,reason:"owner_scope_required"};return{allowed,permission,role,reason:allowed?"granted":"not_granted"}}
export function permissionsForRole(role:WorkspaceRoleCode){return permissionModules.flatMap(module=>permissionActions.filter(action=>evaluateWorkspacePermission(role,{module,action}).allowed).map(action=>permissionKey(module,action)))}
