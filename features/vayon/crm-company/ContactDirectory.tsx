import Link from "next/link";
import type { ContactRecord } from "./domain";
import { SmartEmptyState } from "@/features/vayon/components/SmartEmptyState";

export function ContactDirectory({ items, search }: { items: readonly ContactRecord[]; search?: string }) {
  return <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
    {items.length ? items.map(item => <Link key={item.id} href={`/vayon/crm/contacts/${item.id}`} className="vds-focus vds-card-motion rounded-2xl border border-vds-border bg-vds-surface p-5 shadow-sm hover:border-vds-accent-border motion-reduce:transition-none">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-vds-primary-soft font-semibold">{item.name.slice(0, 2).toUpperCase()}</span>
        <div className="min-w-0"><h2 className="break-words font-semibold">{item.name}</h2><p className="text-xs text-vds-muted">{item.position || item.relationship}</p></div>
      </div>
      <dl className="mt-5 grid gap-3 text-sm">
        <div><dt className="text-xs text-vds-muted">Company</dt><dd className="mt-1 break-words">{item.companyName}</dd></div>
        <div><dt className="text-xs text-vds-muted">Relationship owner</dt><dd className="mt-1">{item.ownerName}</dd></div>
        {item.email && <div><dt className="text-xs text-vds-muted">Email</dt><dd className="mt-1 break-all">{item.email}</dd></div>}
        {item.phone && <div><dt className="text-xs text-vds-muted">Phone</dt><dd className="mt-1">{item.phone}</dd></div>}
      </dl>
      <p className="mt-4 border-t border-vds-divider pt-3 text-sm font-medium">Open client profile →</p>
    </Link>) : search?.trim() ? <SmartEmptyState className="col-span-full" title="No clients match this search" description="Try another client name, email address or phone number." primaryLabel="Clear client search" primaryHref="/vayon/crm/contacts" /> : <SmartEmptyState className="col-span-full" title="No clients yet" description="Client profiles are created from people recorded in Leads. Go to Leads to add or update a client’s details." primaryLabel="Go to Leads" primaryHref="/vayon/leads" />}
  </div>;
}
