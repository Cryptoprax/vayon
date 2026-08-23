export type NavigationIconName =
  | "platform"
  | "applications"
  | "identity"
  | "organizations"
  | "workspaces"
  | "users"
  | "roles"
  | "permissions"
  | "notifications"
  | "activity"
  | "search"
  | "themes"
  | "audit"
  | "marketplace"
  | "developer"
  | "settings";

export interface NavigationItem {
  id: string;
  title: string;
  iconName: NavigationIconName;
  route: string;
  badge?: string;
  permission: string;
  enabled: boolean;
  founderOnly?: boolean;
  children: NavigationItem[];
}

export const missionControlNavigation: NavigationItem[] = [
  { id: "founder", title: "Founder Portal", iconName: "platform", route: "/platform/founder", badge: "Live", permission: "platform.founder.view", enabled: true, founderOnly: true, children: [] },
  { id: "platform", title: "Platform", iconName: "platform", route: "/platform", permission: "platform.overview.view", enabled: true, children: [] },
  { id: "applications", title: "Applications", iconName: "applications", route: "/platform/applications", permission: "platform.applications.view", enabled: true, children: [] },
  { id: "identity", title: "Identity", iconName: "identity", route: "/platform/identity", badge: "Core", permission: "platform.identity.view", enabled: true, children: [] },
  { id: "organizations", title: "Organizations", iconName: "organizations", route: "/platform/organizations", permission: "platform.organizations.view", enabled: true, children: [] },
  { id: "workspaces", title: "Workspaces", iconName: "workspaces", route: "/platform/workspaces", permission: "platform.workspaces.view", enabled: true, children: [] },
  { id: "users", title: "Users", iconName: "users", route: "/platform/users", permission: "platform.users.view", enabled: true, children: [] },
  { id: "roles", title: "Roles", iconName: "roles", route: "/platform/roles", permission: "platform.roles.view", enabled: true, children: [] },
  { id: "permissions", title: "Permissions", iconName: "permissions", route: "/platform/permissions", permission: "platform.permissions.view", enabled: true, children: [] },
  { id: "notifications", title: "Notifications", iconName: "notifications", route: "/platform/notifications", badge: "8", permission: "platform.notifications.view", enabled: true, children: [] },
  { id: "activity", title: "Activity", iconName: "activity", route: "/platform/activity", permission: "platform.activity.view", enabled: true, children: [] },
  { id: "search", title: "Search", iconName: "search", route: "/platform/search", permission: "platform.search.use", enabled: true, children: [] },
  { id: "themes", title: "Themes", iconName: "themes", route: "/platform/themes", permission: "platform.themes.view", enabled: true, children: [] },
  { id: "audit", title: "Audit", iconName: "audit", route: "/platform/audit", permission: "platform.audit.view", enabled: true, children: [] },
  { id: "integrations", title: "Integrations", iconName: "developer", route: "/platform/integrations", badge: "New", permission: "platform.integrations.manage", enabled: true, children: [] },
  { id: "customers", title: "Customers", iconName: "organizations", route: "/platform/customers", permission: "platform.customers.view", enabled: true, children: [] },
  { id: "customer-success", title: "Customer Success", iconName: "activity", route: "/platform/customer-success", permission: "platform.customer_success.view", enabled: true, children: [] },
  { id: "support", title: "Support", iconName: "users", route: "/platform/support", permission: "platform.support.access", enabled: true, children: [] },
  { id: "platform-health", title: "Platform Health", iconName: "platform", route: "/platform/platform-health", permission: "platform.health.view", enabled: true, children: [] },
  { id: "launch-readiness", title: "Launch Readiness", iconName: "audit", route: "/platform/launch-readiness", permission: "platform.audit.view", enabled: true, children: [] },
  { id: "feature-flags", title: "Feature Flags", iconName: "permissions", route: "/platform/feature-flags", permission: "platform.flags.manage", enabled: true, children: [] },
  { id: "releases", title: "Releases", iconName: "applications", route: "/platform/releases", permission: "platform.releases.manage", enabled: true, children: [] },
  { id: "system-analytics", title: "System Analytics", iconName: "search", route: "/platform/system-analytics", permission: "platform.analytics.view", enabled: true, children: [] },
  { id: "marketplace", title: "Marketplace", iconName: "marketplace", route: "/platform/marketplace", permission: "platform.marketplace.view", enabled: true, children: [] },
  { id: "developer-center", title: "Developer Center", iconName: "developer", route: "/platform/developer", permission: "platform.developer.view", enabled: true, children: [] },
  { id: "settings", title: "Settings", iconName: "settings", route: "/platform/settings", permission: "platform.settings.view", enabled: true, children: [] },
];
