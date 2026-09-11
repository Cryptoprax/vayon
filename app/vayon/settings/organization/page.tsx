import Link from "next/link";
import { OrganizationHeader, OrganizationSettingsForm } from "@/features/platform/organization/components/OrganizationUI";
import { EnterpriseOrganizationService } from "@/features/platform/organization";
import { enforcePagePermission } from "@/features/platform/permissions/runtime/http";
export default async function Page(){await enforcePagePermission("organization_settings");const snapshot=await new EnterpriseOrganizationService().snapshot();return <main className="mx-auto max-w-6xl px-5 py-8"><OrganizationHeader title="Organization Settings" description="Profile, business identity, localization, address, logo, and VAYON branding settings."/>{snapshot.canManage && <Link href="/vayon/settings/members" className="focus-ring mt-5 inline-flex min-h-11 items-center text-vds-primary">Workspace / Team Members</Link>}<OrganizationSettingsForm snapshot={snapshot}/></main>}
