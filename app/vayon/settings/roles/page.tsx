import { OrganizationHeader, RolesView } from "@/features/platform/organization/components/OrganizationUI";
import { EnterpriseOrganizationService } from "@/features/platform/organization";
export default async function Page(){await new EnterpriseOrganizationService().snapshot();return <main className="mx-auto max-w-[96rem] px-5 py-8"><OrganizationHeader title="Roles & Permissions" description="Organization RBAC roles and their effective permission assignments."/><RolesView/></main>}
