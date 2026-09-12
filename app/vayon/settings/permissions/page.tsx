import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { PermissionMatrix } from "@/features/platform/organization/components/OrganizationAdmin";
import { OrganizationHeader } from "@/features/platform/organization/components/OrganizationUI";
import { EnterpriseOrganizationService } from "@/features/platform/organization";
export default async function Page(){const snapshot=await new EnterpriseOrganizationService().snapshot();return <WorkspaceContent ><OrganizationHeader title="Permission Matrix" description="Effective module and action access across the canonical enterprise RBAC roles."/><PermissionMatrix snapshot={snapshot}/></WorkspaceContent>}
