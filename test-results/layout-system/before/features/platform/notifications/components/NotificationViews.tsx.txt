import Link from "next/link";
import type {
  NotificationPreference,
  PlatformNotification,
} from "../domain/notification";
import { notificationSummary } from "../view-models/notification";
const card =
  "rounded-2xl border border-vds-border bg-vds-surface p-5 shadow-vds-sm";
export function NotificationNav() {
  return (
    <nav
      className="mb-6 flex gap-2 overflow-x-auto"
      aria-label="Notification platform"
    >
      <Link
        className="rounded-full border border-vds-border px-4 py-2 text-sm"
        href="/vayon/notifications"
      >
        Overview
      </Link>
      <Link
        className="rounded-full border border-vds-border px-4 py-2 text-sm"
        href="/vayon/notifications/inbox"
      >
        Inbox
      </Link>
      <Link
        className="rounded-full border border-vds-border px-4 py-2 text-sm"
        href="/vayon/notifications/preferences"
      >
        Preferences
      </Link>
      <Link
        className="rounded-full border border-vds-border px-4 py-2 text-sm"
        href="/vayon/notifications/history"
      >
        History
      </Link>
    </nav>
  );
}
export function NotificationHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header>
      <p className="text-xs uppercase tracking-[.2em] text-vds-primary">
        Notification platform
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm text-vds-muted">{description}</p>
    </header>
  );
}
export function Inbox({ items }: { items: readonly PlatformNotification[] }) {
  const s = notificationSummary(items);
  return (
    <>
      <section className="mt-6 grid gap-3 sm:grid-cols-4">
        {Object.entries(s).map(([l, v]) => (
          <article className={card} key={l}>
            <p className="text-xs capitalize text-vds-muted">{l}</p>
            <p className="mt-2 text-2xl font-semibold">{v}</p>
          </article>
        ))}
      </section>
      <section className={`${card} mt-6`}>
        {items.map((x) => (
          <article
            className="border-b border-vds-divider py-4"
            key={x.notificationId}
          >
            <p className="font-medium">{x.title}</p>
            <p className="mt-1 text-sm text-vds-muted">{x.body}</p>
          </article>
        ))}
        {!items.length && (
          <p className="py-12 text-center text-sm text-vds-muted">
            No deterministic notifications are available.
          </p>
        )}
      </section>
    </>
  );
}
export function Preferences({
  items,
}: {
  items: readonly NotificationPreference[];
}) {
  return (
    <section className="mt-6 grid gap-3 md:grid-cols-2">
      {items.map((x) => (
        <article className={card} key={x.category}>
          <div className="flex justify-between">
            <p className="font-semibold capitalize">
              {x.category.replaceAll("-", " ")}
            </p>
            <span className="text-xs text-vds-muted">Read only</span>
          </div>
          <p className="mt-3 text-sm text-vds-muted">
            In-app {x.inAppEnabled ? "enabled" : "disabled"} · External delivery
            disabled
          </p>
        </article>
      ))}
    </section>
  );
}
