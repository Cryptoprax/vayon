import { ContactDirectory } from "@/features/vayon/crm-company/ContactDirectory";
import { CrmShell } from "@/features/vayon/crm-engine/components/CrmShell";
import { CrmCompanyService } from "@/features/vayon/crm-company/service";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams,search=typeof query.search==="string"?query.search:undefined;
  const items = await (await CrmCompanyService.production()).contacts(search);
  return <CrmShell title="Contacts" description="People records connected to their primary company, position, department, owner, and CRM timeline."><form className="mb-5"><input name="search" defaultValue={search} placeholder="Search contacts" aria-label="Search contacts" className="vds-focus h-11 w-full max-w-md rounded-xl border border-vds-border bg-vds-surface px-3 text-sm"/></form><ContactDirectory items={items}/></CrmShell>;
}
