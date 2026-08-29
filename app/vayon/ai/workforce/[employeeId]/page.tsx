import { notFound } from "next/navigation";
import { EmployeeProfile } from "@/features/vayon/operational-workforce/components/WorkforceViews";
import { WorkforceShell } from "@/features/vayon/operational-workforce/components/WorkforceShell";
import { WorkforceService } from "@/features/vayon/operational-workforce/services/workforce.service";
import { WorkforceRuntimeService } from "@/features/platform/openai/runtime/service";
import { WorkforceChatPanel } from "@/features/platform/openai/runtime/ChatPanel";
import type { AIEmployeeCode } from "@/features/platform/openai/domain/models";
import { SalesAIDashboard, SalesAIService } from "@/features/platform/sales-ai";
import { CRMAIDashboard, CRMAIService } from "@/features/platform/crm-ai";
import { WhatsAppAIDashboard, WhatsAppAIService } from "@/features/platform/whatsapp-ai";
import { MarketingAIDashboard, MarketingAIService } from "@/features/platform/marketing-ai";
import { ExecutiveAIDashboard, ExecutiveAIService } from "@/features/platform/executive-ai";
import { AICollaborationService, ExecutiveCollaborationDashboard } from "@/features/platform/ai-collaboration";
import dynamic from "next/dynamic";
import { EmployeeIdentityPanel } from "@/features/vayon/operational-workforce/components/EmployeeIdentityPanel";
const EmployeeHeadquartersSecondary = dynamic(() => import("@/features/vayon/operational-workforce/components/EmployeeHeadquartersSecondary"));
const EmployeeMemoryPanel = dynamic(() => import("@/features/vayon/operational-workforce/components/EmployeeMemoryPanel"));
const EmployeeCollaborationPanel = dynamic(() => import("@/features/vayon/operational-workforce/components/EmployeeCollaborationPanel"));
const EmployeeDailyWorkspace = dynamic(() => import("@/features/vayon/operational-workforce/components/EmployeeDailyWorkspace"));
export default async function Page({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  const result = await (
    await WorkforceService.production()
  ).employee(employeeId);
  if (!result.employee) notFound();
  const runtime = await WorkforceRuntimeService.production();
  const employee = result.employee.code as AIEmployeeCode;
  const [history, health] = await Promise.all([
    runtime.history(employee).catch(() => ({ conversations: [], messages: [] })),
    runtime.health(),
  ]);
  const salesDashboard = employee === "sales-ai" ? await (await SalesAIService.production()).dashboard() : null;
  const crmDashboard = employee === "crm-ai" ? await (await CRMAIService.production()).dashboard() : null;
  const whatsappDashboard = employee === "whatsapp-ai" ? await (await WhatsAppAIService.production()).dashboard() : null;
  const marketingDashboard = employee === "marketing-ai" ? await (await MarketingAIService.production()).dashboard() : null;
  const executiveDashboard = employee === "executive-ai" ? await (await ExecutiveAIService.production()).dashboard() : null;
  const collaborationDashboard = await (await AICollaborationService.production()).dashboard();
  const employeeRecommendations = collaborationDashboard.recommendationPipeline.filter((entry) => entry.employee === employee);
  const conversationContext = {
    name: result.employee.name,
    role: result.employee.role,
    avatar: result.employee.avatar,
    workspace: "Current workspace",
    currentFocus: result.employee.memory.currentObjectives || "Awaiting verified workspace activity",
    goals: result.tasks.slice(0, 3).map((task) => task.title),
    knowledgeCoverage: result.employee.memory.knowledgeReferences ? `${result.employee.memory.knowledgeReferences} verified references` : "Ready to learn from verified activity",
    businessImpact: result.employee.department,
    evidenceCount: result.tasks.length + result.activity.length + employeeRecommendations.length,
    sourceModules: Array.from(new Set([result.employee.department, ...result.tasks.map((task) => task.type)])),
    relatedRecords: [
      ...result.tasks.slice(0, 4).map((task) => ({ type: task.type === "Meeting Scheduling" ? "Meeting" : task.type === "Campaign Suggestion" ? "Campaign" : "Task", label: task.title })),
    ],
    lastActivity: result.activity[0]?.title ?? null,
    recommendationIds: employeeRecommendations.map((entry) => entry.id),
  } as const;
  return (
    <WorkforceShell
      title={result.employee.name}
      description={`${result.employee.role} · ${result.employee.availability}. Review today's work, recommendations, achievements and conversation.`}
    >
      {salesDashboard && <SalesAIDashboard data={salesDashboard} />}
      {crmDashboard && <CRMAIDashboard data={crmDashboard} />}
      {whatsappDashboard && <WhatsAppAIDashboard data={whatsappDashboard} />}
      {marketingDashboard && <MarketingAIDashboard data={marketingDashboard} />}
      {executiveDashboard && <ExecutiveAIDashboard data={executiveDashboard} />}
      {employee === "executive-ai" && <ExecutiveCollaborationDashboard data={collaborationDashboard} />}
      <EmployeeDailyWorkspace item={result.employee} tasks={result.tasks} activity={result.activity} collaboration={collaborationDashboard}/>
      <EmployeeIdentityPanel item={result.employee}/>
      <EmployeeProfile
        item={result.employee}
        tasks={result.tasks}
        activity={result.activity}
      />
      <EmployeeHeadquartersSecondary item={result.employee} tasks={result.tasks} activity={result.activity}/>
      <EmployeeMemoryPanel item={result.employee} tasks={result.tasks} activity={result.activity}/>
      <EmployeeCollaborationPanel item={result.employee}/>
      <section className="rounded-3xl border border-vds-border bg-vds-surface p-5 sm:p-7" aria-labelledby="employee-conversation-title"><p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">Conversation</p><h2 id="employee-conversation-title" className="mt-2 text-2xl font-semibold">{result.employee.name} · {result.employee.role}</h2><p className="mt-2 text-sm text-vds-muted">What should I follow up today? · Which buyers are hottest? · Which deals are at risk? · Summarize today&apos;s opportunities. · Prepare follow-up plan.</p><p className="mt-3 text-xs text-vds-muted">Chat prepares actions only and remains approval-based. Nothing is executed autonomously.</p></section>
      <WorkforceChatPanel employee={employee} initial={history} health={health} context={conversationContext}/>
    </WorkforceShell>
  );
}
