import { Button } from "@/features/platform/design-system";
import type { MetaAdAccountSummary, MetaLeadFormConsentRule, MetaLeadFormMapping, MetaLeadFormSummary, MetaMarketingConnection, MetaPageSummary } from "../domain/types";
import {
  beginConnectMetaMarketingAction,
  configureMetaLeadFormConsentRuleAction,
  createMetaLeadFormMappingAction,
  disableMetaLeadFormConsentRuleAction,
  disableMetaLeadFormMappingAction,
  disconnectMetaMarketingAction,
  saveMetaMarketingConnectionAction,
} from "../actions";

const card = "rounded-2xl border border-vds-border bg-vds-surface p-5";

const summaryLabel: Record<string, string> = {
  pending_fetch: "Lead event received",
  fetching: "Lead event received",
  fetched: "Lead details fetched",
  fetch_failed: "Fetch failed",
  invalid_payload: "Fetch failed",
  unresolved_connection: "Unmapped / unresolved",
};

const crmSummaryLabel: Record<string, string> = {
  completed: "CRM imported",
  identity_conflict: "Needs review",
  failed: "Failed",
};

/**
 * Phase M1/M2 customer UI, extended by M4 with a counts-only diagnostic.
 * Deliberately does not build: campaign creation, ad publishing, ad-spend
 * controls, or a lead viewer -- those are explicitly out of scope. This page
 * only lets a customer connect Meta, choose a Page (and optionally an ad
 * account), map a Lead Form to a property, and see how many Lead Ads events
 * have arrived/been fetched/failed -- never any name/email/phone/answer.
 */
