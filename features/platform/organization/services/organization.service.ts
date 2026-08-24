import "server-only";
import { StorageService } from "@/features/platform/integrations/storage/storage.service";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OrganizationRepository } from "../repositories/organization.repository";
import { SupabaseInvitationProvider } from "../providers/supabase-invitation.provider";
import type { InvitationProvider } from "../contracts";
import type { OrganizationRole, OrganizationSnapshot } from "../types";
import { workspaceRoleCatalog } from "../config/workspace-role-catalog";
export class EnterpriseOrganizationService{constructor(private invitations:InvitationProvider=new SupabaseInvitationProvider()){}
private async context(){const context=await operationsContext(),{data:{user}}=await context.client.auth.getUser();if(!user)throw new Error("Authentication required.");const{data,error}=await context.client.from("workspace_members").select("roles(code)").eq("workspace_id",context.workspaceId).eq("user_id",user.id).eq("status","active").maybeSingle();if(error)throw error;const role=(data as unknown as{roles:{code:string}|null}|null)?.roles?.code??"";return{...context,userId:user.id,role,repository:new OrganizationRepository(context.client,context.organizationId,context.workspaceId)}}
async snapshot():Promise<OrganizationSnapshot>{const c=await this.context();const[profile,members,invitations,departments,teams,activity]=await Promise.all([c.repository.profile(),c.repository.members(),c.repository.invitations(),c.repository.departments(),c.repository.teams(),c.repository.activity()]);return{profile,members,invitations,roles:workspaceRoleCatalog,departments,teams,activity,canManage:["organization_owner","organization_admin"].includes(c.role),isOwner:c.role==="organization_owner"}}
async updateProfile(input:unknown){const c=await this.context();return c.repository.mutate("update_enterprise_organization",{p_input:input})}
async uploadLogo(file:File){if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>5*1024*1024)throw new Error("Logo must be PNG, JPEG, or WebP and no larger than 5 MB.");const c=await this.context(),path=await new StorageService().upload("company-logo",c.organizationId,file);await c.repository.mutate("set_enterprise_organization_logo",{p_logo_path:path});return path}
async invite(input:{name:string;email:string;role:OrganizationRole},origin:string){const c=await this.context(),id=String(await c.repository.mutate("invite_organization_member",{p_name:input.name,p_email:input.email,p_role:input.role}));try{await this.invitations.send({email:input.email,redirectTo:`${origin}/accept-invitation`,organizationId:c.organizationId,workspaceId:c.workspaceId})}catch(reason){await c.repository.mutate("cancel_organization_invitation",{p_invitation_id:id});throw reason}return id}
async resend(id:string,origin:string){const c=await this.context(),result=await c.repository.mutate("resend_organization_invitation",{p_invitation_id:id})as {email:string};await this.invitations.send({email:result.email,redirectTo:`${origin}/accept-invitation`,organizationId:c.organizationId,workspaceId:c.workspaceId})}
async cancelInvitation(id:string){const c=await this.context();return c.repository.mutate("cancel_organization_invitation",{p_invitation_id:id})}
async acceptInvitation(){const client=await createSupabaseServerClient(),{data,error}=await client.rpc("accept_organization_invitation");if(error)throw error;return data}
async changeRole(memberId:string,role:OrganizationRole){const c=await this.context();return c.repository.mutate("change_organization_member_role",{p_member_id:memberId,p_role:role})}
async setMemberStatus(memberId:string,status:"active"|"suspended"){const c=await this.context();return c.repository.mutate("set_organization_member_status",{p_member_id:memberId,p_status:status})}
async removeMember(memberId:string){const c=await this.context();return c.repository.mutate("remove_organization_member",{p_member_id:memberId})}
async transferOwnership(memberId:string,confirmation:string){const c=await this.context();return c.repository.mutate("transfer_organization_ownership",{p_member_id:memberId,p_confirmation:confirmation})}
async manageDepartment(intent:"create"|"update"|"archive",id:string|null,input:unknown){const c=await this.context();return c.repository.mutate("manage_organization_department",{p_intent:intent,p_department_id:id,p_input:input})}
async manageTeam(intent:"create"|"update"|"archive",id:string|null,input:unknown){const c=await this.context();return c.repository.mutate("manage_organization_team",{p_intent:intent,p_team_id:id,p_input:input})}
}
