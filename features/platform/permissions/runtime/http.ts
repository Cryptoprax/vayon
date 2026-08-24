import "server-only";
import { forbidden } from "next/navigation";
import { WorkspacePermissionError } from "./errors";
import { requireWorkspacePermission } from "./permission.service";
import type { PermissionAction, PermissionModule } from "./types";
export async function enforcePagePermission(module:PermissionModule,action:PermissionAction="view"){
  try{return await requireWorkspacePermission(module,action)}
  catch(error){if(error instanceof WorkspacePermissionError)forbidden();throw error}
}
export async function enforceApiPermission(module:PermissionModule,action:PermissionAction="view"){
  try{return{context:await requireWorkspacePermission(module,action),response:null}}
  catch(error){
    if(error instanceof WorkspacePermissionError){
      return{context:null,response:Response.json({error:"Forbidden",permission:error.decision.permission},{status:403,headers:{"Cache-Control":"private, no-store"}})};
    }
    throw error;
  }
}