export function MetaMarketingSettings({
  connection,
  mappings,
  canManage,
  state,
  pendingPages,
  pendingAdAccounts,
  leadForms,
  properties,
  ingestionSummary = {},
  crmIngestionSummary = {},
  consentRulesByMapping = {},
  error,
  success,
}: {
  connection: MetaMarketingConnection | null;
  mappings: readonly MetaLeadFormMapping[];
  canManage: boolean;
  state: string | null;
  pendingPages: readonly MetaPageSummary[];
  pendingAdAccounts: readonly MetaAdAccountSummary[];
  leadForms: readonly MetaLeadFormSummary[];
  properties: readonly { id: string; title: string }[];
  ingestionSummary?: Readonly<Record<string, number>>;
  crmIngestionSummary?: Readonly<Record<string, number>>;
  consentRulesByMapping?: Readonly<Record<string, MetaLeadFormConsentRule>>;
  error?: string;
  success?: string;
}) {
  const mappedFormIds = new Set(mappings.filter((item) => item.status === "active").map((item) => item.formId));
  const unmappedForms = leadForms.filter((item) => !mappedFormIds.has(item.id));

  return (
    <div className="space-y-5">
      {error && <p role="alert" className="rounded-xl border border-vds-danger bg-vds-danger-soft p-3 text-sm text-vds-danger">{error}</p>}
      {success && <p role="status" className="rounded-xl border border-vds-border p-3 text-sm text-vds-success">{success}</p>}

      <section className={card} aria-labelledby="meta-marketing-heading">
        <h2 id="meta-marketing-heading" className="font-semibold">Meta Marketing / Lead Ads</h2>
        <p className="mt-2 text-sm text-vds-muted">
          Connect a Facebook Page to receive Lead Ads context. This does not create ads, spend money, or fetch leads yet.
        </p>

        {!connection && !state && (
          <div className="mt-5">
            {canManage ? (
              <form action={beginConnectMetaMarketingAction}><Button type="submit" variant="primary">Connect Meta</Button></form>
            ) : (
              <p className="text-sm text-vds-muted">You do not have permission to connect Meta.</p>
            )}
          </div>
        )}

        {!connection && state && (
          <form action={saveMetaMarketingConnectionAction} className="mt-5 space-y-4">
            <input type="hidden" name="state" value={state} />
            <fieldset>
              <legend className="text-sm font-medium">Select a Page</legend>
              {pendingPages.length ? (
                <div className="mt-2 space-y-2">
                  {pendingPages.map((page, index) => (
                    <label key={page.id} className="flex items-center gap-2 text-sm">
                      <input type="radio" name="pageId" value={page.id} required defaultChecked={index === 0} />
                      {page.name}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-vds-muted">No Facebook Pages were found for this Meta account.</p>
              )}
            </fieldset>
            {pendingAdAccounts.length > 0 && (
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-vds-muted">Ad account (optional)</span>
                <select name="adAccountId" defaultValue="" className="w-full rounded-lg border border-vds-border bg-vds-background p-2 text-sm">
                  <option value="">None</option>
                  {pendingAdAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
                </select>
              </label>
            )}
            {pendingPages.length > 0 && <Button type="submit" variant="primary">Save connection</Button>}
          </form>
        )}

        {connection && (
          <div className="mt-5 space-y-3">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div><dt className="text-xs text-vds-muted">Page</dt><dd className="mt-1 text-sm">{connection.pageName ?? connection.pageId}</dd></div>
              <div><dt className="text-xs text-vds-muted">Status</dt><dd className="mt-1 text-sm capitalize">{connection.status}</dd></div>
              {connection.adAccountName && <div><dt className="text-xs text-vds-muted">Ad account</dt><dd className="mt-1 text-sm">{connection.adAccountName}</dd></div>}
              {connection.instagramBusinessAccountId && <div><dt className="text-xs text-vds-muted">Instagram</dt><dd className="mt-1 text-sm">Connected</dd></div>}
            </dl>
            {canManage && (
              <form action={disconnectMetaMarketingAction}><Button type="submit" variant="ghost" className="text-vds-danger">Disconnect</Button></form>
            )}
          </div>
        )}
      </section>

      {connection && (
        <section className={card} aria-labelledby="lead-ingestion-summary-heading">
          <h2 id="lead-ingestion-summary-heading" className="font-semibold">Lead Ads activity</h2>
          <p className="mt-2 text-sm text-vds-muted">Counts only -- no lead names, emails, phone numbers, or answers are shown here.</p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            {["Lead event received", "Lead details fetched", "Fetch failed"].map((label) => {
              const count = Object.entries(ingestionSummary).filter(([status]) => summaryLabel[status] === label).reduce((total, [, value]) => total + value, 0);
              return <div key={label}><dt className="text-xs text-vds-muted">{label}</dt><dd className="mt-1 text-lg font-medium">{count}</dd></div>;
            })}
          </dl>
        </section>
      )}

      {connection && (
        <section className={card} aria-labelledby="crm-ingestion-summary-heading">
          <h2 id="crm-ingestion-summary-heading" className="font-semibold">CRM import activity</h2>
          <p className="mt-2 text-sm text-vds-muted">Counts only -- no lead names, emails, phone numbers, or answers are shown here. Imported leads appear in your normal CRM lead list.</p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            {["CRM imported", "Needs review", "Failed"].map((label) => {
              const count = Object.entries(crmIngestionSummary).filter(([status]) => crmSummaryLabel[status] === label).reduce((total, [, value]) => total + value, 0);
              return <div key={label}><dt className="text-xs text-vds-muted">{label}</dt><dd className="mt-1 text-lg font-medium">{count}</dd></div>;
            })}
          </dl>
        </section>
      )}

      {connection && canManage && (
        <section className={card} aria-labelledby="lead-form-mapping-heading">
          <h2 id="lead-form-mapping-heading" className="font-semibold">Map a Lead Form to a property</h2>
          <p className="mt-2 text-sm text-vds-muted">Only Lead Forms discovered from your connected Page can be mapped.</p>
          {unmappedForms.length ? (
            <form action={createMetaLeadFormMappingAction} className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-xs text-vds-muted">Lead Form</span>
                <select name="formId" required defaultValue="" className="w-full rounded-lg border border-vds-border bg-vds-background p-2 text-sm">
                  <option value="" disabled>Select a form</option>
                  {unmappedForms.map((form) => <option key={form.id} value={form.id}>{form.name}</option>)}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs text-vds-muted">Property</span>
                <select name="propertyId" required defaultValue="" className="w-full rounded-lg border border-vds-border bg-vds-background p-2 text-sm">
                  <option value="" disabled>Select a property</option>
                  {properties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}
                </select>
              </label>
              <div className="sm:col-span-2"><Button type="submit" variant="primary">Map form</Button></div>
            </form>
          ) : (
            <p className="mt-4 text-sm text-vds-muted">No unmapped Lead Forms are available right now.</p>
          )}

          <div className="mt-5 space-y-3">
            {mappings.length ? mappings.map((mapping) => (
              <article key={mapping.id} className="rounded-xl border border-vds-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{mapping.formName ?? mapping.formId}</p>
                    <p className="mt-1 text-xs text-vds-muted">{properties.find((property) => property.id === mapping.propertyId)?.title ?? "Property"} · {mapping.status}</p>
                  </div>
                  {mapping.status === "active" && (
                    <form action={disableMetaLeadFormMappingAction}>
                      <input type="hidden" name="mappingId" value={mapping.id} />
                      <Button type="submit" variant="ghost" className="text-vds-danger">Disable</Button>
                    </form>
                  )}
                </div>
                {mapping.status === "active" && (
                  <ConsentRuleConfig mapping={mapping} rule={consentRulesByMapping[mapping.id]} />
                )}
              </article>
            )) : <p className="text-sm text-vds-muted">No Lead Forms have been mapped yet.</p>}
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Phase M6, Part 21. Submitting a lead form does not automatically grant
 * WhatsApp consent -- this config is opt-in and requires the customer to
 * have verified their own Meta form explicitly collects WhatsApp opt-in.
 * No legal advice is offered; the disclosure statement is whatever text the
 * customer themselves configures. No "mark consent granted" shortcut exists
 * anywhere here -- every consent record is produced deterministically from
 * this configuration, never a manual override.
 */
function ConsentRuleConfig({ mapping, rule }: { mapping: MetaLeadFormMapping; rule?: MetaLeadFormConsentRule }) {
  return (
    <div className="mt-4 rounded-xl border border-vds-border bg-vds-background p-4">
      <p className="text-xs font-medium text-vds-muted">WhatsApp outreach consent</p>
      {rule ? (
        <div className="mt-2 space-y-2 text-sm">
          <p>Field <span className="font-mono">{rule.consentFieldName}</span> counts as consent when it equals: {rule.acceptedValues.join(", ")}</p>
          <p className="text-xs text-vds-muted">Disclosure (v{rule.version}): {rule.consentStatement}</p>
          <form action={disableMetaLeadFormConsentRuleAction}>
            <input type="hidden" name="ruleId" value={rule.id} />
            <Button type="submit" variant="ghost" className="text-vds-danger">Disable consent rule</Button>
          </form>
        </div>
      ) : (
        <p className="mt-1 text-xs text-vds-muted">Not configured -- leads from this form are never treated as WhatsApp-consented.</p>
      )}
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-vds-muted">{rule ? "Replace with a new version" : "Configure"}</summary>
        <form action={configureMetaLeadFormConsentRuleAction} className="mt-3 space-y-3">
          <input type="hidden" name="formMappingId" value={mapping.id} />
          <p className="rounded-lg bg-vds-primary-soft p-2 text-xs text-vds-primary">
            Submitting a lead form does not automatically grant WhatsApp consent. Configure this only when your Meta form explicitly collects WhatsApp opt-in.
          </p>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-vds-muted">Meta field/question name (exact)</span>
            <input type="text" name="consentFieldName" required className="w-full rounded-lg border border-vds-border bg-vds-surface p-2 text-sm" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-vds-muted">Accepted value(s), comma-separated</span>
            <input type="text" name="acceptedValues" required placeholder="Yes, I agree" className="w-full rounded-lg border border-vds-border bg-vds-surface p-2 text-sm" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-vds-muted">Consent disclosure statement (what the lead agreed to)</span>
            <textarea name="consentStatement" required rows={3} className="w-full rounded-lg border border-vds-border bg-vds-surface p-2 text-sm" />
          </label>
          <Button type="submit" variant="primary">Save consent rule</Button>
        </form>
      </details>
    </div>
  );
}
