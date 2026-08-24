"use server";

import { redirect } from "next/navigation";
import { EnterpriseOnboardingService } from "../services/enterprise-onboarding.service";

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
  await new EnterpriseOnboardingService().complete();
  redirect("/vayon/customer-success?welcome=1&tour=1");
}
