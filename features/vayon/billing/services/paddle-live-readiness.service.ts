import "server-only";
import { paddleEnvironment, paddleRequest } from "../providers/paddle/paddle-client";
import { paddlePlanCodes, paddleCatalogEntry } from "../providers/paddle/paddle-catalog";

export interface PaddleLiveReadiness {
  readonly environment: "sandbox" | "live";
  readonly api: "healthy" | "unavailable";
  readonly catalog: "healthy" | "configuration_required";
  readonly webhook: "configured" | "configuration_required";
  readonly portal: "available" | "configuration_required";
  readonly checkedAt: string;
}

export class PaddleLiveReadinessService {
  async verify(): Promise<PaddleLiveReadiness> {
    const environment = paddleEnvironment();
    let catalog: PaddleLiveReadiness["catalog"] = "healthy";
    try { for (const plan of paddlePlanCodes) for (const period of ["monthly", "annual"] as const) paddleCatalogEntry(plan, period); }
    catch { catalog = "configuration_required"; }
    let api: PaddleLiveReadiness["api"] = "healthy";
    try { await paddleRequest<readonly unknown[]>("/event-types"); } catch { api = "unavailable"; }
    const webhook = process.env.PADDLE_WEBHOOK_SECRET ? "configured" as const : "configuration_required" as const;
    return Object.freeze({ environment, api, catalog, webhook, portal: environment === "live" && api === "healthy" && catalog === "healthy" ? "available" : "configuration_required", checkedAt: new Date().toISOString() });
  }
}
