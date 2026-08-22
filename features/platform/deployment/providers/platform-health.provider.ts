import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { OpenAIProvider } from "@/features/platform/openai/providers/openai.provider";
import { EmailService } from "@/features/platform/email/services/email.service";
import type {
  ComponentHealth,
  DeploymentHealthProvider,
  DeploymentState,
} from "../contracts";
const safe = (message: string) =>
  message
    .replace(/sk-[A-Za-z0-9_-]+|Bearer\s+\S+|whsec_\S+/gi, "[redacted]")
    .slice(0, 160);
const state = (ok: boolean): DeploymentState =>
  ok ? "healthy" : "unavailable";
export class PlatformHealthProvider implements DeploymentHealthProvider {
  constructor(private client: SupabaseClient) {}
  private async database(
    name: ComponentHealth["component"],
    table: string,
  ): Promise<ComponentHealth> {
    const started = performance.now();
    try {
      const { error } = await this.client
        .from(table)
        .select("*", { head: true, count: "exact" })
        .limit(1);
      if (error) throw error;
      return {
        component: name,
        state: "healthy",
        latencyMs: Math.round(performance.now() - started),
        version: null,
        diagnostic: "Operational",
      };
    } catch (error) {
      return {
        component: name,
        state: "unavailable",
        latencyMs: Math.round(performance.now() - started),
        version: null,
        diagnostic: safe(
          error instanceof Error ? error.message : "Health check failed",
        ),
      };
    }
  }
  private configured(
    component: ComponentHealth["component"],
    names: readonly string[],
    version: string | null = null,
  ): ComponentHealth {
    const missing = names.filter((name) => !process.env[name]?.trim());
    return {
      component,
      state: missing.length ? "misconfigured" : "healthy",
      latencyMs: null,
      version,
      diagnostic: missing.length
        ? `Missing configuration: ${missing.join(", ")}`
        : "Required configuration present; live operation is verified by its provider workspace.",
    };
  }
  private async storage(): Promise<ComponentHealth> {
    const started = performance.now();
    try {
      const { error } = await this.client.storage.listBuckets();
      if (error) throw error;
      return {
        component: "storage",
        state: "healthy",
        latencyMs: Math.round(performance.now() - started),
        version: null,
        diagnostic: "Storage reachable",
      };
    } catch (error) {
      return {
        component: "storage",
        state: "unavailable",
        latencyMs: Math.round(performance.now() - started),
        version: null,
        diagnostic: safe(
          error instanceof Error ? error.message : "Storage health failed",
        ),
      };
    }
  }
  private async stripe(): Promise<ComponentHealth> {
    const started = performance.now(),
      key = process.env.STRIPE_SECRET_KEY;
    if (!key)
      return {
        component: "stripe",
        state: "misconfigured",
        latencyMs: null,
        version: null,
        diagnostic: "Stripe credential is missing",
      };
    try {
      const response = await fetch("https://api.stripe.com/v1/balance", {
        headers: { authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      });
      return {
        component: "stripe",
        state: state(response.ok),
        latencyMs: Math.round(performance.now() - started),
        version: response.headers.get("stripe-version"),
        diagnostic: response.ok
          ? "Stripe reachable"
          : `Stripe returned HTTP ${response.status}`,
      };
    } catch {
      return {
        component: "stripe",
        state: "unavailable",
        latencyMs: Math.round(performance.now() - started),
        version: null,
        diagnostic: "Stripe network error",
      };
    }
  }
  async check() {
    const openai = new OpenAIProvider()
        .health()
        .then((x) => ({
          component: "openai" as const,
          state:
            x.state === "healthy"
              ? ("healthy" as const)
              : ("unavailable" as const),
          latencyMs: x.latencyMs,
          version: x.version,
          diagnostic: x.reason,
        })),
      email = new EmailService()
        .health()
        .then((x) => ({
          component: "email" as const,
          state: x.state,
          latencyMs: x.latencyMs,
          version: x.version,
          diagnostic: safe(x.diagnostic),
        }));
    return Promise.all([
      Promise.resolve({
        component: "application" as const,
        state: "healthy" as const,
        latencyMs: 0,
        version: process.env.APP_VERSION ?? null,
        diagnostic: "Application running",
      }),
      this.database("database", "deployment_migration_history"),
      openai,
      this.stripe(),
      Promise.resolve(
        this.configured("razorpay", [
          "RAZORPAY_KEY_ID",
          "RAZORPAY_KEY_SECRET",
          "RAZORPAY_WEBHOOK_SECRET",
        ]),
      ),
      email,
      Promise.resolve(
        this.configured("google_workspace", [
          "GOOGLE_CLIENT_ID",
          "GOOGLE_CLIENT_SECRET",
        ]),
      ),
      Promise.resolve(
        this.configured("google_calendar", [
          "GOOGLE_CLIENT_ID",
          "GOOGLE_CLIENT_SECRET",
        ]),
      ),
      Promise.resolve(
        this.configured(
          "whatsapp",
          ["WHATSAPP_APP_SECRET", "WHATSAPP_VERIFY_TOKEN"],
          process.env.WHATSAPP_GRAPH_VERSION ?? null,
        ),
      ),
      this.storage(),
      this.database("workflow", "workflow_instances"),
      this.database("notifications", "notification_events"),
      this.database("knowledge", "knowledge_articles"),
      this.database("queues", "notification_queue"),
      this.database("background_jobs", "continuous_learning_jobs"),
    ]);
  }
}
