import Link from "next/link";
import { Bath, BedDouble, Building2, MapPin, Ruler } from "lucide-react";
import type { PropertyRecord } from "../types";
import { PropertyStatusBadge } from "./PropertyStatusBadge";

const money = (property: PropertyRecord) => {
  const value = property.salePrice ?? property.rentalPrice;
  return value ? new Intl.NumberFormat(undefined, { style: "currency", currency: value.currency, maximumFractionDigits: 0 }).format(value.amount) : "Price on request";
};

export function PropertyCard({ property }: { property: PropertyRecord }) {
  const facts = [
    [BedDouble, property.specification.bedrooms ?? "—", "Bedrooms"],
    [Bath, property.specification.bathrooms ?? "—", "Bathrooms"],
    [Ruler, property.specification.area ? `${property.specification.area}${property.specification.areaUnit ? ` ${property.specification.areaUnit}` : ""}` : "—", "Area"],
  ] as const;
  return <article className="vds-card-motion group overflow-hidden rounded-3xl border border-vds-border bg-vds-surface shadow-sm motion-reduce:transition-none">
    <div className="flex flex-wrap items-center gap-3 border-b border-vds-border px-5 py-3">
      <Building2 className="size-5 text-vds-primary" aria-hidden="true" />
      <PropertyStatusBadge status={property.status}/>
      <span className="text-xs text-vds-muted">{property.reference}</span>
    </div>
    <div className="p-5">
      <h2 className="break-words text-lg font-semibold"><Link href={`/vayon/properties/${property.id}`} className="focus-ring rounded hover:text-vds-primary">{property.title}</Link></h2>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-vds-muted"><MapPin className="size-4" aria-hidden="true"/>{property.address.locality ? `${property.address.locality}, ` : ""}{property.address.city}</p>
      <p className="mt-4 text-xl font-semibold text-vds-primary">{money(property)}</p>
      <dl className="mt-4 grid grid-cols-3 gap-2 border-y border-vds-divider py-3">{facts.map(([Icon,value,label])=><div key={label}><dt className="flex items-center gap-1 text-[10px] text-vds-subtle"><Icon className="size-4" aria-hidden="true"/>{label}</dt><dd className="mt-1 text-xs font-medium">{value}</dd></div>)}</dl>
      <p className="mt-4 text-sm text-vds-muted">{!property.description?.trim() ? "Next: add a property description" : !property.assignedAgentId ? "Next: assign a responsible agent" : "Next: review marketing and buyer activity"}</p>
      <Link href={`/vayon/properties/${property.id}`} className="focus-ring mt-5 inline-flex w-full justify-center rounded-xl border border-vds-border px-4 py-2.5 text-sm font-medium hover:border-vds-accent-border hover:bg-vds-hover">Open property</Link>
    </div>
  </article>;
}
