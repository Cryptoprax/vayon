import type { CampaignLeadFormSpecification, MetaLeadFormConsentDisclosure, MetaLeadFormQuestion } from "./types";

export class LeadFormValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeadFormValidationError";
  }
}
export class PrivacyPolicyRequiredError extends Error {
  constructor(message = "A privacy policy URL is required before creating this form on Meta.") {
    super(message);
    this.name = "PRIVACY_POLICY_REQUIRED";
  }
}

/** Part 9: minimal, no sensitive fields -- only Meta's built-in contact question types, never CUSTOM here. */
const allowedContactFieldTypes = new Set(["FULL_NAME", "EMAIL", "PHONE"]);
const maxContactFields = 3;
/** Part 10: safe maximum, CRM-aligned qualification concepts only, always Meta's CUSTOM type with a human label. */
const maxQualificationQuestions = 5;

function validateQuestionList(questions: readonly MetaLeadFormQuestion[], label: string, max: number, allowedTypes: ReadonlySet<string> | null): MetaLeadFormQuestion[] {
  if (questions.length > max) throw new LeadFormValidationError(`${label} may not exceed ${max}.`);
  const keys = new Set<string>();
  return questions.map((q) => {
    if (allowedTypes && !allowedTypes.has(q.type)) throw new LeadFormValidationError(`Unsupported question type "${q.type}" for ${label}.`);
    const key = q.key.trim();
    if (!key || key.length > 60) throw new LeadFormValidationError(`${label} question key must be 1-60 characters.`);
    if (keys.has(key)) throw new LeadFormValidationError(`${label} question keys must be unique.`);
    keys.add(key);
    if (q.type === "CUSTOM") {
      const trimmedLabel = q.label?.trim();
      if (!trimmedLabel || trimmedLabel.length > 200) throw new LeadFormValidationError(`${label} custom question requires a 1-200 character label.`);
      return { type: q.type, key, label: trimmedLabel };
    }
    return { type: q.type, key };
  });
}

function validateConsentDisclosure(disclosure: MetaLeadFormConsentDisclosure | null, requested: boolean): MetaLeadFormConsentDisclosure | null {
  if (!requested) return null;
  if (!disclosure) throw new LeadFormValidationError("A WhatsApp consent disclosure is required when WhatsApp follow-up is requested.");
  const key = disclosure.key.trim();
  const title = disclosure.title.trim();
  const bodyText = disclosure.bodyText.trim();
  const checkboxText = disclosure.checkboxText.trim();
  if (!key || key.length > 60) throw new LeadFormValidationError("Consent field identifier must be 1-60 characters.");
  if (!title || title.length > 80) throw new LeadFormValidationError("Consent disclosure title must be 1-80 characters.");
  if (!bodyText || bodyText.length > 600) throw new LeadFormValidationError("Consent disclosure text must be 1-600 characters.");
  if (!checkboxText || checkboxText.length > 300) throw new LeadFormValidationError("Consent checkbox text must be 1-300 characters.");
  if (!Number.isInteger(disclosure.statementVersion) || disclosure.statementVersion < 1) throw new LeadFormValidationError("Consent statement version must be a positive whole number.");
  return { key, title, bodyText, checkboxText, statementVersion: disclosure.statementVersion };
}

/** Part 7/9/10/11: validated at draft-save time. Privacy policy is intentionally NOT required here (Part 7 -- a human may still be drafting) -- see validateSpecificationForCreation for the stricter gate applied only at the explicit "Create on Meta" step. */
export function validateLeadFormSpecification(input: {
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
}): { formName: string; specification: CampaignLeadFormSpecification } {
  const formName = input.formName.trim();
  if (!formName || formName.length > 160) throw new LeadFormValidationError("Form name must be 1-160 characters.");
  const locale = input.locale.trim();
  if (!/^[a-z]{2}_[A-Z]{2}$/.test(locale)) throw new LeadFormValidationError("Locale must be a language_COUNTRY code such as en_US.");

  const contactFields = validateQuestionList(input.contactFields, "Contact fields", maxContactFields, allowedContactFieldTypes);
  if (contactFields.length === 0) throw new LeadFormValidationError("At least one contact field is required.");
  const qualificationQuestions = validateQuestionList(input.qualificationQuestions, "Qualification questions", maxQualificationQuestions, null);
  for (const q of qualificationQuestions) if (q.type !== "CUSTOM") throw new LeadFormValidationError("Qualification questions must use Meta's CUSTOM question type.");

  const privacyPolicyUrl = input.privacyPolicyUrl?.trim() || null;
  if (privacyPolicyUrl && !/^https:\/\//i.test(privacyPolicyUrl)) throw new LeadFormValidationError("Privacy policy URL must start with https://.");
  const privacyPolicyLinkText = input.privacyPolicyLinkText.trim().slice(0, 70) || "Privacy Policy";

  const thankYouTitle = input.thankYouTitle.trim();
  const thankYouBody = input.thankYouBody.trim();
  if (!thankYouTitle || thankYouTitle.length > 80) throw new LeadFormValidationError("Thank-you title must be 1-80 characters.");
  if (!thankYouBody || thankYouBody.length > 600) throw new LeadFormValidationError("Thank-you message must be 1-600 characters.");

  const consentDisclosure = validateConsentDisclosure(input.consentDisclosure, input.whatsappConsentRequested);

  return {
    formName,
    specification: {
      contactFields,
      qualificationQuestions,
      privacyPolicyUrl,
      privacyPolicyLinkText,
      thankYouTitle,
      thankYouBody,
      whatsappConsentRequested: input.whatsappConsentRequested,
      consentDisclosure,
    },
  };
}

/** Part 12/14: the stricter gate applied only immediately before the explicit "Create on Meta" action -- fails closed rather than silently proceeding without a real controller privacy policy or explicit consent semantics. */
export function requireCreatableSpecification(specification: CampaignLeadFormSpecification): void {
  if (!specification.privacyPolicyUrl) throw new PrivacyPolicyRequiredError();
  if (specification.whatsappConsentRequested && !specification.consentDisclosure) {
    throw new LeadFormValidationError("WhatsApp consent was requested but no consent disclosure is configured; fix the draft or disable WhatsApp follow-up before creating this form.");
  }
}
