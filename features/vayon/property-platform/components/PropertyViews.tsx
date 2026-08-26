import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/features/platform/design-system";
import type {
  PropertyAnalytics,
  PropertyAsset,
  PropertyRecommendation,
  PropertyRelationships,
  PropertySnapshot,
} from "../domain/models";
import {
  formatPropertyPrice,
  propertyGroups,
  propertyTypeLabel,
} from "../view-models/property";
const card =
  "rounded-2xl border border-vds-border bg-vds-surface p-5 shadow-vds-sm";
export function PropertyPlatformHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header>
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">
        Property intelligence
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm text-vds-muted">{description}</p>
    </header>
  );
}
export function PropertyGrid({
  properties,
}: {
  properties: readonly PropertyAsset[];
}) {
  return (
    <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {properties.map((property) => (
        <article className={`${card} overflow-hidden p-0`} key={property.id}>
          {property.gallery[0] ? (
            <Image
              alt=""
              className="aspect-[16/9] w-full object-cover"
              height={360}
              src={property.gallery[0]}
              width={640}
            />
          ) : (
            <div aria-hidden="true" className="aspect-[16/9] bg-vds-elevated" />
          )}
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-vds-muted">
                  {property.referenceCode}
                </p>
                <h2 className="mt-1 font-semibold">
                  <Link href={`/vayon/properties/${property.id}`}>
                    {property.title}
                  </Link>
                </h2>
              </div>
              <span className="rounded-full border border-vds-border px-3 py-1 text-xs capitalize">
                {property.status.replaceAll("-", " ")}
              </span>
            </div>
            <p className="mt-3 text-sm text-vds-muted capitalize">
              {propertyTypeLabel(property.type)} · {property.location}
            </p>
            <p className="mt-4 text-lg font-semibold">
              {formatPropertyPrice(property)}
            </p>
            <p className="mt-2 text-xs text-vds-muted">
              {property.area
                ? `${property.area.toLocaleString()} ${property.areaUnit}`
                : "Area unavailable"}{" "}
              · {property.bedrooms ?? "—"} bed · {property.parking ?? "—"}{" "}
              parking
            </p>
          </div>
        </article>
      ))}
      {!properties.length && (
        <div className="col-span-full rounded-2xl border border-dashed border-vds-border p-8 text-center">
          <p className="font-medium">Create your first property listing.</p>
          <p className="mt-1 text-sm text-vds-muted">Add the essential details now; enrich the listing whenever you are ready.</p>
          <ButtonLink href="/vayon/properties/new" className="mt-4">Create property</ButtonLink>
        </div>
      )}
    </section>
  );
}
export function PropertyMap({
  properties,
}: {
  properties: readonly PropertyAsset[];
}) {
  return (
    <section
      className={`${card} mt-6 grid min-h-[34rem] gap-5 lg:grid-cols-[1.5fr_1fr]`}
    >
      <div className="grid place-items-center rounded-xl border border-dashed border-vds-border bg-vds-elevated text-center">
        <div>
          <p className="font-semibold">Provider-neutral map surface</p>
          <p className="mt-2 max-w-md text-sm text-vds-muted">
            Coordinates and map tiles remain unavailable until an approved maps
            provider is connected.
          </p>
        </div>
      </div>
      <div className="max-h-[34rem] space-y-2 overflow-auto [content-visibility:auto]">
        {properties.map((item) => (
          <article className="rounded-xl bg-vds-elevated p-4" key={item.id}>
            <p className="font-medium">{item.title}</p>
            <p className="mt-1 text-xs text-vds-muted">{item.location}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
export function AvailabilityBoard({
  snapshot,
}: {
  snapshot: PropertySnapshot;
}) {
  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-3">
      {propertyGroups(snapshot).map((group) => (
        <article className={card} key={group.status}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold capitalize">
              {group.status.replaceAll("-", " ")}
            </h2>
            <span className="text-sm text-vds-muted">{group.items.length}</span>
          </div>
          <div className="mt-4 space-y-2">
            {group.items.slice(0, 8).map((item) => (
              <Link
                className="block rounded-xl bg-vds-elevated p-3 text-sm hover:text-vds-primary"
                href={`/vayon/properties/${item.id}`}
                key={item.id}
              >
                {item.title}
              </Link>
            ))}
            {!group.items.length && (
              <p className="py-5 text-center text-xs text-vds-muted">
                No properties
              </p>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
export function DocumentLibrary({
  properties,
}: {
  properties: readonly PropertyAsset[];
}) {
  const documents = properties.flatMap((item) => item.documents);
  return (
    <section className={`${card} mt-6`}>
      <h2 className="font-semibold">Read-only property documents</h2>
      <div className="mt-4 divide-y divide-vds-divider">
        {documents.map((document) => (
          <article
            className="grid gap-2 py-4 sm:grid-cols-[1fr_auto]"
            key={document.id}
          >
            <div>
              <p className="font-medium">{document.title}</p>
              <p className="mt-1 text-xs text-vds-muted">
                Property {document.propertyId}
              </p>
            </div>
            <span className="self-start rounded-full border border-vds-border px-3 py-1 text-xs capitalize">
              {document.kind.replaceAll("-", " ")}
            </span>
          </article>
        ))}
        {!documents.length && (
          <p className="py-12 text-center text-sm text-vds-muted">
            No authoritative property documents are available.
          </p>
        )}
      </div>
    </section>
  );
}
export function AnalyticsPanel({
  analytics,
}: {
  analytics: PropertyAnalytics;
}) {
  return (
    <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Object.entries(analytics).map(([label, value]) => (
        <article className={card} key={label}>
          <p className="text-xs capitalize text-vds-muted">
            {label.replace(/([A-Z])/g, " $1")}
          </p>
          <p className="mt-3 text-xl font-semibold">{value}</p>
        </article>
      ))}
    </section>
  );
}
export function RelationshipPanel({
  relationship,
}: {
  relationship?: PropertyRelationships;
}) {
  const entries = relationship
    ? Object.entries(relationship).filter(([key]) => key !== "propertyId")
    : [];
  return (
    <section className={`${card} mt-6`}>
      <h2 className="font-semibold">Connected business context</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {entries.map(([label, items]) => (
          <article className="rounded-xl bg-vds-elevated p-4" key={label}>
            <p className="text-xs capitalize text-vds-muted">
              {label.replace(/([A-Z])/g, " $1")}
            </p>
            <p className="mt-2 font-semibold">
              {Array.isArray(items) ? items.length : 0}
            </p>
          </article>
        ))}
        {!entries.length && (
          <p className="text-sm text-vds-muted">
            Awaiting connected CRM, Communications, Calendar, Workflow, and
            Timeline data.
          </p>
        )}
      </div>
    </section>
  );
}
export function PropertyAI({
  recommendations,
}: {
  recommendations: readonly PropertyRecommendation[];
}) {
  return (
    <section className={`${card} mt-6`}>
      <h2 className="font-semibold">Deterministic property assistance</h2>
      <p className="mt-1 text-sm text-vds-muted">
        Advisory only. No external AI or autonomous actions.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {recommendations.map((item) => (
          <article className="rounded-xl bg-vds-elevated p-4" key={item.kind}>
            <p className="text-xs uppercase tracking-wide text-vds-primary">
              {item.kind.replaceAll("-", " ")}
            </p>
            <p className="mt-2 font-medium">{item.value}</p>
            <p className="mt-2 text-xs text-vds-muted">{item.rationale}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
