import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { LeadRepository } from "@/features/vayon/lead/repositories/lead.repository";
import type { LeadRecord } from "@/features/vayon/lead/types";
import type { CrmRepository } from "../contracts/repository";
import type {
  CrmCompany,
  CrmLeadListQuery,
  CrmLeadProfile,
  CrmLeadRow,
  CrmPage,
  CrmRelatedItem,
  CrmTimelineItem,
} from "../domain/contracts";
import { CrmRulesService } from "../services/crm-rules.service";
type Row = Record<string, unknown>;
const money = (lead: LeadRecord) =>
  lead.budgetAmount
    ? new Intl.NumberFormat("en", {
        style: "currency",
        currency: lead.budgetAmount.currency,
        maximumFractionDigits: 0,
      }).format(lead.budgetAmount.amount)
    : "Not set";
const mapLead = (lead: LeadRecord): CrmLeadRow => ({
  id: lead.id,
  name: lead.name,
  phone: lead.phone,
  email: lead.email,
  budgetLabel: money(lead),
  source: lead.source,
  priority: lead.priority,
  status: lead.status,
  assignedAgent: lead.assignedAgentName ?? (lead.assignedEmployeeId ? "Assigned salesperson" : "Unassigned"),
  propertyInterest:
    lead.interestedPropertyNames[0] ?? lead.propertyType ?? "Not specified",
  lastActivity: lead.lastActivityAt,
  aiScore: lead.score,
  interestLevel: lead.interestLevel ?? "cold",
  intelligenceReason: lead.intelligenceReason ?? "More qualification evidence is required.",
  intelligenceRecommendation: lead.intelligenceRecommendation ?? "Capture budget, location, and purchase timeline.",
  intelligenceConfidence: lead.intelligenceConfidence ?? 0,
  intelligenceEvidence: lead.intelligenceEvidence,
  intelligenceUpdatedAt: lead.intelligenceUpdatedAt ?? lead.updatedAt,
  pipelineStage: lead.pipelineStage ?? "new",
  nextRecommendedAction: lead.nextRecommendedAction ?? "Qualify requirements",
  followUpDueAt: lead.followUpDueAt,
  createdAt: lead.createdAt,
  location: lead.preferredLocations[0],
  propertyType: lead.propertyType,
  tags: lead.tags,
});
export class SupabaseCrmRepository implements CrmRepository {
  readonly provider = "production" as const;
  private leadsRepository: LeadRepository;
  constructor(
    private client: SupabaseClient,
    private organizationId: string,
    private workspaceId: string,
  ) {
    this.leadsRepository = new LeadRepository(
      client,
      organizationId,
      workspaceId,
    );
  }
  async leads(q: CrmLeadListQuery): Promise<CrmPage<CrmLeadRow>> {
    const page = await this.leadsRepository.list({ ...q, view: "table" });
    return { ...page, items: page.items.map(mapLead) };
  }
  async customers(q: CrmLeadListQuery) {
    return this.leads(q);
  }
  async companies(): Promise<readonly CrmCompany[]> {
    return [];
  }
  async activities(limit = 100) {
    const { data, error } = await this.scoped("activity_events")
      .select("id,event_type,title,description,occurred_at")
      .order("occurred_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((row) => this.timeline(row as Row, "activity"));
  }
  async lead(id: string): Promise<CrmLeadProfile | null> {
    const record = await this.leadsRepository.detail(id);
    if (!record) return null;
    const lead = mapLead(record),
      queries = await Promise.all([
        this.related("deals", "lead_id", id, "name", "stage_id"),
        this.related("tasks", "related_id", id, "title", "status"),
        this.related("meetings", "related_id", id, "title", "status"),
        this.related("site_visits", "lead_id", id, "id", "status"),
        this.related(
          "lead_property_interests",
          "lead_id",
          id,
          "property_id",
          "created_at",
          false,
        ),
        Promise.resolve([] as Row[]),
        Promise.resolve([] as Row[]),
        this.related(
          "activity_events",
          "related_id",
          id,
          "title",
          "event_type",
          false,
        ),
      ]);
    const [
        deals,
        tasks,
        meetings,
        visits,
        properties,
        documents,
        payments,
        activity,
      ] = queries,
      communicationRows = await this.communications(id),recommendations=await this.recommendations(id);
    const communications = communicationRows.map((row) =>
      this.timeline(
        row,
        String(row.channel) === "email"
          ? "email"
          : String(row.channel) === "whatsapp"
            ? "whatsapp"
            : "activity",
      ),
    );
    const timeline = [
      ...communications,
      ...activity.map((row) => this.timeline(row, "activity")),
      ...meetings.map((row) =>
        this.timeline({ ...row, occurred_at: row.starts_at }, "meeting"),
      ),
      ...visits.map((row) =>
        this.timeline({ ...row, occurred_at: row.starts_at }, "site-visit"),
      ),
      ...payments.map((row) =>
        this.timeline({ ...row, occurred_at: row.created_at }, "payment"),
      ),
    ]
      .filter((item) => item.occurredAt && item.occurredAt !== "undefined")
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    return {
      lead,
      preferredLocations: record.preferredLocations,
      buyingPurpose: record.buyingPurpose,
      owner: lead.assignedAgent,
      timeline,
      properties: this.items(properties, "property"),
      deals: this.items(deals, "deal"),
      communications,
      meetings: this.items(meetings, "meeting"),
      tasks: this.items(tasks, "task"),
      documents: this.items(documents, "document"),
      insights: new CrmRulesService().insight(lead),
      recommendations,
    };
  }
  private async recommendations(id:string){const{data,error}=await this.client.from("crm_property_recommendations").select("*,properties(title,reference,sale_price,rental_price,currency,city,locality,bedrooms,area,area_unit,status)").eq("organization_id",this.organizationId).eq("workspace_id",this.workspaceId).eq("lead_id",id).order("overall_score",{ascending:false}).limit(12);if(error)throw error;return((data??[])as unknown as Array<Row&{properties:Row|null}>).map(row=>{const p=row.properties??{};const amount=p.sale_price??p.rental_price;return{id:String(row.id),propertyId:String(row.property_id),title:String(p.title??"Property"),reference:String(p.reference??""),price:amount==null?"Price on request":`${String(p.currency)} ${Number(amount).toLocaleString()}`,location:[p.locality,p.city].filter(Boolean).map(String).join(", "),bedrooms:p.bedrooms==null?undefined:Number(p.bedrooms),area:p.area==null?undefined:Number(p.area),status:String(p.status??"unavailable"),overallScore:Number(row.overall_score),budgetScore:Number(row.budget_score),locationScore:Number(row.location_score),bedroomScore:Number(row.bedroom_score),propertyTypeScore:Number(row.property_type_score),availabilityScore:Number(row.availability_score),investmentScore:Number(row.investment_score),rentalScore:Number(row.rental_score),lifestyleScore:Number(row.lifestyle_score),recommendation:String(row.recommendation),calculatedAt:String(row.calculated_at)}})}
  private scoped(table: string) {
    return this.client
      .from(table)
      .select("*")
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId);
  }
  private async related(
    table: string,
    column: string,
    id: string,
    title: string,
    status: string,
    softDelete = true,
  ) {
    let request = this.scoped(table).eq(column, id);
    if (softDelete) request = request.is("deleted_at", null);
    const { data, error } = await request;
    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...row,
      title: row[title],
      status: row[status],
    })) as Row[];
  }
  private async communications(id: string) {
    const { data, error } = await this.scoped("communications")
      .contains("metadata", { lead_id: id })
      .is("deleted_at", null)
      .order("occurred_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row[];
  }
  private timeline(row: Row, kind: CrmTimelineItem["kind"]): CrmTimelineItem {
    return {
      id: String(row.id),
      kind,
      title: String(row.title ?? row.body ?? row.event_type ?? kind),
      detail: row.description ? String(row.description) : undefined,
      occurredAt: String(row.occurred_at ?? row.created_at),
    };
  }
  private items(rows: Row[], kind: string): CrmRelatedItem[] {
    return rows.map((row) => ({
      id: String(row.id),
      kind,
      title: String(row.title ?? row.name ?? row.property_id ?? kind),
      status: String(row.status ?? "recorded"),
      meta: row.value ? String(row.value) : undefined,
    }));
  }
}
