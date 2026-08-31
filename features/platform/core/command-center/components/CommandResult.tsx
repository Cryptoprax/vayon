import { Button } from "@/features/platform/design-system";
import { ArrowUpRight, Command as CommandIcon } from "lucide-react";

import type { Command } from "../types/command";

export function CommandResult({ command }: { command: Command }) {
  return (
    <Button variant="control" disabled title="Command execution is not configured"
      type="button"
      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-vds-surface/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vds-focus"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-vds-border/[0.07] bg-vds-surface/[0.025] text-vds-subtle group-hover:text-vds-primary">
        <CommandIcon className="size-3.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-vds-secondary">
          {command.title}
        </span>
        <span className="mt-0.5 block truncate text-xs text-vds-subtle">
          {command.description}
        </span>
      </span>
      {command.shortcut ? (
        <kbd className="rounded-md border border-vds-border/[0.08] px-2 py-1 font-sans text-[9px] text-vds-subtle">
          {command.shortcut}
        </kbd>
      ) : null}
      <ArrowUpRight
        className="size-3 text-vds-secondary group-hover:text-vds-muted"
        aria-hidden="true"
      />
    </Button>
  );
}
