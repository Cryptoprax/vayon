"use client";
import { useLinkStatus } from "next/link";

// Inline feedback while a clicked <Link> waits for its destination (a not-yet-prefetched dynamic page).
// Always rendered and toggled by opacity, so it never shifts layout; place inside a `relative` Link.
export function LinkPendingHint() {
  const { pending } = useLinkStatus();
  return <span aria-hidden="true" data-pending={pending ? "true" : undefined} className={`pointer-events-none absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-vds-primary transition-opacity duration-150 ${pending ? "animate-pulse opacity-100" : "opacity-0"}`}/>;
}
