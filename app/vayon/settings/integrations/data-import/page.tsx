import { WorkspaceContent, WorkspaceHeader } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { enforcePagePermission } from "@/features/platform/permissions/runtime/http";
import { DataImportWorkspace } from "@/features/onboarding/components/DataImportWorkspace";

export default async function Page() {
  await enforcePagePermission("integrations");
  return <WorkspaceContent ><WorkspaceHeader><p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">Settings · Integrations</p><h1 className="mt-2 text-3xl font-semibold">Data Import</h1><p className="mt-2 text-sm text-vds-muted">Bring existing CRM records into VAYON after workspace activation. Imports remain tenant-scoped and user initiated.</p></WorkspaceHeader><DataImportWorkspace /></WorkspaceContent>;
}
