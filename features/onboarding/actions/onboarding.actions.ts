"use server";

import { redirect } from "next/navigation";
import { onboardingSchema } from "../validation/onboarding";
import { OnboardingService } from "../services/onboarding.service";

function parseInvitations(form: FormData) {
  const names = form.getAll("inviteName").map(String), emails = form.getAll("inviteEmail").map(String), roles = form.getAll("inviteRole").map(String);
  return emails.map((email, index) => ({ email, name: names[index] ?? "", role: roles[index] ?? "agent" })).filter((item) => item.email || item.name);
}

export async function completeOnboardingAction(form: FormData) {
  const parsed = onboardingSchema.safeParse({ organizationName: String(form.get("organizationName") ?? ""), country: String(form.get("country") ?? ""), currency: String(form.get("currency") ?? ""), timezone: String(form.get("timezone") ?? ""), language: String(form.get("language") ?? ""), workspaceName: String(form.get("workspaceName") ?? ""), businessType: String(form.get("businessType") ?? ""), companySize: String(form.get("companySize") ?? ""), phone: String(form.get("phone") ?? ""), website: String(form.get("website") ?? ""), industry: String(form.get("industry") ?? ""), office: String(form.get("office") ?? ""), branch: String(form.get("branch") ?? ""), invitations: parseInvitations(form) });
  if (!parsed.success) redirect(`/onboarding?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid onboarding details.")}`);
  const logo = form.get("organizationLogo");
  try {
    await new OnboardingService().complete(parsed.data, logo instanceof File && logo.size ? logo : undefined);
  } catch (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to create workspace.")}`);
  }
  redirect("/vayon/dashboard?welcome=1");
}
