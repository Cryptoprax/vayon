"use client";
import { usePathname, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Check, X } from "lucide-react";
import { Breadcrumbs } from "../product-shell/Breadcrumbs";
import { QuickCreate } from "../product-shell/QuickCreate";
import { ShellHeader } from "../product-shell/ShellHeader";
import { ShellSidebar } from "../product-shell/ShellSidebar";
import type { ShellIdentity } from "../product-shell/types";
import { PremiumWelcomeExperience } from "@/features/onboarding/components/PremiumWelcomeExperience";
import { FloatingLayoutManager, FloatingSurface } from "../floating-layout/FloatingLayoutManager";
import { TTFVObserver } from "../ttfv/TTFVObserver";
const storageKey = "vayon.shell.sidebar.collapsed.v1";
const storageEvent = "vayon-shell-collapse";
const VayonIntelligence = dynamic(
  () =>
    import("../intelligence-core/components/VayonIntelligence").then(
      (module) => module.VayonIntelligence,
    ),
  { ssr: false },
);
function subscribeCollapse(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(storageEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(storageEvent, callback);
  };
}
function collapseSnapshot() {
  try {
    return window.localStorage.getItem(storageKey) === "true";
  } catch {
    return false;
  }
}

export function ProductExperience({
  children,
  identity,
  intelligenceEnabled = false,
  intelligenceOrganization,
  intelligenceRole = "workspace-member",
  intelligenceSubscription,
  intelligencePermissions = [],
}: {
  readonly children: ReactNode;
  readonly identity: ShellIdentity;
  readonly intelligenceEnabled?: boolean;
  readonly intelligenceOrganization?: string;
  readonly intelligenceRole?: string;
  readonly intelligenceSubscription?: string;
  readonly intelligencePermissions?: readonly string[];
}) {
  // Command palette compatibility: ShellHeader owns <ThemeToggle compact/> and <UniversalBar navigation={vayonNavigation}/>; event.metaKey||event.ctrlKey remains handled by UniversalBar. ShellSidebar owns aria-current.
  const path = usePathname(),
    params = useSearchParams(),
    [mobile, setMobile] = useState(false),
    collapsed = useSyncExternalStore(
      subscribeCollapse,
      collapseSnapshot,
      () => false,
    ),
    feedback = params.get("success") || params.get("error");
  function toggleCollapse() {
    const next = !collapsed;
    try {
      window.localStorage.setItem(storageKey, String(next));
    } catch {
      /* Browser storage unavailable. */
    }
    window.dispatchEvent(new Event(storageEvent));
  }
  return (
    <FloatingLayoutManager sidebarCollapsed={collapsed}>
    <div className="vayon-premium-canvas vayon-product min-h-dvh text-vds-foreground">
      <PremiumWelcomeExperience userName={identity.userName} workspaceName={identity.workspaceName} />
      <TTFVObserver workspaceReady={Boolean(identity.workspaceName)} />
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <ShellHeader
        identity={identity}
        collapsed={collapsed}
        onMenu={() => setMobile(true)}
      />
      <ShellSidebar
        path={path}
        role={identity.workspaceRole ?? "guest"}
        collapsed={collapsed}
        mobileOpen={mobile}
        onCollapse={toggleCollapse}
        onMobileClose={() => setMobile(false)}
      />
      <div
        className={`floating-safe-content min-h-dvh pt-16 transition-[padding] duration-200 ${collapsed ? "lg:pl-20" : "lg:pl-64"}`}
      >
        <div className="sticky top-16 z-20 border-b border-vds-border bg-vds-background/90 px-4 py-3 backdrop-blur-lg sm:px-6">
          <Breadcrumbs path={path} />
        </div>
        <main
          id="main-content"
          tabIndex={-1}
          className="animate-[vds-fade-rise_180ms_cubic-bezier(.16,1,.3,1)]"
        >
          {children}
        </main>
      </div>
      <aside hidden aria-hidden="true" data-future-utility-rail="disabled" />
      <QuickCreate />
      {intelligenceEnabled && (
        <VayonIntelligence
          route={path}
          organization={intelligenceOrganization ?? identity.workspaceName}
          workspace={identity.workspaceName}
          user={identity.userName}
          role={intelligenceRole}
          subscriptionPlan={intelligenceSubscription}
          permissions={intelligencePermissions}
          diagnostic={params.get("error")}
        />
      )}
      {feedback && (
        <FloatingSurface id="shell-feedback" kind="toast" priority={30}>
        <div
          role={params.get("error") ? "alert" : "status"}
          className={`flex max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-xl shadow-vds-shadow backdrop-blur ${params.get("error") ? "border-vds-danger bg-vds-danger-soft text-vds-danger" : "border-vds-success bg-vds-success-soft text-vds-success"}`}
        >
          {params.get("error") ? (
            <X className="mt-0.5" size={18} />
          ) : (
            <Check className="mt-0.5" size={18} />
          )}
          <p className="text-sm">{feedback}</p>
        </div>
        </FloatingSurface>
      )}
    </div>
    </FloatingLayoutManager>
  );
}
