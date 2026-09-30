/**
 * ADS-B4B (Part 17): future publishing OAuth scopes -- NOT wired into the
 * live OAuth authorization flow. The live flow
 * (features/platform/integrations/meta-marketing/domain/types.ts's
 * metaMarketingOAuthScopes) remains exactly ["pages_show_list",
 * "leads_retrieval"] and is untouched by this phase. This constant exists so
 * a future, separately-authorized publishing-enablement phase has a single,
 * tested place documenting the additional scopes it will need to add --
 * ads_management and pages_manage_ads only (ADS-B4A2 Part 18). business_management,
 * ads_read, and instagram_basic are deliberately excluded: CONDITIONAL,
 * deferred, and unresolved respectively, none of them required for V1.
 */
export const futureMetaAdsPublishingOAuthScopes = ["pages_show_list", "leads_retrieval", "ads_management", "pages_manage_ads"] as const;
