"use client";
import { useState, type ReactNode } from "react";
import { Button, ButtonLink, Dialog } from "@/features/platform/design-system";
import { subscriptionEntitlementCatalog } from "../config/entitlements";
import type { EntitlementDecision } from "../services/entitlement-policy";

export function EntitlementGate({ decision, children, mode = "upgrade" }: { readonly decision: EntitlementDecision; readonly children: ReactNode; readonly mode?: "hide" | "disable" | "upgrade" }) {
  const [open, setOpen] = useState(false);
  if (decision.allowed) return children;
  if (mode === "hide") return null;
  if (mode === "disable") return <span className="pointer-events-none opacity-50" aria-disabled="true" title={decision.reason}>{children}</span>;
  return <><Button variant="control" onClick={() => setOpen(true)} aria-haspopup="dialog">{children}</Button>{open && <UpgradeDialog decision={decision} onClose={() => setOpen(false)} />}</>;
}

export function UpgradeDialog({ decision, onClose }: { readonly decision: EntitlementDecision; readonly onClose: () => void }) {
  const current = subscriptionEntitlementCatalog[decision.currentPlan], target = decision.targetPlan ? subscriptionEntitlementCatalog[decision.targetPlan] : null;
  return <Dialog open onClose={onClose} title="Upgrade to continue" description={decision.reason}><p className="text-xs font-semibold uppercase tracking-[0.18em] text-vds-primary">Plan entitlement</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><PlanSummary label="Current plan" name={current.name} detail={current.audience}/><PlanSummary label="Recommended plan" name={target?.name ?? "Contact sales"} detail={target?.audience ?? "A tailored entitlement package"}/></div><div className="mt-6 flex flex-wrap justify-end gap-3"><Button variant="control" onClick={onClose}>Not now</Button><ButtonLink href="/vayon/settings/subscription" variant="primary">Compare plans</ButtonLink></div></Dialog>;
}
function PlanSummary({ label, name, detail }: { readonly label: string; readonly name: string; readonly detail: string }) { return <article className="rounded-2xl border border-vds-border bg-vds-surface-raised p-4"><p className="text-xs uppercase text-vds-muted">{label}</p><p className="mt-2 font-semibold">{name}</p><p className="mt-1 text-xs text-vds-muted">{detail}</p></article>; }
