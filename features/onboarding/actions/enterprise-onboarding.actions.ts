"use server";

import { redirect } from "next/navigation";
import { EnterpriseOnboardingService } from "../services/enterprise-onboarding.service";
import { OnboardingCompletionService } from "../services/onboarding-completion.service";

export async function saveOnboardingProgressAction(input: {
  step: number;
  configuration: Record<string, unknown>;
  completed: number[];
  demoMode: boolean;
}) {
  await new EnterpriseOnboardingService().save(
    input.step,
    input.configuration,
    input.completed,
    input.demoMode,
  );
}

export async function launchOnboardingAction() {
  const diagnostic = await new OnboardingCompletionService().complete();
  if (!diagnostic.success && !diagnostic.workspaceId) {
    redirect(`/onboarding?error=${encodeURIComponent(diagnostic.error ?? "Unable to create workspace.")}`);
  }
  redirect("/vayon/dashboard?welcome=1&tour=1");
}
