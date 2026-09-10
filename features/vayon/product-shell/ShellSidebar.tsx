"use client";
import { Button } from "@/features/platform/design-system";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { shellNavigation, navigationGroupForPath } from "./navigation";
import { filterNavigationForRole } from "@/features/platform/permissions/runtime/navigation";
import type { WorkspaceRoleCode } from "@/features/platform/organization/config/workspace-role-catalog";
import type { PlatformVisibilityContext } from "@/features/platform/visibility/domain";

export function ShellSidebar({ path, role, visibility, collapsed, mobileOpen, onCollapse, onMobileClose }: { readonly path: string; readonly role: WorkspaceRoleCode; readonly visibility: PlatformVisibilityContext; readonly collapsed: boolean; readonly mobileOpen: boolean; readonly onCollapse: () => void; readonly onMobileClose: () => void }) {
  const closeButton=useRef<HTMLButtonElement>(null);
  useEffect(()=>{if(!mobileOpen)return;const close=(event:KeyboardEvent)=>{if(event.key==="Escape")onMobileClose()};window.addEventListener("keydown",close);requestAnimationFrame(()=>closeButton.current?.focus());return()=>window.removeEventListener("keydown",close)},[mobileOpen,onMobileClose]);
  const navigation=filterNavigationForRole(shellNavigation,role,visibility);
  return <><div aria-hidden="true" onClick={onMobileClose} className={`fixed inset-0 z-[65] bg-vds-overlay backdrop-blur-sm transition lg:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}/><aside id="vayon-sidebar" aria-label="Business navigation" className={`fixed inset-y-0 left-0 z-[70] flex w-72 flex-col border-r border-vds-border bg-vds-surface/95 pt-16 shadow-xl shadow-vds-shadow backdrop-blur-xl transition-[width,transform] duration-200 lg:z-50 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "invisible -translate-x-full lg:visible"} ${collapsed ? "lg:w-20" : "lg:w-64"}`}>
    <Button variant="control" ref={closeButton} type="button" onClick={onMobileClose} aria-label="Close navigation" className="absolute right-3 top-3 grid size-9 place-items-center rounded-xl text-vds-muted hover:bg-vds-hover hover:text-vds-foreground lg:hidden"><X className="size-4"/></Button>
    <nav aria-label="Primary navigation" className="flex-1 overflow-y-auto px-3 py-5">
      {navigation.map(group => {
        const GroupIcon = group.icon;
        const active = navigationGroupForPath(path, navigation) === group.id;
        if (group.id === "ai" && !active) return null;
        const destination = group.items[0]?.href;
        if (!destination) return null;
        const creativeContext = path.startsWith("/vayon/creative") && !path.startsWith("/vayon/creative/campaigns");
        const workflowItems = group.items.filter(item => item.href !== destination && (
          group.id !== "marketing" || creativeContext || !item.href?.startsWith("/vayon/creative") || item.href === "/vayon/creative"
        ));
        const advanced = (href?: string) => Boolean(href && ["templates", "/brand", "/creative/calendar", "automations", "/goals", "/workflows", "/analytics/"].some(segment => href.includes(segment)));
        const items = workflowItems.filter(item => !advanced(item.href));
        const advancedItems = workflowItems.filter(item => advanced(item.href));
        return <div key={group.id} className="mb-2">
          <Link href={destination} onClick={onMobileClose} title={collapsed ? group.label : undefined}
            aria-current={path === destination ? "page" : undefined}
            className={`focus-ring flex min-h-11 items-center rounded-xl text-sm font-semibold ${collapsed ? "justify-center px-2" : "gap-3 px-3"} ${active ? "bg-vds-primary-soft text-vds-primary" : "text-vds-muted hover:bg-vds-hover hover:text-vds-foreground"}`}>
            <GroupIcon aria-hidden="true" className="size-5 shrink-0" /><span className={collapsed ? "sr-only" : "min-w-0"}>{group.label}{group.items[0].label !== group.label && <span className="block text-xs font-normal text-vds-muted">{group.items[0].label}</span>}</span>
          </Link>
          {active && !collapsed && workflowItems.length > 0 && <div role="group" aria-label={group.label + " destinations"} className="ml-5 mt-2 grid gap-1 border-l border-vds-border pl-3">
            {items.map(item => <Link key={item.href} href={item.href!} onClick={onMobileClose}
              aria-current={path === item.href ? "page" : undefined}
              className={`focus-ring flex min-h-11 items-center rounded-lg px-3 py-2 text-sm ${path === item.href ? "bg-vds-primary-soft text-vds-primary" : "text-vds-muted hover:bg-vds-hover hover:text-vds-foreground"}`}>{item.label}</Link>)}
            {advancedItems.length > 0 && <details key={path} open={advancedItems.some(item => path === item.href)} className="mt-2"><summary className="focus-ring cursor-pointer rounded-lg px-3 py-3 text-sm text-vds-muted">More tools for this workflow</summary><div className="grid gap-1">{advancedItems.map(item => <Link key={item.href} href={item.href!} onClick={onMobileClose} aria-current={path === item.href ? "page" : undefined} className="focus-ring min-h-11 rounded-lg px-3 py-3 text-sm text-vds-muted hover:bg-vds-hover">{item.label}</Link>)}</div></details>}
          </div>}
        </div>;
      })}
    </nav>
    <Button variant="control" type="button" onClick={onCollapse} className="hidden h-14 items-center justify-center gap-2 border-t border-vds-border text-xs text-vds-muted hover:bg-vds-hover hover:text-vds-foreground lg:flex" aria-label={collapsed?"Expand sidebar":"Collapse sidebar"}>{collapsed?<ChevronRight className="size-4"/>:<><ChevronLeft className="size-4"/>Collapse</>}</Button>
  </aside></>;
}
