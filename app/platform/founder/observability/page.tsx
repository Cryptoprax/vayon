import { notFound } from "next/navigation";
import { ObservabilityDashboard } from "@/features/platform/observability-center/ObservabilityDashboard";
import { PlatformObservabilityService } from "@/features/platform/observability-center/observability.service";
import { FounderAccessError } from "@/features/platform/founder/services/founder-context";
export const dynamic="force-dynamic";
export default async function Page(){let data;try{data=await new PlatformObservabilityService().snapshot()}catch(error){if(error instanceof FounderAccessError)notFound();throw error}return <ObservabilityDashboard data={data}/>}
