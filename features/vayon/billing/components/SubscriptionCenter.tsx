"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { subscriptionMessage, type SubscriptionWriteDecision } from "../services/subscription-write-contract";
import { Button } from "@/features/platform/design-system";
import { CommercialPlans } from "./CommercialPlatform";
import { containDialogFocus } from "./dialog-keyboard";
import type { PublicPaddleCatalogPrice } from "../providers/paddle/paddle-catalog.types";
import type { FoundingMemberAvailability } from "../services/founding-member.types";
import type { SubscriptionRecord } from "../types";
import { redeemVayon3Day } from "../actions/vayon3day.actions";

export function SubscriptionCenter(props: { catalog: PublicPaddleCatalogPrice[]; organizationId: string; workspaceId: string; clientToken?: string; environment?: "sandbox" | "live"; subscription?: SubscriptionRecord | null; checkoutEnabled?: boolean; founding?: FoundingMemberAvailability; blocked?: SubscriptionWriteDecision }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [redeeming, startRedemption] = useTransition();
  useEffect(() => { if (props.blocked) dialog.current?.showModal(); }, [props.blocked]);
  return <section className="mt-6">
    <div className="flex flex-wrap gap-3">
      <Button variant="primary" onClick={() => dialog.current?.showModal()}>Upgrade Now</Button>
      <Button className="min-h-11 rounded-xl border border-vds-border px-4 py-2" variant="control" onClick={() => dialog.current?.showModal()}>Compare Plans</Button>
    </div>
    <p role="status" className="mt-3 text-sm">{message}</p>
    <dialog ref={dialog} onKeyDown={containDialogFocus} aria-labelledby="subscription-center-title" className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-6xl overflow-y-auto rounded-2xl border border-vds-border bg-vds-surface p-5 text-vds-foreground backdrop:bg-vds-overlay sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4"><h2 id="subscription-center-title" className="text-xl font-semibold">Subscription Center</h2><Button className="min-h-11 rounded-xl border border-vds-border px-4 py-2" variant="control" onClick={() => dialog.current?.close()} aria-label="Close subscription center">Dismiss</Button></div>
      {props.blocked && <p role="status" className="mt-4 text-sm">{subscriptionMessage(props.blocked)}</p>}
      <form className="mt-6 rounded-2xl border border-vds-border bg-vds-elevated p-4" onSubmit={(event) => { event.preventDefault(); startRedemption(async () => { const result = await redeemVayon3Day(accessCode); if (result.ok) { setMessage("Your 3-day access is active. Opening your workspace…"); router.refresh(); router.push("/vayon/dashboard"); return; } const messages: Record<string,string> = { INVALID_CODE: "That access code is not valid.", ALREADY_USED: "This access code has already been used for this account.", PAID_SUBSCRIPTION: "Your workspace already has an active paid subscription.", LEGACY_TRIAL_USED: "This workspace has already used its trial access.", SUBSCRIPTION_UNVERIFIED: "We could not confirm your workspace subscription.", UNAVAILABLE: "We could not activate access right now. Please try again." }; setMessage(messages[result.code]); }); }}>
        <label htmlFor="vayon3day-code" className="font-semibold">Use 3-Day Access Code</label><p className="mt-1 text-sm text-vds-muted">Enter your access code to start one three-day VAYON trial.</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row"><input id="vayon3day-code" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} className="min-h-11 flex-1 rounded-xl border border-vds-border bg-vds-surface px-3" autoComplete="off" placeholder="Access code" aria-describedby="vayon3day-status"/><Button type="submit" variant="control" disabled={redeeming}>{redeeming ? "Activating…" : "Activate access"}</Button></div>
        <p id="vayon3day-status" role="status" className="mt-3 text-sm text-vds-muted">{message}</p>
      </form>
      <CommercialPlans {...props} onMessage={setMessage} onCheckout={() => dialog.current?.close()}/>
    </dialog>
  </section>;
}
