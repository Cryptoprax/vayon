import { enforcePagePermission } from "@/features/platform/permissions/runtime/http";
import { WorkspacePermissionService } from "@/features/platform/permissions/runtime/permission.service";
import { MetaMarketingService } from "@/features/platform/integrations/meta-marketing/services/meta-marketing.service";
import { PropertyService } from "@/features/vayon/property/services/property.service";
import { MetaMarketingSettings } from "@/features/platform/integrations/meta-marketing/components/MetaMarketingSettings";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; error?: string; success?: string }>;
}) {
  await enforcePagePermission("integrations");
  const query = await searchParams;

  const service = await MetaMarketingService.production();
  const [connection, mappings, manage] = await Promise.all([
    service.connection(),
    service.formMappings(),
    new WorkspacePermissionService().check("integrations", "manage").catch(() => ({ decision: { allowed: false } })),
  ]);

  let pendingPages: Awaited<ReturnType<typeof service.discoverPendingPages>> = [];
  let pendingAdAccounts: Awaited<ReturnType<typeof service.discoverPendingAdAccounts>> = [];
  if (query.state && !connection) {
    [pendingPages, pendingAdAccounts] = await Promise.all([
      service.discoverPendingPages(query.state).catch(() => []),
      service.discoverPendingAdAccounts(query.state).catch(() => []),
    ]);
  }

  let leadForms: Awaited<ReturnType<typeof service.discoverLeadForms>> = [];
  let properties: Awaited<ReturnType<PropertyService["list"]>>["items"] = [];
  let ingestionSummary: Readonly<Record<string, number>> = {};
  let crmIngestionSummary: Readonly<Record<string, number>> = {};
  if (connection) {
    const [forms, propertyPage, summary, crmSummary] = await Promise.all([
      service.discoverLeadForms().catch(() => []),
      new PropertyService().list({ page: 1, pageSize: 100, view: "table" }),
      service.leadIngestionSummary().catch(() => ({})),
      service.crmIngestionSummary().catch(() => ({})),
    ]);
    leadForms = forms;
    properties = propertyPage.items;
    ingestionSummary = summary;
    crmIngestionSummary = crmSummary;
  }

  const consentRuleEntries = await Promise.all(
    mappings.filter((mapping) => mapping.status === "active").map(async (mapping) => [mapping.id, await service.activeConsentRule(mapping.id).catch(() => null)] as const),
  );
  const consentRulesByMapping: Record<string, NonNullable<(typeof consentRuleEntries)[number][1]>> = {};
  for (const [mappingId, rule] of consentRuleEntries) if (rule) consentRulesByMapping[mappingId] = rule;

  return (
    <MetaMarketingSettings
      connection={connection}
      mappings={mappings}
      canManage={manage.decision.allowed}
      state={query.state ?? null}
      pendingPages={pendingPages}
      pendingAdAccounts={pendingAdAccounts}
      leadForms={leadForms}
      properties={properties.map((item) => ({ id: item.id, title: item.title }))}
      ingestionSummary={ingestionSummary}
      crmIngestionSummary={crmIngestionSummary}
      consentRulesByMapping={consentRulesByMapping}
      error={query.error}
      success={query.success}
    />
  );
}
