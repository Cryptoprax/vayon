import Link from "next/link";
import { ButtonLink } from "@/features/platform/design-system";
import type {
  Campaign,
  CommunicationTemplate,
  CommunicationsSnapshot,
  ConversationDetail,
  ConversationRow,
  HubNotification,
} from "../domain/models";
const card = "rounded-2xl border border-vds-border bg-vds-surface p-5";
export function HubDashboard({
  snapshot,
}: {
  snapshot: CommunicationsSnapshot;
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {snapshot.observability.map((x) => (
          <article key={x.label} className={card}>
            <p className="text-xs text-vds-muted">{x.label}</p>
            <p
              className={`mt-3 text-lg font-semibold ${x.available ? "" : "text-vds-muted"}`}
            >
              {x.value}
            </p>
          </article>
        ))}
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className={card}>
          <div className="flex justify-between">
            <h2 className="font-semibold">Recent conversations</h2>
            <Link
              href="/vayon/communications/inbox"
              className="text-sm text-vds-primary"
            >
              Open inbox
            </Link>
          </div>
          <ConversationLinks items={snapshot.conversations.slice(0, 8)} />
        </section>
        <section className={card}>
          <h2 className="font-semibold">Governed outbound lifecycle</h2>
          <ol className="mt-4 space-y-3 text-sm text-vds-muted">
            {[
              "Draft",
              "Approval Engine",
              "Execution Request",
              "Integration Platform",
              "Deterministic Provider",
              "Conversation Timeline",
            ].map((x, index) => (
              <li key={x}>
                <span className="mr-2 text-vds-primary">{index + 1}.</span>
                {x}
              </li>
            ))}
          </ol>
        </section>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className={card}>
          <h2 className="font-semibold">Channel readiness</h2>
          <div className="mt-3 space-y-3">
            {snapshot.providers.map((item) => <div key={item.provider} className="flex items-center justify-between text-sm"><span className="capitalize">{item.provider.replaceAll("-", " ")}</span><span className="text-vds-muted">Architecture ready · not connected</span></div>)}
          </div>
        </section>
        <section className={card}>
          <h2 className="font-semibold">Communication reporting</h2>
          <div className="mt-3 space-y-3">{snapshot.reports.slice(0, 4).map((item) => <div key={item.label}><p className="text-xs text-vds-muted">{item.label}</p><p className="mt-1 text-sm">{item.value}</p></div>)}</div>
        </section>
      </div>
    </div>
  );
}
export function ConversationLinks({
  items,
}: {
  items: readonly ConversationRow[];
}) {
  return (
    <div className="mt-3 divide-y divide-vds-border">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/vayon/communications/conversations/${item.id}`}
          className="flex justify-between gap-3 py-3"
        >
          <span>
            <strong className="block text-sm">{item.customer}</strong>
            <span className="text-xs text-vds-muted">{item.subject}</span>
          </span>
          <span className="text-xs capitalize text-vds-muted">
            {item.channel}
          </span>
        </Link>
      ))}
      {!items.length && <Empty title="Start your first customer conversation." href="/vayon/communications/inbox" action="Open inbox" />}
    </div>
  );
}
export function ConversationView({ detail }: { detail: ConversationDetail }) {
  const { conversation } = detail;
  return (
    <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
      <section>
        <article className={card}>
          <div className="flex justify-between">
            <div>
              <h2 className="text-xl font-semibold">{conversation.customer}</h2>
              <p className="mt-1 text-sm text-vds-muted">
                {conversation.subject}
              </p>
            </div>
            <span className="h-fit rounded-full bg-vds-primary-soft px-2 py-1 text-xs capitalize text-vds-primary">
              {conversation.status}
            </span>
          </div>
          <p className="mt-4 text-xs text-vds-muted">
            {conversation.channel} · Human: {conversation.assignedHuman} · AI:{" "}
            {conversation.assignedAI}
          </p>
        </article>
        <div className="mt-4 space-y-3">
          {detail.timeline.map((item) => (
            <article
              key={item.id}
              className={`${card} ${item.direction === "outbound" ? "ml-8" : "mr-8"}`}
            >
              <div className="flex justify-between">
                <p className="text-xs capitalize text-vds-primary">
                  {item.kind} · {item.state}
                </p>
                <time className="text-xs text-vds-muted">
                  {new Date(item.occurredAt).toLocaleString()}
                </time>
              </div>
              <h3 className="mt-2 font-medium">{item.title}</h3>
              <p className="mt-2 text-sm text-vds-muted">{item.body}</p>
            </article>
          ))}
          {!detail.timeline.length && (
            <Empty title="Add the first meaningful touchpoint." href="/vayon/communications/inbox" action="Open inbox" />
          )}
        </div>
      </section>
      <aside className="space-y-4">
        <Panel title="CRM context" data={detail.crm} />
        <Panel title="AI Workforce" data={detail.ai} />
        <Panel title="Deterministic assistance" data={detail.intelligence} />
        <Panel title="Internal notes" data={{ count: detail.notes.length, pinned: detail.notes.filter((item) => item.pinned).length, latest: detail.notes[0]?.body ?? "No private notes" }} />
        <Panel title="Attachments" data={{ count: detail.attachments.length, files: detail.attachments.map((item) => item.name).join(", ") || "No attachments" }} />
      </aside>
    </div>
  );
}
export function TemplateLibrary({
  items,
}: {
  items: readonly CommunicationTemplate[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <article key={item.id} className={card}>
          <p className="text-xs text-vds-primary">
            {item.category} · {item.channel}
          </p>
          <h2 className="mt-2 font-semibold">{item.name}</h2>
          <p className="mt-3 text-sm text-vds-muted">{item.body}</p>
          <p className="mt-4 text-xs text-vds-muted">
            Read-only · approval required before use
          </p>
        </article>
      ))}
    </div>
  );
}
export function CampaignList({ items }: { items: readonly Campaign[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.length ? (
        items.map((item) => (
          <article key={item.id} className={card}>
            <div className="flex justify-between">
              <h2 className="font-semibold">{item.name}</h2>
              <span className="text-xs capitalize">{item.status}</span>
            </div>
            <p className="mt-3 text-sm text-vds-muted">
              Audience: {item.audience}
            </p>
            <p className="mt-2 text-xs text-vds-muted">
              Progress: {item.progress}
            </p>
            <p className="mt-1 text-xs text-vds-muted">
              Estimated reach: {item.estimatedReach}
            </p>
            <p className="mt-1 text-xs text-vds-muted">
              Approval: {item.approvalStatus}
            </p>
          </article>
        ))
      ) : (
        <Empty title="Generate your first campaign." href="/vayon/communications/campaigns" action="Create campaign" />
      )}
    </div>
  );
}
export function NotificationList({
  items,
}: {
  items: readonly HubNotification[];
}) {
  return (
    <div className="space-y-3">
      {items.length ? (
        items.map((item) => (
          <Link key={item.id} href={item.href} className={`${card} block`}>
            <p className="text-xs text-vds-primary">{item.type}</p>
            <h2 className="mt-2 font-medium">{item.title}</h2>
            <time className="mt-2 block text-xs text-vds-muted">
              {new Date(item.occurredAt).toLocaleString()}
            </time>
          </Link>
        ))
      ) : (
        <Empty title="You are ready for your next action." href="/vayon/tasks" action="Open tasks" />
      )}
    </div>
  );
}
function Panel({ title, data }: { title: string; data: object }) {
  return (
    <section className={card}>
      <h2 className="font-semibold">{title}</h2>
      <dl className="mt-3 space-y-3">
        {Object.entries(data)
          .filter(([key]) => key !== "generatedBy")
          .map(([key, value]) => (
            <div key={key}>
              <dt className="text-xs capitalize text-vds-muted">
                {key.replaceAll(/([A-Z])/g, " $1")}
              </dt>
              <dd className="mt-1 text-sm">{String(value)}</dd>
            </div>
          ))}
      </dl>
    </section>
  );
}
function Empty({ title, href, action }: { title: string; href: string; action: string }) {
  return (
    <div className="col-span-full rounded-2xl border border-dashed border-vds-border p-8 text-center">
      <p className="font-medium">{title}</p>
      <ButtonLink href={href} className="mt-4">{action}</ButtonLink>
    </div>
  );
}
