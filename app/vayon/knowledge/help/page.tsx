import Link from "next/link";
import { Button } from "@/features/platform/design-system";
import { EnterpriseKnowledgeService } from "@/features/platform/knowledge/services/knowledge.service";
import { recordKnowledgeQualityFeedbackAction } from "@/features/platform/knowledge/actions";

const guides = [
  "Admin Guide",
  "User Guide",
  "Marketing Studio Guide",
  "Campaign Growth Guide",
  "Billing Guide",
  "Organization Guide",
  "Developer Notes",
  "Architecture Summary",
];
const faq = [
  "How do approvals protect external actions?",
  "How do I import inventory?",
  "How do I connect email and calendars?",
  "How do subscription limits work?",
];
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; module?: string }>;
}) {
  const parameters = await searchParams,
    q = parameters.q?.trim() ?? "",
    moduleName = parameters.module?.replace(/[^a-z0-9-]/gi, "").slice(0, 60),
    answer = q
      ? await new EnterpriseKnowledgeService().ask(q, {
          module: moduleName,
          productVersion: process.env.APP_VERSION ?? "2.0",
        })
      : null;
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/vayon/knowledge" className="text-sm text-vds-primary">
        ← Knowledge Center
      </Link>
      <h1 className="mt-5 text-3xl font-semibold">Help Center</h1>
      <p className="mt-2 text-sm text-vds-muted">
        Search product documentation, organization knowledge, launch guides, and
        context-sensitive help.
      </p>
      <form className="mt-6 flex gap-2" role="search">
        <label className="sr-only" htmlFor="help-search">
          Search Help Center
        </label>
        <input
          id="help-search"
          name="q"
          defaultValue={q}
          maxLength={300}
          placeholder="Ask a product or setup question"
          className="vds-focus h-11 flex-1 rounded-xl border border-vds-border bg-vds-elevated px-3"
        />
        {moduleName && <input type="hidden" name="module" value={moduleName} />}
        <Button type="submit">Search</Button>
      </form>
      {answer && (
        <section
          aria-live="polite"
          className="mt-6 rounded-2xl border border-vds-border bg-vds-surface p-6"
        >
          <p className="text-sm leading-6">{answer.answer}</p>
          <p className="mt-3 text-xs text-vds-muted">
            Knowledge-first answer · Recommendation only · {answer.latencyMs} ms
          </p>
          <h2 className="mt-5 font-semibold">Supporting documents</h2>
          <ul className="mt-2 space-y-2">
            {answer.citations.map((x) => (
              <li className="text-sm" key={x.id}>
                {x.citation} — {x.title}
              </li>
            ))}
          </ul>
          {answer.related.length > 0 && (
            <div className="mt-5">
              <h2 className="font-semibold">Related guides</h2>
              <ul className="mt-2 space-y-2 text-sm">
                {answer.related.map((item) => (
                  <li key={item.id}>{item.title}</li>
                ))}
              </ul>
            </div>
          )}
          {answer.video && (
            <Link
              className="mt-5 inline-block text-sm font-semibold text-vds-primary"
              href={
                answer.video.videoUrl ??
                `/vayon/knowledge?q=${encodeURIComponent(answer.video.title)}`
              }
            >
              Watch: {answer.video.title}
            </Link>
          )}
          <p className="mt-5 text-sm">
            <strong>Suggested next step:</strong> {answer.suggestedNextStep}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {answer.quickActions.map((action) => (
              <Link
                className="vds-focus rounded-xl border border-vds-border px-3 py-2 text-sm font-semibold"
                href={action.href}
                key={action.href}
              >
                {action.label}
              </Link>
            ))}
          </div>
          {answer.citations[0] && (
            <form
              action={recordKnowledgeQualityFeedbackAction}
              className="mt-6 flex flex-wrap gap-2"
            >
              <input
                type="hidden"
                name="sourceId"
                value={answer.citations[0].id}
              />
              {[
                ["helpful", "Helpful"],
                ["not_helpful", "Not Helpful"],
                ["needs_update", "Needs Update"],
                ["report_problem", "Report Problem"],
              ].map(([rating, label]) => (
                <Button
                  variant="outline"
                  name="rating"
                  value={rating}
                  key={rating}
                >
                  {label}
                </Button>
              ))}
            </form>
          )}
          {answer.escalate && (
            <Link
              className="mt-5 inline-block text-sm text-vds-primary"
              href="/contact"
            >
              Escalate to support
            </Link>
          )}
        </section>
      )}
      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-vds-border bg-vds-surface p-5">
          <h2 className="font-semibold">Launch and product guides</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {guides.map((guide) => (
              <li key={guide}>
                <Link
                  className="block rounded-lg bg-vds-elevated px-3 py-2 text-sm"
                  href={`/docs?q=${encodeURIComponent(guide)}`}
                >
                  {guide}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-vds-border bg-vds-surface p-5">
          <h2 className="font-semibold">Frequently asked questions</h2>
          <ul className="mt-3 space-y-2">
            {faq.map((item) => (
              <li
                className="rounded-lg bg-vds-elevated px-3 py-2 text-sm"
                key={item}
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-vds-muted">
            Video guides are prepared as accessible placeholders until approved
            media is available.
          </p>
        </section>
      </div>
    </main>
  );
}
