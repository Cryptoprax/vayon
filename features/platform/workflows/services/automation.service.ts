import "server-only";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { PlatformVisibilityService } from "@/features/platform/visibility/service";
import { SupabaseWorkflowRepository } from "../repositories/supabase-workflow.repository";
import { WorkflowValidationService } from "./validation.service";
import { WorkflowExecutionPlanner } from "./execution-planner.service";
import { workflowTemplates } from "../library/templates";
import type { WorkflowDefinition } from "../domain/contracts";

export class WorkflowAutomationService {
  private async context() {
    const context = await operationsContext();
    return { ...context, repository: new SupabaseWorkflowRepository(context.client, context.organizationId, context.workspaceId) };
  }

  async snapshot() {
    const context = await this.context();
    const [definitions, executions, canManage, visibility] = await Promise.all([
      context.repository.definitions(), context.repository.executions(), context.repository.canManage(),
      new PlatformVisibilityService().context(),
    ]);
    const templates = workflowTemplates.filter((template) => visibility.founder || (
      template.industryVisibility.includes(visibility.industry) && template.roleVisibility.includes(visibility.role)
    ));
    const completed = executions.filter((item) => item.status === "completed");
    const terminal = executions.filter((item) => ["completed", "failed"].includes(item.status));
    return {
      definitions, executions, canManage, templates,
      metrics: {
        total: definitions.length,
        active: definitions.filter((item) => item.status === "published").length,
        successRate: terminal.length ? Math.round(completed.length / terminal.length * 100) : null,
        averageDurationMs: completed.length ? Math.round(completed.reduce((total, item) => total + (item.durationMs ?? 0), 0) / completed.length) : null,
        pendingApprovals: executions.filter((item) => item.approvalStatus === "pending").length,
        aiRecommendations: executions.filter((item) => item.aiParticipation).length,
      },
    };
  }

  async save(input: WorkflowDefinition) {
    const validation = new WorkflowValidationService().validate(input);
    if (!validation.valid) throw new Error(validation.issues.map((item) => item.message).join(" "));
    new WorkflowExecutionPlanner().plan(input);
    return (await this.context()).repository.save(input);
  }

  async publish(id: string, version: number) { return (await this.context()).repository.publish(id, version); }

  async installTemplate(templateId: string) {
    const visibility = await new PlatformVisibilityService().context();
    const template = workflowTemplates.find((item) => item.id === templateId && (visibility.founder || (
      item.industryVisibility.includes(visibility.industry) && item.roleVisibility.includes(visibility.role)
    )));
    if (!template) throw new Error("Workflow template not found.");
    return (await this.context()).repository.installTemplate(structuredClone(template.definition));
  }
}
