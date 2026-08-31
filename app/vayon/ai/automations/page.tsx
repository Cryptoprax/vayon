import { AutomationRules } from "@/features/vayon/autonomous-workforce/AutonomousWorkforceViews";
import { WorkforceShell } from "@/features/vayon/operational-workforce/components/WorkforceShell";
export default function Page() { return <WorkforceShell title="Smart Automations" description="Continuously identify opportunities and prepare reviewable work without automatic external execution."><AutomationRules /></WorkforceShell>; }
