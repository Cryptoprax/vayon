import { redirect } from "next/navigation";
import { AuthenticationService } from "@/features/authentication/services/authentication.service";
import { OnboardingRecoveryService } from "@/features/onboarding/services/onboarding-recovery.service";
import { EnterpriseOnboardingWizard } from "@/features/onboarding/components/EnterpriseOnboardingWizard";
import { onboardingSetupTargets } from "@/features/onboarding/domain/enterprise-onboarding";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>;
}) {
  const user = await new AuthenticationService().user();
  if (!user) redirect("/login");
  const { organization, session } = await new OnboardingRecoveryService().prepare(user);
  const query = await searchParams;
  return <main className="grid min-h-dvh place-items-center bg-vds-background px-4 py-8"><EnterpriseOnboardingWizard initialStep={onboardingSetupTargets[query.setup ?? ""]} session={session} provisioned={Boolean(organization)}/></main>;
}
