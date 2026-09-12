import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { ActivityLog, OrganizationHeader } from "@/features/platform/organization/components/OrganizationUI";
import { EnterpriseOrganizationService } from "@/features/platform/organization";
export default async function Page(){const snapshot=await new EnterpriseOrganizationService().snapshot();return <WorkspaceContent ><OrganizationHeader title="Organization Activity" description="Immutable organization, invitation, membership, role, and ownership audit history."/><ActivityLog snapshot={snapshot}/></WorkspaceContent>}
