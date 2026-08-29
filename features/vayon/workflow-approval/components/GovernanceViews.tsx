import Link from "next/link";
import type {
  ApprovalRequest,
  AuditEntry,
  ExecutionRequest,
  GovernedWorkflow,
} from "../domain/models";
const card = "rounded-2xl border border-vds-border bg-vds-surface p-5";
export function GovernanceNav() {
  return (
    <nav
      aria-label="Workflow governance"
      className="mb-6 flex gap-2 overflow-x-auto border-y border-vds-border py-3"
    >
      {[
        ["Designer", "/vayon/workflows"],
        ["Approvals", "/vayon/approvals"],
        ["Executions", "/vayon/executions"],
      ].map(([label, href]) => (
        <Link
          key={href}
          href={href}
          className="vds-focus rounded-lg px-3 py-2 text-sm text-vds-muted hover:bg-vds-hover"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
export function GovernanceHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">
        Governed automation · no autonomous execution
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm text-vds-muted">{description}</p>
    </header>
  );
}
export function WorkflowList({
  items,
}: {
  items: readonly GovernedWorkflow[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/vayon/workflows/${item.id}`}
          className={`${card} block hover:border-vds-border-strong`}
        >
          <div className="flex justify-between">
            <h2 className="font-semibold">{item.name}</h2>
            <span className="text-xs capitalize text-vds-muted">
              {item.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-vds-muted">{item.description}</p>
          <p className="mt-4 text-xs text-vds-muted">
            {item.steps.length} governed steps · v{item.version} · {item.owner}
          </p>
        </Link>
      ))}
    </div>
  );
}
export function WorkflowDetail({
  item,
  audit,
}: {
  item: GovernedWorkflow;
  audit: readonly AuditEntry[];
}) {
  return (
    <div className="space-y-5">
      <section className={card}>
        <h2 className="font-semibold">Workflow model</h2>
        <p className="mt-3 text-sm text-vds-muted">
          Owner: {item.owner} · Status: {item.status} · Version: {item.version}
        </p>
      </section>
      <section>
        <h2 className="mb-3 font-semibold">Steps and policies</h2>
        <div className="space-y-3">
          {item.steps.map((step) => (
            <article key={step.id} className={card}>
              <div className="flex justify-between">
                <h3 className="font-medium capitalize">{step.name}</h3>
                <span className="text-xs text-vds-primary">
                  Approval required
                </span>
              </div>
              <p className="mt-2 text-sm text-vds-muted">
                Action: {step.actionType} · Policy: {step.approvalPolicyId}
              </p>
              <p className="mt-1 text-xs text-vds-muted">
                Conditions: {step.conditions.join(", ")}
              </p>
            </article>
          ))}
        </div>
      </section>
      <AuditList items={audit} />
    </div>
  );
}
export function ApprovalList({ items }: { items: readonly ApprovalRequest[] }) {
  return (
    <div className="space-y-3">
      {items.length ? (
        items.map((item) => (
          <Link
            href={`/vayon/approvals/${item.id}`}
            key={item.id}
            className={`${card} block`}
          >
            <div className="flex justify-between">
              <h2 className="font-medium">Approval request</h2>
              <span className="text-xs capitalize">{item.decision}</span>
            </div>
            <p className="mt-2 text-sm text-vds-muted">
              Requested by {item.requestedBy}
              {item.aiEmployee ? ` for ${item.aiEmployee}` : ""}
            </p>
            <dl className="mt-4 grid gap-2 text-xs text-vds-muted sm:grid-cols-2 lg:grid-cols-4">
              <div><dt className="font-medium text-vds-foreground">Requester</dt><dd>{item.requestedBy}</dd></div>
              <div><dt className="font-medium text-vds-foreground">Approver</dt><dd>{item.humanApprover ?? "Awaiting assignment"}</dd></div>
              <div><dt className="font-medium text-vds-foreground">Reason</dt><dd>{item.reason ?? "Awaiting decision"}</dd></div>
              <div><dt className="font-medium text-vds-foreground">Evidence & timeline</dt><dd>Open the approval record</dd></div>
            </dl>
          </Link>
        ))
      ) : (
        <Empty text="No real estate approvals need attention. New property, listing, pricing, offer, campaign, contract, description, or media requests will appear here with evidence and a timeline." />
      )}
    </div>
  );
}
export function ExecutionList({
  items,
}: {
  items: readonly ExecutionRequest[];
}) {
  return (
    <div className="space-y-3">
      {items.length ? (
        items.map((item) => (
          <article key={item.id} className={card}>
            <div className="flex justify-between">
              <h2 className="font-medium">{item.actionType}</h2>
              <span className="text-xs capitalize">{item.status}</span>
            </div>
            <p className="mt-2 text-sm text-vds-muted">
              Workflow {item.workflowId} · Step {item.stepId}
            </p>
            <p className="mt-2 text-xs text-vds-muted">
              Deterministic adapter can prepare approved requests but cannot
              execute them.
            </p>
          </article>
        ))
      ) : (
        <Empty text="No execution requests have been created." />
      )}
    </div>
  );
}
export function ApprovalDetail({
  item,
  audit,
}: {
  item: ApprovalRequest;
  audit: readonly AuditEntry[];
}) {
  return (
    <div className="space-y-5">
      <section className={card}>
        <h2 className="font-semibold">Decision record</h2>
        <p className="mt-3 text-sm text-vds-muted">
          Requested by {item.requestedBy} · Decision: {item.decision} ·
          Approver: {item.humanApprover ?? "Awaiting decision"}
        </p>
        <p className="mt-2 text-sm text-vds-muted">
          Reason: {item.reason ?? "Awaiting decision"}
        </p>
      </section>
      <AuditList items={audit} />
    </div>
  );
}
export function AuditList({ items }: { items: readonly AuditEntry[] }) {
  return (
    <section>
      <h2 className="mb-3 font-semibold">Audit history</h2>
      <div className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <article
              key={item.id}
              className={`${card} border-l-2 border-l-vds-primary`}
            >
              <p className="font-medium">{item.event}</p>
              <p className="mt-1 text-xs text-vds-muted">
                {item.actorId} · {new Date(item.occurredAt).toLocaleString()}
              </p>
            </article>
          ))
        ) : (
          <Empty text="No audit transitions have been recorded." />
        )}
      </div>
    </section>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-vds-border p-12 text-center text-sm text-vds-muted">
      {text}
    </div>
  );
}
