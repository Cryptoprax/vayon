import { IntegrationCenter } from "@/features/platform/integrations/center";
import { IntegrationCenterService } from "@/features/platform/integrations/center/service";
import { ProviderStatusDashboard } from "@/features/platform/integration-platform/components/ProviderStatusDashboard";
import { IntegrationPlatformService } from "@/features/platform/integration-platform/services/platform.service";
import { enforcePagePermission } from "@/features/platform/permissions/runtime/http";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
    error?: string;
    success?: string;
  }>;
}) {
  await enforcePagePermission("integrations");
  const [model, platform, q] = await Promise.all([
    new IntegrationCenterService().model(),
    new IntegrationPlatformService().dashboard(),
    searchParams,
  ]);
  return (
    <>
      {q.error && (
        <p
          role="alert"
          className="mx-auto mt-5 max-w-[96rem] px-5 text-vds-danger"
        >
          {q.error}
        </p>
      )}
      {q.success && (
        <p
          role="status"
          className="mx-auto mt-5 max-w-[96rem] px-5 text-vds-success"
        >
          {q.success}
        </p>
      )}
      <IntegrationCenter
        model={model}
        query={q.q}
        category={q.category}
        status={q.status}
      />
      <ProviderStatusDashboard model={platform} />
    </>
  );
}
