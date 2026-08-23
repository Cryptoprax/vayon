"use client";

import type { FounderChart } from "../types";

export default function FounderCharts({ charts }: { charts: readonly FounderChart[] }) {
  return <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{charts.map((chart) => <ChartCard chart={chart} key={chart.id}/>)}</div>;
}

function ChartCard({ chart }: { chart: FounderChart }) {
  const values = chart.points.map((point) => point.value), maximum = Math.max(...values, 1), minimum = Math.min(...values, 0), span = Math.max(maximum - minimum, 1);
  const points = chart.points.map((point, index) => `${chart.points.length === 1 ? 50 : index / (chart.points.length - 1) * 100},${92 - (point.value - minimum) / span * 78}`).join(" ");
  return <article className="min-h-64 rounded-3xl border border-vds-border/70 bg-vds-surface/70 p-5 shadow-xl shadow-vds-shadow/10 backdrop-blur-xl"><div className="flex items-center justify-between"><h3 className="capitalize font-medium">{chart.label}</h3><span className="text-[10px] uppercase tracking-[.16em] text-vds-subtle">{chart.unit}</span></div>{chart.points.length ? <><svg className="mt-6 h-36 w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`${chart.label} trend`}><defs><linearGradient id={`fill-${chart.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--vds-color-primary)" stopOpacity=".32"/><stop offset="1" stopColor="var(--vds-color-primary)" stopOpacity="0"/></linearGradient></defs><polygon points={`0,100 ${points} 100,100`} fill={`url(#fill-${chart.id})`}/><polyline points={points} fill="none" stroke="var(--vds-color-primary)" strokeWidth="2" vectorEffect="non-scaling-stroke"/></svg><div className="mt-3 flex justify-between text-[10px] text-vds-subtle"><span>{chart.points[0]?.label}</span><span>{chart.points.at(-1)?.label}</span></div></> : <div className="mt-6 flex h-36 items-center justify-center rounded-2xl border border-dashed border-vds-border text-sm text-vds-muted">No authoritative trend data</div>}</article>;
}
