import { IntegrationCenter } from "@/features/platform/integrations/center";
import { IntegrationCenterService } from "@/features/platform/integrations/center/service";
import type { ConnectedAppsTab } from "@/features/platform/integrations/center/IntegrationCenter";
import { enforcePagePermission } from "@/features/platform/permissions/runtime/http";
import { ButtonLink } from "@/features/platform/design-system";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
    error?: string;
    success?: string;
    tab?: ConnectedAppsTab;
  }>;
}) {
  await enforcePagePermission("integrations");
  const [model, q] = await Promise.all([
    new IntegrationCenterService().model(),
    searchParams,
  ]);
  return (
    <>
      <div className="mx-auto flex max-w-[100rem] justify-end px-4 pt-5 sm:px-6"><ButtonLink href="/vayon/settings/integrations/data-import" variant="outline">Data Import</ButtonLink></div>
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
      <IntegrationCenter model={model} query={q.q} category={q.category} status={q.status} tab={q.tab} />
    </>
  );
}
