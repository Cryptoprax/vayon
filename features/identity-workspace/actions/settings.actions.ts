"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { inviteMemberAction } from "@/features/platform/organization/actions/organization.actions";
import { IdentityWorkspaceService } from "../services/identity-workspace.service";
import { profileSettingsSchema } from "../validation/settings";
const value=(form:FormData,key:string)=>String(form.get(key)??"");
export async function updateProfileAction(form:FormData){const parsed=profileSettingsSchema.safeParse({name:value(form,"name"),timezone:value(form,"timezone"),language:value(form,"language"),country:value(form,"country").toUpperCase(),phone:value(form,"phone"),jobTitle:value(form,"jobTitle"),department:value(form,"department")});if(!parsed.success)redirect(`/vayon/settings/profile?error=${encodeURIComponent(parsed.error.issues[0]?.message??"Invalid profile")}`);const{repository}=await new IdentityWorkspaceService().context();await repository.updateProfile({...parsed.data,notificationPreferences:{email:form.get("emailNotifications")==="on",in_app:true,security:form.get("securityNotifications")==="on"},securitySettings:{session_timeout_minutes:Number(value(form,"sessionTimeout")||480),login_alerts:form.get("loginAlerts")==="on"}});revalidatePath("/vayon/settings/profile");redirect("/vayon/settings/profile?success=Profile%20updated")}
export async function inviteTeamMemberAction(form:FormData){return inviteMemberAction(form)}

