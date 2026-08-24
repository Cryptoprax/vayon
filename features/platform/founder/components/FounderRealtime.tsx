"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const realtimeTables = ["platform_metrics", "organizations", "subscriptions", "billing_events", "invoices", "ai_conversations", "ai_tasks", "ai_runtime_outputs", "workflow_instances", "continuous_learning_jobs", "notification_queue", "support_sessions", "customer_health", "system_alerts", "creative_campaigns", "marketing_events", "marketing_leads", "leads", "deals", "site_visits", "activity_events", "integration_connections", "integration_health", "integration_logs", "integration_retry_queue", "integration_webhooks", "integration_sync_history"] as const;

export function FounderRealtime() {
  const router = useRouter();
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const client = createSupabaseBrowserClient();
    const channel = client.channel("founder-operating-system");
    for (const table of realtimeTables) channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
      if (timeout.current) return;
      timeout.current = setTimeout(() => { timeout.current = null; router.refresh(); }, 1000);
    });
    channel.subscribe();
    return () => { if (timeout.current) clearTimeout(timeout.current); void client.removeChannel(channel); };
  }, [router]);
  return <span className="inline-flex items-center gap-2 text-xs text-vds-muted" aria-live="polite"><span className="size-2 animate-pulse rounded-full bg-vds-success" aria-hidden="true"/>Realtime connected</span>;
}
