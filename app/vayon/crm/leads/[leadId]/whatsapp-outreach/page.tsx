import { enforcePagePermission } from "@/features/platform/permissions/runtime/http";
import { Button, ButtonLink } from "@/features/platform/design-system";
import { prepareWhatsAppOutreach } from "@/features/platform/integrations/whatsapp/whatsapp-outreach-execution.service";
import { languagesForTemplateName, findUsableTemplate, planTemplateVariables, renderTemplatePreview } from "@/features/platform/integrations/whatsapp/whatsapp-outreach-template";
import { sendWhatsAppOutreachAction } from "@/features/platform/integrations/whatsapp/whatsapp-outreach.actions";

export const dynamic = "force-dynamic";

const reasonCopy: Record<string, string> = {
  lead_not_found: "This lead could not be found in your workspace.",
  do_not_contact: "This lead is marked do-not-contact.",
  no_phone: "This lead has no phone number on file.",
  phone_not_normalized: "This lead's phone number could not be safely verified for WhatsApp (no country code recorded). Correct the phone number before outreach -- VAYON never guesses a country.",
  no_consent: "No WhatsApp marketing consent has been recorded for this lead.",
  consent_revoked: "WhatsApp marketing consent for this lead has been revoked.",
  consent_unverifiable: "WhatsApp marketing consent for this lead could not be verified.",
  whatsapp_not_entitled: "Your current plan does not include WhatsApp outreach.",
  connection_unavailable: "No active WhatsApp connection is configured for this workspace.",
  template_required_unavailable: "This lead requires an approved WhatsApp template, and none is currently available for your connected number.",
};

function maskPhone(phone: string): string {
  return phone.length > 4 ? `${phone.slice(0, -4).replace(/\d/g, "*")}${phone.slice(-4)}` : phone;
}

