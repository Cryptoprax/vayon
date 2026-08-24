import { randomUUID } from "node:crypto";
import type {
  RuntimeAuthorizer,
  RuntimeClock,
  RuntimeStore,
} from "../contracts/ports";
import type {
  ApprovalRecord,
  ExecutionContext,
  ExecutionHistoryEntry,
  ExecutionSession,
  RuntimePlan,
  RuntimeStep,
} from "../domain/contracts";
import { WorkflowActionDispatcher } from "./action-dispatcher";
import { RuntimeVariableResolver } from "./variable-resolver";
import { WorkflowRuntimeObservability } from "./observability";
const systemClock: RuntimeClock = {
  now: () => new Date(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};
function immutable<T>(value: T): T {
  return Object.freeze(structuredClone(value));
}
export class WorkflowRuntimeEngine {
  constructor(
    private store: RuntimeStore,
    private dispatcher: WorkflowActionDispatcher,
    private authorizer: RuntimeAuthorizer,
    private clock: RuntimeClock = systemClock,
    private observability = new WorkflowRuntimeObservability(),
    private variables = new RuntimeVariableResolver(),
  ) {}
  async queue(plan: RuntimePlan, context: ExecutionContext) {
    if (!plan.published)
      throw new Error("Only published workflows can execute.");
    const unsupported = plan.steps.find(
      (step) => !this.dispatcher.supports(step.action),
    );
    if (unsupported)
      throw Object.assign(
        new Error(`Action is not approved: ${unsupported.action}`),
        { code: "ACTION_NOT_APPROVED" },
      );
    if (!(await this.authorizer.authorize(context, "workflow.execute")))
      throw new Error("Workflow execution permission denied.");
    const now = this.clock.now().toISOString(),
      session: ExecutionSession = immutable({
        id: randomUUID(),
        plan,
        context,
        state: "queued",
        attempts: {},
        outputs: {},
        createdAt: now,
        updatedAt: now,
      });
    this.store.save(session);
    this.audit(session, "started", {});
    return session;
  }
  async run(sessionId: string): Promise<ExecutionSession> {
    let session = this.required(sessionId);
    if (
      ["completed", "cancelled", "failed", "timed_out"].includes(session.state)
    )
      return session;
    session = this.update(session, { state: "running" });
    for (const step of session.plan.steps) {
      if (session.outputs[step.id] !== undefined) continue;
      if (step.dependencies.some((id) => session.outputs[id] === undefined)) {
        session = this.update(session, {
          state: "skipped",
          currentStepId: step.id,
        });
        continue;
      }
      const approval = this.store.approval(session.id, step.id);
      if (step.approvalRequired && approval?.state !== "approved") {
        if (!approval) this.requestApproval(session, step);
        return this.update(session, {
          state: "waiting",
          currentStepId: step.id,
        });
      }
      session = await this.executeStep(session, step);
      if (
        session.state === "failed" ||
        session.state === "waiting" ||
        session.state === "cancelled"
      )
        return session;
    }
    session = this.update(session, {
      state: "completed",
      completedAt: this.clock.now().toISOString(),
      currentStepId: undefined,
    });
    this.audit(session, "completed", { durationMs: this.duration(session) });
    return session;
  }
  async resume(sessionId: string) {
    const session = this.required(sessionId);
    if (!["waiting", "paused", "failed"].includes(session.state))
      throw new Error("Execution is not resumable.");
    this.audit(session, "resumed", {});
    return this.run(sessionId);
  }
  cancel(sessionId: string, actorId: string) {
    const session = this.required(sessionId);
    if (["completed", "cancelled"].includes(session.state)) return session;
    if (
      session.context.actorId !== actorId &&
      !session.context.permissions.includes("workflow.cancel.any")
    )
      throw new Error("Workflow cancellation permission denied.");
    const next = this.update(session, {
      state: "cancelled",
      cancelledAt: this.clock.now().toISOString(),
    });
    this.audit(next, "cancelled", {});
    return next;
  }
  decideApproval(
    sessionId: string,
    stepId: string,
    state: "approved" | "rejected" | "escalated",
    actorId: string,
    reason?: string,
  ) {
    const session = this.required(sessionId),
      current = this.store.approval(sessionId, stepId);
    if (!current || current.state !== "approval_required")
      throw new Error("Approval is not pending.");
    if (
      !session.context.permissions.includes("workflow.approve") &&
      actorId === session.context.actorId
    )
      throw new Error("Approval policy forbids self approval.");
    const decision: ApprovalRecord = immutable({
      ...current,
      state,
      decidedAt: this.clock.now().toISOString(),
      decidedBy: actorId,
      reason,
    });
    this.store.saveApproval(decision);
    this.audit(session, state, { stepId, reason: reason ?? "" });
    if (state === "rejected")
      return this.update(session, {
        state: "cancelled",
        cancelledAt: this.clock.now().toISOString(),
      });
    return decision;
  }

  timeoutApproval(sessionId: string, stepId: string) {
    const session = this.required(sessionId),
      current = this.store.approval(sessionId, stepId);
    if (!current || current.state !== "approval_required")
      throw new Error("Approval is not pending.");
    const decision: ApprovalRecord = immutable({
      ...current,
      state: "timed_out",
      decidedAt: this.clock.now().toISOString(),
      reason: "Approval window expired.",
    });
    this.store.saveApproval(decision);
    this.audit(session, "timed_out", {
      stepId,
      code: "APPROVAL_TIMEOUT",
    });
    return this.update(session, {
      state: "timed_out",
      failure: {
        code: "APPROVAL_TIMEOUT",
        message: "Approval window expired.",
      },
    });
  }

  pause(sessionId: string) {
    const session = this.required(sessionId);
    return this.update(session, { state: "paused" });
  }
  private async executeStep(session: ExecutionSession, step: RuntimeStep) {
    let attempt = session.attempts[step.id] ?? 0;
    while (attempt < step.retryPolicy.maxAttempts) {
      attempt++;
      session = this.update(session, {
        state: "running",
        currentStepId: step.id,
        attempts: { ...session.attempts, [step.id]: attempt },
      });
      this.audit(session, "step_started", { stepId: step.id, attempt });
      const started = this.clock.now().getTime();
      try {
        const input = this.variables.resolveInput(step.input, {
            context: session.context,
            ...session.context.variables,
            outputs: session.outputs,
            execution: {
              id: session.id,
              attempt,
              startedAt: session.createdAt,
            },
          }),
          result = await Promise.race([
            this.dispatcher.dispatch({ ...step, input }, session.context, {
              ...session.context.variables,
              outputs: session.outputs,
            }),
            new Promise<never>((_, reject) =>
              setTimeout(
                () =>
                  reject(
                    Object.assign(new Error("Step timed out."), {
                      code: "TIMEOUT",
                    }),
                  ),
                step.timeoutMs,
              ),
            ),
          ]);
        const outputs = { ...session.outputs, [step.id]: result.output };
        session = this.update(session, {
          state: result.status === "waiting" ? "waiting" : "running",
          outputs,
        });
        this.checkpoint(session, step);
        this.audit(session, "step_completed", {
          stepId: step.id,
          attempt,
          durationMs: this.clock.now().getTime() - started,
          providerLatencyMs: result.providerLatencyMs ?? 0,
        });
        this.observability.record({
          name: "workflow.step.duration",
          sessionId: session.id,
          value: this.clock.now().getTime() - started,
          unit: "milliseconds",
          attributes: { action: step.action, attempt },
        });
        return session;
      } catch (error) {
        const code =
            typeof error === "object" && error && "code" in error
              ? String(error.code)
              : "UNHANDLED",
          retryable =
            step.retryPolicy.retryableCodes.includes(code) &&
            attempt < step.retryPolicy.maxAttempts;
        if (retryable) {
          const delay = Math.min(
            step.retryPolicy.maxDelayMs,
            step.retryPolicy.baseDelayMs * 2 ** (attempt - 1),
          );
          this.audit(session, "retry_scheduled", {
            stepId: step.id,
            attempt,
            code,
            delayMs: delay,
          });
          await this.clock.sleep(delay);
          continue;
        }
        const timedOut = code === "TIMEOUT";
        session = this.update(session, {
          state: timedOut ? "timed_out" : "failed",
          failure: {
            code,
            message:
              error instanceof Error ? error.message : "Workflow step failed.",
          },
        });
        this.audit(session, timedOut ? "timed_out" : "failed", {
          stepId: step.id,
          attempt,
          code,
        });
        return session;
      }
    }
    return session;
  }
  private requestApproval(session: ExecutionSession, step: RuntimeStep) {
    const approval: ApprovalRecord = immutable({
      id: randomUUID(),
      sessionId: session.id,
      stepId: step.id,
      state: "approval_required",
      requestedAt: this.clock.now().toISOString(),
    });
    this.store.saveApproval(approval);
    this.audit(session, "approval_required", { stepId: step.id });
  }
  private checkpoint(session: ExecutionSession, step: RuntimeStep) {
    const previous = this.store.latestCheckpoint(session.id);
    this.store.checkpoint(
      immutable({
        sessionId: session.id,
        stepId: step.id,
        sequence: (previous?.sequence ?? 0) + 1,
        state: session.state,
        outputs: session.outputs,
        recordedAt: this.clock.now().toISOString(),
      }),
    );
  }
  private update(session: ExecutionSession, patch: Partial<ExecutionSession>) {
    const next = immutable({
      ...session,
      ...patch,
      updatedAt: this.clock.now().toISOString(),
    });
    this.store.save(next);
    return next;
  }
  private audit(
    session: ExecutionSession,
    type: ExecutionHistoryEntry["type"],
    metadata: Record<string, unknown>,
  ) {
    this.store.appendHistory(
      immutable({
        id: randomUUID(),
        sessionId: session.id,
        sequence: this.store.history(session.id).length + 1,
        type,
        occurredAt: this.clock.now().toISOString(),
        stepId:
          typeof metadata.stepId === "string" ? metadata.stepId : undefined,
        durationMs:
          typeof metadata.durationMs === "number"
            ? metadata.durationMs
            : undefined,
        attempt:
          typeof metadata.attempt === "number" ? metadata.attempt : undefined,
        code: typeof metadata.code === "string" ? metadata.code : undefined,
        metadata: { ...metadata, actorId: session.context.actorId, correlationId: session.context.correlationId, trigger: session.context.trigger },
      }),
    );
  }
  private duration(session: ExecutionSession) {
    return this.clock.now().getTime() - new Date(session.createdAt).getTime();
  }
  private required(id: string) {
    const value = this.store.get(id);
    if (!value) throw new Error("Execution session not found.");
    return value;
  }
}
