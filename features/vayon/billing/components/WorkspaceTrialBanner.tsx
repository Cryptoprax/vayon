"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { trialState, workspaceTrialLimits } from "../config/trial";
import type { WorkspaceTrialSnapshot } from "../services/workspace-trial";

export function WorkspaceTrialBanner({ snapshot, canOpenBilling = true }: { snapshot: WorkspaceTrialSnapshot | null; canOpenBilling?: boolean }) {
  const [now, setNow] = useState<number | undefined>(undefined);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const state = trialState(snapshot?.status, snapshot?.endsAt, now, snapshot?.source === "vayon3day" ? snapshot.redeemedAt : null);
  if (!snapshot || !state.trial) return null;
  const title = snapshot.source === "vayon3day" && state.day && state.totalDays ? `Trial Day ${state.day} of ${state.totalDays}` : `Trial active · ${state.daysRemaining} day${state.daysRemaining === 1 ? "" : "s"} remaining`;
  return <aside aria-label="Workspace trial" className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-vds-border bg-vds-elevated p-4 text-sm">
    <div><p className="font-semibold">{title}</p><p className="mt-1 text-vds-muted">Upgrade before your trial ends. No credit card required for your trial.</p><ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">{Object.entries(workspaceTrialLimits).map(([key, limit]) => <li key={key} className="capitalize">{key === "members" ? "Additional team members" : key} {snapshot.usage[key as keyof typeof snapshot.usage] ?? "Checking"} / {limit}</li>)}</ul></div>{canOpenBilling ? <Link href="/vayon/settings/billing" className="vds-focus rounded-xl bg-vds-primary px-4 py-3 font-semibold text-vds-on-accent">Upgrade Now</Link> : <p className="text-vds-muted">Ask your workspace owner to upgrade.</p>}
  </aside>;
}