export default async function Page({
  params, searchParams,
}: {
  params: Promise<{ leadId: string }>;
  searchParams: Promise<{ template?: string; language?: string; error?: string; success?: string; [key: string]: string | undefined }>;
}) {
  // Reuses the "approvals" permission module, matching whatsapp-outreach.actions.ts's
  // own documented reasoning -- sending a real customer message is at least
  // as sensitive as deciding an approval, and no dedicated communications
  // module exists in the permission catalog.
  await enforcePagePermission("approvals");
  const { leadId } = await params;
  const query = await searchParams;

  const preparation = await prepareWhatsAppOutreach(leadId);
  const { eligibility, usableTemplates, property, executionId } = preparation;

  const templateNames = [...new Set(usableTemplates.map((template) => template.name))];
  const selectedName = query.template && templateNames.includes(query.template) ? query.template : null;
  const languageOptions = selectedName ? languagesForTemplateName(usableTemplates, selectedName) : [];
  const selectedLanguage = selectedName
    ? (query.language && languageOptions.includes(query.language) ? query.language : (languageOptions.length === 1 ? languageOptions[0] : null))
    : null;
  const template = selectedName && selectedLanguage ? findUsableTemplate(usableTemplates, selectedName, selectedLanguage) : null;
  const plan = template ? planTemplateVariables(template) : [];

  const variablesByComponent: Record<"HEADER" | "BODY", readonly string[]> = { HEADER: [], BODY: [] };
  let variablesComplete = Boolean(template);
  for (const component of plan) {
    const values: string[] = [];
    for (let index = 1; index <= component.placeholderCount; index += 1) {
      const value = query[`${component.type.toLowerCase()}-${index}`];
      if (!value) variablesComplete = false;
      values.push(value ?? "");
    }
    variablesByComponent[component.type] = values;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6">
      {query.error && <p role="alert" className="rounded-xl border border-vds-danger bg-vds-danger-soft p-3 text-sm text-vds-danger">{query.error}</p>}
      {query.success && <p role="status" className="rounded-xl border border-vds-border p-3 text-sm text-vds-success">{query.success}</p>}

      <section className="rounded-2xl border border-vds-border bg-vds-surface p-5">
        <h1 className="text-xl font-semibold">WhatsApp Outreach</h1>
        <p className="mt-2 text-sm text-vds-muted">Consent-governed first-contact outreach for this Meta lead. No message is sent automatically.</p>

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-xs text-vds-muted">Consent</dt><dd className="mt-1">{eligibility.consent.status === "valid" ? "Granted (Meta Lead Form)" : (reasonCopy[eligibility.consent.reason] ?? eligibility.consent.reason)}</dd></div>
          <div><dt className="text-xs text-vds-muted">Transport</dt><dd className="mt-1">{eligibility.transport.requiresTemplate ? "Template required" : "Freeform available"}</dd></div>
          <div><dt className="text-xs text-vds-muted">Recipient</dt><dd className="mt-1">{eligibility.normalizedPhone ? maskPhone(eligibility.normalizedPhone) : "Not available"}</dd></div>
          {property.propertyId && <div><dt className="text-xs text-vds-muted">Property</dt><dd className="mt-1"><a className="underline" href={`/vayon/properties/${property.propertyId}`}>View property</a></dd></div>}
          {property.status === "unresolved_multiple_interests" && <div><dt className="text-xs text-vds-muted">Property</dt><dd className="mt-1">Multiple active property interests -- select manually if a template variable needs one.</dd></div>}
        </dl>

        {!eligibility.eligible && (
          <p className="mt-4 rounded-xl border border-vds-border bg-vds-background p-3 text-sm text-vds-muted">
            {eligibility.consent.status === "blocked"
              ? (reasonCopy[eligibility.consent.reason] ?? eligibility.consent.reason)
              : (eligibility.transport.reason ? (reasonCopy[eligibility.transport.reason] ?? eligibility.transport.reason) : "This lead is not currently eligible for WhatsApp outreach.")}
          </p>
        )}

        {eligibility.eligible && !eligibility.transport.requiresTemplate && (
          <div className="mt-4">
            <p className="text-sm text-vds-muted">This lead has an open WhatsApp conversation window. Use the existing conversation to reply -- a new first-contact template is not needed.</p>
            <ButtonLink href={`/vayon/communications?lead=${leadId}`} className="mt-3">Open WhatsApp conversation</ButtonLink>
          </div>
        )}

        {eligibility.eligible && eligibility.transport.requiresTemplate && (
          <div className="mt-5 space-y-5">
            {!selectedName && (
              <form method="get" className="space-y-3">
                <label className="block text-sm">
                  <span className="mb-1 block text-xs text-vds-muted">Approved WhatsApp template</span>
                  {templateNames.length ? (
                    <select name="template" required defaultValue="" className="w-full rounded-lg border border-vds-border bg-vds-background p-2 text-sm">
                      <option value="" disabled>Select a template</option>
                      {templateNames.map((name) => <option key={name} value={name}>{name}</option>)}
                    </select>
                  ) : (
                    <p className="text-sm text-vds-muted">No approved WhatsApp template is currently available for your connected number.</p>
                  )}
                </label>
                {templateNames.length > 0 && <Button type="submit" variant="primary">Choose template</Button>}
              </form>
            )}

            {selectedName && !selectedLanguage && languageOptions.length > 1 && (
              <form method="get" className="space-y-3">
                <input type="hidden" name="template" value={selectedName} />
                <label className="block text-sm">
                  <span className="mb-1 block text-xs text-vds-muted">Language</span>
                  <select name="language" required defaultValue="" className="w-full rounded-lg border border-vds-border bg-vds-background p-2 text-sm">
                    <option value="" disabled>Select a language</option>
                    {languageOptions.map((language) => <option key={language} value={language}>{language}</option>)}
                  </select>
                </label>
                <Button type="submit" variant="primary">Choose language</Button>
              </form>
            )}

            {template && (
              <form method="get" className="space-y-3">
                <input type="hidden" name="template" value={selectedName ?? ""} />
                <input type="hidden" name="language" value={selectedLanguage ?? ""} />
                {plan.map((component) => (
                  <fieldset key={component.type} className="space-y-2">
                    <legend className="text-xs text-vds-muted">{component.type === "HEADER" ? "Header variables" : "Message variables"}</legend>
                    {Array.from({ length: component.placeholderCount }, (_, i) => i + 1).map((index) => (
                      <label key={index} className="block text-sm">
                        <span className="mb-1 block text-xs text-vds-muted">{"{{"}{index}{"}}"}</span>
                        <input type="text" name={`${component.type.toLowerCase()}-${index}`} required maxLength={300} defaultValue={query[`${component.type.toLowerCase()}-${index}`] ?? ""} className="w-full rounded-lg border border-vds-border bg-vds-background p-2 text-sm" />
                      </label>
                    ))}
                  </fieldset>
                ))}
                <Button type="submit" variant="primary">Preview</Button>
              </form>
            )}

            {template && variablesComplete && (
              <div className="space-y-4 rounded-xl border border-vds-border bg-vds-background p-4">
                <div>
                  <p className="text-xs text-vds-muted">Preview -- provider template text plus your variables, exactly as it will be sent</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{renderTemplatePreview(template, variablesByComponent)}</p>
                </div>
                <p className="text-xs text-vds-muted">Consent source: Meta Lead Form.</p>
                <form action={sendWhatsAppOutreachAction}>
                  <input type="hidden" name="leadId" value={leadId} />
                  <input type="hidden" name="executionId" value={executionId} />
                  <input type="hidden" name="templateName" value={template.name} />
                  <input type="hidden" name="templateLanguage" value={template.language} />
                  {Object.entries(variablesByComponent).flatMap(([type, values]) =>
                    values.map((value, index) => <input key={`${type}-${index}`} type="hidden" name={`${type.toLowerCase()}-${index + 1}`} value={value} />),
                  )}
                  <Button type="submit" variant="primary">Send WhatsApp Message</Button>
                </form>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
