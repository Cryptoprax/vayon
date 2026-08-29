import { ButtonLink } from "@/features/platform/design-system";
import { CrmDashboard, SalesCommandCenter } from "@/features/vayon/crm-engine/components/CrmDashboard";
import { CrmShell } from "@/features/vayon/crm-engine/components/CrmShell";
import { CrmService } from "@/features/vayon/crm-engine/services/crm.service";
import { CrmAutomationService } from "@/features/vayon/crm-automation/service";
import { SalesAutomationSummary } from "@/features/vayon/crm-automation/SalesAutomationSummary";
export default async function Page() {
  const service = await CrmService.production();
  const automation = await CrmAutomationService.production();
  const [model, sales, activity] = await Promise.all([
    service.dashboard(), service.salesDashboard(), automation.dashboard(),
  ]);
  return (
    <CrmShell
      title="CRM Command Center"
      description="A tenant-safe view of leads, customers, companies, and relationship activity."
      actions={<ButtonLink href="/vayon/leads/new">Add lead</ButtonLink>}
    >
      <div className="space-y-8">
        <SalesAutomationSummary model={activity} />
        <SalesCommandCenter model={sales}/>
        <CrmDashboard model={model} />
      </div>
    </CrmShell>
  );
}
