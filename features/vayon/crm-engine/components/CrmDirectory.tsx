import Link from "next/link";
import { SmartEmptyState } from "@/features/vayon/components/SmartEmptyState";
import type { CrmLeadRow, CrmTimelineItem } from "../domain/contracts";
import type { CompanyRecord } from "@/features/vayon/crm-company/domain";
export function CustomerDirectory({ items }: { items: readonly CrmLeadRow[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.length ? (
        items.map((item) => (
          <Link
            href={`/vayon/crm/leads/${item.id}`}
            key={item.id}
            className="rounded-2xl border border-vds-border bg-vds-surface p-5 hover:border-vds-border-strong"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-vds-primary-soft font-semibold text-vds-primary">
                {item.name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <h2 className="font-semibold">{item.name}</h2>
                <p className="text-xs text-vds-muted">
                  {item.email ?? item.phone}
                </p>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-vds-muted">Status</dt>
                <dd className="mt-1 capitalize">{item.status}</dd>
              </div>
              <div>
                <dt className="text-vds-muted">Owner</dt>
                <dd className="mt-1">{item.assignedAgent}</dd>
              </div>
              <div>
                <dt className="text-vds-muted">Interest</dt>
                <dd className="mt-1">{item.propertyInterest}</dd>
              </div>
              <div>
                <dt className="text-vds-muted">Source</dt>
                <dd className="mt-1">{item.source}</dd>
              </div>
            </dl>
          </Link>
        ))
      ) : (
        <SmartEmptyState
          className="col-span-full"
          title="Let's build your customer pipeline."
          description="Bring in your existing contacts or create the first relationship in your workspace."
          primaryLabel="Import CSV"
          primaryHref="/vayon/settings/integrations/data-import"
          secondaryActions={[
            { label: "Create Contact", href: "/vayon/leads/new" },
            { label: "Ask AI", href: "/vayon/ai" },
          ]}
        />
      )}
    </div>
  );
}
export function CompanyDirectory({ items }: { items: readonly CompanyRecord[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.length ? (
        items.map((item) => (
          <Link href={`/vayon/crm/companies/${item.id}`}
            key={item.id}
            className="rounded-2xl border border-vds-border bg-vds-surface p-5"
          >
            <h2 className="font-semibold">{item.name}</h2>
            <p className="mt-1 text-sm text-vds-muted">{item.industry ?? "Industry not recorded"}</p>
            <div className="mt-5 flex justify-between text-xs">
              <span>{item.address ?? item.country ?? "Location not recorded"}</span>
              <span className="rounded-full bg-vds-primary-soft px-2 py-1 text-vds-primary">
                {item.ownerName}
              </span>
            </div>
          </Link>
        ))
      ) : (
        <SmartEmptyState className="col-span-full" title="No Companies Yet" description="Create the first company to connect contacts, leads, deals, and properties in one account view." primaryLabel="Create Company" primaryHref="/vayon/crm/companies/new" />
      )}
    </div>
  );
}
export function ActivityDirectory({
  items,
}: {
  items: readonly CrmTimelineItem[];
}) {
  return (
    <div className="space-y-3">
      {items.length ? (
        items.map((item) => (
          <article
            key={item.id}
            className="flex gap-4 rounded-2xl border border-vds-border bg-vds-surface p-4"
          >
            <span className="mt-1 size-2 shrink-0 rounded-full bg-vds-primary" />
            <div>
              <p className="font-medium">{item.title}</p>
              {item.detail && (
                <p className="mt-1 text-sm text-vds-muted">{item.detail}</p>
              )}
              <p className="mt-2 text-xs capitalize text-vds-muted">
                {item.kind} · {new Date(item.occurredAt).toLocaleString()}
              </p>
            </div>
          </article>
        ))
      ) : (
        <Empty message="Workspace activity will appear after CRM records are updated." />
      )}
    </div>
  );
}
function Empty({ message }: { message: string }) {
  return (
    <div className="col-span-full rounded-2xl border border-dashed border-vds-border p-14 text-center text-sm text-vds-muted">
      {message}
    </div>
  );
}
