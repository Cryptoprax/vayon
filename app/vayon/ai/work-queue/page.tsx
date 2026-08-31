import { AIWorkQueue, EmployeeActivity } from "@/features/vayon/autonomous-workforce/AutonomousWorkforceViews";
import { WorkforceShell } from "@/features/vayon/operational-workforce/components/WorkforceShell";
export default function Page() { return <WorkforceShell title="AI Work Queue" description="Live, approval-gated work prepared by the AI workforce across the workspace."><div className="space-y-6"><AIWorkQueue /><EmployeeActivity /></div></WorkforceShell>; }
