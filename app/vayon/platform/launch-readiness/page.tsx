import { notFound } from "next/navigation";

import { LaunchReadinessDashboard } from "@/features/platform/launch-readiness/components/LaunchReadinessDashboard";
import { LaunchReadinessService } from "@/features/platform/launch-readiness/services/launch-readiness.service";
import { FounderAccessError, founderContext } from "@/features/platform/founder/services/founder-context";

export const dynamic = "force-dynamic";

export default async function Page() {
  let data;
  try {
    await founderContext();
    data = await new LaunchReadinessService().snapshot();
  } catch (error) {
    if (error instanceof FounderAccessError) notFound();
    throw error;
  }
  return <LaunchReadinessDashboard data={data} />;
}
