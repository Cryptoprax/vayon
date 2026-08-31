"use client";
import { Button } from "@/features/platform/design-system";

import {
  Bot,
  Building2,
  CreditCard,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";

const tabs = ["Platform", "Organizations", "Security", "Billing", "AI"] as const;
type NotificationTab = (typeof tabs)[number];

const tabDetails: Record<
  NotificationTab,
  { title: string; description: string; icon: typeof Bot; tone: string }
> = {
  Platform: {
    title: "Platform services operational",
    description: "All core systems are reporting normal health.",
    icon: Sparkles,
    tone: "text-vds-primary bg-vds-primary-soft",
  },
  Organizations: {
    title: "Organization review ready",
    description: "A workspace configuration is ready for review.",
    icon: Building2,
    tone: "text-vds-accent bg-vds-accent-soft",
  },
  Security: {
    title: "Security posture updated",
    description: "The latest access review has completed.",
    icon: ShieldCheck,
    tone: "text-vds-success bg-vds-success-soft",
  },
  Billing: {
    title: "Billing cycle prepared",
    description: "Subscription summaries are available.",
    icon: CreditCard,
    tone: "text-vds-warning bg-vds-warning-soft",
  },
  AI: {
    title: "AI systems within budget",
    description: "Usage and quality controls are operating normally.",
    icon: Bot,
    tone: "text-vds-accent bg-vds-accent-soft",
  },
};

export interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationCenter({
  open,
  onClose,
}: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<NotificationTab>("Platform");
  const [read, setRead] = useState(false);
  const detail = tabDetails[activeTab];
  const Icon = detail.icon;

  if (!open) return null;

  return (
    <>
      <Button variant="control"
        type="button"
        className="fixed inset-0 z-40 bg-vds-overlay/35 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close notification center"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Notification center"
        className="fixed inset-y-2 right-2 z-50 flex w-[calc(100%-1rem)] max-w-md flex-col overflow-hidden rounded-3xl border border-vds-border bg-[var(--vds-color-surface)]/96 shadow-[0_32px_100px_var(--vds-overlay)] backdrop-blur-2xl sm:inset-y-3 sm:right-3"
      >
        <div className="flex items-center justify-between border-b border-vds-border/[0.07] px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-vds-foreground">Notifications</h2>
            <p className="mt-0.5 text-xs text-vds-subtle">
              Platform activity and attention
            </p>
          </div>
          <Button variant="control"
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-xl text-vds-muted transition hover:bg-vds-surface/[0.06] hover:text-vds-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vds-focus"
            aria-label="Close notification center"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div
          className="flex gap-1 overflow-x-auto border-b border-vds-border/[0.07] px-3 py-2 [scrollbar-width:none]"
          role="tablist"
          aria-label="Notification categories"
        >
          {tabs.map((tab) => (
            <Button variant="control"
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vds-focus ${
                activeTab === tab
                  ? "bg-vds-surface/[0.08] text-vds-foreground"
                  : "text-vds-subtle hover:text-vds-secondary"
              }`}
            >
              {tab}
            </Button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3" role="tabpanel">
          <article className="flex w-full gap-3 rounded-2xl border border-vds-border/[0.07] bg-vds-surface/[0.025] p-4 text-left">
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${detail.tone}`}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-vds-secondary">
                  {detail.title}
                </span>
                {!read&&<span className="size-1.5 shrink-0 rounded-full bg-vds-primary" />}
              </span>
              <span className="mt-1.5 block text-xs leading-5 text-vds-muted">
                {detail.description}
              </span>
              <span className="mt-3 block text-[10px] text-vds-subtle">
                A moment ago
              </span>
            </span>
          </article>
        </div>

        <div className="border-t border-vds-border/[0.07] p-3">
          <Button variant="control"
            type="button"
            onClick={()=>setRead(true)}
            disabled={read}
            className="h-10 w-full rounded-xl text-xs font-medium text-vds-muted transition hover:bg-vds-surface/[0.05] hover:text-vds-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vds-focus"
          >
            {read?"All notifications read":"Mark all as read"}
          </Button>
        </div>
      </section>
    </>
  );
}
