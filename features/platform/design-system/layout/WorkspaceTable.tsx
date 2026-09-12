"use client";

import { useEffect, useRef, type TableHTMLAttributes } from "react";

/** A presentation adapter: native cells, controls, forms and event handlers stay intact. */
export function WorkspaceTable({ children, className = "", ...props }: TableHTMLAttributes<HTMLTableElement>) {
  const ref = useRef<HTMLTableElement>(null);
  useEffect(() => {
    const table = ref.current;
    if (!table) return;
    const labelCells = () => {
      const headers = Array.from(table.tHead?.rows[0]?.cells ?? []).map(cell => cell.textContent?.trim() ?? "");
      table.querySelectorAll("thead,tbody,tfoot").forEach(group => group.setAttribute("role", "rowgroup"));
      Array.from(table.rows).forEach(row => {
        row.setAttribute("role", "row");
        let column = 0;
        Array.from(row.cells).forEach(cell => {
          const heading = cell.tagName === "TH";
          cell.setAttribute("role", heading ? (row.parentElement === table.tHead ? "columnheader" : "rowheader") : "cell");
          if (row.parentElement !== table.tHead) cell.dataset.label = cell.colSpan > 1 ? "" : headers[column] ?? "";
          column += cell.colSpan;
        });
      });
    };
    labelCells();
    const observer = new MutationObserver(labelCells);
    observer.observe(table, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);
  return <div className="vds-workspace-table-container"><table {...props} ref={ref} role={props.role ?? "table"} className={`vds-workspace-table ${className}`}>{children}</table></div>;
}
