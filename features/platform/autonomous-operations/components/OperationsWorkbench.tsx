"use client";
import { useMemo, useState } from "react";
import { Button } from "@/features/platform/design-system";
export function OperationsWorkbench({ baseMrr }: { baseMrr: number | null }) {
  const [title, setTitle] = useState(""),
    [objectives, setObjectives] = useState<readonly string[]>([]),
    [conversion, setConversion] = useState(5),
    [churn, setChurn] = useState(2),
    simulation = useMemo(
      () =>
        baseMrr === null
          ? null
          : {
              projectedMrr:
                baseMrr * (1 + conversion / 100) * (1 - churn / 100),
              change:
                baseMrr * ((1 + conversion / 100) * (1 - churn / 100) - 1),
            },
      [baseMrr, conversion, churn],
    );
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-3xl border border-vds-border bg-vds-surface p-5">
        <h3 className="font-semibold">Define a session objective</h3>
        <p className="mt-1 text-xs text-vds-muted">
          Uses the existing cognitive goal semantics. Production data is not
          changed.
        </p>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const next = title.trim();
            if (next) setObjectives((items) => [...items, next].slice(-8));
            setTitle("");
          }}
        >
          <label className="sr-only" htmlFor="objective-title">
            Objective
          </label>
          <input
            id="objective-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            placeholder="Define a measurable business objective"
            className="h-11 min-w-0 flex-1 rounded-xl border border-vds-border bg-vds-input px-3"
          />
          <Button type="submit">Add</Button>
        </form>
        <ul className="mt-4 space-y-2">
          {objectives.map((item, index) => (
            <li
              className="rounded-xl bg-vds-elevated p-3 text-sm"
              key={`${item}-${index}`}
            >
              {item}
              <span className="mt-1 block text-[10px] uppercase text-vds-primary">
                Planning session · not persisted
              </span>
            </li>
          ))}
          {!objectives.length && (
            <li className="py-8 text-center text-sm text-vds-muted">
              No session objectives added.
            </li>
          )}
        </ul>
      </section>
      <section className="rounded-3xl border border-vds-accent-border bg-vds-surface p-5">
        <p className="text-[10px] font-semibold uppercase text-vds-primary">
          Simulation only · no production writes
        </p>
        <h3 className="mt-2 font-semibold">MRR scenario explorer</h3>
        <label className="mt-5 block text-xs text-vds-muted">
          Conversion improvement: {conversion}%
          <input
            type="range"
            min="0"
            max="30"
            value={conversion}
            onChange={(event) => setConversion(Number(event.target.value))}
            className="mt-2 w-full"
          />
        </label>
        <label className="mt-4 block text-xs text-vds-muted">
          Churn assumption: {churn}%
          <input
            type="range"
            min="0"
            max="20"
            value={churn}
            onChange={(event) => setChurn(Number(event.target.value))}
            className="mt-2 w-full"
          />
        </label>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Metric
            label="Projected MRR"
            value={
              simulation
                ? simulation.projectedMrr.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })
                : "Unavailable"
            }
          />
          <Metric
            label="Estimated change"
            value={
              simulation
                ? simulation.change.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })
                : "Unavailable"
            }
          />
        </div>
        <p className="mt-4 text-xs leading-5 text-vds-muted">
          Projection applies selected conversion and churn assumptions to
          current authoritative MRR. It is not a forecast or guarantee.
        </p>
      </section>
    </div>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-vds-elevated p-3">
      <p className="text-[10px] uppercase text-vds-subtle">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}
