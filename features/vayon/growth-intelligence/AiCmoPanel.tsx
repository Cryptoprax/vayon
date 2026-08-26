"use client";

import { useState } from "react";
import { Bot, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/features/platform/design-system";

const responsibilities = ["Marketing strategy", "Campaign planning", "Content planning", "Brand consistency", "Channel recommendations", "Launch planning", "Community recommendations", "Investor visibility"];

export function AiCmoPanel() {
  const [brief, setBrief] = useState("");
  const [prepared, setPrepared] = useState(false);
  return <aside className="rounded-3xl border border-vds-accent-border bg-vds-surface p-5 shadow-vds-sm lg:sticky lg:top-20" aria-labelledby="ai-cmo-title">
    <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-vds-primary-soft text-vds-primary"><Bot className="size-5" aria-hidden="true" /></span><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-vds-primary">Persistent advisor</p><h2 id="ai-cmo-title" className="mt-1 text-lg font-semibold">Chief Marketing Officer</h2></div></div>
    <p className="mt-4 text-sm leading-6 text-vds-muted">Turn an objective into a review-ready marketing brief. This workspace prepares recommendations only.</p>
    <label className="mt-4 block text-sm font-medium" htmlFor="cmo-brief">What are you planning?</label><textarea id="cmo-brief" value={brief} onChange={(event) => { setBrief(event.target.value); setPrepared(false); }} className="vds-focus mt-2 min-h-24 w-full rounded-xl border border-vds-border bg-vds-input p-3 text-sm" placeholder="Example: Prepare a product launch for operations leaders" />
    <Button className="mt-3" fullWidth disabled={!brief.trim()} onClick={() => setPrepared(true)}>Prepare recommendation</Button>
    {prepared && <div role="status" className="mt-4 rounded-2xl border border-vds-success bg-vds-success-soft p-3 text-sm text-vds-success"><Check className="mr-2 inline size-4" aria-hidden="true" />Brief prepared for your review. No content was published.</div>}
    <details className="mt-4"><summary className="vds-focus cursor-pointer rounded-lg text-sm font-medium">CMO responsibilities</summary><ul className="mt-3 grid gap-2">{responsibilities.map((item) => <li key={item} className="flex items-center gap-2 text-xs text-vds-muted"><Check className="size-3 text-vds-success" aria-hidden="true" />{item}</li>)}</ul></details>
    <p className="mt-4 flex items-center gap-2 border-t border-vds-divider pt-4 text-xs text-vds-muted"><ShieldCheck className="size-4 text-vds-success" aria-hidden="true" />Never auto-publishes. You approve every external action.</p>
  </aside>;
}
