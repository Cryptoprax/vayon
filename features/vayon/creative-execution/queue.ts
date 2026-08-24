import type { ExecutionEvent, ExecutionJob } from "./types";
const rank = { critical: 0, high: 1, normal: 2, low: 3 } as const;
export class CreativeExecutionQueue {
  private jobs = new Map<string, ExecutionJob>();
  private events: ExecutionEvent[] = [];
  enqueue(job: ExecutionJob) {
    if (job.timeoutMs < 1000 || job.maxRetries < 0)
      throw new Error("Execution retry and timeout configuration is invalid.");
    this.jobs.set(job.id, job);
    this.emit(job, "Queued");
    return job;
  }
  next() {
    return (
      [...this.jobs.values()]
        .filter((job) => job.state === "Queued" && !job.cancellationRequested)
        .sort(
          (a, b) =>
            rank[a.priority] - rank[b.priority] ||
            a.createdAt.localeCompare(b.createdAt),
        )[0] ?? null
    );
  }
  update(job: ExecutionJob) {
    this.jobs.set(job.id, job);
    return job;
  }
  cancel(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    const cancelled = {
      ...job,
      state: "Cancelled" as const,
      cancellationRequested: true,
      updatedAt: new Date().toISOString(),
    };
    this.jobs.set(jobId, cancelled);
    this.emit(cancelled, "Cancelled");
    return cancelled;
  }
  retry(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job || job.retryCount >= job.maxRetries) return null;
    const retried = {
      ...job,
      state: "Queued" as const,
      retryCount: job.retryCount + 1,
      updatedAt: new Date().toISOString(),
    };
    this.jobs.set(jobId, retried);
    this.emit(retried, "Retry");
    return retried;
  }
  list() {
    return [...this.jobs.values()];
  }
  history() {
    return [...this.events];
  }
  emit(
    job: ExecutionJob,
    type: ExecutionEvent["type"],
    metadata: ExecutionEvent["metadata"] = {},
  ) {
    this.events.push({
      id: `${job.id}-${type}-${this.events.length + 1}`,
      jobId: job.id,
      workspaceId: job.workspaceId,
      organizationId: job.organizationId,
      type,
      correlationId: job.correlationId,
      occurredAt: new Date().toISOString(),
      metadata,
    });
  }
}
