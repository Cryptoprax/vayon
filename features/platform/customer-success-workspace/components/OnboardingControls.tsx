"use client";

import { useState, useTransition } from "react";
import { Check, LoaderCircle, Sparkles } from "lucide-react";
import { Button } from "@/features/platform/design-system";
import {
  completeCustomerSuccessTaskAction,
  configureCustomerAIAction,
} from "../actions/customer-success.actions";

const employees = [
  "Marketing AI",
  "Sales AI",
  "Customer Success AI",
  "Creative AI",
  "Knowledge AI",
] as const;

export function ChecklistAction({ step }: { step: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="control"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(() => completeCustomerSuccessTaskAction(step))
      }
    >
      {pending ? (
        <LoaderCircle className="mr-1 size-3 animate-spin" aria-hidden="true" />
      ) : (
        <Check className="mr-1 size-3" aria-hidden="true" />
      )}
      Mark complete
    </Button>
  );
}

export function AISetupWizard({ canConfigure }: { canConfigure: boolean }) {
  const [selected, setSelected] = useState<readonly string[]>(employees),
    [pending, startTransition] = useTransition(),
    [saved, setSaved] = useState(false);
  return (
    <section
      className="rounded-3xl border border-vds-border bg-vds-surface p-5"
      aria-labelledby="ai-setup-title"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-vds-primary">
        Suggested defaults
      </p>
      <h2
        className="mt-2 flex items-center gap-2 font-semibold"
        id="ai-setup-title"
      >
        <Sparkles className="size-4" aria-hidden="true" />
        AI setup wizard
      </h2>
      <p className="mt-2 text-xs leading-5 text-vds-muted">
        Choose governed, recommendation-only AI employees. Provider credentials
        are not required to complete setup.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {employees.map((employee) => (
          <label
            className="flex items-center gap-2 rounded-xl border border-vds-border p-3 text-sm"
            key={employee}
          >
            <input
              type="checkbox"
              checked={selected.includes(employee)}
              disabled={!canConfigure || pending}
              onChange={(event) =>
                setSelected((current) =>
                  event.target.checked
                    ? [...current, employee]
                    : current.filter((item) => item !== employee),
                )
              }
            />
            {employee}
          </label>
        ))}
      </div>
      <Button
        className="mt-4"
        disabled={!canConfigure || pending || !selected.length}
        onClick={() =>
          startTransition(async () => {
            await configureCustomerAIAction(selected);
            setSaved(true);
          })
        }
      >
        {pending ? "Saving…" : "Save AI setup"}
      </Button>
      {!canConfigure && (
        <p className="mt-3 text-xs text-vds-warning">
          Organization Owner or Administrator access is required to configure
          AI.
        </p>
      )}
      {saved && (
        <p className="mt-3 text-xs text-vds-success" role="status">
          AI onboarding preferences saved.
        </p>
      )}
    </section>
  );
}
