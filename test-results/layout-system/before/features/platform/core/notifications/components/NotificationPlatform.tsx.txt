"use client";
import { Button } from "@/features/platform/design-system";

import { useState } from "react";

import {
  notifications,
  notificationTabs,
} from "../config/notifications";
import type { NotificationCategory } from "../types/notification";
import { NotificationCard } from "./NotificationCard";

export function NotificationPlatform() {
  const [activeTab, setActiveTab] =
    useState<NotificationCategory>("Platform");
  const visibleNotifications = notifications.filter(
    (notification) => notification.category === activeTab,
  );

  return (
    <section className="overflow-hidden rounded-3xl border border-vds-border/[0.08] bg-vds-surface/[0.02]">
      <div
        className="flex gap-1 overflow-x-auto border-b border-vds-border/[0.07] p-2 [scrollbar-width:none]"
        role="tablist"
        aria-label="Notification categories"
      >
        {notificationTabs.map((tab) => (
          <Button variant="control"
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 rounded-xl px-3 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vds-focus ${
              activeTab === tab
                ? "bg-vds-surface/[0.08] text-vds-foreground"
                : "text-vds-subtle hover:bg-vds-surface/[0.03] hover:text-vds-secondary"
            }`}
          >
            {tab}
          </Button>
        ))}
      </div>
      <div className="space-y-3 p-3 sm:p-4" role="tabpanel">
        {visibleNotifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
          />
        ))}
      </div>
    </section>
  );
}
