import { MembersManagement, OrganizationHeader } from "@/features/platform/organization/components/OrganizationUI";
import { EnterpriseOrganizationService } from "@/features/platform/organization";
import { enforcePagePermission } from "@/features/platform/permissions/runtime/http";
export default async function Page(){await enforcePagePermission("team_management");const snapshot=await new EnterpriseOrganizationService().snapshot();return <main className="mx-auto max-w-[96rem] px-5 py-8"><OrganizationHeader title="Members" description="Invite, assign, suspend, reactivate, remove, and transfer ownership within the active workspace."/><MembersManagement snapshot={snapshot}/></main>}
