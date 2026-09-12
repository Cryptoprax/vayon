import { Button } from "@/features/platform/design-system";
import { CommunicationsShell } from "@/features/vayon/communications-workspace/components/CommunicationsShell";
import { InboxList } from "@/features/vayon/communications-workspace/components/InboxList";
import { CommunicationsWorkspaceService } from "@/features/vayon/communications-workspace/services/communications.service";
import { toInboxQuery } from "@/features/vayon/communications-workspace/view-models/query";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams,
    query = toInboxQuery(raw),
    data = await (
      await CommunicationsWorkspaceService.production()
    ).inbox(query);
  return (
    <CommunicationsShell
      title="Unified Inbox"
      description="Search, filter, sort, and review every tenant-scoped customer interaction without connecting external providers."
    >
      <form className="mb-5 grid gap-3 rounded-2xl border border-vds-border bg-vds-surface p-4 md:grid-cols-6">
        <input
          name="search"
          defaultValue={query.search}
          aria-label="Search inbox"
          placeholder="Search conversations"
          className="vds-focus h-11 rounded-xl border border-vds-border bg-vds-elevated px-3 text-sm md:col-span-2"
        />
        <select
          name="channel"
          defaultValue={query.channel ?? ""}
          aria-label="Filter channel"
          className="vds-focus h-11 rounded-xl border border-vds-border bg-vds-elevated px-3 text-sm"
        >
          <option value="">All channels</option>
          {[
            "whatsapp",
            "email",
            "sms",
            "phone",
            "internal-note",
            "system-notification",
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={query.status ?? ""}
          aria-label="Filter status"
          className="vds-focus h-11 rounded-xl border border-vds-border bg-vds-elevated px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option>open</option>
          <option>waiting_reply</option>
          <option>archived</option>
        </select>
        <select
          name="sort"
          defaultValue={query.sort}
          aria-label="Sort inbox"
          className="vds-focus h-11 rounded-xl border border-vds-border bg-vds-elevated px-3 text-sm"
        >
          <option value="recent">Recent</option>
          <option value="oldest">Oldest</option>
          <option value="unread">Unread</option>
        </select>
        <Button type="submit">Apply</Button>
      </form>
      <div className="mb-3 flex gap-3 overflow-x-auto text-xs text-vds-muted">
        <a className="shrink-0" href="?">All Conversations</a>
        <a className="shrink-0" href="?channel=whatsapp">WhatsApp</a>
        <a className="shrink-0" href="?channel=email">Email</a>
        <a className="shrink-0" href="?channel=internal-note">Internal Notes</a>
        <a className="shrink-0" href="?channel=phone">Calls</a>
        <a className="shrink-0" href="?channel=sms">SMS</a>
        <a className="shrink-0" href="?channel=system-notification">System Notifications</a>
      </div>
      <div className="mb-3 flex gap-3 overflow-x-auto text-xs text-vds-muted">
        <a href="?unread=true">Unread</a><a href="?assigned=true">Assigned</a><a href="?aiDraftPending=true">AI Draft Pending</a><a href="?highPriority=true">High Priority</a><a href="?closed=true">Closed</a><a href="?archived=true">Archived</a>
      </div>
      <InboxList items={data.items} />
      <footer className="mt-4 flex justify-between text-sm text-vds-muted">
        <span>
          Page {data.page} · {data.count} conversations
        </span>
        <div className="flex gap-3">
          <a href={`?page=${Math.max(1, data.page - 1)}`}>Previous</a>
          <a href={`?page=${data.page + 1}`}>Next</a>
        </div>
      </footer>
    </CommunicationsShell>
  );
}
