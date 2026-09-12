"use client";

import { useEffect, useRef, useState } from "react";
import { subscriptionMessage, type SubscriptionWriteDecision } from "../services/subscription-write-contract";
import { Button } from "@/features/platform/design-system";
import { CommercialPlans } from "./CommercialPlatform";
import { containDialogFocus } from "./dialog-keyboard";
import type { PaddleCatalogPrice } from "../providers/paddle/paddle-catalog.types";

export function SubscriptionCenter(props: { catalog: PaddleCatalogPrice[]; organizationId: string; workspaceId: string; clientToken?: string; environment?: "sandbox" | "live"; subscribed?: boolean; blocked?: SubscriptionWriteDecision }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState("");
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
      <CommercialPlans {...props} onMessage={setMessage} onCheckout={() => dialog.current?.close()}/>
    </dialog>
  </section>;
}
