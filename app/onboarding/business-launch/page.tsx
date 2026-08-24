import { notFound } from "next/navigation";
import { BusinessLaunchWizard } from "@/features/onboarding/business-launch/BusinessLaunchWizard";
import { BusinessLaunchService } from "@/features/onboarding/business-launch/service";
export default async function Page() {
  let snapshot;
  try {
    snapshot = await new BusinessLaunchService().snapshot();
  } catch {
    notFound();
  }
  return <BusinessLaunchWizard snapshot={snapshot} />;
}
