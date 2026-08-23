"use client";

import { Button, ButtonLink } from "@/features/platform/design-system";
import { BookOpen, CirclePlay, Sparkles } from "lucide-react";
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
  documentation = "/vayon/knowledge",
  video = "/vayon/success-center",
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
    <section
      data-empty-state
      aria-labelledby={`${module}-empty-title`}
      className="grid min-h-56 place-items-center rounded-3xl border border-dashed border-vds-border bg-vds-surface/[0.02] p-8 text-center"
    >
      <div className="max-w-xl">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-vds-primary-soft text-vds-primary" aria-hidden="true">
          <Sparkles className="size-5" />
        </span>
        <h2 id={`${module}-empty-title`} className="mt-4 font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-vds-muted">{description}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {primary && <ButtonLink href={primary.href}>{primary.label}</ButtonLink>}
          {secondary && <ButtonLink variant="secondary" href={secondary.href}>{secondary.label}</ButtonLink>}
          <ButtonLink variant="ghost" href={video}><CirclePlay className="size-4" />Watch tutorial</ButtonLink>
          <ButtonLink variant="ghost" href={documentation}><BookOpen className="size-4" />Documentation</ButtonLink>
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
      </div>
    </section>
  );
}
