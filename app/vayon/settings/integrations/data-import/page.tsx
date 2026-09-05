import { enforcePagePermission } from "@/features/platform/permissions/runtime/http";
import { DataImportWorkspace } from "@/features/onboarding/components/DataImportWorkspace";

export default async function Page() {
  await enforcePagePermission("integrations");
  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">Settings · Integrations</p><h1 className="mt-2 text-3xl font-semibold">Data Import</h1><p className="mt-2 text-sm text-vds-muted">Bring existing CRM records into VAYON after workspace activation. Imports remain tenant-scoped and user initiated.</p><DataImportWorkspace /></main>;
}
