import type { CollaborationDashboard as Dashboard } from "../types";
const card = "rounded-2xl border border-vds-border bg-vds-surface p-5";
export function ExecutiveCollaborationDashboard({ data }: { data: Dashboard }) {
  return (
    <section className="space-y-5" aria-labelledby="collaboration-title">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">
          AI collaboration engine
        </p>
        <h2 id="collaboration-title" className="mt-2 text-2xl font-semibold">
          Executive Collaboration Dashboard
        </h2>
        <p className="mt-2 text-sm text-vds-muted">
          Tenant-scoped, recommendation-only coordination through the existing
          workforce runtime.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Active collaborations", data.activeCollaborations],
          ["AI requests", data.observability.requestCount],
          ["Pending approvals", data.pendingApprovals],
          ["Estimated cost", `$${data.observability.estimatedCost.toFixed(6)}`],
        ].map(([label, value]) => (
          <article className={card} key={label}>
            <p className="text-xs text-vds-muted">{label}</p>
            <p className="mt-3 text-xl font-semibold">{value}</p>
          </article>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <article className={card}>
          <h3 className="font-semibold">Top AI Contributors</h3>
          <div className="mt-4 space-y-2">
            {data.topContributors.map((i) => (
              <div className="flex justify-between text-sm" key={i.agent}>
                <span>{i.agent}</span>
                <span>{i.requests} requests</span>
              </div>
            ))}
            {!data.topContributors.length && (
              <p className="text-sm text-vds-muted">
                No collaboration activity yet.
              </p>
            )}
          </div>
        </article>
        <article className={card}>
          <h3 className="font-semibold">Department Collaboration</h3>
          <div className="mt-4 space-y-2">
            {data.departmentCollaboration.map((i) => (
              <div
                className="flex justify-between text-sm capitalize"
                key={i.department}
              >
                <span>{i.department}</span>
                <span>{i.requests}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
      <article className={card}>
        <h3 className="font-semibold">Recommendation Pipeline</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-vds-muted">
              <tr>
                {[
                  "AI Employee",
                  "Requested Recommendation",
                  "Provider",
                  "Confidence",
                  "Approval Status",
                  "Related Customer",
                  "Latency",
                ].map((h) => (
                  <th className="pb-3 pr-4" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recommendationPipeline.map((n) => (
                <tr className="border-t border-vds-border" key={n.id}>
                  <td className="py-3 pr-4">{n.employee}</td>
                  <td className="py-3 pr-4">{n.requestedRecommendation}</td>
                  <td className="py-3 pr-4">{n.provider}</td>
                  <td className="py-3 pr-4">
                    {n.confidence == null
                      ? "Unavailable"
                      : `${Math.round(n.confidence * 100)}%`}
                  </td>
                  <td className="py-3 pr-4 capitalize">{n.approvalStatus}</td>
                  <td className="py-3 pr-4">
                    {n.relatedCustomer ?? "Not linked"}
                  </td>
                  <td className="py-3">
                    {n.latencyMs == null ? "—" : `${n.latencyMs} ms`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
      <div className="grid gap-5 xl:grid-cols-2">
        <article className={card}>
          <h3 className="font-semibold">Recent Collaboration Timeline</h3>
          <ol className="mt-4 space-y-3">
            {data.timeline.slice(0, 20).map((e) => (
              <li className="text-sm" key={e.id}>
                <span className="font-medium">{e.agent}</span> — {e.summary}
                <p className="text-xs text-vds-muted">
                  {new Date(e.occurredAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ol>
        </article>
        <article className={card}>
          <h3 className="font-semibold">Collaboration Observability</h3>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            {[
              ["Request count", data.observability.requestCount],
              ["Prompt tokens", data.observability.promptTokens],
              ["Completion tokens", data.observability.completionTokens],
              [
                "Latency",
                data.observability.averageLatencyMs == null
                  ? "—"
                  : `${data.observability.averageLatencyMs} ms`,
              ],
              ["Model", data.observability.models.join(", ") || "No response"],
              [
                "Recommendation confidence",
                data.observability.averageConfidence == null
                  ? "Unavailable"
                  : `${Math.round(data.observability.averageConfidence * 100)}%`,
              ],
              ["Approval status", `${data.pendingApprovals} pending`],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-vds-muted">{label}</dt>
                <dd className="mt-1 text-sm">{value}</dd>
              </div>
            ))}
          </dl>
        </article>
      </div>
    </section>
  );
}
