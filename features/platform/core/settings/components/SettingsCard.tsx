import { Button } from "@/features/platform/design-system";
import { ArrowUpRight, Settings2 } from "lucide-react";

import type { SettingsOption } from "../types/settings";

export function SettingsCard({ option }: { option: SettingsOption }) {
  return (
    <Button variant="control" disabled title="This setting is read-only"
      type="button"
      className="group flex w-full items-center gap-3 rounded-xl border border-vds-border/[0.06] bg-vds-surface/[0.018] p-3 text-left transition hover:border-vds-border/[0.11] hover:bg-vds-surface/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vds-focus"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-vds-surface/[0.04] text-vds-subtle group-hover:text-vds-primary">
        <Settings2 className="size-3.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-vds-secondary">
          {option.label}
        </span>
        <span className="mt-0.5 block truncate text-[10px] text-vds-subtle">
          {option.description}
        </span>
      </span>
      <span className="text-[10px] text-vds-muted">{option.value}</span>
      <ArrowUpRight className="size-3 text-vds-secondary" aria-hidden="true" />
    </Button>
  );
}
