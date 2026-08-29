import Link from "next/link";
import { Bath, BedDouble, Building2, MapPin, Ruler, Sparkles, Users } from "lucide-react";
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
    <div className="relative grid aspect-[16/8] place-items-center bg-gradient-to-br from-vds-primary-soft via-vds-elevated to-vds-background">
      <Building2 className="size-9 text-vds-primary/70" aria-hidden="true" />
      <span className="sr-only">No verified property hero image available</span>
      <div className="absolute left-4 top-4"><PropertyStatusBadge status={property.status}/></div>
      <span className="absolute right-4 top-4 rounded-full bg-vds-surface/90 px-2.5 py-1 text-[10px] text-vds-muted backdrop-blur">{property.reference}</span>
    </div>
    <div className="p-5">
      <h2 className="text-lg font-semibold"><Link href={`/vayon/properties/${property.id}`} className="focus-ring rounded hover:text-vds-primary">{property.title}</Link></h2>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-vds-muted"><MapPin className="size-4" aria-hidden="true"/>{property.address.locality ? `${property.address.locality}, ` : ""}{property.address.city}</p>
      <p className="mt-4 text-xl font-semibold text-vds-primary">{money(property)}</p>
      <dl className="mt-4 grid grid-cols-3 gap-2 border-y border-vds-divider py-3">{facts.map(([Icon,value,label])=><div key={label}><dt className="flex items-center gap-1 text-[10px] text-vds-subtle"><Icon className="size-4" aria-hidden="true"/>{label}</dt><dd className="mt-1 text-xs font-medium">{value}</dd></div>)}</dl>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div><dt className="flex items-center gap-1 text-vds-muted"><Sparkles className="size-4" aria-hidden="true"/>AI listing score</dt><dd className="mt-1 font-semibold">{property.aiScore == null ? "Unavailable" : `${property.aiScore}/100`}</dd></div>
        <div><dt className="flex items-center gap-1 text-vds-muted"><Users className="size-4" aria-hidden="true"/>Interested buyers</dt><dd className="mt-1 font-semibold">Unavailable</dd></div>
        <div><dt className="text-vds-muted">Demand score</dt><dd className="mt-1 font-semibold">Unavailable</dd></div>
        <div><dt className="text-vds-muted">Viewing requests</dt><dd className="mt-1 font-semibold">Unavailable</dd></div>
        <div><dt className="text-vds-muted">Days on market</dt><dd className="mt-1 font-semibold">Unavailable</dd></div>
        <div><dt className="text-vds-muted">Assigned agent</dt><dd className="mt-1 font-semibold">{property.assignedAgentName ?? "Unassigned"}</dd></div>
      </dl>
      <Link href={`/vayon/properties/${property.id}`} className="focus-ring mt-5 inline-flex w-full justify-center rounded-xl border border-vds-border px-4 py-2.5 text-sm font-medium hover:border-vds-accent-border hover:bg-vds-hover">Open property command center</Link>
    </div>
  </article>;
}
