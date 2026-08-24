import "server-only";

import { WorkflowActionDispatcher } from "@/features/platform/workflow-runtime/services/action-dispatcher";
import { WorkflowRuntimeEngine } from "@/features/platform/workflow-runtime/services/runtime-engine";
import { PermissionRuntimeAuthorizer } from "@/features/platform/workflow-runtime/services/security";
import { InMemoryRuntimeStore } from "@/features/platform/workflow-runtime/storage/in-memory-runtime.store";
import type {
  ExecutionContext,
  RuntimeAction,
  RuntimePlan,
} from "@/features/platform/workflow-runtime/domain/contracts";
import type { ActionKind, WorkflowDefinition } from "../domain/contracts";
import { ExistingPlatformWorkflowProvider } from "../providers/existing-platform.provider";

const actionKinds: readonly ActionKind[] = [
  "crm.task.recommend",
  "task.create",
  "owner.assign",
  "notification.create",
  "whatsapp.queue",
  "sms.queue",
  "ai.task.create",
  "crm.record.update",
  "meeting.schedule",
  "report.generate",
  "provider.call",
  "reminder.create",
  "gmail.draft",
  "whatsapp.draft",
  "meeting.recommend",
  "ai.recommend",
  "ai.request",
  "user.notify",
  "email.queue",
  "approval.request",
  "timeline.update",
  "timeline.propose",
  "executive.report",
];

/** Compiles the visual definition into the established Sprint workflow runtime. */
export class WorkflowRuntimeAdapterService {
  constructor(private provider = new ExistingPlatformWorkflowProvider()) {}

  compile(definition: WorkflowDefinition): RuntimePlan {
    const executable = definition.nodes.filter((node) =>
      actionKinds.includes(node.configuration.action as ActionKind),
    );
    return {
      workflowId: definition.id,
      workflowVersion: definition.version,
      published: true,
      steps: executable.map((node) => ({
        id: node.id,
        nodeId: node.id,
        action: `provider.${node.configuration.action as ActionKind}` as RuntimeAction,
        input: node.configuration,
        dependencies: definition.connections
          .filter((edge) =>
            edge.targetNodeId === node.id &&
            executable.some((candidate) => candidate.id === edge.sourceNodeId),
          )
          .map((edge) => edge.sourceNodeId),
        approvalRequired: node.configuration.approvalRequired !== false,
        timeoutMs: 30_000,
        retryPolicy: {
          maxAttempts: 3,
          baseDelayMs: 250,
          maxDelayMs: 2_000,
          retryableCodes: ["NETWORK_ERROR", "TIMEOUT", "RATE_LIMITED"],
        },
      })),
    };
  }

  async execute(definition: WorkflowDefinition, context: ExecutionContext) {
    const store = new InMemoryRuntimeStore();
    const dispatcher = new WorkflowActionDispatcher();
    for (const action of actionKinds) {
      dispatcher.register({
        action: `provider.${action}`,
        execute: async (step, runtimeContext) => {
          const result = await this.provider.execute({
            action,
            input: { ...step.input },
            organizationId: runtimeContext.organizationId,
            workspaceId: runtimeContext.workspaceId,
            approvalStatus: step.approvalRequired ? "approved" : "pending",
            correlationId: runtimeContext.correlationId,
          });
          return {
            status:
              result.status === "approval_required" ? "waiting" : "completed",
            output: result,
          };
        },
      });
    }
    const engine = new WorkflowRuntimeEngine(
      store,
      dispatcher,
      new PermissionRuntimeAuthorizer(),
    );
    const queued = await engine.queue(this.compile(definition), context);
    const session = await engine.run(queued.id);
    return {
      session,
      history: store.history(session.id),
      approval: session.currentStepId
        ? store.approval(session.id, session.currentStepId)
        : undefined,
    };
  }
}
