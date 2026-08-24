import "server-only";
import { log } from "@/lib/observability/logger";
import type { LeadCaptureKind, MarketingEventType } from "../contracts";
import { MarketingProviderError, SupabaseMarketingProvider } from "../providers/supabase-marketing.provider";
type ContactInput = { kind: LeadCaptureKind; name?: string; email: string; company?: string; message?: string; plan?: string };
type RequestContext = { requestId: string; correlationId: string };
function failureFields(reason: unknown, context: RequestContext, operation: string) { const failure = reason instanceof MarketingProviderError ? reason : new MarketingProviderError("provider_error", false); return { ...context, tenantId: "public", route: "/contact", provider: "supabase-marketing", operation, diagnostic: failure.diagnostic, retryRecommendation: failure.retryable ? "automatic_retry_exhausted" : "verify_configuration_and_migrations" }; }
export class ContactPipelineService {
  constructor(private readonly provider = new SupabaseMarketingProvider()) {}
  async submit(input: ContactInput, context: RequestContext) { let leadId: string | null = null; try { leadId = await this.provider.captureLead(input); } catch (reason) { log("marketing.contact.storage_failed", failureFields(reason, context, "capture_lead")); }
    const eventType: MarketingEventType = input.kind === "demo" ? "demo_request" : input.kind === "trial" ? "trial_signup" : input.kind === "sales" ? "contact_sales" : input.kind === "enterprise" ? "enterprise_inquiry" : input.kind === "waitlist" ? "waitlist" : "newsletter";
    try { await this.provider.record({ type: eventType, path: "/contact", sessionId: context.correlationId, metadata: { source: "contact_form" } }); } catch (reason) { log("marketing.contact.optional_event_failed", failureFields(reason, context, "record_marketing_event")); }
    return { accepted: true as const, leadId, storage: leadId ? "stored" as const : "retry_required" as const }; }
}
