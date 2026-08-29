import {
  AnalyticsPanel,
  AvailabilityBoard,
  DocumentLibrary,
  PropertyAI,
  PropertyGrid,
  PropertyMap,
  PropertyPlatformHeader,
  RelationshipPanel,
} from "../components/PropertyViews";
import { PropertyPlatformService } from "../services/property-platform.service";
import { PropertyAnalyticsWidgets } from "../../real-estate-experience/RealEstateSurfaces";

export async function PropertyPlatformRoute({
  view,
}: {
  view: "grid" | "map" | "availability" | "documents" | "analytics";
}) {
  const service = await PropertyPlatformService.production(),
    snapshot = await service.snapshot(),
    first = snapshot.properties[0],
    relationship = first
      ? snapshot.relationships.find((item) => item.propertyId === first.id)
      : undefined;
  if (view === "grid")
    return (
      <main className="mx-auto max-w-[100rem] px-4 py-8 sm:px-5">
        <PropertyPlatformHeader
          title="Property grid"
          description="A responsive business asset inventory with pricing, location, availability, specifications, and optimized media placeholders."
        />
        <PropertyGrid properties={snapshot.properties} />
      </main>
    );
  if (view === "map")
    return (
      <main className="mx-auto max-w-[100rem] px-4 py-8 sm:px-5">
        <PropertyPlatformHeader
          title="Property map"
          description="A provider-neutral location workspace. No external map or MLS connection is active."
        />
        <PropertyMap properties={snapshot.properties} />
      </main>
    );
  if (view === "availability")
    return (
      <main className="mx-auto max-w-[100rem] px-4 py-8 sm:px-5">
        <PropertyPlatformHeader
          title="Availability"
          description="Read-only asset lifecycle visibility across available, reserved, negotiation, sold, inactive, and archived states."
        />
        <AvailabilityBoard snapshot={snapshot} />
      </main>
    );
  if (view === "documents")
    return (
      <main className="mx-auto max-w-[100rem] px-4 py-8 sm:px-5">
        <PropertyPlatformHeader
          title="Property documents"
          description="Brochures, floor plans, images, videos, contracts, approvals, and certificates remain read-only."
        />
        <DocumentLibrary properties={snapshot.properties} />
      </main>
    );
  return (
    <main className="mx-auto max-w-[100rem] px-4 py-8 sm:px-5">
      <PropertyPlatformHeader
        title="Property analytics"
        description="Evidence-safe analytics derived only from authoritative repository relationships. Unavailable metrics are never fabricated."
      />
      <AnalyticsPanel analytics={service.analytics(snapshot)} />
      <PropertyAnalyticsWidgets />
      <RelationshipPanel relationship={relationship} />
      {first && (
        <PropertyAI
          recommendations={service.recommendations(snapshot, first.id)}
        />
      )}
    </main>
  );
}
