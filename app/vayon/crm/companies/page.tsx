import { WorkspaceFilters, WorkspacePagination } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { CompanyDirectory } from "@/features/vayon/crm-engine/components/CrmDirectory";
import { CrmShell } from "@/features/vayon/crm-engine/components/CrmShell";
import { CrmCompanyService } from "@/features/vayon/crm-company/service";
import { ButtonLink } from "@/features/platform/design-system";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const raw = await searchParams;
  const page = Math.max(1,Number(raw.page??1)),data = await (await CrmCompanyService.production()).list(raw.search,page);
  return (
    <CrmShell
      title="Companies"
      description="Searchable customer organizations with owners, relationships, revenue, and CRM activity."
      actions={data.items.length > 0 ? <ButtonLink href="/vayon/crm/companies/new">Create Company</ButtonLink> : undefined}
    >
      <WorkspaceFilters><form>
        <input
          name="search"
          defaultValue={raw.search}
          placeholder="Search companies"
          aria-label="Search companies"
          className="vds-focus h-11 w-full max-w-md rounded-xl border border-vds-border bg-vds-surface px-3 text-sm"
        />
      </form></WorkspaceFilters>
      <CompanyDirectory items={data.items} />
      {data.count>data.pageSize&&<WorkspacePagination page={page} pageCount={Math.ceil(data.count/data.pageSize)} total={data.count} previousHref={page>1?`?search=${encodeURIComponent(raw.search??"")}&page=${page-1}`:undefined} nextHref={page*data.pageSize<data.count?`?search=${encodeURIComponent(raw.search??"")}&page=${page+1}`:undefined} />}
    </CrmShell>
  );
}
