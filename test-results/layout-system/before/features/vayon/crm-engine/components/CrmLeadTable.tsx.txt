"use client";
import { useMemo, useState } from "react";
import { Button } from "@/features/platform/design-system";
import type { CrmLeadRow } from "../domain/contracts";
const columns = [
  "name",
  "phone",
  "email",
  "budget",
  "source",
  "priority",
  "status",
  "agent",
  "interest",
  "activity",
  "score",
] as const;
export function CrmLeadTable({ items }: { items: readonly CrmLeadRow[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [visible, setVisible] = useState<readonly string[]>(columns);
  const all = items.length > 0 && selected.length === items.length;
  const csv = useMemo(
    () =>
      [
        "Name,Phone,Email,Budget,Source,Priority,Status,Agent,Interest,Score",
        ...items.map((x) =>
          [
            x.name,
            x.phone,
            x.email ?? "",
            x.budgetLabel,
            x.source,
            x.priority,
            x.status,
            x.assignedAgent,
            x.propertyInterest,
            x.aiScore ?? "",
          ]
            .map((v) => `"${String(v).replaceAll('"', '""')}"`)
            .join(","),
        ),
      ].join("\n"),
    [items],
  );
  const exportCsv = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "vayon-crm-leads.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-vds-muted">
          {selected.length} selected
        </span>
        <details className="relative">
          <summary className="vds-focus cursor-pointer rounded-xl border border-vds-border px-3 py-2 text-xs">
            Columns
          </summary>
          <div className="absolute z-20 mt-2 grid min-w-44 gap-2 rounded-xl border border-vds-border bg-vds-elevated p-3 shadow-xl">
            {columns.map((c) => (
              <label key={c} className="flex gap-2 text-xs capitalize">
                <input
                  type="checkbox"
                  checked={visible.includes(c)}
                  onChange={() =>
                    setVisible((v) =>
                      v.includes(c) ? v.filter((x) => x !== c) : [...v, c],
                    )
                  }
                />
                {c}
              </label>
            ))}
          </div>
        </details>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-vds-border">
        <table className="min-w-[1100px] w-full text-left text-sm">
          <thead className="bg-vds-elevated text-xs uppercase text-vds-muted">
            <tr>
              <th className="p-3">
                <input
                  aria-label="Select all leads"
                  type="checkbox"
                  checked={all}
                  onChange={() =>
                    setSelected(all ? [] : items.map((x) => x.id))
                  }
                />
              </th>
              {columns
                .filter((c) => visible.includes(c))
                .map((c) => (
                  <th key={c} className="p-3">
                    {c}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-vds-border">
            {items.map((x) => (
              <tr key={x.id} className="hover:bg-vds-hover">
                <td className="p-3">
                  <input
                    aria-label={`Select ${x.name}`}
                    type="checkbox"
                    checked={selected.includes(x.id)}
                    onChange={() =>
                      setSelected((v) =>
                        v.includes(x.id)
                          ? v.filter((id) => id !== x.id)
                          : [...v, x.id],
                      )
                    }
                  />
                </td>
                {visible.includes("name") && (
                  <td className="p-3 font-medium">
                    <a
                      className="hover:text-vds-primary"
                      href={`/vayon/crm/leads/${x.id}`}
                    >
                      {x.name}
                    </a>
                  </td>
                )}
                {visible.includes("phone") && (
                  <td className="p-3">{x.phone}</td>
                )}
                {visible.includes("email") && (
                  <td className="p-3">{x.email ?? "—"}</td>
                )}
                {visible.includes("budget") && (
                  <td className="p-3">{x.budgetLabel}</td>
                )}
                {visible.includes("source") && (
                  <td className="p-3">{x.source}</td>
                )}
                {visible.includes("priority") && (
                  <td className="p-3 capitalize">{x.priority}</td>
                )}
                {visible.includes("status") && (
                  <td className="p-3">
                    <span className="rounded-full bg-vds-primary-soft px-2 py-1 text-xs text-vds-primary">
                      {x.status}
                    </span>
                  </td>
                )}
                {visible.includes("agent") && (
                  <td className="p-3">{x.assignedAgent}</td>
                )}
                {visible.includes("interest") && (
                  <td className="p-3">{x.propertyInterest}</td>
                )}
                {visible.includes("activity") && (
                  <td className="p-3">
                    {x.lastActivity
                      ? new Date(x.lastActivity).toLocaleDateString()
                      : "—"}
                  </td>
                )}
                {visible.includes("score") && (
                  <td className="p-3">{x.aiScore ?? "—"}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && (
          <p className="p-12 text-center text-sm text-vds-muted">
            No leads match this view.
          </p>
        )}
      </div>
    </div>
  );
}
