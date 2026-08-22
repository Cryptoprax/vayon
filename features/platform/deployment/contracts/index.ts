export type DeploymentState =
  "healthy" | "degraded" | "unavailable" | "misconfigured";
export type DeploymentComponent =
  | "application"
  | "database"
  | "openai"
  | "stripe"
  | "razorpay"
  | "email"
  | "google_workspace"
  | "google_calendar"
  | "whatsapp"
  | "storage"
  | "workflow"
  | "notifications"
  | "knowledge"
  | "queues"
  | "background_jobs";
export interface ComponentHealth {
  component: DeploymentComponent;
  state: DeploymentState;
  latencyMs: number | null;
  version: string | null;
  diagnostic: string;
}
export interface MigrationStatus {
  databaseVersion: string | null;
  expectedVersion: string | null;
  applied: readonly string[];
  pending: readonly string[];
  current: boolean;
}
export interface DeploymentSnapshot {
  build: {
    version: string;
    buildId: string;
    commitSha: string;
    environment: string;
    builtAt: string | null;
  };
  health: readonly ComponentHealth[];
  migrations: MigrationStatus;
  latestDeployment: string | null;
  configuration: { valid: boolean; missing: readonly string[] };
  monitoring: {
    sentry: boolean;
    posthog: boolean;
    structuredLogging: true;
    performanceMetrics: true;
  };
  backups: {
    database: "extension_ready";
    storage: "extension_ready";
    configuration: "extension_ready";
    restoreVerification: "extension_ready";
  };
  verification: readonly { area: string; state: DeploymentState }[];
}
export interface DeploymentHealthProvider {
  check(): Promise<readonly ComponentHealth[]>;
}
