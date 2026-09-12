import "server-only";
import { founderContext } from "@/features/platform/founder/services/founder-context";
import { RuntimeAdapterRegistry } from "./adapter";
import { CreativeExecutionPlanner } from "./planner";
import { CreativeExecutionQueue } from "./queue";
import type { ExecutionJob, ExecutionResult, ExecutionSnapshot } from "./types";
export class CreativeExecutionService {
  constructor(
    private adapters = new RuntimeAdapterRegistry(),
    private queue = new CreativeExecutionQueue(),
    private planner = new CreativeExecutionPlanner(adapters),
  ) {}
  async accept(job: ExecutionJob): Promise<ExecutionResult> {
    this.validate(job);
    this.queue.enqueue(job);
    const plan = await this.planner.plan(job.id, job.capability, job.request);
    if (!plan.valid) {
      const waiting = {
        ...job,
        state: "WaitingProvider" as const,
        updatedAt: new Date().toISOString(),
      };
      this.queue.update(waiting);
      return this.result(waiting, "WaitingProvider", null, plan.reasons, []);
    }
    const adapter = this.adapters.get(plan.selectedProviderId!);
    if (!adapter)
      return this.result(
        job,
        "WaitingProvider",
        null,
        ["Planned adapter is no longer registered."],
        [],
      );
    const controller = new AbortController(),
      timeout = setTimeout(() => controller.abort(), job.timeoutMs),
      started = Date.now();
    try {
      this.queue.update({
        ...job,
        state: "Executing",
        updatedAt: new Date().toISOString(),
      });
      this.queue.emit(job, "Started");
      const outputs = await adapter.generate(
        {
          organizationId: job.organizationId,
          workspaceId: job.workspaceId,
          correlationId: job.correlationId,
          timeoutMs: job.timeoutMs,
          signal: controller.signal,
        },
        job.request,
      );
      const completed = {
        ...job,
        state: "WaitingApproval" as const,
        updatedAt: new Date().toISOString(),
      };
      this.queue.update(completed);
      this.queue.emit(completed, "ApprovalRequested", {
        outputs: outputs.length,
        latencyMs: Date.now() - started,
      });
      return this.result(completed, "WaitingApproval", adapter.id, [], outputs);
    } catch (error) {
      this.queue.emit(job, "Failed", {
        reason: error instanceof Error ? error.name : "UnknownError",
      });
      return this.result(
        job,
        "Failed",
        adapter.id,
        [error instanceof Error ? error.message : "Execution failed."],
        [],
      );
    } finally {
      clearTimeout(timeout);
    }
  }
  private validate(job: ExecutionJob) {
    if (
      !job.organizationId ||
      !job.workspaceId ||
      job.request.workspaceId !== job.workspaceId
    )
      throw new Error(
        "Tenant and workspace attribution must match the runtime request.",
      );
    if (
      !job.correlationId ||
      !job.request.prompt.trim() ||
      job.request.outputCount < 1
    )
      throw new Error("Execution request is incomplete.");
  }
  private result(
    job: ExecutionJob,
    status: ExecutionResult["status"],
    provider: string | null,
    errors: readonly string[],
    outputs: ExecutionResult["outputs"],
  ): ExecutionResult {
    return {
      jobId: job.id,
      status,
      provider,
      capability: job.capability,
      metadata: {
        correlationId: job.correlationId,
        startedAt: null,
        completedAt: null,
        latencyMs: null,
        retries: job.retryCount,
        estimatedCost: null,
        providerModel: null,
      },
      warnings:
        status === "WaitingProvider"
          ? ["Execution paused without a provider."]
          : [],
      errors,
      outputs,
    };
  }
  async snapshot(): Promise<ExecutionSnapshot> {
    await founderContext();
    const jobs = this.queue.list(),
      events = this.queue.history(),
      latencies = events
        .map((event) => event.metadata.latencyMs)
        .filter((value): value is number => typeof value === "number");
    return {
      adapters: this.adapters.size,
      documentCapability: "Registered",
      providerReadiness: "Unavailable",
      jobs,
      events,
      metrics: {
        queued: jobs.filter((job) => job.state === "Queued").length,
        completed: jobs.filter((job) => job.state === "Completed").length,
        retries: jobs.reduce((sum, job) => sum + job.retryCount, 0),
        failures: jobs.filter((job) => job.state === "Failed").length,
        averageLatencyMs: latencies.length
          ? Math.round(
              latencies.reduce((sum, value) => sum + value, 0) /
                latencies.length,
            )
          : null,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}
