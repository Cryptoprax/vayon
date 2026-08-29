import { WorkflowDesigner } from "@/features/platform/workflows/components/WorkflowDesigner";
import { WorkflowAutomationDashboard } from "@/features/platform/workflows/components/WorkflowAutomationDashboard";
import { WorkflowAutomationService } from "@/features/platform/workflows/services/automation.service";
import { WorkflowOrchestrator } from "@/features/vayon/workflow-orchestrator/components/WorkflowOrchestrator";
import Link from "next/link";

export default async function Page() {
  const snapshot = await new WorkflowAutomationService().snapshot();
  return (
    <main className="mx-auto max-w-[110rem] space-y-10 px-4 py-8 sm:px-6">
      <WorkflowOrchestrator />
      <section aria-labelledby="existing-automation-title">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">Recommended automations</p>
        <h2 id="existing-automation-title" className="mt-2 text-2xl font-semibold">Start with a proven workflow</h2>
        <div className="flex flex-wrap items-end justify-between gap-3"><p className="mt-2 max-w-3xl text-sm text-vds-muted">Choose a Real Estate template and VAYON will prepare it for your workspace.</p><div className="flex flex-wrap gap-2"><Link className="focus-ring rounded-xl border border-vds-border px-4 py-2 text-sm" href="#workflow-designer-title">Create Custom Workflow</Link><Link className="focus-ring rounded-xl bg-vds-primary px-4 py-2 text-sm font-semibold text-vds-on-accent" href="#workflow-designer-title">AI Workflow Builder</Link></div></div>
        <div className="mt-6"><WorkflowAutomationDashboard snapshot={snapshot} /></div>
      </section>
      <details className="rounded-2xl border border-vds-border bg-vds-surface p-5"><summary className="cursor-pointer font-medium">Advanced workflow settings</summary><section aria-labelledby="workflow-designer-title" className="mt-5"><h2 id="workflow-designer-title" className="mb-4 text-2xl font-semibold">Workflow designer</h2><WorkflowDesigner definition={snapshot.definitions[0]} /></section></details>
    </main>
  );
}
