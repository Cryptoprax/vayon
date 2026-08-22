"use client";
import { useEffect } from "react";
import { readConsent } from "./ConsentManager";
import type { ProductEvent } from "@/features/platform/product-intelligence/contracts";

const routeEvents: readonly [RegExp, string, string][] = [
  [/\/vayon\/ai\//, "ai_workforce_used", "ai-workforce"],
  [/\/vayon\/(crm|leads|deals)/, "crm_used", "crm"],
  [/\/vayon\/properties/, "crm_used", "inventory"],
  [/\/vayon\/knowledge/, "knowledge_used", "knowledge"],
  [/\/vayon\/workflows/, "workflow_used", "workflow"],
  [/\/vayon\/notifications/, "notifications_used", "notifications"],
  [/\/vayon\/email/, "email_used", "email"],
  [/\/vayon\/(home|dashboard)/, "executive_dashboard_used", "dashboard"],
  [/marketing-ai|creative-studio/, "marketing_ai_used", "marketing"],
  [/sales-ai/, "sales_ai_used", "sales-ai"],
  [/whatsapp/, "whatsapp_ai_used", "whatsapp"],
];

export function ProductAnalytics() {
  useEffect(() => {
    if (!readConsent()?.analytics) return;
    const match = routeEvents.find(([pattern]) =>
      pattern.test(location.pathname),
    );
    const productModule =
      match?.[2] ?? location.pathname.split("/").filter(Boolean)[1] ?? "app";
    const key = "vayon-product-analytics-session",
      anonymousSessionId = sessionStorage.getItem(key) ?? crypto.randomUUID(),
      started = performance.now(),
      queue: ProductEvent[] = [];
    sessionStorage.setItem(key, anonymousSessionId);
    const add = (event: Omit<ProductEvent, "anonymousSessionId">) => {
        if (queue.length < 50) queue.push({ ...event, anonymousSessionId });
      },
      flush = () => {
        if (!queue.length) return;
        const batch = queue.splice(0, queue.length);
        navigator.sendBeacon(
          "/api/product-intelligence/events",
          new Blob([JSON.stringify({ events: batch })], {
            type: "application/json",
          }),
        );
        if (match)
          navigator.sendBeacon(
            "/api/analytics/events",
            new Blob(
              [
                JSON.stringify({
                  name: match[1],
                  path: location.pathname,
                  durationMs: Math.round(performance.now() - started),
                  metadata: { anonymousUser: anonymousSessionId },
                }),
              ],
              { type: "application/json" },
            ),
          );
      },
      custom = (raw: Event) => {
        const detail = (
          raw as CustomEvent<Omit<ProductEvent, "anonymousSessionId">>
        ).detail;
        if (detail?.name) add(detail);
      };
    add({
      name: "page_viewed",
      module: productModule,
      path: location.pathname,
    });
    add({
      name: "feature_opened",
      module: productModule,
      path: location.pathname,
    });
    const timer = window.setInterval(flush, 10000);
    addEventListener("vayon:product-event", custom);
    addEventListener("pagehide", flush, { once: true });
    return () => {
      add({
        name: "page_viewed",
        module: productModule,
        path: location.pathname,
        durationMs: Math.round(performance.now() - started),
      });
      flush();
      clearInterval(timer);
      removeEventListener("vayon:product-event", custom);
      removeEventListener("pagehide", flush);
    };
  }, []);
  return null;
}
