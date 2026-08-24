import { notFound } from "next/navigation";
import { FounderAccessError } from "@/features/platform/founder/services/founder-context";
import { CreativeRuntimeDashboard } from "@/features/vayon/creative-runtime/CreativeRuntimeDashboard";
import { CreativeRuntimeService } from "@/features/vayon/creative-runtime/service";
export default async function Page() {
  let snapshot;
  try {
    snapshot = await new CreativeRuntimeService().snapshot();
  } catch (error) {
    if (error instanceof FounderAccessError) notFound();
    throw error;
  }
  return <CreativeRuntimeDashboard snapshot={snapshot} />;
}
