import { notFound } from "next/navigation";
import { CompanyMetrics } from "@/features/vayon/crm-company/CompanyMetrics";
import { CompanyProfile } from "@/features/vayon/crm-company/CompanyProfile";
import { CrmCompanyService } from "@/features/vayon/crm-company/service";
import { CrmShell } from "@/features/vayon/crm-engine/components/CrmShell";
import { ContextualAIActions } from "@/features/vayon/cross-module-intelligence/ContextualAIActions";
export default async function Page({params,searchParams}:{params:Promise<{companyId:string}>;searchParams:Promise<{success?:string;error?:string}>}){const id=(await params).companyId,q=await searchParams,model=await(await CrmCompanyService.production()).detail(id);if(!model)notFound();return <CrmShell title="Company Dashboard" description="A complete, evidence-backed view of this customer organization."><CompanyMetrics model={model}/><CompanyProfile model={model} success={q.success} error={q.error}/><ContextualAIActions kind="company" recordId={id}/></CrmShell>}
