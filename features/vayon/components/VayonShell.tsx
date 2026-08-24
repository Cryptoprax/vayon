import type { ReactNode } from "react";
import { Suspense } from "react";
import { AuthenticationService } from "@/features/authentication/services/authentication.service";
import { OrganizationService } from "@/features/onboarding/services/organization.service";
import { ProductExperience } from "./ProductExperience";
import { getAuroraNavigationContext } from "../demo-workspace";
import { WorkspacePermissionService } from "@/features/platform/permissions/runtime/permission.service";
// Search/navigation compatibility remains sourced from builder/config/vayon-navigation through ShellHeader.

export async function VayonShell({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [user, organization, authorization] = await Promise.all([
      new AuthenticationService().user(),
      new OrganizationService().current(),
      new WorkspacePermissionService().context().catch(() => null),
    ]),
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
      ? { userName, workspaceName: organization.name, workspaceRole: authorization?.role ?? "guest" as const }
      : {
          userName,
          workspaceName: demo.workspaceName,
          workspaceLogo: demo.logoPlaceholder,
          organizationDescription: demo.organizationDescription,
          demoWorkspace: "aurora" as const,
          workspaceRole: authorization?.role ?? "guest" as const,
        };
  return (
    <Suspense>
      <ProductExperience
        identity={identity}
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
