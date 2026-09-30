/**
 * Phase M1/M2: Meta Marketing (Lead Ads) connection foundation. Distinct from
 * the WhatsApp Cloud API integration -- this is the Marketing/Ads Graph API
 * surface (Business Login OAuth, Pages, ad accounts, Instagram business
 * accounts, Lead Ads forms). No leadgen webhook, no lead ingestion, no CRM
 * lead/property-interest creation, and no ad publishing exist yet.
 */
export type MetaConnectionStatus = "connected" | "disconnected" | "expired" | "error";
export type MetaFormMappingStatus = "active" | "inactive";

/**
 * Minimal scope set requested for M1/M2 discovery only. Ad-account and
 * Instagram discovery are opportunistic (see Part 25): granting only these
 * two scopes means Meta will not authorize /me/adaccounts or an Instagram
 * business account lookup, and the provider treats that as "not available
 * for this connection" rather than a hard failure -- see maybeListAdAccounts
 * in meta-marketing.service.ts.
 *
 * SCOPE CATEGORIZATION (Part 9):
 *   required now (M1/M2 discovery):        pages_show_list, leads_retrieval
 *   required later (M4 lead detail fetch):  leads_retrieval (already requested)
 *   required later (ad publishing):         ads_management
 *   required later (insights):              ads_read / read_insights
 * Only the first row is requested by this phase.
 */
export const metaMarketingOAuthScopes = ["pages_show_list", "leads_retrieval"] as const;

export const oauthStateTtlSeconds = 600;

export interface MetaMarketingConnection {
  readonly id: string;
  readonly businessId: string | null;
  readonly pageId: string;
  readonly pageName: string | null;
  readonly adAccountId: string | null;
  readonly adAccountName: string | null;
  readonly instagramBusinessAccountId: string | null;
  readonly tokenExpiresAt: string | null;
  readonly scopes: readonly string[];
  readonly status: MetaConnectionStatus;
  readonly connectedAt: string;
  readonly updatedAt: string;
}

export interface MetaLeadFormMapping {
  readonly id: string;
  readonly connectionId: string;
  readonly pageId: string;
  readonly formId: string;
  readonly formName: string | null;
  readonly propertyId: string;
  readonly campaignId: string | null;
  readonly status: MetaFormMappingStatus;
  readonly createdAt: string;
}

export interface MetaPageSummary {
  readonly id: string;
  readonly name: string;
  /** Page-scoped access token, present only in the provider response -- never persisted unencrypted, never returned to the browser. */
  readonly accessToken: string;
}
export interface MetaAdAccountSummary {
  readonly id: string;
  readonly name: string;
}
export interface MetaInstagramAccountSummary {
  readonly id: string;
}
export interface MetaLeadFormSummary {
  readonly id: string;
  readonly name: string;
  readonly status: string;
}

export interface MetaLeadTenantResolution {
  readonly organizationId: string;
  readonly workspaceId: string;
  readonly connectionId: string;
  readonly propertyId: string;
  readonly campaignId: string | null;
}

/** Phase M6: an admin-authored, versioned mapping from a Meta Lead Form field to WhatsApp marketing consent. Never inferred automatically. */
export interface MetaLeadFormConsentRule {
  readonly id: string;
  readonly formMappingId: string;
  readonly channel: "whatsapp";
  readonly purpose: "marketing";
  readonly consentFieldName: string;
  readonly acceptedValues: readonly string[];
  readonly consentStatement: string;
  readonly version: number;
  readonly active: boolean;
  readonly createdAt: string;
}

/**
 * Phase C6 Part 3/9/10: question types actually documented on Meta's Lead
 * Ads form-creation reference. FULL_NAME/EMAIL/PHONE are the only contact
 * fields C6 offers by default (Part 9 -- minimal, no sensitive fields);
 * CUSTOM is used for CRM-aligned qualification questions (Part 10) since
 * Meta has no dedicated "budget"/"timeline" question type.
 */
export const metaLeadFormQuestionTypes = ["FULL_NAME", "EMAIL", "PHONE", "CUSTOM"] as const;
export type MetaLeadFormQuestionType = (typeof metaLeadFormQuestionTypes)[number];
export interface MetaLeadFormQuestion {
  readonly type: MetaLeadFormQuestionType;
  readonly key: string;
  readonly label?: string;
}
/** Sent to Meta only when the customer intends WhatsApp follow-up (Part 11) -- never fabricated, never pre-checked (is_checked_by_default is always false at the call site). */
export interface MetaLeadFormConsentDisclosure {
  readonly key: string;
  readonly title: string;
  readonly bodyText: string;
  readonly checkboxText: string;
  readonly statementVersion: number;
}
export interface CreateLeadFormInput {
  readonly name: string;
  readonly locale: string;
  readonly questions: readonly MetaLeadFormQuestion[];
  readonly privacyPolicyUrl: string;
  readonly privacyPolicyLinkText: string;
  readonly thankYouTitle: string;
  readonly thankYouBody: string;
  readonly consentDisclosure: MetaLeadFormConsentDisclosure | null;
}
export interface CreateLeadFormResult {
  readonly providerFormId: string;
  readonly status: string | null;
}

export const campaignLeadFormStatuses = ["draft", "creating", "created", "created_mapping_failed", "created_consent_failed", "uncertain", "failed", "archived"] as const;
export type CampaignLeadFormStatus = (typeof campaignLeadFormStatuses)[number];

/** Part 7/8: the server-validated draft specification a human reviews before any Meta call. Editable fields are exactly what a customer would reasonably supply; VAYON never lets arbitrary provider-payload fields through untyped. */
export interface CampaignLeadFormSpecification {
  readonly contactFields: readonly MetaLeadFormQuestion[];
  readonly qualificationQuestions: readonly MetaLeadFormQuestion[];
  readonly privacyPolicyUrl: string | null;
  readonly privacyPolicyLinkText: string;
  readonly thankYouTitle: string;
  readonly thankYouBody: string;
  readonly whatsappConsentRequested: boolean;
  readonly consentDisclosure: MetaLeadFormConsentDisclosure | null;
}

export interface CampaignLeadForm {
  readonly id: string;
  readonly campaignId: string;
  readonly propertyId: string;
  readonly connectionId: string;
  readonly pageId: string;
  readonly version: number;
  readonly providerFormId: string | null;
  readonly formName: string;
  readonly status: CampaignLeadFormStatus;
  readonly specification: CampaignLeadFormSpecification;
  readonly formMappingId: string | null;
  readonly consentRuleId: string | null;
  readonly diagnostic: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
