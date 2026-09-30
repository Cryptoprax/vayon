import { Button } from "@/features/platform/design-system";
import { prepareCampaignLeadFormAction, createCampaignLeadFormOnMetaAction } from "../actions";
import { isOutreachReady } from "../services/campaign-lead-form.service";
import type { CampaignLeadForm } from "../domain/types";

const card = "rounded-2xl border border-vds-border bg-vds-surface p-5";

function ReadinessRow({ label, ready }: { readonly label: string; readonly ready: boolean }) {
  return <p className="mt-1 text-sm"><span className={ready ? "text-vds-primary" : "text-vds-muted"}>{ready ? "✓" : "○"}</span> {label}</p>;
}

function LeadFormCard({ form }: { readonly form: CampaignLeadForm }) {
  const s = form.specification;
  const outreachReady = isOutreachReady(form);
  return (
    <div className={`${card} space-y-4`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{form.formName} · v{form.version} · {form.status}</h3>
        {form.status === "draft" && (
          <form action={createCampaignLeadFormOnMetaAction}>
            <input type="hidden" name="campaignId" value={form.campaignId} />
            <input type="hidden" name="localFormId" value={form.id} />
            <Button type="submit" variant="control">Create on Meta</Button>
          </form>
        )}
        {(form.status === "created_mapping_failed" || form.status === "created_consent_failed") && (
          <form action={createCampaignLeadFormOnMetaAction}>
            <input type="hidden" name="campaignId" value={form.campaignId} />
            <input type="hidden" name="localFormId" value={form.id} />
            <Button type="submit" variant="control">Retry</Button>
          </form>
        )}
      </div>

      <section>
        <h4 className="text-xs font-semibold uppercase text-vds-muted">Contact fields</h4>
        <p className="mt-1 text-sm text-vds-muted">{s.contactFields.map((f) => f.type).join(", ") || "None"}</p>
      </section>

      <section>
        <h4 className="text-xs font-semibold uppercase text-vds-muted">Qualification questions</h4>
        <ul className="mt-1 list-disc pl-5 text-sm text-vds-muted">{s.qualificationQuestions.map((q) => <li key={q.key}>{q.label}</li>)}</ul>
      </section>

      <section>
        <h4 className="text-xs font-semibold uppercase text-vds-muted">Privacy policy</h4>
        <p className="mt-1 text-sm text-vds-muted">{s.privacyPolicyUrl ?? "Not configured -- required before Create on Meta"}</p>
      </section>

      <section>
        <h4 className="text-xs font-semibold uppercase text-vds-muted">WhatsApp consent</h4>
        {s.whatsappConsentRequested && s.consentDisclosure ? (
          <p className="mt-1 text-sm text-vds-muted">{s.consentDisclosure.checkboxText} (unchecked by default -- never pre-checked or inferred)</p>
        ) : (
          <p className="mt-1 text-sm text-vds-muted">No WhatsApp follow-up consent requested on this form.</p>
        )}
      </section>

      <section>
        <h4 className="text-xs font-semibold uppercase text-vds-muted">Thank-you message</h4>
        <p className="mt-1 text-sm text-vds-muted">{s.thankYouTitle} -- {s.thankYouBody}</p>
      </section>

      {form.diagnostic && <p className="text-sm text-vds-warning">{form.diagnostic}</p>}

      {form.status !== "draft" && (
        <section>
          <h4 className="text-xs font-semibold uppercase text-vds-muted">Readiness</h4>
          <ReadinessRow label="Form created on Meta" ready={form.status === "created" || form.status === "created_mapping_failed" || form.status === "created_consent_failed"} />
          <ReadinessRow label="Mapped to this property" ready={Boolean(form.formMappingId)} />
          {form.specification.whatsappConsentRequested && <ReadinessRow label="WhatsApp consent rule configured" ready={Boolean(form.consentRuleId)} />}
          <p className={`mt-2 text-sm font-medium ${outreachReady ? "text-vds-primary" : "text-vds-muted"}`}>{outreachReady ? "Outreach ready" : "Not outreach ready yet"}</p>
        </section>
      )}
    </div>
  );
}

export function CampaignLeadFormPanel({ campaignId, forms }: { readonly campaignId: string; readonly forms: readonly CampaignLeadForm[] }) {
  return (
    <div className="space-y-5">
      <form action={prepareCampaignLeadFormAction} className={`${card} space-y-3`}>
        <input type="hidden" name="campaignId" value={campaignId} />
        <h3 className="font-semibold">Lead Form</h3>
        <p className="text-sm text-vds-muted">Prepare a Lead Form draft for human review before creating it on Meta. Draft only -- nothing is sent to Meta until you explicitly click Create on Meta.</p>
        <label className="block text-sm">Form name<input required name="formName" maxLength={160} className="vds-focus mt-1 h-11 w-full rounded-xl border border-vds-border bg-vds-elevated px-3" /></label>
        <fieldset className="grid gap-2 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="contactFullName" defaultChecked /> Full name</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="contactPhone" defaultChecked /> Phone</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="contactEmail" defaultChecked /> Email</label>
        </fieldset>
        <label className="block text-sm">Qualification question 1<input name="qualificationQuestion1" maxLength={200} placeholder="What is your budget range?" className="vds-focus mt-1 h-11 w-full rounded-xl border border-vds-border bg-vds-elevated px-3" /></label>
        <label className="block text-sm">Qualification question 2 (optional)<input name="qualificationQuestion2" maxLength={200} placeholder="What is your purchase timeline?" className="vds-focus mt-1 h-11 w-full rounded-xl border border-vds-border bg-vds-elevated px-3" /></label>
        <label className="block text-sm">Privacy policy URL<input name="privacyPolicyUrl" type="url" placeholder="https://example.com/privacy" className="vds-focus mt-1 h-11 w-full rounded-xl border border-vds-border bg-vds-elevated px-3" /></label>
        <label className="block text-sm">Thank-you title<input name="thankYouTitle" defaultValue="Thank you" maxLength={80} className="vds-focus mt-1 h-11 w-full rounded-xl border border-vds-border bg-vds-elevated px-3" /></label>
        <label className="block text-sm">Thank-you message<textarea name="thankYouBody" defaultValue="We will be in touch shortly." maxLength={600} className="vds-focus mt-1 min-h-20 w-full rounded-xl border border-vds-border bg-vds-elevated p-3" /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="whatsappConsentRequested" /> Request explicit WhatsApp follow-up consent</label>
        <label className="block text-sm">Consent checkbox text (shown to the prospect, unchecked by default)<input name="consentCheckboxText" maxLength={300} placeholder="I agree to receive WhatsApp messages about this property." className="vds-focus mt-1 h-11 w-full rounded-xl border border-vds-border bg-vds-elevated px-3" /></label>
        <label className="block text-sm">Consent disclosure body<textarea name="consentBody" maxLength={600} className="vds-focus mt-1 min-h-16 w-full rounded-xl border border-vds-border bg-vds-elevated p-3" /></label>
        <Button type="submit">Prepare Lead Form</Button>
      </form>
      {forms.map((form) => <LeadFormCard key={form.id} form={form} />)}
      {!forms.length && <p className="rounded-2xl border border-dashed border-vds-border p-10 text-center text-sm text-vds-muted">No Lead Form prepared yet.</p>}
    </div>
  );
}
