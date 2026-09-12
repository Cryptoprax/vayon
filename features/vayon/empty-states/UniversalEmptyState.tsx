"use client";

import { WorkspaceEmptyState } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { Button, ButtonLink } from "@/features/platform/design-system";
import { BookOpen, CirclePlay } from "lucide-react";
import { useSyncExternalStore } from "react";

const dismissalEvent = "vayon-empty-state-dismissed";
function subscribeDismissal(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(dismissalEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(dismissalEvent, callback);
  };
}

export function UniversalEmptyState({
  module,
  title,
  description,
  primary,
  secondary,
  documentation,
  video,
  workspace = "current",
  user = "current",
  dismissible = false,
}: {
  readonly module: string;
  readonly title: string;
  readonly description: string;
  readonly primary?: { readonly label: string; readonly href: string };
  readonly secondary?: { readonly label: string; readonly href: string };
  readonly documentation?: string;
  readonly video?: string;
  readonly workspace?: string;
  readonly user?: string;
  readonly dismissible?: boolean;
}) {
  const key = `vayon.empty-state.${workspace}.${user}.${module}`;
  const dismissed = useSyncExternalStore(
    subscribeDismissal,
    () => {
      if (!dismissible) return false;
      try { return localStorage.getItem(key) === "dismissed"; } catch { return false; }
    },
    () => false,
  );
  if (dismissed) return null;
  return (
    <WorkspaceEmptyState title={title} description={description} action={primary}>
        <div className="mt-3 flex flex-wrap gap-3">
          {secondary && <ButtonLink variant="secondary" href={secondary.href}>{secondary.label}</ButtonLink>}
          {video && <ButtonLink variant="ghost" href={video}><CirclePlay className="size-4" />Watch tutorial</ButtonLink>}
          {documentation && <ButtonLink variant="ghost" href={documentation}><BookOpen className="size-4" />Documentation</ButtonLink>}
        </div>
        {dismissible && (
          <Button
            variant="ghost"
            className="mt-4 text-xs"
            onClick={() => {
              try { localStorage.setItem(key, "dismissed"); } catch {}
              window.dispatchEvent(new Event(dismissalEvent));
            }}
          >
            Dismiss for this workspace
          </Button>
        )}
    </WorkspaceEmptyState>
  );
}
