import type {
  GovernedMemory,
  MemoryAccessContext,
  MemoryAuditSink,
  MemoryScope,
} from "../contracts";
export class UnifiedMemoryService {
  private records = new Map<string, GovernedMemory>();
  constructor(private readonly audit: MemoryAuditSink) {}
  async remember(record: GovernedMemory, context: MemoryAccessContext) {
    this.authorize(record, context, "write");
    this.records.set(record.id, Object.freeze({ ...record }));
    await this.audit.record({
      operation: "remember",
      memoryId: record.id,
      actorId: context.actorId,
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      occurredAt: new Date().toISOString(),
    });
  }
  async recall(scopes: readonly MemoryScope[], context: MemoryAccessContext) {
    const now = Date.now(),
      values = [...this.records.values()].filter(
        (record) =>
          record.organizationId === context.organizationId &&
          (!record.workspaceId || record.workspaceId === context.workspaceId) &&
          scopes.includes(record.scope) &&
          (!record.founderOnly || context.role === "founder") &&
          (!record.expiresAt || new Date(record.expiresAt).getTime() > now),
      );
    for (const record of values)
      await this.audit.record({
        operation: "recall",
        memoryId: record.id,
        actorId: context.actorId,
        organizationId: context.organizationId,
        workspaceId: context.workspaceId,
        occurredAt: new Date().toISOString(),
      });
    return Object.freeze(values);
  }
  async forget(id: string, context: MemoryAccessContext) {
    const record = this.records.get(id);
    if (!record) return false;
    this.authorize(record, context, "delete");
    this.records.delete(id);
    await this.audit.record({
      operation: "forget",
      memoryId: id,
      actorId: context.actorId,
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      occurredAt: new Date().toISOString(),
    });
    return true;
  }
  async expire(context: MemoryAccessContext) {
    const now = Date.now(),
      expired = [...this.records.values()].filter(
        (record) =>
          record.organizationId === context.organizationId &&
          record.expiresAt &&
          new Date(record.expiresAt).getTime() <= now,
      );
    for (const record of expired) {
      this.records.delete(record.id);
      await this.audit.record({
        operation: "expire",
        memoryId: record.id,
        actorId: context.actorId,
        organizationId: context.organizationId,
        workspaceId: context.workspaceId,
        occurredAt: new Date().toISOString(),
      });
    }
    return expired.length;
  }
  private authorize(
    record: GovernedMemory,
    context: MemoryAccessContext,
    operation: "write" | "delete",
  ) {
    if (record.organizationId !== context.organizationId)
      throw new Error("Cross-organization memory access denied.");
    if (record.workspaceId && record.workspaceId !== context.workspaceId)
      throw new Error("Cross-workspace memory access denied.");
    if (record.founderOnly && context.role !== "founder")
      throw new Error("Founder memory access denied.");
    if (
      !context.permissions.includes(`ai.memory.${operation}`) &&
      context.role !== "founder"
    )
      throw new Error("Memory permission denied.");
  }
}
