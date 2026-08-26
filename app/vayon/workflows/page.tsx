import { WorkflowDesigner } from "@/features/platform/workflows/components/WorkflowDesigner";
import { WorkflowAutomationDashboard } from "@/features/platform/workflows/components/WorkflowAutomationDashboard";
import { WorkflowAutomationService } from "@/features/platform/workflows/services/automation.service";
import { WorkflowOrchestrator } from "@/features/vayon/workflow-orchestrator/components/WorkflowOrchestrator";

export default async function Page() {
  const snapshot = await new WorkflowAutomationService().snapshot();
  return (
    <main className="mx-auto max-w-[110rem] space-y-10 px-4 py-8 sm:px-6">
      <WorkflowOrchestrator />
      <section aria-labelledby="existing-automation-title">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">Recommended automations</p>
        <h2 id="existing-automation-title" className="mt-2 text-2xl font-semibold">Start with a proven workflow</h2>
        <p className="mt-2 max-w-3xl text-sm text-vds-muted">Choose a template and VAYON will prepare it for your workspace.</p>
        <div className="mt-6"><WorkflowAutomationDashboard snapshot={snapshot} /></div>
      </section>
      <details className="rounded-2xl border border-vds-border bg-vds-surface p-5"><summary className="cursor-pointer font-medium">Advanced workflow settings</summary><section aria-labelledby="workflow-designer-title" className="mt-5"><h2 id="workflow-designer-title" className="mb-4 text-2xl font-semibold">Workflow designer</h2><WorkflowDesigner definition={snapshot.definitions[0]} /></section></details>
    </main>
  );
}
