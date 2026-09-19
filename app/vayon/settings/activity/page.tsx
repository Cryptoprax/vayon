import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { ActivityLog, OrganizationHeader } from "@/features/platform/organization/components/OrganizationUI";
import { EnterpriseOrganizationService } from "@/features/platform/organization";
import { requireEntitlement, FeatureNotEntitledError } from "@/features/vayon/billing/services/require-entitlement";
import { EntitlementUpgradeRequired } from "@/features/vayon/billing/components/EntitlementUpgradeRequired";
export const dynamic = "force-dynamic";
export default async function Page(){try{await requireEntitlement("audit")}catch(error){if(error instanceof FeatureNotEntitledError)return <EntitlementUpgradeRequired feature="audit" label="Organization Activity"/>;throw error}const snapshot=await new EnterpriseOrganizationService().snapshot();return <WorkspaceContent ><OrganizationHeader title="Organization Activity" description="Immutable organization, invitation, membership, role, and ownership audit history."/><ActivityLog snapshot={snapshot}/></WorkspaceContent>}
