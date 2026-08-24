import { notFound } from "next/navigation";
import { FounderAccessError } from "@/features/platform/founder/services/founder-context";
import { WorkflowOrchestrationDashboard } from "@/features/platform/workflow-orchestration/components/WorkflowOrchestrationDashboard";
import { WorkflowOrchestrationService } from "@/features/platform/workflow-orchestration/services/workflow-orchestration.service";
export const dynamic="force-dynamic";
export default async function Page(){let data;try{data=await new WorkflowOrchestrationService().snapshot()}catch(error){if(error instanceof FounderAccessError)notFound();throw error}return <WorkflowOrchestrationDashboard data={data}/>}
