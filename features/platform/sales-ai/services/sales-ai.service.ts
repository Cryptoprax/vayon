import "server-only";
import { operationsContext } from "@/features/vayon/operations/services/context";
import type { SalesAIRepositoryContract } from "../contracts/repository";
import { SupabaseSalesAIRepository } from "../repositories/supabase-sales-ai.repository";
import type { SalesAIDashboard, SalesCopilotAction, SalesCopilotConfidence, SalesCopilotRecommendation } from "../types";
import type { SalesEvidence } from "../contracts/repository";
import { GmailPlatformService } from "@/features/platform/gmail/services/gmail-platform.service";
import { GoogleCalendarPlatformService } from "@/features/platform/google-calendar/services/google-calendar.service";

export class SalesAIService {
  constructor(private repository: SalesAIRepositoryContract) {}
  static async production() { const context = await operationsContext(); return new SalesAIService(new SupabaseSalesAIRepository(context.client, context.organizationId, context.workspaceId)); }
  private recommendation(id: string, title: string, reason: string, evidence: readonly string[], action: SalesCopilotAction, confidence: SalesCopilotConfidence, missingInformation: readonly string[] = []): SalesCopilotRecommendation {
    const query = new URLSearchParams({ intent: action, source: "sales-copilot", recommendation: id });
    return { id, title, reason, evidence, action, confidence, missingInformation, approvalHref: `/vayon/approvals?${query}`, approvalRequired: true, executable: false };
  }
  private project(evidence: SalesEvidence): SalesAIDashboard {
    const activeDeals = evidence.deals.filter((deal) => !/won|lost|closed/i.test(deal.stage));
    const weighted = activeDeals.reduce((sum, deal) => sum + deal.value * deal.probability / 100, 0), atRisk = activeDeals.filter((deal) => deal.risk === "high");
    const health = atRisk.length > activeDeals.length / 2 ? "critical" : atRisk.length || evidence.overdueTasks ? "watch" : "healthy";
    const priorities = [...atRisk.slice(0, 3).map((deal) => `Recover ${deal.title}: ${deal.nextAction}`), ...evidence.leads.filter((lead) => lead.temperature === "hot").slice(0, 3).map((lead) => `Follow up with ${lead.name}: ${lead.explanation}`), ...(evidence.overdueTasks ? [`Resolve ${evidence.overdueTasks} overdue follow-up${evidence.overdueTasks === 1 ? "" : "s"}`] : [])].slice(0, 6);
    const cleanup = [[evidence.duplicateLeadCount, "potential duplicate leads"], [evidence.missingFieldCount, "leads with missing qualification fields"], [evidence.unassignedLeadCount, "unassigned leads"], [evidence.slowResponseCount, "leads with long response times"]] as const;
    const dailyPriorities = [
      ...atRisk.slice(0, 3).map((deal) => this.recommendation(`deal-${deal.id}`, `Recover ${deal.title}`, deal.nextAction, [`${deal.daysInStage} days in ${deal.stage}`, `${deal.probability}% recorded close probability`, ...deal.missingActivities], deal.missingActivities.some((item) => /document/i.test(item)) ? "request_documents" : "call", deal.missingActivities.length ? "medium" : "high", deal.missingActivities)),
      ...evidence.leads.filter((lead) => lead.temperature === "hot").slice(0, 3).map((lead) => this.recommendation(`lead-${lead.id}`, `Follow up with ${lead.name}`, lead.explanation, [lead.explanation, lead.lastActivity ? `Last activity: ${lead.lastActivity}` : "Last activity unavailable"], "whatsapp", lead.confidence >= .8 ? "high" : "medium", lead.lastActivity ? [] : ["Last contact date"])),
      ...(evidence.overdueTasks ? [this.recommendation("overdue-follow-ups", `Resolve ${evidence.overdueTasks} overdue follow-ups`, "Recorded tasks are overdue and may delay customer commitments.", [`${evidence.overdueTasks} overdue task${evidence.overdueTasks === 1 ? "" : "s"}`], "call", "high")] : []),
    ].slice(0, 8);
    const recent = evidence.recentCommunications.slice(0, 5);
    return { briefing: { priorities, upcomingMeetings: evidence.meetings.length, overdueFollowUps: evidence.overdueTasks, dealsAtRisk: atRisk.length, highValueOpportunities: activeDeals.filter((deal) => deal.value >= 10_000_000 && deal.risk !== "high").length, expectedRevenue: weighted }, dailyPriorities, conversation: { conversationSummary: recent.length ? `${recent.length} recent verified email or WhatsApp interactions are available for review.` : "No verified email or WhatsApp conversation evidence is available.", actionItems: dailyPriorities.map((item) => item.title).slice(0, 5), risks: atRisk.map((deal) => `${deal.title}: ${deal.nextAction}`).slice(0, 5), nextSteps: dailyPriorities.map((item) => item.reason).slice(0, 5), pendingQuestions: [evidence.missingFieldCount ? `${evidence.missingFieldCount} leads need qualification fields.` : null, evidence.unassignedLeadCount ? `${evidence.unassignedLeadCount} leads need an owner.` : null, recent.length ? null : "Which customer conversations should be connected?"].filter((item): item is string => Boolean(item)) }, leads: evidence.leads, deals: activeDeals, forecast: { expectedMonthlyRevenue: weighted, likelyClosedDeals: activeDeals.filter((deal) => deal.probability >= 70 && deal.risk !== "high").length, atRiskRevenue: atRisk.reduce((sum, deal) => sum + deal.value, 0), pipelineHealth: health, confidence: activeDeals.length ? Math.min(.95, .55 + activeDeals.length * .025) : .2, explanation: activeDeals.length ? `Weighted from ${activeDeals.length} active deals using recorded probability, stage age, and missing-activity risk.` : "No active deal evidence is available; forecast confidence is low." }, pendingApprovals: evidence.pendingApprovals, recommendations: evidence.recommendations, timeline: evidence.timeline, crmCleanup: cleanup.filter(([count]) => count > 0).map(([count, label]) => `${count} ${label}`), observability: evidence.observability, generatedAt: new Date().toISOString() };
  }
  async dashboard(): Promise<SalesAIDashboard> { return this.project(await this.repository.evidence()); }
  async runtimeContext() {
    const [evidence, gmail, calendar] = await Promise.all([
      this.repository.evidence(),
      new GmailPlatformService().health(),
      new GoogleCalendarPlatformService().health(),
    ]);
    const data = this.project(evidence);
    return JSON.stringify({ generatedAt: data.generatedAt, briefing: data.briefing, dailyPriorities: data.dailyPriorities, conversation: data.conversation, topLeads: data.leads.slice(0, 20), deals: data.deals.slice(0, 20), recentEmailAndWhatsApp: evidence.recentCommunications, meetings: evidence.meetings, forecast: data.forecast, crmCleanup: data.crmCleanup, integrations: { gmail: gmail.connection, googleCalendar: calendar.connection, whatsapp: evidence.recentCommunications.some((item) => item.channel === "whatsapp") ? "workspace records available" : "no workspace records" }, governance: { recommendationOnly: true, approvalRequired: true, sendingAllowed: false } });
  }
}
