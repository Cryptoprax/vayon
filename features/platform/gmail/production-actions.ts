"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { GmailProductionSyncService, type GmailPermissions } from "./services/gmail-production-sync.service";
const back=(kind:"success"|"error",message:string)=>redirect(`/vayon/email?${kind}=${encodeURIComponent(message)}`);
export async function synchronizeGmailAction(){try{const result=await new GmailProductionSyncService().synchronize();revalidatePath("/vayon/email");revalidatePath("/vayon/dashboard");back("success",`Gmail synchronized: ${result.imported} new, ${result.duplicates} already current, ${result.linked} linked to CRM.`)}catch(reason){back("error",reason instanceof Error?reason.message:"Gmail synchronization failed. Try again or reconnect Gmail.")}}
export async function updateGmailPermissionsAction(form:FormData){const checked=(key:keyof GmailPermissions)=>form.get(key)==="on";try{await new GmailProductionSyncService().permissions({readEmail:checked("readEmail"),sendEmail:checked("sendEmail"),draftReplies:checked("draftReplies"),crmSynchronization:checked("crmSynchronization"),threadSummaries:checked("threadSummaries")});revalidatePath("/vayon/email");back("success","Gmail permissions updated.")}catch{back("error","Permissions could not be updated. Try again or contact support.")}}
