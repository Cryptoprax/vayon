import { CompanyDirectory } from "@/features/vayon/crm-engine/components/CrmDirectory";
import { CrmShell } from "@/features/vayon/crm-engine/components/CrmShell";
import { CrmCompanyService } from "@/features/vayon/crm-company/service";
import Link from "next/link";
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
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><form>
        <input
          name="search"
          defaultValue={raw.search}
          placeholder="Search companies"
          aria-label="Search companies"
          className="vds-focus h-11 w-full max-w-md rounded-xl border border-vds-border bg-vds-surface px-3 text-sm"
        />
      </form><ButtonLink href="/vayon/crm/companies/new">Create Company</ButtonLink></div>
      <CompanyDirectory items={data.items} />
      {data.count>data.pageSize&&<nav aria-label="Company pagination" className="mt-6 flex justify-between text-sm"><Link aria-disabled={page===1} className={page===1?"pointer-events-none text-vds-muted":"text-vds-primary"} href={`?search=${encodeURIComponent(raw.search??"")}&page=${page-1}`}>Previous</Link><span>Page {page} of {Math.ceil(data.count/data.pageSize)}</span><Link aria-disabled={page*data.pageSize>=data.count} className={page*data.pageSize>=data.count?"pointer-events-none text-vds-muted":"text-vds-primary"} href={`?search=${encodeURIComponent(raw.search??"")}&page=${page+1}`}>Next</Link></nav>}
    </CrmShell>
  );
}
