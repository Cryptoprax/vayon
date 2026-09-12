import { createRoot } from "react-dom/client";
import { EnterpriseMembersManagement } from "@/features/platform/organization/components/RoleManagementUI";
import { EnterpriseMembersManagement as BeforeMembers } from "@/features/platform/organization/components/RoleManagementUI?before";
import { WorkspacePageLayout, WorkspaceContent, WorkspaceHeader } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { AppShell } from "@/features/vayon/product-shell/AppShell";
import { ButtonLink } from "@/features/platform/design-system/components/core/Actions";

const params = new URLSearchParams(location.search);
const before = params.has("before");
const readOnly = params.has("readonly");
const records = [
  ["John Smith", "owner@example.test", "organization_owner", "active"],
  ["Alexandria Montgomery", "alexandria.montgomery.with.a.long.address@example.test", "sales_manager", "active"],
  ["Morgan Patel", "morgan@example.test", "customer_success_manager", "suspended"],
  ["Avery Chen", "avery@example.test", "viewer", "active"],
];
const members = records.map(([name, email, role, status], i) => ({ id: `00000000-0000-4000-8000-00000000000${i}`, userId: `qa-${i}`, name, email, role, roleName: role, status, joinedAt: "2026-09-01T10:00:00Z", lastLoginAt: i ? "2026-09-10T10:00:00Z" : null }));
const snapshot = { profile: {}, members: params.has("solo") ? members.slice(0, 1) : members, invitations: [{ id: "00000000-0000-4000-8000-000000000099", name: "Pending QA teammate", email: "pending.teammate.with.a.long.address@example.test", role: "sales_representative", roleName: "Sales Representative", expiresAt: "2026-10-01T12:00:00Z" }], roles: [], departments: [], teams: [], activity: [], canManage: !readOnly, isOwner: !readOnly };
window.memberSubmissions = [];
const header = <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center border-b border-vds-border bg-vds-background px-4 text-sm">VAYON · Members presentation fixture</header>;
const sidebar = <aside className="fixed bottom-0 left-0 top-16 hidden w-64 border-r border-vds-border bg-vds-background p-5 lg:block"><p className="font-semibold">Workspace</p><p className="mt-5 text-sm text-vds-muted">Settings</p><p className="mt-3 text-sm">Team Members</p></aside>;
createRoot(document.getElementById("root")).render(<div className="vayon-premium-canvas vayon-product"><AppShell sidebarCollapsed={false} header={header} sidebar={sidebar}><main id="main-content"><WorkspacePageLayout breadcrumbs={<nav aria-label="Breadcrumb">Settings / Team Members</nav>}><WorkspaceContent><WorkspaceHeader title="Team Members" description="Bring your team together and keep everyone’s access up to date." actions={!readOnly && <ButtonLink href="#invite-team">Invite Team</ButtonLink>} />{before ? <BeforeMembers snapshot={snapshot} /> : <EnterpriseMembersManagement snapshot={snapshot} />}</WorkspaceContent></WorkspacePageLayout></main></AppShell></div>);
