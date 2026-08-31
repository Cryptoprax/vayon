import { Button } from "@/features/platform/design-system";
import { ArrowUpRight, BellRing } from "lucide-react";

import { StatusBadge } from "../../../identity/components/StatusBadge";
import type {
  Notification,
  NotificationPriority,
} from "../types/notification";

const priorityTones: Record<
  NotificationPriority,
  "negative" | "warning" | "info" | "neutral"
> = {
  Critical: "negative",
  High: "warning",
  Normal: "info",
  Low: "neutral",
};

export function NotificationCard({
  notification,
}: {
  notification: Notification;
}) {
  return (
    <article className="flex gap-4 rounded-2xl border border-vds-border/[0.07] bg-vds-surface/[0.025] p-4 transition hover:border-vds-border/[0.12] hover:bg-vds-surface/[0.04]">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-vds-primary/[0.08] text-vds-primary">
        <BellRing className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-vds-secondary">
              {notification.title}
            </h3>
            <p className="mt-1 text-xs leading-5 text-vds-subtle">
              {notification.description}
            </p>
          </div>
          <StatusBadge
            label={notification.priority}
            tone={priorityTones[notification.priority]}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-vds-border/[0.06] pt-3">
          <div className="flex items-center gap-2 text-[10px] text-vds-subtle">
            <span>{notification.source}</span>
            <span>·</span>
            <span>{notification.time}</span>
            <span>·</span>
            <span>{notification.status}</span>
          </div>
          <Button variant="control"
            type="button"
            disabled
            title="No notification destination is configured"
            className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-vds-primary transition hover:text-vds-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vds-focus"
          >
            {notification.action}
            <ArrowUpRight className="size-3" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </article>
  );
}
