import { AIHeader, ProviderHealth } from "@/features/vayon/ai-workforce/components/AIWorkforceUI";
import { WorkforceDirectory } from "@/features/vayon/operational-workforce/components/WorkforceDirectory";
import { WorkforceService } from "@/features/vayon/operational-workforce/services/workforce.service";

export default async function Page() {
  const snapshot = await (await WorkforceService.production()).snapshot();
  const health = snapshot.runtimeHealth;
  return <main className="mx-auto max-w-[96rem] px-5 py-8">
    <AIHeader title="Meet Your AI Team" description="Your AI real estate specialists are prepared for sales, property consulting, marketing, customer success and operations. Every important action stays under your control." health={health}/>
    <details className="mt-5 rounded-2xl border border-vds-border bg-vds-surface p-4"><summary className="cursor-pointer text-sm font-medium">Advanced AI status</summary><div className="mt-4"><ProviderHealth health={health} observability={snapshot.observability}/></div></details>
    <div className="mt-7"><WorkforceDirectory items={snapshot.employees}/></div>
  </main>;
}
