import "server-only";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { requireWorkspacePermission } from "@/features/platform/permissions/runtime/permission.service";
import { TokenCryptoService } from "@/features/platform/integrations/google/services/token-crypto.service";
import { CampaignLeadFormRepository } from "../repositories/campaign-lead-form.repository";
import { MetaMarketingRepository } from "../repositories/meta-marketing.repository";
import { MetaMarketingService } from "./meta-marketing.service";
import { MetaGraphMarketingProvider, type MetaMarketingProvider } from "../providers/meta-graph.provider";
import { validateLeadFormSpecification, requireCreatableSpecification } from "../domain/lead-form-validation";
import type { CampaignLeadForm, CampaignLeadFormSpecification, CreateLeadFormInput, MetaLeadFormQuestion, MetaLeadFormConsentDisclosure } from "../domain/types";

export class CampaignLeadFormOwnershipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CampaignLeadFormOwnershipError";
  }
}
export class MetaConnectionRequiredError extends Error {
  constructor(message = "Connect Meta Marketing before preparing a Lead Form.") {
    super(message);
    this.name = "MetaConnectionRequiredError";
  }
}

export interface PrepareLeadFormInput {
  readonly campaignId: string;
  readonly formName: string;
  readonly locale: string;
  readonly contactFields: readonly MetaLeadFormQuestion[];
  readonly qualificationQuestions: readonly MetaLeadFormQuestion[];
  readonly privacyPolicyUrl: string | null;
  readonly privacyPolicyLinkText: string;
  readonly thankYouTitle: string;
  readonly thankYouBody: string;
  readonly whatsappConsentRequested: boolean;
  readonly consentDisclosure: MetaLeadFormConsentDisclosure | null;
}

/** Part 8: the provider-facing payload is built ONLY from the already-validated, server-stored specification -- never re-derived from fresh client input at creation time. */
function buildProviderInput(formName: string, specification: CampaignLeadFormSpecification): CreateLeadFormInput {
  return {
    name: formName,
    locale: "en_US",
    questions: [...specification.contactFields, ...specification.qualificationQuestions],
    privacyPolicyUrl: specification.privacyPolicyUrl as string,
    privacyPolicyLinkText: specification.privacyPolicyLinkText,
    thankYouTitle: specification.thankYouTitle,
    thankYouBody: specification.thankYouBody,
    consentDisclosure: specification.consentDisclosure,
  };
}

export class CampaignLeadFormService {
  constructor(
    private repository: CampaignLeadFormRepository,
    private metaRepository: MetaMarketingRepository,
    private metaService: MetaMarketingService,
    private provider: MetaMarketingProvider,
    private crypto: TokenCryptoService,
  ) {}

  static async production(): Promise<CampaignLeadFormService | null> {
    await requireWorkspacePermission("integrations", "manage");
    const context = await operationsContext();
    const { data } = await context.client.auth.getUser();
    if (!data.user) return null;
    const metaService = await MetaMarketingService.production();
    return new CampaignLeadFormService(
      new CampaignLeadFormRepository(context.client, context.organizationId, context.workspaceId),
      new MetaMarketingRepository(context.client, context.organizationId, context.workspaceId),
      metaService,
      new MetaGraphMarketingProvider(),
      new TokenCryptoService(),
    );
  }

  /** Test/internal constructor: an explicit fake provider (Part 30 -- never a real Graph call in tests). */
  static withProvider(repository: CampaignLeadFormRepository, metaRepository: MetaMarketingRepository, metaService: MetaMarketingService, provider: MetaMarketingProvider, crypto: TokenCryptoService) {
    return new CampaignLeadFormService(repository, metaRepository, metaService, provider, crypto);
  }

  async list(campaignId: string): Promise<readonly CampaignLeadForm[]> {
    return this.repository.listByCampaign(campaignId);
  }

  /** Part 6/7/8: campaign+property+accepted-strategy+accepted-package+connection are all re-validated server-side inside save_campaign_lead_form_draft; this method only validates the human-facing specification fields before persisting. */
  async prepareDraft(input: PrepareLeadFormInput): Promise<CampaignLeadForm> {
    const { formName, specification } = validateLeadFormSpecification(input);
    const localFormId = await this.repository.saveDraft(input.campaignId, formName, specification);
    const saved = await this.repository.get(localFormId);
    if (!saved) throw new Error("Lead form draft could not be reloaded after save.");
    return saved;
  }

