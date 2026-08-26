import Link from "next/link";
import {
  Bot,
  Building2,
  CalendarDays,
  CircleDollarSign,
  ListChecks,
  Target,
  TrendingDown,
  TrendingUp,
  UserRoundPlus,
} from "lucide-react";
import type { DashboardIcon, KpiMetric } from "../types";
import { Sparkline } from "./Sparkline";

const icons: Record<DashboardIcon, typeof Target> = {
  leads: UserRoundPlus,
  deals: Target,
  pipeline: TrendingUp,
  properties: Building2,
  meetings: CalendarDays,
  tasks: ListChecks,
  ai: Bot,
  revenue: CircleDollarSign,
};
export function KpiCard({ metric }: { metric: KpiMetric }) {
  const Icon = icons[metric.icon],
    positive = metric.trend >= 0;
  return (
    <Link
      href={metric.href}
      aria-label={`${metric.label}: ${metric.displayValue}`}
      className="group focus-ring vds-card-motion relative overflow-hidden rounded-3xl border border-vds-border/[0.075] bg-gradient-to-br from-vds-surface to-vds-surface p-5 shadow-[0_18px_50px_var(--vds-shadow-color)] motion-reduce:transition-none hover:-translate-y-1 hover:border-vds-accent-border hover:shadow-[0_24px_60px_var(--vds-shadow-color)] motion-reduce:transform-none"
    >
      <div className="absolute right-0 top-0 size-24 rounded-full bg-vds-primary/[0.035] blur-2xl transition group-hover:bg-vds-primary/[0.08]" />
      <div className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-2xl border border-vds-border/[0.07] bg-vds-surface/[0.04] text-vds-primary">
          <Icon className="size-5" />
        </span>
        <span
          className={`flex items-center gap-1 text-xs font-medium ${positive ? "text-vds-success" : "text-vds-danger"}`}
        >
          {positive ? (
            <TrendingUp className="size-4" />
          ) : (
            <TrendingDown className="size-4" />
          )}
          <span>{Math.abs(metric.trend)}% <span className="sr-only">against previous period</span></span>
        </span>
      </div>
      <p className="mt-5 text-xs font-medium uppercase tracking-[.14em] text-vds-muted">
        {metric.label}
      </p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-3xl font-semibold tracking-tight text-vds-foreground tabular-nums motion-safe:animate-[vds-fade-rise_300ms_ease-out]">
            {metric.displayValue}
          </p>
          {metric.detail && (
            <p className="mt-1 truncate text-xs capitalize text-vds-subtle">
              {metric.detail}
            </p>
          )}
        </div>
        <Sparkline
          values={metric.sparkline}
          label={`${metric.label} seven-day trend`}
        />
      </div>
    </Link>
  );
}
export function KpiCardSkeleton() {
  return (
    <div className="rounded-3xl border border-vds-border/[0.07] p-5">
      <div className="skeleton size-10 rounded-2xl" />
      <div className="skeleton mt-5 h-3 w-24 rounded" />
      <div className="skeleton mt-3 h-8 w-32 rounded-lg" />
    </div>
  );
}
