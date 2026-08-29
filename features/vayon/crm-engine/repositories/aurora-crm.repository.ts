import {
  auroraBusinessActivity,
  auroraCompanies,
  auroraContacts,
  auroraDeals,
  auroraEmployees,
  auroraLeads,
  auroraMeetings,
  auroraProperties,
  auroraTasks,
} from "@/features/vayon/demo-workspace";
import type { CrmRepository } from "../contracts/repository";
import type {
  CrmCompany,
  CrmLeadListQuery,
  CrmLeadProfile,
  CrmLeadRow,
  CrmTimelineItem,
} from "../domain/contracts";
import { CrmRulesService } from "../services/crm-rules.service";
const row = (lead: (typeof auroraLeads)[number]): CrmLeadRow => {
  const contact = auroraContacts.find((item) => item.id === lead.contactId)!,
    property = auroraProperties.find(
      (item) => item.id === lead.preferredPropertyId,
    )!;
  return {
    id: lead.id,
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    budgetLabel: lead.budgetRange,
    source: lead.source,
    priority: lead.priority,
    status: lead.status,
    assignedAgent:
      auroraEmployees.find((item) => item.id === lead.salesAgentId)?.name ??
      "Aurora Sales",
    propertyInterest: property.name,
    lastActivity: lead.createdAt,
    aiScore:
      lead.priority === "urgent" ? 92 : lead.priority === "high" ? 78 : 64,
    interestLevel: lead.priority === "urgent" ? "excellent" : lead.priority === "high" ? "hot" : "warm",
    intelligenceReason: "Score reflects verified demo budget, property preference, source, and engagement evidence.",
    intelligenceRecommendation: "Confirm the next property action with the customer.",
    intelligenceConfidence: 88,
    intelligenceEvidence: [{signal:"verified demo profile",weight:30},{signal:"property preference",weight:20}],
    intelligenceUpdatedAt: lead.createdAt,
    pipelineStage: lead.status,
    nextRecommendedAction: "Confirm the next property action",
    followUpDueAt: lead.createdAt,
    createdAt: lead.createdAt,
    location: property.city,
    propertyType: property.propertyType,
    tags: property.tags,
  };
};
export class AuroraCrmRepository implements CrmRepository {
  readonly provider = "aurora-demo" as const;
  async leads(query: CrmLeadListQuery) {
    let items = auroraLeads.map(row);
    const term = query.search?.toLocaleLowerCase();
    if (term)
      items = items.filter((item) =>
        [
          item.name,
          item.phone,
          item.email ?? "",
          item.propertyInterest,
          item.location ?? "",
          ...item.tags,
        ].some((value) => value.toLocaleLowerCase().includes(term)),
      );
    if (query.status)
      items = items.filter((item) => item.status === query.status);
    if (query.priority)
      items = items.filter((item) => item.priority === query.priority);
    if (query.source)
      items = items.filter((item) => item.source === query.source);
    items.sort(
      (a, b) =>
        String(
          a[
            query.sort === "name"
              ? "name"
              : query.sort === "lead_score"
                ? "aiScore"
                : query.sort === "created_at"
                  ? "createdAt"
                  : "lastActivity"
          ] ?? "",
        ).localeCompare(
          String(
            b[
              query.sort === "name"
                ? "name"
                : query.sort === "lead_score"
                  ? "aiScore"
                  : query.sort === "created_at"
                    ? "createdAt"
                    : "lastActivity"
            ] ?? "",
          ),
        ) * (query.direction === "asc" ? 1 : -1),
    );
    const start = (query.page - 1) * query.pageSize;
    return {
      items: items.slice(start, start + query.pageSize),
      count: items.length,
      page: query.page,
      pageSize: query.pageSize,
    };
  }
  async customers(query: CrmLeadListQuery) {
    return this.leads(query);
  }
  async companies(search = ""): Promise<readonly CrmCompany[]> {
    const term = search.toLocaleLowerCase();
    return auroraCompanies
      .filter(
        (item) =>
          !term ||
          [item.name, item.industry, item.officeCity].some((value) =>
            value.toLocaleLowerCase().includes(term),
          ),
      )
      .map((item) => ({
        id: item.id,
        name: item.name,
        industry: item.industry,
        location: item.officeCity,
        relationship: item.relationshipStatus,
      }));
  }
  async activities(limit = 100) {
    return auroraBusinessActivity.timeline.events
      .slice(-limit)
      .reverse()
      .map((item) => ({
        id: item.eventId,
        kind: "activity" as const,
        title: item.summary,
        detail: item.eventName,
        occurredAt: item.occurredAt,
      }));
  }
  async lead(id: string): Promise<CrmLeadProfile | null> {
    const source = auroraLeads.find((item) => item.id === id);
    if (!source) return null;
    const lead = row(source),
      deals = auroraDeals.filter((item) => item.leadId === id),
      tasks = auroraTasks.filter((item) => item.leadId === id),
      meetings = auroraMeetings.filter((item) => item.leadId === id),
      communications = auroraBusinessActivity.communications
        .filter((item) => item.leadId === id)
        .map((item) => ({
          id: item.id,
          kind:
            item.channel === "whatsapp"
              ? ("whatsapp" as const)
              : item.channel === "email"
                ? ("email" as const)
                : ("activity" as const),
          title: item.subject,
          detail: item.preview,
          occurredAt: item.occurredAt,
        })),
      timeline = [
        ...communications,
        ...meetings.map((item) => ({
          id: item.id,
          kind:
            item.kind === "property-visit"
              ? ("site-visit" as const)
              : ("meeting" as const),
          title: item.title,
          detail: item.location,
          occurredAt: item.startsAt,
        })),
      ].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    const related = (
      items: readonly { id: string; title: string }[],
      kind: string,
      status: string,
    ) =>
      items.map((item) => ({ id: item.id, kind, title: item.title, status }));
    return {
      lead,
      preferredLocations: [lead.location!],
      buyingPurpose: source.buyingTimeline,
      owner: lead.assignedAgent,
      timeline,
      properties: [
        {
          id: source.preferredPropertyId,
          kind: "property",
          title: lead.propertyInterest,
          status: "interested",
        },
      ],
      deals: related(deals, "deal", deals[0]?.stage ?? "open"),
      communications: communications as readonly CrmTimelineItem[],
      meetings: related(meetings, "meeting", "scheduled"),
      tasks: tasks.map((item) => ({
        id: item.id,
        kind: "task",
        title: item.title,
        status: item.status,
        meta: item.dueAt,
      })),
      documents: [],
      insights: new CrmRulesService().insight(lead),
      recommendations: [],
    };
  }
}
