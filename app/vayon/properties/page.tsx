import { WorkspaceHeader } from "@/features/platform/design-system/layout/WorkspaceLayouts";
﻿import Link from "next/link";
import { Button, ButtonLink } from "@/features/platform/design-system";
import { archivePropertiesAction } from "@/features/vayon/property/actions/property.actions";
import { PropertyCard } from "@/features/vayon/property/components/PropertyCard";
import { PropertyTable } from "@/features/vayon/property/components/PropertyTable";
import { PropertyToolbar } from "@/features/vayon/property/components/PropertyToolbar";
import { PropertyService } from "@/features/vayon/property/services/property.service";
import { propertyListSchema } from "@/features/vayon/property/validation/property";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const raw = await searchParams, parsed = propertyListSchema.safeParse(raw);
  const query = parsed.success ? parsed.data : propertyListSchema.parse({});
  const data = await new PropertyService().list(query);
  const attention = data.items.filter(property => !property.description?.trim() || !property.assignedAgentId);
  const pageHref = (page: number) => `?${new URLSearchParams({ ...Object.fromEntries(Object.entries(raw).filter((entry): entry is [string, string] => typeof entry[1] === "string")), page: String(page) })}#inventory`;
  return <div className="min-w-0 py-4">
    <WorkspaceHeader breadcrumbs={false} className="sticky top-16 z-20 border-b border-vds-border bg-vds-background/95 py-3 backdrop-blur-lg">
      <nav aria-label="Breadcrumb" className="text-xs text-vds-muted"><Link href="/vayon/dashboard" className="focus-ring">Dashboard</Link><span aria-hidden="true"> / </span><span aria-current="page">Properties</span></nav>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Properties</h1><p className="mt-1 text-sm text-vds-muted">Which properties need your attention? Choose a record to take the next step.</p></div><ButtonLink href="/vayon/properties/new">Create Property</ButtonLink></div>
    </WorkspaceHeader>
    {attention.length > 0 && <section className="mt-5 rounded-2xl border border-vds-border p-4" aria-labelledby="property-attention"><h2 id="property-attention" className="font-semibold">Needs attention on this page</h2><ul className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{attention.map(property => <li key={property.id}><Link href={`/vayon/properties/${property.id}/edit`} className="focus-ring block rounded-xl bg-vds-elevated p-3"><span className="block break-words font-medium">{property.title}</span><span className="mt-1 block text-sm text-vds-muted">{!property.description?.trim() ? "Add a property description" : "Assign a responsible agent"}</span></Link></li>)}</ul></section>}
    <PropertyToolbar query={raw}/>
    <section id="inventory" className="mt-6 scroll-mt-40" aria-labelledby="inventory-title"><div className="flex flex-wrap items-center justify-between gap-3"><h2 id="inventory-title" className="text-xl font-semibold">Your properties</h2><div className="flex gap-3 text-sm"><Link className="focus-ring min-h-11 py-3" href="?view=table#inventory">Table</Link><Link className="focus-ring min-h-11 py-3" href="?view=grid#inventory">Grid</Link><Link className="focus-ring min-h-11 py-3" href="/vayon/properties/analytics">Analytics</Link></div></div>
      {!data.items.length ? <div className="mt-5 rounded-2xl border border-dashed border-vds-border p-6"><h3 className="font-semibold">No properties in this view</h3><p className="mt-2 text-sm text-vds-muted">Create your first property using the button above, then complete its details and plan your next buyer conversation.</p><Link href="/vayon/properties" className="focus-ring mt-3 inline-block min-h-11 py-3 text-sm text-vds-primary">Clear filters</Link></div> : query.view === "grid" ? <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{data.items.map(property => <PropertyCard key={property.id} property={property}/>)}</div> : <form action={archivePropertiesAction} className="mt-5"><Button variant="control" className="mb-3 rounded-xl border border-vds-border px-4 py-3 text-sm">Bulk archive</Button><PropertyTable items={data.items}/></form>}
      <footer className="mt-5 flex flex-wrap justify-between gap-3 text-sm text-vds-muted"><span>Page {data.page} / {Math.max(1, Math.ceil(data.count / data.pageSize))} - {data.count} results</span><div className="flex gap-4">{data.page > 1 && <Link className="focus-ring min-h-11 py-3" href={pageHref(data.page - 1)}>Previous</Link>}{data.page * data.pageSize < data.count && <Link className="focus-ring min-h-11 py-3" href={pageHref(data.page + 1)}>Next</Link>}</div></footer>
    </section>
  </div>;
}
