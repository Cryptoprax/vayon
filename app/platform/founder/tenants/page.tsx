import { notFound } from "next/navigation";
import { FounderAccessError } from "@/features/platform/founder/services/founder-context";
import { TenantManagementCenter } from "@/features/platform/tenant-management/components/TenantManagementCenter";
import { TenantManagementService } from "@/features/platform/tenant-management/services/tenant-management.service";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ query?: string; lifecycle?: string }> }) {
  let data;
  try {
    data = await new TenantManagementService().snapshot();
  } catch (error) {
    if (error instanceof FounderAccessError) notFound();
    throw error;
  }
  const params = await searchParams;
  return <TenantManagementCenter data={data} query={(params.query ?? "").slice(0, 120)} lifecycle={(params.lifecycle ?? "").slice(0, 24)}/>;
}
