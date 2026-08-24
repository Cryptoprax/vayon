import { notFound } from "next/navigation";
import type { OpenAIHealth } from "@/features/platform/openai/domain/models";
import type { ConversationSnapshot } from "@/features/platform/openai/runtime/models";
import { WorkforceRuntimeService } from "@/features/platform/openai/runtime/service";
import { FounderAccessError } from "@/features/platform/founder/services/founder-context";
import { EnterpriseIntegrationDashboard } from "@/features/platform/enterprise-integrations/components/EnterpriseIntegrationDashboard";
import { EnterpriseIntegrationService } from "@/features/platform/enterprise-integrations/services/enterprise-integration.service";
export const dynamic = "force-dynamic";
const unavailable: OpenAIHealth = { state:"unavailable",connected:false,model:"unavailable",latencyMs:null,quota:"unknown",version:"unavailable",diagnostic:"provider_exception",reason:"Integration Assistant runtime is unavailable." };
const empty:ConversationSnapshot={conversations:[],messages:[]};
export default async function Page(){let data;try{data=await new EnterpriseIntegrationService().snapshot();}catch(error){if(error instanceof FounderAccessError)notFound();throw error}const runtime=await WorkforceRuntimeService.production().catch(()=>null),[history,health]=runtime?await Promise.all([runtime.history("executive-ai").catch(()=>empty),runtime.health().catch(()=>unavailable)]):[empty,unavailable];return <EnterpriseIntegrationDashboard data={data} history={history} health={health}/>}
