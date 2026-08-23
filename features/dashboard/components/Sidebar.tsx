"use client";
import { Button } from "@/features/platform/design-system";

import {
  Activity,
  AppWindow,
  Bell,
  Building2,
  ChevronLeft,
  Code2,
  Fingerprint,
  Gauge,
  History,
  KeyRound,
  Palette,
  PanelLeftClose,
  PanelsTopLeft,
  Settings,
  ShieldCheck,
  Search,
  Store,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import {
  missionControlNavigation,
  type NavigationIconName,
} from "@/features/dashboard/config/navigation";

import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

const navigationIcons: Record<NavigationIconName, LucideIcon> = {
  platform: Gauge,
  applications: AppWindow,
  identity: Fingerprint,
  organizations: Building2,
  workspaces: PanelsTopLeft,
  users: UsersRound,
  roles: ShieldCheck,
  permissions: KeyRound,
  notifications: Bell,
  activity: Activity,
  search: Search,
  themes: Palette,
  audit: History,
  marketplace: Store,
  developer: Code2,
  settings: Settings,
};

export interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  activeRoute?: string;
  onCollapse: () => void;
  onMobileClose: () => void;
  showFounder?: boolean;
}

export function Sidebar({
  collapsed,
  mobileOpen,
  activeRoute = "/platform",
  onCollapse,
  onMobileClose,
  showFounder = false,
}: SidebarProps) {
  const items = missionControlNavigation.filter((item) => item.enabled && (!item.founderOnly || showFounder));

  return (
    <>
      {mobileOpen ? (
        <Button variant="control"
          type="button"
          className="fixed inset-0 z-40 bg-vds-overlay backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          aria-label="Close navigation"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex border-r border-vds-border/[0.07] bg-[var(--vds-color-background)]/95 shadow-2xl shadow-vds-shadow backdrop-blur-2xl transition-[width,transform] duration-300 lg:relative lg:z-20 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-20" : "w-72"}`}
        aria-label="Mission Control navigation"
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <div
            className={`flex h-16 shrink-0 items-center border-b border-vds-border/[0.07] ${
              collapsed ? "justify-center px-3" : "justify-between px-4"
            }`}
          >
            <Link
              href="/platform"
              className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vds-focus"
              aria-label="AtlasOS Mission Control"
            >
              <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-vds-accent-border bg-gradient-to-br from-vds-primary via-vds-primary to-vds-info font-bold text-vds-foreground shadow-[0_0_24px_var(--vds-color-primary-soft)]">
                A
              </span>
              {!collapsed ? (
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold tracking-tight text-vds-foreground">
                    AtlasOS
                  </span>
                  <span className="block truncate text-[10px] font-medium uppercase tracking-[0.15em] text-vds-subtle">
                    Mission Control
                  </span>
                </span>
              ) : null}
            </Link>
            {!collapsed ? (
              <Button variant="control"
                type="button"
                onClick={onMobileClose}
                className="flex size-8 items-center justify-center rounded-lg text-vds-muted transition hover:bg-vds-surface/[0.06] hover:text-vds-foreground lg:hidden"
                aria-label="Close navigation"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            ) : null}
          </div>

          <div className="shrink-0 p-3">
            <WorkspaceSwitcher compact={collapsed} />
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 [scrollbar-color:var(--vds-color-border)_transparent] [scrollbar-width:thin]">
            <p
              className={`mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-vds-subtle ${
                collapsed ? "sr-only" : ""
              }`}
            >
              Platform
            </p>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const Icon = navigationIcons[item.iconName];
                const isActive = item.route === activeRoute;

                return (
                  <li key={item.id}>
                    <Link
                      href={item.route}
                      title={collapsed ? item.title : undefined}
                      onClick={onMobileClose}
                      className={`group flex h-9 items-center rounded-xl text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vds-focus ${
                        collapsed ? "justify-center px-2" : "gap-3 px-3"
                      } ${
                        isActive
                          ? "bg-vds-primary/[0.09] text-vds-primary shadow-[inset_0_0_0_1px_var(--vds-color-primary-soft)]"
                          : "text-vds-muted hover:bg-vds-surface/[0.045] hover:text-vds-secondary"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon
                        className={`size-4 shrink-0 ${
                          isActive
                            ? "text-vds-primary"
                            : "text-vds-subtle group-hover:text-vds-muted"
                        }`}
                        strokeWidth={1.7}
                        aria-hidden="true"
                      />
                      {!collapsed ? (
                        <>
                          <span className="min-w-0 flex-1 truncate">
                            {item.title}
                          </span>
                          {item.badge ? (
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${
                                item.badge === "Live"
                                  ? "bg-vds-success-soft text-vds-success"
                                  : "bg-vds-surface/[0.06] text-vds-muted"
                              }`}
                            >
                              {item.badge}
                            </span>
                          ) : null}
                        </>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="shrink-0 border-t border-vds-border/[0.07] p-3">
            <Button variant="control"
              type="button"
              onClick={onCollapse}
              className={`hidden h-9 w-full items-center rounded-xl text-sm text-vds-muted transition hover:bg-vds-surface/[0.05] hover:text-vds-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vds-focus lg:flex ${
                collapsed ? "justify-center" : "gap-3 px-3"
              }`}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
            >
              {collapsed ? (
                <ChevronLeft
                  className="size-4 rotate-180"
                  aria-hidden="true"
                />
              ) : (
                <>
                  <PanelLeftClose className="size-4" aria-hidden="true" />
                  Collapse sidebar
                </>
              )}
            </Button>
          </div>
        </div>

        <div
          className="group absolute inset-y-0 -right-1 hidden w-2 cursor-col-resize items-center justify-center lg:flex"
          title="Resize sidebar"
          aria-hidden="true"
        >
          <span className="h-12 w-px rounded-full bg-transparent transition group-hover:bg-vds-primary/40" />
        </div>
      </aside>
    </>
  );
}
