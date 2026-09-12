import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { TeamsManagement } from "@/features/platform/organization/components/OrganizationAdmin";
import { OrganizationHeader } from "@/features/platform/organization/components/OrganizationUI";
import { EnterpriseOrganizationService } from "@/features/platform/organization";
export default async function Page(){const snapshot=await new EnterpriseOrganizationService().snapshot();return <WorkspaceContent ><OrganizationHeader title="Teams" description="Create, staff, manage capacity, and archive teams inside tenant-scoped departments."/><TeamsManagement snapshot={snapshot}/></WorkspaceContent>}
