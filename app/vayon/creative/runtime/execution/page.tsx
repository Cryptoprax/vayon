import { notFound } from "next/navigation";
import { FounderAccessError } from "@/features/platform/founder/services/founder-context";
import { ExecutionDashboard } from "@/features/vayon/creative-execution/ExecutionDashboard";
import { CreativeExecutionService } from "@/features/vayon/creative-execution/service";
import { OpenAIDocumentAdapter } from "@/features/vayon/creative-providers/openai-document.adapter";
export default async function Page() {
  let snapshot;
  try {
    snapshot = await new CreativeExecutionService().snapshot();
  } catch (error) {
    if (error instanceof FounderAccessError) notFound();
    throw error;
  }
  const health = await new OpenAIDocumentAdapter().health();
  return (
    <ExecutionDashboard
      snapshot={snapshot}
      provider={{
        name: "OpenAI Document",
        state: health.state,
        reason: health.reason,
      }}
    />
  );
}
