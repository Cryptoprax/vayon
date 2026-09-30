"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { guardSubscriptionAction } from "@/features/vayon/billing/services/subscription-write-guard";
import { requireWorkspacePermission } from "@/features/platform/permissions/runtime/permission.service";
import { MetaMarketingService } from "./services/meta-marketing.service";
import { CampaignLeadFormService } from "./services/campaign-lead-form.service";
import type { MetaLeadFormQuestion, MetaLeadFormConsentDisclosure } from "./domain/types";

const settingsPath = "/vayon/settings/integrations/meta-marketing";

/**
 * No commercial entitlement gate here, matching the WhatsApp connect action's
 * own precedent: there is no dedicated Meta Marketing plan flag today (see
 * Part 20/the final report's ENTITLEMENT section). Only permission-gating
 * plus the general subscription-health guard; entitlement packaging is
 * explicitly deferred, not silently invented.
 *
 * Two-layer enforcement: requireWorkspacePermission("integrations","manage")
 * here, plus can_manage_integrations() inside every write RPC -- the same
 * defense-in-depth convention used since D1, not a second role system.
 */
async function authorize() {
  await guardSubscriptionAction();
  await requireWorkspacePermission("integrations", "manage");
}

function fail(path: string, error: unknown): never {
  const message = error instanceof Error ? error.message : "The Meta Marketing action could not be completed.";
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function beginConnectMetaMarketingAction() {
  await authorize();
  const service = await MetaMarketingService.production();
  let url: string;
  try {
    url = await service.beginConnect(settingsPath);
  } catch (error) {
    fail(settingsPath, error);
  }
  redirect(url);
}

export async function disconnectMetaMarketingAction() {
  await authorize();
  const service = await MetaMarketingService.production();
  try {
    await service.disconnect();
  } catch (error) {
    fail(settingsPath, error);
  }
  revalidatePath(settingsPath);
}

export async function saveMetaMarketingConnectionAction(formData: FormData) {
  await authorize();
  const state = String(formData.get("state") ?? "");
  const pageId = String(formData.get("pageId") ?? "");
  const adAccountId = String(formData.get("adAccountId") ?? "") || null;
  if (!state || !pageId) fail(settingsPath, new Error("A Page selection is required."));

  const service = await MetaMarketingService.production();
  try {
    await service.saveConnection({ state, pageId, adAccountId });
  } catch (error) {
    fail(settingsPath, error);
  }
  revalidatePath(settingsPath);
  redirect(`${settingsPath}?success=${encodeURIComponent("Meta Marketing connected.")}`);
}

export async function createMetaLeadFormMappingAction(formData: FormData) {
  await authorize();
  const formId = String(formData.get("formId") ?? "");
  const propertyId = String(formData.get("propertyId") ?? "");
  const campaignId = String(formData.get("campaignId") ?? "") || null;
  if (!formId || !propertyId) fail(settingsPath, new Error("A Lead Form and a property are required."));

  const service = await MetaMarketingService.production();
  try {
    await service.createFormMapping({ formId, propertyId, campaignId });
  } catch (error) {
    fail(settingsPath, error);
  }
  revalidatePath(settingsPath);
}

export async function disableMetaLeadFormMappingAction(formData: FormData) {
  await authorize();
  const mappingId = String(formData.get("mappingId") ?? "");
  if (!mappingId) fail(settingsPath, new Error("A mapping is required."));

  const service = await MetaMarketingService.production();
  try {
    await service.disableFormMapping(mappingId);
  } catch (error) {
    fail(settingsPath, error);
  }
  revalidatePath(settingsPath);
}

/**
 * Phase M6, Part 5/21: an explicit, admin-authored WhatsApp consent rule for
 * one Lead Form mapping. Submitting a lead form does NOT automatically grant
 * WhatsApp consent -- this action exists only for a customer who has
 * verified their own Meta form explicitly collects WhatsApp opt-in and wants
 * to record exactly which field/value/disclosure means that.
 */
export async function configureMetaLeadFormConsentRuleAction(formData: FormData) {
  await authorize();
  const formMappingId = String(formData.get("formMappingId") ?? "");
  const consentFieldName = String(formData.get("consentFieldName") ?? "").trim();
  const acceptedValuesRaw = String(formData.get("acceptedValues") ?? "");
  const consentStatement = String(formData.get("consentStatement") ?? "").trim();
  const acceptedValues = acceptedValuesRaw.split(",").map((value) => value.trim()).filter((value) => value.length > 0);

  if (!formMappingId || !consentFieldName || acceptedValues.length === 0 || !consentStatement) {
    fail(settingsPath, new Error("A Meta field name, at least one accepted value, and a consent disclosure statement are all required."));
  }

  const service = await MetaMarketingService.production();
  try {
    await service.configureConsentRule({ formMappingId, consentFieldName, acceptedValues, consentStatement });
  } catch (error) {
    fail(settingsPath, error);
  }
  revalidatePath(settingsPath);
}

export async function disableMetaLeadFormConsentRuleAction(formData: FormData) {
  await authorize();
  const ruleId = String(formData.get("ruleId") ?? "");
  if (!ruleId) fail(settingsPath, new Error("A consent rule is required."));

  const service = await MetaMarketingService.production();
  try {
    await service.disableConsentRule(ruleId);
  } catch (error) {
    fail(settingsPath, error);
  }
  revalidatePath(settingsPath);
}

/**
 * Phase C6 Part 4/5/6/9/10/11: the client supplies only the human-facing
 * draft fields (form name, which contact fields, up to 5 qualification
 * question labels, privacy policy URL, thank-you copy, and whether/what
 * WhatsApp consent disclosure to include). Campaign/property ownership, the
 * accepted-strategy/accepted-package requirement, the Meta connection/Page/
 * token, and the final provider payload are all derived and validated
 * server-side inside CampaignLeadFormService -- never trusted from the
 * client.
 */
const campaignLeadFormAccessError = "Meta Marketing / Creative Studio access is required.";

function campaignPath(campaignId: string): string {
  return `/vayon/creative-studio/campaigns/${campaignId}`;
}

export async function prepareCampaignLeadFormAction(formData: FormData) {
  await guardSubscriptionAction();
  const service = await CampaignLeadFormService.production();
  if (!service) throw new Error(campaignLeadFormAccessError);
  const campaignId = String(formData.get("campaignId") ?? "");

  const contactFields: MetaLeadFormQuestion[] = [];
  if (formData.get("contactFullName")) contactFields.push({ type: "FULL_NAME", key: "full_name" });
  if (formData.get("contactEmail")) contactFields.push({ type: "EMAIL", key: "email" });
  if (formData.get("contactPhone")) contactFields.push({ type: "PHONE", key: "phone" });

  const qualificationQuestions: MetaLeadFormQuestion[] = [];
  for (let i = 1; i <= 5; i++) {
    const label = String(formData.get(`qualificationQuestion${i}`) ?? "").trim();
    if (label) qualificationQuestions.push({ type: "CUSTOM", key: `q${i}`, label });
  }

  const whatsappConsentRequested = Boolean(formData.get("whatsappConsentRequested"));
  const consentDisclosure: MetaLeadFormConsentDisclosure | null = whatsappConsentRequested
    ? {
        key: "whatsapp_marketing_consent",
        title: String(formData.get("consentTitle") ?? "Stay in touch"),
        bodyText: String(formData.get("consentBody") ?? ""),
        checkboxText: String(formData.get("consentCheckboxText") ?? ""),
        statementVersion: 1,
      }
    : null;

  try {
    await service.prepareDraft({
      campaignId,
      formName: String(formData.get("formName") ?? ""),
      locale: "en_US",
      contactFields,
      qualificationQuestions,
      privacyPolicyUrl: String(formData.get("privacyPolicyUrl") ?? "") || null,
      privacyPolicyLinkText: String(formData.get("privacyPolicyLinkText") ?? "Privacy Policy"),
      thankYouTitle: String(formData.get("thankYouTitle") ?? "Thank you"),
      thankYouBody: String(formData.get("thankYouBody") ?? "We will be in touch shortly."),
      whatsappConsentRequested,
      consentDisclosure,
    });
  } catch (error) {
    fail(campaignPath(campaignId), error);
  }
  revalidatePath(campaignPath(campaignId));
}

export async function createCampaignLeadFormOnMetaAction(formData: FormData) {
  await guardSubscriptionAction();
  const service = await CampaignLeadFormService.production();
  if (!service) throw new Error(campaignLeadFormAccessError);
  const campaignId = String(formData.get("campaignId") ?? "");
  const localFormId = String(formData.get("localFormId") ?? "");
  try {
    await service.createOnMeta(localFormId);
  } catch (error) {
    fail(campaignPath(campaignId), error);
  }
  revalidatePath(campaignPath(campaignId));
}
