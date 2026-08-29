import "server-only";

import type { User } from "@supabase/supabase-js";
import { OrganizationService } from "./organization.service";
import { WorkspaceService } from "./workspace.service";
import { WorkspaceBootstrapService } from "./workspace-bootstrap.service";
import { EnterpriseOnboardingService } from "./enterprise-onboarding.service";

export type OnboardingFailureCategory =
  | "WORKSPACE_NOT_FOUND"
  | "ONBOARDING_NOT_FOUND"
  | "MEMBERSHIP_NOT_FOUND"
  | "RLS_DENIED"
  | "SUPABASE_QUERY_FAILED"
  | "SERVER_ACTION_FAILED"
  | "UNEXPECTED_EXCEPTION";

type Session = Awaited<ReturnType<EnterpriseOnboardingService["session"]>>;

export class OnboardingRecoveryError extends Error {
  constructor(
    readonly category: OnboardingFailureCategory,
    readonly repository: string,
    readonly service: string,
    cause?: unknown,
  ) {
    super(`${category}: ${cause instanceof Error ? cause.message : "Workspace recovery failed."}`, { cause });
    this.name = "OnboardingRecoveryError";
  }
}

function category(error: unknown): OnboardingFailureCategory {
  const value = error as { code?: string; message?: string } | null;
  const message = String(value?.message ?? "").toLowerCase();
  if (value?.code === "42501" || /row.level|permission denied|rls/.test(message)) return "RLS_DENIED";
  if (/onboarding.*not found|onboarding session unavailable/.test(message)) return "ONBOARDING_NOT_FOUND";
  if (/membership|member/.test(message)) return "MEMBERSHIP_NOT_FOUND";
  if (/workspace.*not found/.test(message)) return "WORKSPACE_NOT_FOUND";
  if (value?.code || /supabase|postgres|query|relation/.test(message)) return "SUPABASE_QUERY_FAILED";
  return error instanceof Error ? "UNEXPECTED_EXCEPTION" : "SERVER_ACTION_FAILED";
}

function logFailure(error: OnboardingRecoveryError, context: Record<string, unknown>) {
  const cause = error.cause instanceof Error ? error.cause : error;
  console.error(JSON.stringify({
    level: "error",
    event: "onboarding.recovery.failed",
    route: "/onboarding",
    step: "workspace-recovery",
    category: error.category,
    repository: error.repository,
    service: error.service,
    errorCode: (cause as Error & { code?: string }).code ?? error.category,
    message: cause.message.slice(0, 500),
    stack: cause.stack?.slice(0, 4000),
    timestamp: new Date().toISOString(),
    ...context,
  }));
}

export class OnboardingRecoveryService {
  constructor(
    private readonly organizations = new OrganizationService(),
    private readonly workspaces = new WorkspaceService(),
    private readonly bootstrap = new WorkspaceBootstrapService(),
    private readonly onboarding = new EnterpriseOnboardingService(),
  ) {}

  async prepare(user: User): Promise<{ organization: { id: string; name: string }; session: NonNullable<Session> }> {
    const context: Record<string, unknown> = { userId: user.id, organizationId: null, workspaceId: null };
    try {
      let organization = await this.organizations.current();
      if (!organization) {
        console.info(JSON.stringify({ level: "info", event: "onboarding.recovery.started", route: "/onboarding", userId: user.id, step: "workspace-bootstrap", service: "WorkspaceBootstrapService", timestamp: new Date().toISOString() }));
        organization = await this.bootstrap.ensure(user);
      }
      if (!organization) throw new OnboardingRecoveryError("WORKSPACE_NOT_FOUND", "OrganizationService", "WorkspaceBootstrapService");
      context.organizationId = organization.id;

      const workspace = await this.workspaces.first();
      if (!workspace) throw new OnboardingRecoveryError("MEMBERSHIP_NOT_FOUND", "WorkspaceService", "WorkspaceBootstrapService");
      context.workspaceId = workspace.id;

      let session = await this.onboarding.session();
      if (!session) {
        await this.onboarding.save(1, {}, [], false);
        session = await this.onboarding.session();
      }
      if (!session) throw new OnboardingRecoveryError("ONBOARDING_NOT_FOUND", "OnboardingRepository", "EnterpriseOnboardingService");

      console.info(JSON.stringify({ level: "info", event: "onboarding.recovery.ready", route: "/onboarding", step: "complete", service: "OnboardingRecoveryService", timestamp: new Date().toISOString(), ...context }));
      return { organization, session };
    } catch (cause) {
      const error = cause instanceof OnboardingRecoveryError
        ? cause
        : new OnboardingRecoveryError(category(cause), "OnboardingRepository", "OnboardingRecoveryService", cause);
      logFailure(error, context);
      throw error;
    }
  }
}
