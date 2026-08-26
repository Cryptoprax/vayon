import type { Metadata } from "next";
import { ExecutiveHome } from "@/features/vayon/executive-home/components/ExecutiveHome";
import { createAwaitingExecutiveHome } from "@/features/vayon/executive-home/view-models/executive-home";
import { AuthenticationService } from "@/features/authentication/services/authentication.service";
import { OrganizationService } from "@/features/onboarding/services/organization.service";
import { auroraBusinessActivity, auroraCrmNetwork, auroraExecutiveIntelligence, auroraOrganizationChart, auroraPropertyPortfolio, auroraSalesOperations, getAuroraNavigationContext } from "@/features/vayon/demo-workspace";
import { CrmNetworkPanel } from "@/features/vayon/demo-workspace/crm-network/CrmNetworkPanel";
import { PropertyPortfolioPanel } from "@/features/vayon/demo-workspace/property-portfolio/PropertyPortfolioPanel";
import { SalesOperationsPanel } from "@/features/vayon/demo-workspace/sales-operations/SalesOperationsPanel";
import { BusinessActivityHomePanel } from "@/features/vayon/demo-workspace/business-activity/ActivityPanels";
import { ExecutiveIntelligencePanel } from "@/features/vayon/demo-workspace/executive-intelligence/ExecutiveIntelligencePanels";
import { ExecutiveWorkspacePanel } from "@/features/vayon/demo-workspace/executive-intelligence/ExecutiveWorkspacePanel";
import { GmailExecutiveSnapshot } from "@/features/platform/messaging/executive/GmailExecutiveSnapshot";
import { CalendarExecutiveSnapshot } from "@/features/platform/calendar/components/CalendarExecutiveSnapshot";
import { DriveExecutiveSnapshot } from "@/features/platform/external-storage/components/DriveExecutiveSnapshot";
import { ContactsExecutiveSnapshot } from "@/features/platform/external-contacts/components/ContactsExecutiveSnapshot";
import { MicrosoftExecutiveSnapshot } from "@/features/platform/integrations/microsoft/components/MicrosoftExecutiveSnapshot";
import { EnterpriseOnboardingService } from "@/features/onboarding/services/enterprise-onboarding.service";
import { WorkspaceSetupCenter } from "@/features/onboarding/components/WorkspaceSetupCenter";
import { ExecutiveActivationCards } from "@/features/vayon/executive-home/components/ExecutiveActivationCards";

export const metadata: Metadata = { title: "Executive Home | Vayon OS", description: "A calm executive view across Vayon OS." };

export default async function ExecutiveHomePage() {
  const [user, organization, onboarding] = await Promise.all([new AuthenticationService().user(), new OrganizationService().current(), new EnterpriseOnboardingService().session().catch(() => null)]);
  const demo = getAuroraNavigationContext();
  const userName = String(user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split("@")[0] ?? "User");
  return <main className="mx-auto max-w-[100rem] space-y-6 px-4 py-8 sm:px-6">
    {!onboarding?.completed_at && <WorkspaceSetupCenter session={onboarding} provisioned={Boolean(organization)} userName={userName}/>}
    {!onboarding?.completed_at && <ExecutiveActivationCards />}
    <ExecutiveHome model={organization ? createAwaitingExecutiveHome() : auroraExecutiveIntelligence.executiveHome()} userName={userName} workspaceName={organization?.name ?? demo.workspaceName} organizationDescription={organization ? undefined : demo.organizationDescription} people={organization ? undefined : auroraOrganizationChart.peopleWorkspace()}/>
    {organization && <GmailExecutiveSnapshot/>}
    {organization && <CalendarExecutiveSnapshot/>}
    {organization && <DriveExecutiveSnapshot/>}
    {organization && <ContactsExecutiveSnapshot/>}
    {organization && <MicrosoftExecutiveSnapshot/>}
    {!organization && <CrmNetworkPanel model={auroraCrmNetwork.homeProjection()}/>} 
    {!organization && <PropertyPortfolioPanel model={auroraPropertyPortfolio.homeProjection()}/>} 
    {!organization && <SalesOperationsPanel model={auroraSalesOperations.homeProjection()} advisories={auroraSalesOperations.advisoryExamples()}/>} 
    {!organization && <BusinessActivityHomePanel model={auroraBusinessActivity.homeProjection()}/>} 
    {!organization && <ExecutiveIntelligencePanel readiness={auroraExecutiveIntelligence.readiness()} evidence={auroraExecutiveIntelligence.projection().evidence}/>} 
    {!organization && <ExecutiveWorkspacePanel/>} 
  </main>;
}
