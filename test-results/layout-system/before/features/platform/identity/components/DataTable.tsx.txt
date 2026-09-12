import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  id: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  rows: T[];
  columns: DataTableColumn<T>[];
  getRowKey: (row: T) => string;
  caption: string;
  toolbar?: ReactNode;
  emptyState?: ReactNode;
}

export function DataTable<T>({
  rows,
  columns,
  getRowKey,
  caption,
  toolbar,
  emptyState,
}: DataTableProps<T>) {
  return (
    <section className="overflow-hidden rounded-2xl border border-vds-border/[0.08] bg-vds-surface/[0.02]">
      {toolbar}
      {rows.length === 0 ? (
        emptyState
      ) : (
        <div className="overflow-x-auto [scrollbar-color:var(--vds-color-border)_transparent] [scrollbar-width:thin]">
          <table className="w-full min-w-max border-collapse text-left">
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr className="border-b border-vds-border/[0.07] bg-vds-surface/[0.018]">
                {columns.map((column) => (
                  <th
                    key={column.id}
                    scope="col"
                    className={`px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-vds-subtle ${column.className ?? ""}`}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-vds-divider/[0.055]">
              {rows.map((row) => (
                <tr
                  key={getRowKey(row)}
                  className="group transition hover:bg-vds-surface/[0.025]"
                >
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={`whitespace-nowrap px-4 py-3.5 text-xs text-vds-muted ${column.className ?? ""}`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
