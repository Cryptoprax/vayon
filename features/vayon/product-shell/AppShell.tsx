"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
interface AppShellLayoutContextValue { readonly sidebarCollapsed: boolean; readonly sidebarMode: "expanded" | "collapsed"; }
const AppShellLayoutContext = createContext<AppShellLayoutContextValue | null>(null);
export function AppShell({ sidebarCollapsed, header, sidebar, children }: { readonly sidebarCollapsed: boolean; readonly header: ReactNode; readonly sidebar: ReactNode; readonly children: ReactNode }) { const value = useMemo(() => ({ sidebarCollapsed, sidebarMode: sidebarCollapsed ? "collapsed" as const : "expanded" as const }), [sidebarCollapsed]); return <AppShellLayoutContext.Provider value={value}><div className="vayon-app-shell" data-sidebar-state={value.sidebarMode}>{header}{sidebar}<div className="vayon-shell-content floating-safe-content">{children}</div></div></AppShellLayoutContext.Provider>; }
export function ContentContainer({ children }: { readonly children: ReactNode }) { return <div className="vayon-content-container">{children}</div>; }
export function useAppShellLayout() { const value = useContext(AppShellLayoutContext); if (!value) throw new Error("useAppShellLayout must be used inside AppShell."); return value; }
