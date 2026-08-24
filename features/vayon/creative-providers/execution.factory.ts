import "server-only";
import { RuntimeAdapterRegistry } from "@/features/vayon/creative-execution/adapter";
import { CreativeExecutionPlanner } from "@/features/vayon/creative-execution/planner";
import { CreativeExecutionQueue } from "@/features/vayon/creative-execution/queue";
import { CreativeExecutionService } from "@/features/vayon/creative-execution/service";
import { OpenAIDocumentAdapter } from "./openai-document.adapter";
import { OpenAIImageRuntimeAdapter } from "./openai-image.adapter";
import { OpenAIVideoRuntimeAdapter } from "./openai-video.adapter";
export function createLiveCreativeExecutionService() {
  const registry = new RuntimeAdapterRegistry();
  registry.register(new OpenAIDocumentAdapter());
  registry.register(new OpenAIImageRuntimeAdapter());
  registry.register(new OpenAIVideoRuntimeAdapter());
  return new CreativeExecutionService(
    registry,
    new CreativeExecutionQueue(),
    new CreativeExecutionPlanner(registry),
  );
}
