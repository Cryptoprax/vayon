"use client";

import { Download, Printer } from "lucide-react";
import { Button } from "@/features/platform/design-system";
import type { FounderKpi } from "../types";

export function FounderReportExports({ title, generatedAt, kpis, reports }: { title: string; generatedAt: string; kpis: readonly FounderKpi[]; reports: readonly { id: string; label: string; formats: readonly ["PDF", "PowerPoint"] }[] }) {
  function powerpoint(label: string) { const rows = kpis.map((item) => `<tr><td>${escapeHtml(item.label)}</td><td>${item.value ?? "Unavailable"}</td><td>${escapeHtml(item.unit)}</td></tr>`).join(""); const html = `<html><head><meta charset="utf-8"><title>${escapeHtml(label)}</title></head><body><h1>VAYON ${escapeHtml(title)} — ${escapeHtml(label)}</h1><p>Generated ${escapeHtml(generatedAt)}</p><table>${rows}</table><p>AI recommendations require human review and approval.</p></body></html>`; download(`${label.toLowerCase().replaceAll(" ", "-")}.ppt`, html, "application/vnd.ms-powerpoint"); }
  return <div className="grid gap-3 md:grid-cols-3">{reports.map((report) => <article className="rounded-2xl border border-vds-border bg-vds-elevated/60 p-4" key={report.id}><h3 className="font-medium">{report.label}</h3><p className="mt-1 text-xs text-vds-muted">Measured snapshot · {report.formats.join(" · ")}</p><div className="mt-4 flex gap-2"><Button variant="control" size="sm" onClick={() => window.print()}><Printer className="mr-1 size-3.5" aria-hidden="true"/>PDF</Button><Button variant="control" size="sm" onClick={() => powerpoint(report.label)}><Download className="mr-1 size-3.5" aria-hidden="true"/>PowerPoint</Button></div></article>)}</div>;
}
function download(name: string, content: string, type: string) { const url = URL.createObjectURL(new Blob([content], { type })), anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url); }
function escapeHtml(value: string) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
