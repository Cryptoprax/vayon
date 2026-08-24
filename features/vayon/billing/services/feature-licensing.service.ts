import "server-only";
import { billingContext } from "./billing-context";
import type { LicensedFeature } from "../config/commercial-plans";
import { SubscriptionEntitlementService } from "./entitlement.service";
export class FeatureLicensingService {
  // Compatibility adapter replacing the former workspace_feature_licensed decision path.
  async licensed(feature: LicensedFeature) {
    const mapped = feature === "marketing_studio" || feature === "growth_studio" ? "creative_studio" : feature === "ai_workforce" ? "advanced_ai" : feature === "communications" ? "email" : feature === "property_matching" ? "sales_ai" : "crm";
    return (await new SubscriptionEntitlementService().feature(mapped)).allowed;
  }
  async snapshot() {
    const c = await billingContext(), { data, error } = await c.client.from("workspace_feature_licenses").select("feature,enabled,source,starts_at,ends_at").eq("organization_id", c.organizationId).eq("workspace_id", c.workspaceId).order("feature");
    if (error) throw error;
    return (data ?? []).map((item) => ({ feature: String(item.feature), enabled: Boolean(item.enabled), source: String(item.source), startsAt: String(item.starts_at), endsAt: item.ends_at ? String(item.ends_at) : null }));
  }
}
