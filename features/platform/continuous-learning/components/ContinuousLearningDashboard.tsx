import { Button } from "@/features/platform/design-system";
import {
  generateExecutiveBriefingAction,
  saveIntelligenceMemoryAction,
} from "../actions";
import {
  organizationMemoryKeys,
  userMemoryKeys,
  type ContinuousLearningSnapshot,
  type TrendMetric,
} from "../contracts";
const card = "rounded-2xl border border-vds-border bg-vds-surface p-5";
export function ContinuousLearningDashboard({
  snapshot,
}: {
  snapshot: ContinuousLearningSnapshot;
}) {
  return (
    <section
      className="mx-auto max-w-7xl px-5 pb-10"
      aria-labelledby="continuous-learning-title"
    >
      <header className="border-t border-vds-border pt-8">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">
          Continuous learning
        </p>
        <h2
          id="continuous-learning-title"
          className="mt-2 text-2xl font-semibold"
        >
          Executive Intelligence
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-vds-muted">
          Tenant-scoped memory and anonymized operational trends. Generated
          summaries and improvement ideas are recommendations only and never
          execute changes.
        </p>
      </header>
      <MetricGrid title="Executive trends" items={snapshot.executiveMetrics} />
      <MetricGrid
        title="AI quality optimization"
        items={snapshot.qualityMetrics}
      />
      <div className="mt-7 grid gap-5 lg:grid-cols-3">
        <List
          title="Repeated question topics"
          items={snapshot.repeatedQuestions}
        />
        <List
          title="Successful workflows"
          items={snapshot.successfulWorkflows}
        />
        <section className={card}>
          <h3 className="font-semibold">Unused capabilities</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {snapshot.unusedCapabilities.map((item) => (
              <li key={item}>{item}</li>
            ))}
            {!snapshot.unusedCapabilities.length && (
              <li className="text-vds-muted">No unused capability evidence.</li>
            )}
          </ul>
        </section>
      </div>
      <section className="mt-7">
        <h3 className="text-xl font-semibold">
          Knowledge and product evolution
        </h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.recommendations.map((item) => (
            <article className={card} key={item.id}>
              <p className="text-xs font-semibold uppercase text-vds-primary">
                Recommendation only
              </p>
              <h4 className="mt-2 font-semibold">{item.title}</h4>
              <p className="mt-2 text-sm text-vds-muted">{item.rationale}</p>
            </article>
          ))}
          {!snapshot.recommendations.length && (
            <p className="rounded-2xl border border-dashed border-vds-border p-5 text-sm text-vds-muted">
              No evidence-backed recommendation is available.
            </p>
          )}
        </div>
      </section>
      <div className="mt-7 grid gap-5 xl:grid-cols-[1fr_22rem]">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold">Executive AI briefings</h3>
              <p className="mt-1 text-sm text-vds-muted">
                Generated only from aggregate workspace evidence.
              </p>
            </div>
            <form
              action={generateExecutiveBriefingAction}
              className="flex gap-2"
            >
              <select
                aria-label="Briefing period"
                name="period"
                className="h-10 rounded-xl border border-vds-border bg-vds-input px-3 text-sm"
              >
                <option value="weekly">Weekly executive summary</option>
                <option value="monthly">Monthly executive summary</option>
                <option value="quarterly">Quarterly product health</option>
                <option value="customer_success">
                  Customer success summary
                </option>
                <option value="ai_adoption">AI adoption summary</option>
                <option value="knowledge_health">
                  Knowledge health summary
                </option>
              </select>
              <Button>Generate</Button>
            </form>
          </div>
          <div className="mt-3 space-y-3">
            {snapshot.briefings.map((item) => (
              <article className={card} key={item.id}>
                <p className="text-xs font-semibold uppercase text-vds-primary">
                  {item.aiGenerated ? "AI-generated" : "Deterministic fallback"}{" "}
                  · {item.period.replaceAll("_", " ")} · Recommendation only
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-vds-muted">
                  {item.summary}
                </p>
                <p className="mt-3 text-xs text-vds-subtle">
                  {item.source}
                  {item.model
                    ? ` · ${item.model}`
                    : " · deterministic fallback"}{" "}
                  · {new Date(item.generatedAt).toLocaleString()}
                </p>
              </article>
            ))}
            {!snapshot.briefings.length && (
              <p className="rounded-2xl border border-dashed border-vds-border p-5 text-sm text-vds-muted">
                No briefing has been generated. Metrics remain available without
                AI.
              </p>
            )}
          </div>
        </section>
        <div className="space-y-5">
          <MemoryForm scope="organization" keys={organizationMemoryKeys} />
          <MemoryForm scope="user" keys={userMemoryKeys} />
          <MemoryList
            title="Organization memory"
            items={snapshot.organizationMemory}
          />
          <MemoryList title="Your memory" items={snapshot.userMemory} />
        </div>
      </div>
    </section>
  );
}
function MetricGrid({
  title,
  items,
}: {
  title: string;
  items: readonly TrendMetric[];
}) {
  return (
    <section className="mt-7">
      <h3 className="text-xl font-semibold">{title}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <article className={card} key={item.id}>
            <p className="text-xs text-vds-muted">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold">
              {item.value ?? "Unavailable"}
            </p>
            <p className="mt-2 text-xs text-vds-subtle">
              Week {change(item.weeklyChange)} · Month{" "}
              {change(item.monthlyChange)}
            </p>
            <p className="mt-2 text-xs text-vds-subtle">{item.evidence}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
const change = (value: number | null) =>
  value === null ? "unavailable" : `${value > 0 ? "+" : ""}${value}%`;
function List({
  title,
  items,
}: {
  title: string;
  items: readonly { label: string; count: number }[];
}) {
  return (
    <section className={card}>
      <h3 className="font-semibold">{title}</h3>
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
function MemoryForm({
  scope,
  keys,
}: {
  scope: "organization" | "user";
  keys: readonly string[];
}) {
  return (
    <form action={saveIntelligenceMemoryAction} className={card}>
      <h3 className="font-semibold">
        {scope === "organization" ? "Organization" : "User"} memory
      </h3>
      <input type="hidden" name="scope" value={scope} />
      <select
        aria-label={`${scope} memory type`}
        name="key"
        className="mt-3 h-10 w-full rounded-xl border border-vds-border bg-vds-input px-3 text-sm"
      >
        {keys.map((key) => (
          <option value={key} key={key}>
            {key.replaceAll("_", " ")}
          </option>
        ))}
      </select>
      <textarea
        aria-label={`${scope} memory values`}
        name="value"
        required
        maxLength={2000}
        placeholder="Comma-separated preferences"
        className="mt-3 min-h-20 w-full rounded-xl border border-vds-border bg-vds-input p-3 text-sm"
      />
      <p className="mt-2 text-xs text-vds-subtle">
        Save preferences only. Do not enter customer data or secrets.
      </p>
      <Button className="mt-3 w-full">Save preference</Button>
    </form>
  );
}
function MemoryList({
  title,
  items,
}: {
  title: string;
  items: ContinuousLearningSnapshot["organizationMemory"];
}) {
  return (
    <section className={card}>
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-3 space-y-3 text-xs">
        {items.map((item) => (
          <li key={`${item.scope}-${item.key}`}>
            <p className="font-semibold">{item.key.replaceAll("_", " ")}</p>
            <p className="mt-1 text-vds-muted">{item.value.join(", ")}</p>
          </li>
        ))}
        {!items.length && (
          <li className="text-vds-muted">No saved preferences.</li>
        )}
      </ul>
    </section>
  );
}
