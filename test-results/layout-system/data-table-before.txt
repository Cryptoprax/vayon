"use client";
import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  Rows3,
} from "lucide-react";
import { Button, IconButton } from "../core/Actions";
import { Card } from "../core/Surfaces";
import { SearchInput } from "../forms/Fields";
export interface DataColumn<T> {
  readonly id: string;
  readonly header: string;
  readonly cell: (row: T) => ReactNode;
  readonly align?: "left" | "center" | "right";
}
const alignments = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption = "Data table",
  selectable = true,
}: {
  readonly columns: readonly DataColumn<T>[];
  readonly rows: readonly T[];
  readonly rowKey: (row: T) => string;
  readonly caption?: string;
  readonly selectable?: boolean;
}) {
  const [density, setDensity] = useState<"compact" | "comfortable">(
      "comfortable",
    ),
    [visible, setVisible] = useState(
      () => new Set(columns.map((column) => column.id)),
    ),
    [selected, setSelected] = useState<Set<string>>(() => new Set()),
    [widths, setWidths] = useState<Record<string, number>>({});
  const rowRefs = useRef(new Map<string, HTMLTableRowElement | null>()),
    shown = useMemo(
      () => columns.filter((column) => visible.has(column.id)),
      [columns, visible],
    ),
    keys = useMemo(() => rows.map(rowKey), [rowKey, rows]);
  const toggleAll = () =>
    setSelected((value) =>
      value.size === keys.length ? new Set() : new Set(keys),
    );
  const toggleRow = (key: string) =>
    setSelected((value) => {
      const next = new Set(value);
      if (next.has(key))
        return new Set([...next].filter((value) => value !== key));
      next.add(key);
      return next;
    });
  const exportRows = () => {
    const quote = (value: string) => `"${value.replaceAll('"', '""')}"`,
      body = [
        shown.map((column) => quote(column.header)).join(","),
        ...rows.map((row) =>
          shown
            .map((column) => quote(String(column.cell(row) ?? "")))
            .join(","),
        ),
      ].join("\n"),
      link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([body], { type: "text/csv;charset=utf-8" }),
    );
    link.download = `${caption.toLocaleLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const resize = (id: string, event: React.PointerEvent) => {
    const start = event.clientX,
      current = widths[id] ?? 180;
    const move = (next: PointerEvent) =>
      setWidths((value) => ({
        ...value,
        [id]: Math.max(120, current + next.clientX - start),
      }));
    const done = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", done);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", done);
  };
  const rowKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const target =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? keys.length - 1
          : Math.max(
              0,
              Math.min(
                keys.length - 1,
                index + (event.key === "ArrowDown" ? 1 : -1),
              ),
            );
    rowRefs.current.get(keys[target])?.focus();
  };
  return (
    <section aria-label={`${caption} controls`} className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setDensity((value) =>
              value === "compact" ? "comfortable" : "compact",
            )
          }
          aria-label={`Use ${density === "compact" ? "comfortable" : "compact"} table density`}
        >
          <Rows3 className="size-4" aria-hidden="true" />
          {density}
        </Button>
        <details className="relative">
          <summary className="vds-focus inline-flex h-11 cursor-pointer list-none items-center gap-2 rounded-xl border border-vds-border-strong px-3 text-xs font-semibold">
            <Columns3 className="size-4" aria-hidden="true" />
            Columns
          </summary>
          <fieldset className="absolute right-0 z-30 mt-2 min-w-52 space-y-2 rounded-xl border border-vds-border bg-vds-surface p-3 shadow-xl">
            <legend className="sr-only">Visible columns</legend>
            {columns.map((column) => (
              <label
                key={column.id}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={visible.has(column.id)}
                  onChange={() =>
                    setVisible((value) => {
                      const next = new Set(value);
                      if (next.has(column.id) && next.size > 1)
                        return new Set(
                          [...next].filter((value) => value !== column.id),
                        );
                      next.add(column.id);
                      return next;
                    })
                  }
                />
                {column.header}
              </label>
            ))}
          </fieldset>
        </details>
        <Button variant="outline" size="sm" onClick={exportRows}>
          <Download className="size-4" aria-hidden="true" />
          Export CSV
        </Button>
      </div>
      <div className="max-w-full overflow-x-auto rounded-2xl border border-[var(--vds-color-border)]">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 z-10 bg-vds-elevated text-left text-xs uppercase tracking-wide text-[var(--vds-color-muted)]">
            <tr>
              {selectable && (
                <th scope="col" className="w-12 px-4">
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={keys.length > 0 && selected.size === keys.length}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {shown.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  style={{ width: widths[column.id] }}
                  className={`relative h-11 px-4 py-3 font-semibold ${alignments[column.align ?? "left"]}`}
                >
                  {column.header}
                  <Button
                    variant="control"
                    aria-label={`Resize ${column.header} column`}
                    onPointerDown={(event) => resize(column.id, event)}
                    className="absolute inset-y-0 right-0 w-2 cursor-col-resize touch-none border-r border-transparent hover:border-vds-primary"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const key = rowKey(row);
              return (
                <tr
                  key={key}
                  ref={(node) => {
                    rowRefs.current.set(key, node);
                  }}
                  tabIndex={0}
                  aria-selected={selected.has(key)}
                  onKeyDown={(event) => rowKeyDown(event, index)}
                  className="border-t border-[var(--vds-color-border)] transition-colors hover:bg-vds-hover focus:bg-vds-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-vds-focus aria-selected:bg-vds-primary-soft"
                >
                  {selectable && (
                    <td className="w-12 px-4">
                      <input
                        type="checkbox"
                        aria-label={`Select row ${index + 1}`}
                        checked={selected.has(key)}
                        onChange={() => toggleRow(key)}
                      />
                    </td>
                  )}
                  {shown.map((column) => (
                    <td
                      key={column.id}
                      className={`${density === "compact" ? "px-4 py-2" : "px-4 py-3.5"} ${alignments[column.align ?? "left"]}`}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && (
          <div role="status" className="grid min-h-40 place-items-center p-8 text-center">
            <div>
              <span aria-hidden="true" className="mx-auto grid size-10 place-items-center rounded-xl bg-vds-primary-soft text-vds-primary">⌁</span>
              <p className="mt-3 text-sm font-medium">No rows available</p>
              <p className="mt-1 text-xs text-vds-muted">Adjust your filters or add the first record.</p>
            </div>
          </div>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {selected.size} rows selected
      </p>
    </section>
  );
}
export function VirtualTable<T>({
  rows,
  columns,
  rowKey,
  start = 0,
  visibleCount = 30,
  caption,
}: {
  readonly rows: readonly T[];
  readonly columns: readonly DataColumn<T>[];
  readonly rowKey: (row: T) => string;
  readonly start?: number;
  readonly visibleCount?: number;
  readonly caption?: string;
}) {
  return (
    <div
      aria-label="Virtualized table viewport"
      className="max-h-[32rem] overflow-auto"
    >
      <DataTable
        rows={rows.slice(start, start + visibleCount)}
        columns={columns}
        rowKey={rowKey}
        caption={caption}
      />
    </div>
  );
}
export function StatCards({
  items,
}: {
  readonly items: readonly {
    readonly id: string;
    readonly label: string;
    readonly value?: string;
    readonly description?: string;
  }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.id}>
          <p className="text-xs text-[var(--vds-color-muted)]">{item.label}</p>
          <p className="mt-3 text-2xl font-semibold">{item.value ?? "—"}</p>
          {item.description && (
            <p className="mt-2 text-xs text-[var(--vds-color-subtle)]">
              {item.description}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
export function ChartPlaceholder({
  title,
  description = "Awaiting connected business data.",
}: {
  readonly title: string;
  readonly description?: string;
}) {
  return (
    <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-[var(--vds-color-border)] bg-vds-surface/[.015] p-6 text-center">
      <div>
        <span className="mx-auto grid size-10 place-items-center rounded-xl bg-vds-surface/[.04] text-[var(--vds-color-muted)]">
          ⌁
        </span>
        <h3 className="mt-4 font-medium">{title}</h3>
        <p className="mt-2 text-sm text-[var(--vds-color-muted)]">
          {description}
        </p>
      </div>
    </div>
  );
}
export function Filters({
  children,
  onClear,
}: {
  readonly children: ReactNode;
  readonly onClear?: () => void;
}) {
  return (
    <section
      aria-label="Filters"
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--vds-color-border)] bg-vds-surface/[.02] p-4"
    >
      <div className="flex min-w-0 flex-1 flex-wrap gap-3">{children}</div>
      {onClear && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </section>
  );
}
export function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  readonly page: number;
  readonly pageCount: number;
  readonly onPageChange: (page: number) => void;
}) {
  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3"
    >
      <IconButton
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="size-4" />
      </IconButton>
      <span className="text-sm text-[var(--vds-color-muted)]">
        Page {page} of {pageCount}
      </span>
      <IconButton
        aria-label="Next page"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight className="size-4" />
      </IconButton>
    </nav>
  );
}
export function SearchToolbar({
  value,
  onChange,
  actions,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <SearchInput
          aria-label="Search table"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search…"
        />
      </div>
      {actions}
    </div>
  );
}