  /**
   * Part 12/14/19/20/22/23/24/25/26: the explicit "Create on Meta" action.
   * Claims atomically (Part 19), calls the provider exactly once, then
   * reuses the EXISTING MetaMarketingService.createFormMapping() and
   * .configureConsentRule() unchanged -- a mapping or consent-rule failure
   * never re-triggers Meta form creation, only its own local retry.
   */
  async createOnMeta(localFormId: string): Promise<CampaignLeadForm> {
    const form = await this.repository.get(localFormId);
    if (!form) throw new CampaignLeadFormOwnershipError("Lead form not found in this workspace.");

    if (form.status === "created" || form.status === "created_mapping_failed" || form.status === "created_consent_failed") {
      return this.completeGovernance(form);
    }

    requireCreatableSpecification(form.specification);

    const claimed = await this.repository.claimCreation(localFormId);
    if (!claimed) {
      const current = await this.repository.get(localFormId);
      if (!current) throw new CampaignLeadFormOwnershipError("Lead form not found in this workspace.");
      return current;
    }

    const connection = await this.metaRepository.connection();
    if (!connection || connection.status !== "connected") throw new MetaConnectionRequiredError();
    const encrypted = await this.metaRepository.getEncryptedToken(connection.id);
    if (!encrypted) throw new MetaConnectionRequiredError();
    const pageToken = this.crypto.decrypt(encrypted);

    try {
      const result = await this.provider.createLeadForm(connection.pageId, pageToken, buildProviderInput(claimed.formName, claimed.specification));
      await this.repository.completeCreation(localFormId, true, result.providerFormId, null);
    } catch (error) {
      const diagnostic = error instanceof Error ? error.message.slice(0, 200) : "provider_exception";
      await this.repository.completeCreation(localFormId, false, null, diagnostic);
      const failed = await this.repository.get(localFormId);
      if (!failed) throw new CampaignLeadFormOwnershipError("Lead form not found in this workspace.");
      return failed;
    }

    const created = await this.repository.get(localFormId);
    if (!created || !created.providerFormId) throw new Error("Lead form could not be reloaded after creation.");
    return this.completeGovernance(created);
  }

  /** Part 22/23/24/25: automatic property mapping + M6 consent rule, using the SAME existing MetaMarketingService methods a manual mapping already uses -- never a second resolver, never a second consent system. */
  private async completeGovernance(form: CampaignLeadForm): Promise<CampaignLeadForm> {
    let current = form;
    if (!current.formMappingId && current.providerFormId) {
      try {
        const formMappingId = await this.metaService.createFormMapping({ formId: current.providerFormId, propertyId: current.propertyId, campaignId: current.campaignId });
        await this.repository.markMapped(current.id, formMappingId);
      } catch (error) {
        await this.repository.markMappingFailed(current.id, error instanceof Error ? error.message.slice(0, 200) : "mapping_exception");
      }
      const reloaded = await this.repository.get(current.id);
      if (reloaded) current = reloaded;
    }

    if (current.formMappingId && !current.consentRuleId && current.specification.whatsappConsentRequested && current.specification.consentDisclosure) {
      const disclosure = current.specification.consentDisclosure;
      try {
        const consentRuleId = await this.metaService.configureConsentRule({
          formMappingId: current.formMappingId,
          consentFieldName: disclosure.key,
          acceptedValues: [disclosure.checkboxText],
          consentStatement: disclosure.bodyText,
        });
        await this.repository.markConsentConfigured(current.id, consentRuleId);
      } catch (error) {
        await this.repository.markConsentFailed(current.id, error instanceof Error ? error.message.slice(0, 200) : "consent_exception");
      }
      const reloaded = await this.repository.get(current.id);
      if (reloaded) current = reloaded;
    }

    return current;
  }
}

/** Part 26: distinct governance facts, never collapsed into one flag. */
export function isOutreachReady(form: CampaignLeadForm): boolean {
  if (form.status !== "created") return false;
  if (!form.formMappingId) return false;
  if (form.specification.whatsappConsentRequested && !form.consentRuleId) return false;
  return true;
}
