"use client";

import { createPortal } from "react-dom";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type FloatingKind =
  | "assistant"
  | "help"
  | "toast"
  | "walkthrough"
  | "action"
  | "banner";

interface Registration {
  readonly id: string;
  readonly kind: FloatingKind;
  readonly priority: number;
  readonly expanded: boolean;
}

const kindOrder: Record<FloatingKind, number> = {
  banner: 0,
  walkthrough: 10,
  toast: 20,
  assistant: 30,
  action: 40,
  help: 50,
};

interface FloatingContextValue {
  readonly root: HTMLElement | null;
  readonly register: (registration: Registration) => () => void;
}

const FloatingContext = createContext<FloatingContextValue | null>(null);

export function FloatingLayoutManager({
  children,
  sidebarCollapsed,
}: {
  readonly children: ReactNode;
  readonly sidebarCollapsed: boolean;
}) {
  const dockRef = useRef<HTMLDivElement>(null);
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [registrations, setRegistrations] = useState<readonly Registration[]>([]);
  const register = useCallback((registration: Registration) => {
    setRegistrations((current) => [
      ...current.filter((item) => item.id !== registration.id),
      registration,
    ]);
    return () =>
      setRegistrations((current) =>
        current.filter((item) => item.id !== registration.id),
      );
  }, []);
  const attachDock = useCallback((node: HTMLDivElement | null) => {
    dockRef.current = node;
    setRoot(node);
  }, []);
  const expanded = registrations.some((item) => item.expanded);

  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    const update = () => {
      const visual = window.visualViewport;
      const { width, height } = dock.getBoundingClientRect();
      const zoom = visual ? window.innerWidth / visual.width : 1;
      document.documentElement.style.setProperty(
        "--vayon-floating-safe-bottom",
        expanded ? "1rem" : `${Math.min(height + 40, window.innerHeight * 0.8)}px`,
      );
      document.documentElement.style.setProperty(
        "--vayon-floating-safe-right",
        expanded ? `${Math.min(width + 32, 512)}px` : `${Math.min(width + 32, 336)}px`,
      );
      document.documentElement.dataset.floatingViewport = `${Math.round(visual?.width ?? window.innerWidth)}x${Math.round(visual?.height ?? window.innerHeight)}`;
      document.documentElement.dataset.floatingZoom = zoom.toFixed(2);
      document.documentElement.dataset.floatingSidebar = sidebarCollapsed
        ? "collapsed"
        : "expanded";
    };
    const resize = new ResizeObserver(update);
    const mutation = new MutationObserver(update);
    resize.observe(dock);
    mutation.observe(dock, {
      childList: true,
      attributes: true,
      attributeFilter: ["data-floating-expanded", "data-floating-fullscreen"],
    });
    window.addEventListener("resize", update, { passive: true });
    window.visualViewport?.addEventListener("resize", update);
    update();
    return () => {
      resize.disconnect();
      mutation.disconnect();
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, [expanded, sidebarCollapsed, registrations.length]);

  const context = useMemo(() => ({ root, register }), [register, root]);
  return (
    <FloatingContext.Provider value={context}>
      {children}
      <div
        ref={attachDock}
        id="vayon-floating-layout"
        data-floating-layout
        data-expanded={expanded || undefined}
        aria-live="polite"
        className="vayon-floating-layout"
      />
    </FloatingContext.Provider>
  );
}

export function FloatingSurface({
  id,
  kind,
  priority,
  expanded = false,
  fullscreen = false,
  children,
}: {
  readonly id: string;
  readonly kind: FloatingKind;
  readonly priority: number;
  readonly expanded?: boolean;
  readonly fullscreen?: boolean;
  readonly children: ReactNode;
}) {
  const context = useContext(FloatingContext);
  useEffect(
    () => context?.register({ id, kind, priority, expanded }),
    [context, expanded, id, kind, priority],
  );
  if (!context?.root) return null;
  return createPortal(
    <div
      data-floating-surface={kind}
      data-floating-expanded={expanded || undefined}
      data-floating-fullscreen={fullscreen || undefined}
      style={{ order: kindOrder[kind] * 100 + priority }}
      className="vayon-floating-surface"
    >
      {children}
    </div>,
    context.root,
  );
}
