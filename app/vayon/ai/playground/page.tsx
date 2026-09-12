import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { AIRuntimeHeader } from "@/features/vayon/ai-runtime/components/AIRuntimeHeader";
import { PromptLibrary } from "@/features/vayon/ai-runtime/components/PromptLibrary";

export default function Page() {
  return <WorkspaceContent ><AIRuntimeHeader title="Enterprise Prompt Library" description="Versioned role and system prompt templates, tested only through governed workspace-attributed AI employee workflows."/><PromptLibrary /></WorkspaceContent>;
}
