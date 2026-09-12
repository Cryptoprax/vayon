import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import Link from "next/link";
import { EnterpriseUserDirectory } from "@/features/platform/organization/components/OrganizationAdmin";
import { OrganizationHeader } from "@/features/platform/organization/components/OrganizationUI";
import { EnterpriseOrganizationService } from "@/features/platform/organization";
export default async function Page(){const snapshot=await new EnterpriseOrganizationService().snapshot();return <WorkspaceContent ><OrganizationHeader title="Employee Directory" description="Search, filter, and review roles, departments, teams, status, activity, permissions, and workforce assignments."/>{snapshot.canManage && <Link href="/vayon/settings/members" className="focus-ring mt-5 inline-flex min-h-11 items-center text-vds-primary">Invite Team Members</Link>}<EnterpriseUserDirectory snapshot={snapshot}/></WorkspaceContent>}
