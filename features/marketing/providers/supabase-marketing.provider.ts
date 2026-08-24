import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { LeadCaptureKind, MarketingEvent, MarketingProvider } from "../contracts";
const timeoutMs = 4_000;
const attempts = 3;
export class MarketingProviderError extends Error { constructor(readonly diagnostic: "configuration_missing" | "database_unavailable" | "timeout" | "provider_error", readonly retryable: boolean) { super("Marketing provider operation failed."); this.name = "MarketingProviderError"; } }
function client() { const { url, key } = getSupabaseConfig(); return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }); }
async function bounded<T>(operation: () => PromiseLike<T>): Promise<T> { return Promise.race([Promise.resolve(operation()), new Promise<never>((_, reject) => setTimeout(() => reject(new MarketingProviderError("timeout", true)), timeoutMs))]); }
function providerError(reason: unknown) { if (reason instanceof MarketingProviderError) return reason; if (reason instanceof Error && reason.message.includes("NEXT_PUBLIC_SUPABASE")) return new MarketingProviderError("configuration_missing", false); const status = Number((reason as { status?: unknown } | null)?.status ?? 0); const code = String((reason as { code?: unknown } | null)?.code ?? ""); const retryable = status >= 500 || status === 429 || /timeout|connection|PGRST000|PGRST002/i.test(code); return new MarketingProviderError(retryable ? "database_unavailable" : "provider_error", retryable); }
async function execute<T>(operation: () => PromiseLike<T>): Promise<T> { let failure = new MarketingProviderError("provider_error", false); for (let attempt = 1; attempt <= attempts; attempt += 1) { try { return await bounded(operation); } catch (reason) { failure = providerError(reason); if (!failure.retryable || attempt === attempts) throw failure; } } throw failure; }
export class SupabaseMarketingProvider implements MarketingProvider {
  async record(event: MarketingEvent) { await execute(async () => { const { error } = await client().rpc("record_public_marketing_event", { p_event: event }); if (error) throw error; }); }
  async captureLead(input: { kind: LeadCaptureKind; name?: string; email: string; company?: string; message?: string; plan?: string }) { return execute(async () => { const { data, error } = await client().rpc("capture_public_marketing_lead", { p_input: input }); if (error) throw error; return String(data); }); }
}
