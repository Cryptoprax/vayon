import { notFound, redirect } from "next/navigation";
import { onboardingSetupTargets } from "@/features/onboarding/domain/enterprise-onboarding";

export default async function Page({
  params,
}: {
  params: Promise<{ setup: string }>;
}) {
  const { setup } = await params;
  if (!onboardingSetupTargets[setup]) notFound();
  redirect(`/onboarding?setup=${encodeURIComponent(setup)}`);
}
