import { getWorkspaceTrial, type WorkspaceTrialSnapshot } from "@/features/vayon/billing/services/workspace-trial";
import { WorkspaceTrialBanner } from "@/features/vayon/billing/components/WorkspaceTrialBanner";
import { evaluateWorkspacePermission } from "@/features/platform/permissions/runtime/policy";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { AuthenticationService } from "@/features/authentication/services/authentication.service";
import { OrganizationService } from "@/features/onboarding/services/organization.service";
import { ProductExperience } from "./ProductExperience";
import { getAuroraNavigationContext } from "../demo-workspace";
import { WorkspacePermissionService } from "@/features/platform/permissions/runtime/permission.service";
import { WorkspaceBootstrapService } from "@/features/onboarding/services/workspace-bootstrap.service";
import { PlatformVisibilityService } from "@/features/platform/visibility/service";
// Header and sidebar share the product-shell navigation catalog.

export async function VayonShell({
  children,
}: {
  readonly children: ReactNode;
}) {
  // Identity lookups are request-scoped, so these calls share one getUser() and one context read.
  const [user, currentOrganization] = await Promise.all([
    new AuthenticationService().user(),
    new OrganizationService().current(),
  ]);
  let organization = currentOrganization;
  // Bootstrap must finish before anything that reads the organization or workspace.
  if (user && !organization)
    organization = await new WorkspaceBootstrapService().ensure(user);
  // Visibility reuses this request's permission context instead of resolving it again.
  const [authorization, visibility] = await Promise.all([
    new WorkspacePermissionService().context().catch(() => null),
    new PlatformVisibilityService().context(),
  ]);
  const
    demo = getAuroraNavigationContext(),
    userName = String(
      user?.user_metadata?.full_name ??
        user?.user_metadata?.name ??
        user?.email?.split("@")[0] ??
        "User",
    ),
    role = String(user?.app_metadata?.role ?? "workspace-member"),
    subscriptionPlan =
      typeof user?.app_metadata?.subscription_plan === "string"
        ? user.app_metadata.subscription_plan
        : undefined,
    permissions = Array.isArray(user?.app_metadata?.permissions)
      ? user.app_metadata.permissions.filter(
          (permission): permission is string => typeof permission === "string",
        )
      : [],
    identity = organization?.name
      ? { userName, historyScope: `${authorization?.actorId ?? user?.id}:${authorization?.workspaceId ?? organization.id}`, workspaceName: organization.name, organizationDescription: `${organization.name} AI business workspace`, workspaceRole: authorization?.role ?? "guest" as const }
      : {
          userName,
          historyScope: `demo:${user?.id ?? "anonymous"}`,
          workspaceName: demo.workspaceName,
          workspaceLogo: demo.logoPlaceholder,
          organizationDescription: demo.organizationDescription,
          demoWorkspace: "aurora" as const,
          workspaceRole: authorization?.role ?? "guest" as const,
        };
  // Start the trial snapshot now; the banner streams in when it resolves instead of blocking the shell.
  const trial = getWorkspaceTrial().catch(() => null);
  return (
    <Suspense>
      <ProductExperience
        commercialNotice={<Suspense fallback={null}><ShellTrialNotice trial={trial} canOpenBilling={Boolean(authorization && evaluateWorkspacePermission(authorization.role, { module: "billing", action: "view" }).allowed)}/></Suspense>}
        identity={identity}
        visibility={visibility}
        intelligenceEnabled={process.env.FEATURE_VAYON_INTELLIGENCE !== "false"}
        intelligenceOrganization={organization?.id}
        intelligenceRole={role}
        intelligenceSubscription={subscriptionPlan}
        intelligencePermissions={permissions}
      >
        {children}
      </ProductExperience>
    </Suspense>
  );
}

async function ShellTrialNotice({
  trial,
  canOpenBilling,
}: {
  readonly trial: Promise<WorkspaceTrialSnapshot | null>;
  readonly canOpenBilling: boolean;
}) {
  return <WorkspaceTrialBanner snapshot={await trial} canOpenBilling={canOpenBilling}/>;
}
