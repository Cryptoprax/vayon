"use server";
import { requireWorkspacePermission } from "@/features/platform/permissions/runtime/permission.service";
import { EnterpriseOnboardingService } from "@/features/onboarding/services/enterprise-onboarding.service";
import { BrandStudioService } from "@/features/vayon/brand-studio/service";
import { planLaunch } from "./orchestrator";
import type { BusinessLaunchInput, BusinessLaunchProject } from "./types";
export async function prepareBusinessLaunch(
  input: BusinessLaunchInput,
): Promise<BusinessLaunchProject> {
  await requireWorkspacePermission("creative_studio", "create");
  if (
    input.businessName.trim().length < 2 ||
    !input.industry.trim() ||
    !input.country.trim() ||
    !input.primaryLanguage.trim() ||
    input.goals.length === 0 ||
    input.audiences.length === 0 ||
    input.deliverables.length === 0
  )
    throw new Error("Complete every required launch step.");
  const onboarding = new EnterpriseOnboardingService(),
    [session, brands] = await Promise.all([
      onboarding.session(),
      BrandStudioService.production(),
    ]);
  const brandSnapshot = await brands?.snapshot(),
    now = new Date().toISOString(),
    planned = planLaunch(
      input,
      Boolean(brandSnapshot?.brands.length),
      Boolean(process.env.OPENAI_API_KEY),
    );
  const previous = session?.configuration?.businessLaunch,
    previousId =
      previous && typeof previous === "object" && "id" in previous
        ? String(previous.id)
        : crypto.randomUUID();
  const project: BusinessLaunchProject = {
    id: previousId,
    name: `${input.businessName.trim()} Business Launch`,
    state: "Prepared",
    createdAt:
      previous && typeof previous === "object" && "createdAt" in previous
        ? String(previous.createdAt)
        : now,
    updatedAt: now,
    input,
    items: planned.items,
    readiness: { business: planned.business, creative: planned.creative },
    estimatedMinutes: planned.minutes,
    warnings: planned.warnings,
    errors: [],
  };
  await onboarding.save(
    6,
    { ...(session?.configuration ?? {}), businessLaunch: project },
    [...new Set([...(session?.completed_steps ?? []), 1, 2, 3, 4, 5, 6])],
    session?.demo_mode ?? false,
  );
  return project;
}
