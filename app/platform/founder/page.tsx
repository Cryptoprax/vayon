import { notFound } from "next/navigation";

import { FounderDashboard } from "@/features/platform/founder/components/FounderDashboard";
import { FounderAccessError } from "@/features/platform/founder/services/founder-context";
import { FounderService } from "@/features/platform/founder/services/founder.service";
import type { FounderSnapshot } from "@/features/platform/founder/types";

export const dynamic = "force-dynamic";

export default async function FounderPage() {
  let data: FounderSnapshot;
  try {
    data = await new FounderService().snapshot();
  } catch (error) {
    if (error instanceof FounderAccessError) notFound();
    throw error;
  }
  return <FounderDashboard data={data}/>;
}
