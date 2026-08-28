import {
  auroraBusinessActivity,
  auroraContacts,
  auroraDeals,
  auroraEmployees,
  auroraLeads,
  auroraProperties,
} from "@/features/vayon/demo-workspace";
import type {
  DemoInventory,
  DemoRecord,
  DemoRepository,
} from "../domain/contracts";
import { convertToUsd } from "@/features/marketing/currency/currency";

const frozen = <T>(value: T): T => Object.freeze(value);
export class AuroraDemoRepository implements DemoRepository {
  load(): DemoInventory {
    const demoPropertyTypes = [
      "apartment",
      "villa",
      "commercial office",
      "retail",
      "plot",
      "luxury home",
    ] as const;
    const properties = Array.from({ length: 500 }, (_, index) => {
      const item = auroraProperties[index % auroraProperties.length]!,
        assignedAgent = auroraEmployees[index % 18]!,
        bedrooms =
          item.propertyType.includes("commercial") ||
          item.propertyType === "plot"
            ? 0
            : 1 + (index % 5),
        bathrooms =
          bedrooms === 0
            ? 1 + (index % 3)
            : Math.max(1, bedrooms - (index % 2));
      return frozen<DemoRecord>({
        id: `prime-property-${index + 1}`,
        kind: "properties",
        title: `${item.name} · ${String(index + 1).padStart(3, "0")}`,
        subtitle: `${12 + (index % 88)} ${item.locality} Road, ${item.city}`,
        status: item.status,
        meta: [
          demoPropertyTypes[index % demoPropertyTypes.length]!,
          `${bedrooms} bedrooms`,
          `${bathrooms} bathrooms`,
          `${item.areaSquareFeet.toLocaleString("en-IN")} sq ft`,
          assignedAgent.name,
        ],
        image: item.thumbnailPlaceholder,
        monetaryRangeUsd: {
          minimum:
            item.priceRange.minimum == null
              ? undefined
              : convertToUsd(item.priceRange.minimum, "INR"),
          maximum:
            item.priceRange.maximum == null
              ? undefined
              : convertToUsd(item.priceRange.maximum, "INR"),
        },
      });
    });
    const leadStatuses = [
      "new",
      "qualified",
      "contacted",
      "appointment-scheduled",
      "property-visit",
      "negotiation",
      "won",
      "lost",
    ] as const;
    const leads = Array.from({ length: 1000 }, (_, index) => {
      const source = auroraLeads[index % auroraLeads.length]!,
        contact = auroraContacts.find((item) => item.id === source.contactId)!;
      return frozen<DemoRecord>({
        id: `demo-lead-${index + 1}`,
        kind: "leads",
        title:
          index < auroraLeads.length
            ? contact.name
            : `${contact.name} · Portfolio ${Math.floor(index / auroraLeads.length) + 1}`,
        subtitle: `${contact.email} · ${contact.phone}`,
        status: leadStatuses[index % leadStatuses.length]!,
        meta: [
          source.priority,
          source.budgetRange,
          source.source.replaceAll("-", " "),
          properties[index % properties.length]!.title,
          source.buyingTimeline.replaceAll("-", " "),
        ],
      });
    });
    const deals = auroraDeals.map((item) => {
      const property = auroraProperties.find(
          (property) => property.id === item.propertyId,
        )!,
        contact = auroraContacts.find(
          (contact) => contact.id === item.primaryContactId,
        )!;
      return frozen<DemoRecord>({
        id: item.id,
        kind: "deals",
        title: property.name,
        subtitle: contact.name,
        status: item.stage,
        meta: [
          property.city,
          auroraEmployees.find((person) => person.id === item.salesAgentId)
            ?.name ?? "Assigned sales team",
        ],
        monetaryRangeUsd: {
          minimum:
            property.priceRange.minimum == null
              ? undefined
              : convertToUsd(property.priceRange.minimum, "INR"),
          maximum:
            property.priceRange.maximum == null
              ? undefined
              : convertToUsd(property.priceRange.maximum, "INR"),
        },
      });
    });
    const whatsappBase = auroraBusinessActivity.communications.filter(
      (item) => item.channel === "whatsapp",
    );
    const communications = Array.from({ length: 240 }, (_, index) => {
      const item = whatsappBase[index % whatsappBase.length]!,
        contact = auroraContacts.find((value) => value.id === item.contactId)!;
      return frozen<DemoRecord>({
        id: `demo-whatsapp-${index + 1}`,
        kind: "communications",
        title: contact.name,
        subtitle: item.preview,
        status:
          index % 7 === 0 ? "unread" : index % 19 === 0 ? "typing" : "replied",
        meta: [
          [
            "email thread",
            "whatsapp conversation",
            "meeting notes",
            "call summary",
          ][index % 4]!,
          item.direction,
          item.subject,
        ],
        occurredAt: item.occurredAt,
      });
    });
    const activity = auroraBusinessActivity.timeline.events
      .slice(-720)
      .reverse()
      .map((item) =>
        frozen<DemoRecord>({
          id: item.eventId,
          kind: "activity",
          title: item.summary,
          subtitle: item.eventName,
          status: item.severity,
          meta: [item.category, item.priority, item.source.module],
          occurredAt: item.occurredAt,
        }),
      );
    return frozen({
      organization: "Prime Properties Realty",
      persistence: "seeded-json-fixtures",
      readOnly: true,
      properties: frozen(properties),
      leads: frozen(leads),
      deals: frozen(deals),
      communications: frozen(communications),
      activity: frozen(activity),
    });
  }
}
