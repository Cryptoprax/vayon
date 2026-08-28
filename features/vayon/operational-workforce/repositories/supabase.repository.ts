import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkforceRepository } from "../contracts/repository";
import type {
  WorkforceActivity,
  WorkforceTask,
  WorkforceTaskStatus,
  WorkforceTaskType,
} from "../domain/models";
import { configuredEmployee, definitions } from "./workforce-data";
type Row = Record<string, unknown>;
const taskTypes: readonly WorkforceTaskType[] = [
  "Lead Qualification",
  "Customer Summary",
  "WhatsApp Follow-up",
  "Meeting Scheduling",
  "Property Recommendation",
  "Deal Analysis",
  "Campaign Suggestion",
  "Document Review",
];
export class SupabaseWorkforceRepository implements WorkforceRepository {
  readonly provider = "supabase" as const;
  constructor(
    private c: SupabaseClient,
    private organizationId: string,
    private workspaceId: string,
  ) {}
  async employees() {
    const { data, error } = await this.c
      .from("ai_employees")
      .select(
        "id,code,name,avatar,department,responsibilities,status,permissions,created_at,updated_at",
      )
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId)
      .is("deleted_at", null);
    if (error) throw error;
    const rows = (data ?? []) as Row[];
    return definitions.map((def) => {
      const row = rows.find((item) =>
        String(item.code)
          .replaceAll("_", "-")
          .includes(def[0].replace("-ai", "")),
      );
      if (!row) return configuredEmployee(def);
      const base = configuredEmployee(def);
      return {
        ...base,
        id: String(row.id),
        name: /\bai\b|agent|assistant|advisor/i.test(String(row.name ?? "")) ? def[1] : String(row.name ?? def[1]),
        role: /\bai\b|agent|assistant|advisor/i.test(String(row.name ?? "")) ? def[2] : base.role,
        avatar: String(row.avatar ?? def[4]),
        status: row.status === "ready" ? ("idle" as const) : ("offline" as const),
        permissions: Array.isArray(row.permissions)
          ? row.permissions.map(String)
          : base.permissions,
        health:
          row.status === "ready"
            ? ("healthy" as const)
            : ("unavailable" as const),
      };
    });
  }
  async tasks() {
    const { data, error } = await this.c
      .from("ai_tasks")
      .select("id,employee_id,title,description,status,created_at,updated_at")
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as Row[]).map((row, index): WorkforceTask => ({
      id: String(row.id),
      employeeId: String(row.employee_id),
      type: taskTypes[index % taskTypes.length],
      title: String(row.title),
      status: this.status(String(row.status)),
      priority: "normal",
      owner: "Workspace",
      createdAt: String(row.created_at),
      completedAt:
        row.status === "completed" ? String(row.updated_at) : undefined,
    }));
  }
  async activity(): Promise<readonly WorkforceActivity[]> {
    const tasks = await this.tasks();
    return tasks
      .filter((task) => task.status === "completed")
      .map((task) => ({
        id: `activity-${task.id}`,
        title: task.type,
        detail: task.title,
        occurredAt: task.completedAt ?? task.createdAt,
      }));
  }
  private status(value: string): WorkforceTaskStatus {
    return value === "running"
      ? "running"
      : value === "completed"
        ? "completed"
        : value === "failed"
          ? "failed"
          : value === "cancelled"
            ? "cancelled"
            : "pending";
  }
}
