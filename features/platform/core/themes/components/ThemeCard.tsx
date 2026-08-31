import { Button } from "@/features/platform/design-system";
import { Check, Palette } from "lucide-react";

import { StatusBadge } from "../../../identity/components/StatusBadge";
import type { Theme } from "../types/theme";

export function ThemeCard({ theme }: { theme: Theme }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-vds-border/[0.08] bg-vds-surface/[0.025] transition duration-300 hover:-translate-y-0.5 hover:border-vds-border/[0.14]">
      <div
        className={`relative h-36 overflow-hidden bg-gradient-to-br ${theme.previewClass}`}
        aria-label={`${theme.name} preview`}
      >
        <div className="absolute inset-5 rounded-2xl border border-vds-border bg-vds-surface/[0.05] p-3 backdrop-blur-xl">
          <div className="h-2 w-16 rounded-full bg-vds-hover" />
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="col-span-2 h-14 rounded-xl bg-vds-hover" />
            <div className="h-14 rounded-xl bg-vds-hover" />
          </div>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-vds-foreground">{theme.name}</h2>
            <p className="mt-1 text-xs leading-5 text-vds-subtle">
              {theme.description}
            </p>
          </div>
          <StatusBadge
            label={theme.isDefault ? "Default" : theme.status}
            tone={theme.isDefault ? "positive" : "neutral"}
          />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-y border-vds-border/[0.06] py-4 text-[10px]">
          <div>
            <p className="text-vds-subtle">Typography</p>
            <p className="mt-1 text-vds-muted">{theme.typography}</p>
          </div>
          <div>
            <p className="text-vds-subtle">Border radius</p>
            <p className="mt-1 text-vds-muted">{theme.borderRadius}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex -space-x-1">
            {theme.colors.map((color) => (
              <span
                key={color}
                className="size-5 rounded-full border-2 border-[var(--vds-color-surface)]"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <Button variant="control"
            type="button"
            disabled
            title={theme.isDefault?"This theme is already applied":"Theme changes are unavailable here"}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-vds-border/[0.08] px-3 text-xs font-medium text-vds-muted transition hover:bg-vds-surface/[0.05] hover:text-vds-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vds-focus"
          >
            {theme.isDefault ? (
              <Check className="size-3.5" aria-hidden="true" />
            ) : (
              <Palette className="size-3.5" aria-hidden="true" />
            )}
            {theme.isDefault ? "Applied" : "Apply"}
          </Button>
        </div>
      </div>
    </article>
  );
}
