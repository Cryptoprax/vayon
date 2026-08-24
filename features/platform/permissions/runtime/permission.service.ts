import "server-only";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { log } from "@/lib/observability/logger";
import { workspaceRoleByCode, type WorkspaceRoleCode } from "@/features/platform/organization/config/workspace-role-catalog";
import { WorkspacePermissionError } from "./errors";
import { evaluateWorkspacePermission } from "./policy";
import type { PermissionAction, PermissionModule, PermissionRequest } from "./types";

export interface WorkspaceAuthorizationContext{readonly organizationId:string;readonly workspaceId:string;readonly actorId:string;readonly role:WorkspaceRoleCode}
export class WorkspacePermissionService{
  async context():Promise<WorkspaceAuthorizationContext>{const c=await operationsContext(),{data:{user}}=await c.client.auth.getUser();if(!user)throw new Error("Authentication required.");const{data,error}=await c.client.from("workspace_members").select("roles(code)").eq("organization_id",c.organizationId).eq("workspace_id",c.workspaceId).eq("user_id",user.id).eq("status","active").maybeSingle();if(error)throw error;const code=(data as unknown as{roles:{code:string}|null}|null)?.roles?.code;if(!code||!workspaceRoleByCode.has(code as WorkspaceRoleCode)){const decision=evaluateWorkspacePermission("guest",{module:"organization_settings",action:"view"});this.audit(c.organizationId,c.workspaceId,user.id,code??"unassigned",decision.permission);throw new WorkspacePermissionError(decision)}return{organizationId:c.organizationId,workspaceId:c.workspaceId,actorId:user.id,role:code as WorkspaceRoleCode}}
  async check(module:PermissionModule,action:PermissionAction,scope:Omit<PermissionRequest,"module"|"action"|"actorId">={} ){const context=await this.context(),decision=evaluateWorkspacePermission(context.role,{module,action,...scope,actorId:context.actorId});return{context,decision}}
  async require(module:PermissionModule,action:PermissionAction,scope:Omit<PermissionRequest,"module"|"action"|"actorId">={} ){const result=await this.check(module,action,scope);if(!result.decision.allowed){this.audit(result.context.organizationId,result.context.workspaceId,result.context.actorId,result.context.role,result.decision.permission);throw new WorkspacePermissionError(result.decision)}return result.context}
  private audit(organizationId:string,workspaceId:string,actorId:string,role:string,permission:string){log("authorization.permission_denied",{organizationId,workspaceId,actorId,role,permission,module:permission.split(".")[0]})}
}
export async function requireWorkspacePermission(module:PermissionModule,action:PermissionAction,scope?:Omit<PermissionRequest,"module"|"action"|"actorId">){return new WorkspacePermissionService().require(module,action,scope)}
