import Link from "next/link";
import { Button } from "@/features/platform/design-system";
import { submitProductFeedbackAction } from "../actions";
import type { ProductInsight, ProductIntelligenceSnapshot } from "../contracts";
const card = "rounded-2xl border border-vds-border bg-vds-surface p-5";
export function ProductIntelligenceDashboard({
  snapshot,
}: {
  snapshot: ProductIntelligenceSnapshot;
}) {
  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">
          Customer success intelligence
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Product Intelligence</h1>
        <p className="mt-2 max-w-3xl text-sm text-vds-muted">
          Anonymous, tenant-scoped adoption, friction, knowledge, AI quality,
          and customer health evidence. Recommendations never modify the
          application.
        </p>
      </header>
      <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-7">
          <InsightSection title="Product adoption" items={snapshot.adoption} />
          <InsightSection title="User friction" items={snapshot.friction} />
          <InsightSection
            title="Knowledge effectiveness"
            items={snapshot.knowledge}
          />
          <InsightSection title="AI quality" items={snapshot.aiQuality} />
          <InsightSection
            title="Customer health"
            items={snapshot.customerHealth}
          />
          <section>
            <h2 className="text-xl font-semibold">Suggested improvements</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {snapshot.recommendations.map((item) => (
                <article className={card} key={item.id}>
                  <p className="text-xs font-semibold uppercase text-vds-primary">
                    {item.priority} · Recommendation only
                  </p>
                  <h3 className="mt-2 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-vds-muted">{item.reason}</p>
                </article>
              ))}
              {!snapshot.recommendations.length && (
                <p className="rounded-2xl border border-dashed border-vds-border p-6 text-sm text-vds-muted">
                  No evidence-backed improvements are currently available.
                </p>
              )}
            </div>
          </section>
        </div>
        <aside className="space-y-5">
          <List title="Top issues" items={snapshot.topIssues} />
          <List title="Trending requests" items={snapshot.trendingRequests} />
          <List
            title="Common question topics"
            items={snapshot.commonQuestions}
          />
          <List title="Feature popularity" items={snapshot.featurePopularity} />
          <FeedbackForm />
        </aside>
      </div>
      <p className="mt-6 text-xs text-vds-subtle">
        Cached snapshot generated{" "}
        {new Date(snapshot.generatedAt).toLocaleString()}.
      </p>
    </main>
  );
}
function InsightSection({
  title,
  items,
}: {
  title: string;
  items: readonly ProductInsight[];
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article className={card} key={item.id}>
            <p className="text-xs text-vds-muted">{item.title}</p>
            <p className="mt-2 text-2xl font-semibold">
              {item.value ?? "Unavailable"}
            </p>
            <p className="mt-2 text-xs text-vds-subtle">{item.evidence}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
function List({
  title,
  items,
}: {
  title: string;
  items: readonly { label: string; count: number }[];
}) {
  return (
    <section className={card}>
      <h2 className="font-semibold">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((item) => (
          <li className="flex justify-between gap-3" key={item.label}>
            <span>{item.label}</span>
            <span>{item.count}</span>
          </li>
        ))}
        {!items.length && (
          <li className="text-vds-muted">No evidence available.</li>
        )}
      </ul>
    </section>
  );
}
function FeedbackForm() {
  return (
    <form action={submitProductFeedbackAction} className={card}>
      <h2 className="font-semibold">Submit feedback</h2>
      <select
        aria-label="Feedback type"
        name="kind"
        className="mt-3 h-10 w-full rounded-xl border border-vds-border bg-vds-input px-3"
      >
        <option value="bug_report">Bug report</option>
        <option value="feature_request">Feature request</option>
        <option value="improvement_idea">Improvement idea</option>
        <option value="ux_issue">UX issue</option>
        <option value="knowledge_correction">Knowledge correction</option>
        <option value="general_feedback">General feedback</option>
      </select>
      <input
        aria-label="Feedback summary"
        name="title"
        required
        maxLength={160}
        placeholder="Summary"
        className="mt-3 h-10 w-full rounded-xl border border-vds-border bg-vds-input px-3"
      />
      <textarea
        aria-label="Feedback details"
        name="description"
        required
        minLength={10}
        maxLength={4000}
        placeholder="What happened or what should improve?"
        className="mt-3 min-h-28 w-full rounded-xl border border-vds-border bg-vds-input p-3"
      />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <select
          aria-label="Feedback priority"
          name="priority"
          className="h-10 rounded-xl border border-vds-border bg-vds-input px-3"
        >
          <option>low</option>
          <option>medium</option>
          <option>high</option>
          <option>critical</option>
        </select>
        <select
          aria-label="Satisfaction rating"
          name="rating"
          className="h-10 rounded-xl border border-vds-border bg-vds-input px-3"
        >
          <option value="">Rating</option>
          {[1, 2, 3, 4, 5].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
      <select
        aria-label="Resolution quality"
        name="resolutionQuality"
        className="mt-3 h-10 w-full rounded-xl border border-vds-border bg-vds-input px-3"
      >
        <option value="">Resolution quality</option>
        {[1, 2, 3, 4, 5].map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <input
        aria-label="Optional support screenshot"
        name="screenshot"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="mt-3 block w-full text-xs"
      />
      <p className="mt-2 text-xs text-vds-muted">
        Screenshots are private, tenant-scoped, and limited to 5 MB. Remove
        customer or confidential information before uploading.
      </p>
      <Button className="mt-3 w-full">Submit feedback</Button>
      <Link
        className="mt-3 block text-center text-xs text-vds-primary"
        href="/vayon/knowledge/help"
      >
        Open trusted help
      </Link>
    </form>
  );
}
