import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { DepartmentsManagement } from "@/features/platform/organization/components/OrganizationAdmin";
import { OrganizationHeader } from "@/features/platform/organization/components/OrganizationUI";
import { EnterpriseOrganizationService } from "@/features/platform/organization";
export default async function Page(){const snapshot=await new EnterpriseOrganizationService().snapshot();return <WorkspaceContent ><OrganizationHeader title="Departments" description="Manage department leadership, members, KPIs, permissions, and custom operating structures."/><DepartmentsManagement snapshot={snapshot}/></WorkspaceContent>}
