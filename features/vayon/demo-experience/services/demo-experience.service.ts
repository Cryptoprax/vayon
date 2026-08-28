import {
  auroraDeals,
  auroraEmployees,
  auroraMeetings,
  auroraProperties,
  auroraTasks,
} from "@/features/vayon/demo-workspace";
import type {
  ChartPoint,
  DashboardActivity,
  ExecutiveDashboardData,
  KpiMetric,
  PipelineColumn,
} from "@/features/vayon/dashboard/types";
import type { DemoExperienceModel, DemoRepository } from "../domain/contracts";
import { AuroraDemoRepository } from "../repository/aurora-demo.repository";
import { AuroraEnterpriseDemoRepository } from "../repository/aurora-enterprise.repository";
import {
  convertToUsd,
  formatMarketingCurrency,
} from "@/features/marketing/currency/currency";

const stages = [
  "new",
  "qualified",
  "contacted",
  "appointment-scheduled",
  "property-visit",
  "negotiation",
  "won",
  "lost",
] as const;
const usd = (value: number) => convertToUsd(value, "INR");
const money = (valueUsd: number) =>
  formatMarketingCurrency(valueUsd, "USD", true);
export class DemoExperienceService {
  constructor(
    private readonly repository: DemoRepository = new AuroraDemoRepository(),
    private readonly enterpriseRepository = new AuroraEnterpriseDemoRepository(),
  ) {}
  load(): DemoExperienceModel {
    const inventory = this.repository.load(),
      activeLeads = inventory.leads.filter(
        (item) => !["converted", "closed"].includes(item.status),
      ),
      activeDeals = auroraDeals.filter(
        (item) => !["closed-won", "closed-lost"].includes(item.stage),
      );
    const value = (deal: (typeof auroraDeals)[number]) =>
      usd(
        auroraProperties.find((item) => item.id === deal.propertyId)?.priceRange
          .minimum ?? 0,
      );
    const pipelineValue = activeDeals.reduce(
        (sum, item) => sum + value(item),
        0,
      ),
      won = auroraDeals.filter((item) => item.stage === "closed-won"),
      revenue = won.reduce((sum, item) => sum + value(item), 0);
    const kpis: KpiMetric[] = [
      {
        key: "revenue",
        label: "Revenue",
        value: revenue,
        displayValue: money(revenue),
        detail: "Six-month closed-won value",
        trend: 18,
        sparkline: [42, 48, 51, 58, 63, 71, 79],
        icon: "revenue",
        href: "/demo",
      },
      {
        key: "leads",
        label: "Active Leads",
        value: activeLeads.length,
        displayValue: String(activeLeads.length),
        detail: `${inventory.leads.length} total buyers`,
        trend: 12,
        sparkline: [44, 52, 49, 61, 68, 72, 76],
        icon: "leads",
        href: "/demo",
      },
      {
        key: "deals",
        label: "Deals",
        value: activeDeals.length,
        displayValue: String(activeDeals.length),
        detail: `${money(pipelineValue)} pipeline`,
        trend: 9,
        sparkline: [28, 30, 34, 38, 41, 44, 48],
        icon: "deals",
        href: "/demo",
      },
      {
        key: "ai",
        label: "AI Employees",
        value: 7,
        displayValue: "7 Online",
        detail: "Advisory demo workforce",
        trend: 0,
        sparkline: [62, 68, 71, 75, 81, 84, 88],
        icon: "ai",
        href: "/demo",
      },
    ];
    const pipeline: PipelineColumn[] = stages.map((stage) => {
      const records = inventory.leads.filter((item) => item.status === stage),
        sampleValue = records.reduce(
          (sum, _, index) =>
            sum + value(auroraDeals[index % auroraDeals.length]!),
          0,
        );
      return {
        id: stage,
        label: stage
          .replaceAll("-", " ")
          .replace(/\b\w/g, (value) => value.toUpperCase()),
        count: records.length,
        value: sampleValue,
        trend: (stages.indexOf(stage) + 1) * 3,
        href: "/demo",
      };
    });
    const charts: ChartPoint[] = Array.from({ length: 6 }, (_, index) => {
      const monthDeals = auroraDeals.filter(
          (_, position) => position % 6 === index,
        ),
        monthWon = monthDeals.filter((item) => item.stage === "closed-won"),
        leadCount = inventory.leads.filter(
          (_, position) => position % 6 === index,
        ).length;
      return {
        label: ["Mar", "Apr", "May", "Jun", "Jul", "Aug"][index]!,
        revenue: monthWon.reduce((sum, item) => sum + value(item), 0),
        pipeline: monthDeals.reduce((sum, item) => sum + value(item), 0),
        leads: leadCount,
        conversion: leadCount
          ? Math.round((monthWon.length / leadCount) * 100)
          : 0,
        sales: monthWon.length,
      };
    });
    const activities: DashboardActivity[] = inventory.activity
      .slice(0, 12)
      .map((item) => ({
        id: item.id,
        eventType: item.subtitle,
        title: item.title,
        occurredAt: item.occurredAt!,
        workspace: "Prime Properties Realty",
        href: "/demo",
      }));
    const workforceNames = [
      "AI Sales Manager",
      "AI Marketing Manager",
      "AI Operations Manager",
      "AI Customer Success Manager",
      "AI Founder Assistant",
    ];
    const dashboard: ExecutiveDashboardData = {
      organizationName: "Prime Properties Realty",
      workspaceName:
        "Residential + Commercial Brokerage · 18 Agents · Established 2018",
      currency: "USD",
      kpis,
      pipeline,
      charts,
      activities,
      calendar: auroraMeetings.slice(0, 8).map((item) => ({
        id: item.id,
        kind: item.kind === "property-visit" ? "visit" : "meeting",
        title: item.title,
        startsAt: item.startsAt,
        meta: item.location,
        href: "/demo",
      })),
      ai: {
        conversations: inventory.communications.length,
        appointments: auroraMeetings.length,
        followUps: auroraTasks.filter((item) => item.kind === "follow-up")
          .length,
        recommendations: inventory.properties.length,
        emails: 120,
        whatsapp: inventory.communications.length,
      },
      aiWorkforce: workforceNames.map((name, index) => ({
        id: `demo-ai-${index + 1}`,
        name,
        role: [
          "Sales and lead qualification",
          "Marketing and campaign planning",
          "Operations and workflow coordination",
          "Buyer follow-up and appointments",
          "Founder briefings and growth",
        ][index]!,
        status: "online",
        tasksCompleted: 84 + index * 13,
        efficiency: 88 + (index % 8),
      })),
      whatsappConversations: inventory.communications
        .slice(0, 6)
        .map((item) => ({
          id: item.id,
          customer: item.title,
          message: item.subtitle,
          occurredAt: item.occurredAt!,
          unread: item.status === "unread",
        })),
      notifications: [],
      usage: [],
      isEmpty: false,
    };
    return Object.freeze({
      dashboard,
      inventory,
      enterprise: this.enterpriseRepository.load(),
      counts: {
        users: auroraEmployees.length,
        properties: inventory.properties.length,
        leads: inventory.leads.length,
        deals: inventory.deals.length,
        whatsapp: inventory.communications.length,
        activity: inventory.activity.length,
      },
    });
  }
}
