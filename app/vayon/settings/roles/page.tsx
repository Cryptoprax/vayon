import { OrganizationHeader, RolesView } from "@/features/platform/organization/components/OrganizationUI";
import { EnterpriseOrganizationService } from "@/features/platform/organization";
import { enforcePagePermission } from "@/features/platform/permissions/runtime/http";
export default async function Page(){await enforcePagePermission("team_management");await new EnterpriseOrganizationService().snapshot();return <main className="mx-auto max-w-[96rem] px-5 py-8"><OrganizationHeader title="Roles & Permissions" description="Organization RBAC roles and their effective permission assignments."/><RolesView/></main>}
