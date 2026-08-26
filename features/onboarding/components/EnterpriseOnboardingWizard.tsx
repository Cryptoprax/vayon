"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/features/platform/design-system";
import { completeOnboardingAction } from "../actions/onboarding.actions";
import {
  launchOnboardingAction,
  saveOnboardingProgressAction,
} from "../actions/enterprise-onboarding.actions";
import {
  onboardingSteps,
  productTour,
  successResources,
  type ImportKind,
} from "../domain/enterprise-onboarding";
import { OnboardingCsvImportService } from "../services/csv-import.service";

type Session = {
  current_step: number;
  completed_steps: number[];
  configuration: Record<string, unknown>;
  demo_mode: boolean;
  completed_at: string | null;
} | null;
const connections = [
  [5, "Gmail", "/vayon/settings/google"],
  [6, "Google Calendar", "/vayon/settings/google"],
  [7, "WhatsApp", "/vayon/whatsapp/settings"],
] as const;

export function EnterpriseOnboardingWizard({
  session,
  provisioned,
  initialStep,
}: {
  session: Session;
  provisioned: boolean;
  initialStep?: number;
}) {
  const [step, setStep] = useState(
    Math.max(1, Math.min(15, initialStep ?? session?.current_step ?? 1)),
  );
  const [completed, setCompleted] = useState<number[]>(
    session?.completed_steps ?? [],
  );
  const [configuration, setConfiguration] = useState<Record<string, unknown>>(
    session?.configuration ?? {},
  );
  const [demoMode, setDemoMode] = useState(session?.demo_mode ?? false);
  const [preview, setPreview] = useState("");
  const [pending, startTransition] = useTransition();
  const progress = Math.round(
    (completed.length / onboardingSteps.length) * 100,
  );
  const update = (key: string, value: unknown) =>
    setConfiguration((current) => ({ ...current, [key]: value }));
  const health = useMemo(
    () =>
      Math.min(
        100,
        progress +
          (configuration.gmail ? 5 : 0) +
          (configuration.workflowTemplates ? 5 : 0),
      ),
    [configuration, progress],
  );

  useEffect(() => {
    let active = true;
    const locale = navigator.language || "en-US";
    const region = new Intl.Locale(locale).region ?? "US";
    const currencyByRegion: Readonly<Record<string, string>> = {
      AU: "AUD",
      CA: "CAD",
      GB: "GBP",
      IN: "INR",
      JP: "JPY",
      SG: "SGD",
      US: "USD",
    };
    queueMicrotask(() => {
      if (!active) return;
      setConfiguration((current) => ({
        country: current.country ?? region,
        currency: current.currency ?? currencyByRegion[region] ?? "USD",
        language:
          current.language ?? locale.split("-")[0]?.toLowerCase() ?? "en",
        locale: current.locale ?? locale,
        timezone:
          current.timezone ??
          Intl.DateTimeFormat().resolvedOptions().timeZone ??
          "UTC",
        ...current,
      }));
    });
    return () => {
      active = false;
    };
  }, []);

  function move(next: number) {
    const done = completed.includes(step) ? completed : [...completed, step];
    setCompleted(done);
    setStep(next);
    startTransition(() =>
      saveOnboardingProgressAction({
        step: next,
        configuration,
        completed: done,
        demoMode,
      }),
    );
  }

  async function inspectCsv(file: File | undefined, kind: ImportKind) {
    if (!file) return;
    const result = new OnboardingCsvImportService().preview(
      kind,
      await file.text(),
    );
    update(`${kind}Import`, {
      fileName: file.name,
      rows: result.rows.length,
      duplicates: result.duplicates,
      errors: result.errors,
    });
    setPreview(
      `${result.rows.length} rows · ${result.duplicates} duplicates · ${result.errors.length ? result.errors.join(", ") : "validation passed"}`,
    );
  }

  return (
    <div className="w-full max-w-7xl rounded-3xl border border-vds-border bg-vds-surface shadow-vds-lg">
      <div className="grid lg:grid-cols-[20rem_1fr]">
        <aside className="border-b border-vds-border p-6 lg:border-b-0 lg:border-r">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">
            Customer onboarding
          </p>
          <h1 className="mt-3 text-2xl font-semibold">
            Launch your VAYON workspace
          </h1>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-vds-elevated">
            <div
              className="h-full bg-vds-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-vds-muted">
            {progress}% complete · Health {health}/100
          </p>
          <ol className="mt-6 max-h-[34rem] space-y-1 overflow-y-auto">
            {onboardingSteps.map((label, index) => (
              <li key={label}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(index + 1)}
                  className={`h-auto w-full justify-start gap-2 rounded-lg px-3 py-2 text-left text-xs ${step === index + 1 ? "bg-vds-primary-soft text-vds-primary" : "text-vds-muted"}`}
                >
                  {completed.includes(index + 1) ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <span className="size-2 rounded-full bg-vds-subtle" />
                  )}
                  {label}
                </Button>
              </li>
            ))}
          </ol>
        </aside>
        <section className="p-6 sm:p-10">
          <p className="text-xs uppercase tracking-wider text-vds-muted">
            Setup progress · {progress}% complete
          </p>
          <h2 className="mt-2 text-3xl font-semibold">
            {onboardingSteps[step - 1]}
          </h2>
          <div className="mt-7 min-h-[25rem]">
            {step === 1 && (
              <Panel
                title="Welcome to VAYON"
                copy="This guided setup persists automatically, so you can leave and resume at any time."
              >
                <Toggle
                  label="Populate an optional clearly-labelled demo workspace"
                  checked={demoMode}
                  onChange={setDemoMode}
                />
              </Panel>
            )}
            {step === 2 && (
              <Fields
                fields={[
                  ["organizationName", "Company name"],
                  ["workspaceName", "Workspace name"],
                  ["businessType", "Business type"],
                  ["industry", "Industry"],
                  ["phone", "Business phone"],
                  ["website", "Website"],
                ]}
                values={configuration}
                update={update}
              />
            )}
            {step === 3 && (
              <Fields
                fields={[
                  ["primaryColor", "Primary brand color"],
                  ["secondaryColor", "Secondary brand color"],
                  ["logoPath", "Company logo asset path"],
                  ["timezone", "Timezone"],
                  ["language", "Locale"],
                  ["currency", "Currency"],
                ]}
                values={configuration}
                update={update}
              />
            )}
            {step === 4 && (
              <Panel
                title="Invite your team"
                copy="Invitations use the Organization Platform and its existing RBAC roles."
              >
                <Fields
                  fields={[
                    ["inviteEmails", "Email addresses (comma separated)"],
                    ["inviteRole", "Default role"],
                  ]}
                  values={configuration}
                  update={update}
                />
              </Panel>
            )}
            {connections.map(
              ([number, label, href]) =>
                step === number && (
                  <Panel
                    key={number}
                    title={`Connect ${label}`}
                    copy="OAuth and credentials remain owned by the existing provider integration."
                  >
                    <Link
                      href={provisioned ? href : "#"}
                      aria-disabled={!provisioned}
                  className="inline-flex rounded-xl bg-vds-primary px-4 py-2 text-sm text-vds-primary-foreground"
                    >
                      {provisioned
                        ? `Open ${label} setup`
                        : "Available after organization creation"}
                    </Link>
                    <Toggle
                      label={`Mark ${label} setup for completion`}
                      checked={Boolean(configuration[label])}
                      onChange={(value) => update(label, value)}
                    />
                  </Panel>
                ),
            )}
            {step === 8 && (
              <Panel
                title="AI Workforce preferences"
                copy="Assignments remain provider-neutral, recommendation-only, and approval governed."
              >
                <Fields
                  fields={[
                    ["aiProvider", "Preferred provider"],
                    ["aiModel", "Default model"],
                    ["departments", "Department assignments"],
                    ["recommendationPreferences", "Recommendation preferences"],
                    ["approvalPolicy", "Approval policy"],
                  ]}
                  values={configuration}
                  update={update}
                />
              </Panel>
            )}
            {step === 9 && (
              <ImportPanel
                kinds={["contacts", "companies", "leads", "deals"]}
                inspect={inspectCsv}
                preview={preview}
              />
            )}
            {step === 10 && (
              <ImportPanel
                kinds={["properties"]}
                inspect={inspectCsv}
                preview={preview}
              />
            )}
            {step === 11 && (
              <Panel
                title="Production workflow templates"
                copy="Selections install through the existing Workflow Automation Engine after launch."
              >
                <Fields
                  fields={[
                    ["workflowTemplates", "Template names (comma separated)"],
                  ]}
                  values={configuration}
                  update={update}
                />
              </Panel>
            )}
            {step === 12 && (
              <Panel
                title="Notification preferences"
                copy="Configure channels, quiet hours, priority, and digest cadence."
              >
                <Fields
                  fields={[
                    ["notificationChannels", "Channels"],
                    ["quietHours", "Quiet hours"],
                    ["digestFrequency", "Digest frequency"],
                  ]}
                  values={configuration}
                  update={update}
                />
              </Panel>
            )}
            {step === 13 && (
              <Panel
                title="Enterprise email"
                copy="Select one active provider; credentials are configured only in the existing Email Infrastructure."
              >
                <Fields
                  fields={[
                    ["emailProvider", "Resend, SendGrid, Postmark, or SMTP"],
                  ]}
                  values={configuration}
                  update={update}
                />
                {provisioned && (
                  <Link
                    className="text-sm text-vds-primary"
                    href="/vayon/settings/email"
                  >
                    Open email settings
                  </Link>
                )}
              </Panel>
            )}
            {step === 14 && (
              <Panel
                title="Choose your subscription"
                copy="Checkout and subscription lifecycle remain owned by Stripe Billing."
              >
                <Fields
                  fields={[
                    [
                      "subscriptionPlan",
                      "Starter, Professional, or Enterprise",
                    ],
                  ]}
                  values={configuration}
                  update={update}
                />
                {provisioned && (
                  <Link
                    className="text-sm text-vds-primary"
                    href="/vayon/settings/plans"
                  >
                    Compare plans
                  </Link>
                )}
              </Panel>
            )}
            {step === 15 && (
              <LaunchPanel
                configuration={configuration}
                demoMode={demoMode}
                provisioned={provisioned}
              />
            )}
          </div>
          <div className="mt-7 flex justify-between border-t border-vds-border pt-5">
            <Button
              variant="ghost"
              disabled={step === 1 || pending}
              onClick={() => move(step - 1)}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
            {step < 15 && (
              <Button disabled={pending} onClick={() => move(step + 1)}>
                Save & continue
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Panel({
  title,
  copy,
  children,
}: {
  title: string;
  copy: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xl font-medium">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm text-vds-muted">{copy}</p>
      <div className="mt-6 space-y-5">{children}</div>
    </div>
  );
}
function Fields({
  fields,
  values,
  update,
}: {
  fields: readonly (readonly [string, string])[];
  values: Record<string, unknown>;
  update: (key: string, value: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map(([key, label]) => (
        <label className="text-sm" key={key}>
          {label}
          <input
            name={key}
            value={String(values[key] ?? "")}
            onChange={(event) => update(key, event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-vds-border bg-vds-input px-3"
          />
        </label>
      ))}
    </div>
  );
}
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}
function ImportPanel({
  kinds,
  inspect,
  preview,
}: {
  kinds: readonly ImportKind[];
  inspect: (file: File | undefined, kind: ImportKind) => void;
  preview: string;
}) {
  return (
    <Panel
      title="CSV import preview"
      copy="Files are validated and checked for duplicates before any import is queued."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {kinds.map((kind) => (
          <label
            key={kind}
            className="rounded-xl border border-vds-border p-4 text-sm capitalize"
          >
            {kind}
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => inspect(event.target.files?.[0], kind)}
              className="mt-3 block w-full text-xs"
            />
          </label>
        ))}
      </div>
      {preview && (
        <p role="status" className="rounded-xl bg-vds-elevated p-3 text-sm">
          {preview}
        </p>
      )}
    </Panel>
  );
}
function LaunchPanel({
  configuration,
  demoMode,
  provisioned,
}: {
  configuration: Record<string, unknown>;
  demoMode: boolean;
  provisioned: boolean;
}) {
  return (
    <div className="space-y-6">
      <Panel
        title="Ready to launch"
        copy="VAYON records the onboarding audit event and opens your guided product tour."
      >
        <p className="text-sm text-vds-muted">
          {Object.keys(configuration).length} settings configured · Demo data{" "}
          {demoMode ? "enabled and labelled" : "disabled"}
        </p>
        {provisioned ? (
          <form action={launchOnboardingAction}>
            <Button type="submit">Launch workspace</Button>
          </form>
        ) : (
          <ProvisionForm configuration={configuration} />
        )}
      </Panel>
      <div>
        <h3 className="font-medium">Interactive product tour</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {productTour.map(([name]) => (
            <span
              className="rounded-full border border-vds-border px-3 py-1 text-xs"
              key={name}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-medium">Success Center</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          {successResources.map(([name, href]) => (
            <Link className="text-sm text-vds-primary" href={href} key={name}>
              {name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
function ProvisionForm({
  configuration,
}: {
  configuration: Record<string, unknown>;
}) {
  return (
    <form action={completeOnboardingAction}>
      <input
        type="hidden"
        name="organizationName"
        value={String(configuration.organizationName ?? "VAYON Organization")}
      />
      <input
        type="hidden"
        name="workspaceName"
        value={String(configuration.workspaceName ?? "Main Workspace")}
      />
      <input
        type="hidden"
        name="businessType"
        value={String(configuration.businessType ?? "Real estate")}
      />
      <input
        type="hidden"
        name="industry"
        value={String(configuration.industry ?? "Real estate")}
      />
      <input
        type="hidden"
        name="phone"
        value={String(configuration.phone ?? "0000000")}
      />
      <input
        type="hidden"
        name="website"
        value={String(configuration.website ?? "")}
      />
      <input
        type="hidden"
        name="country"
        value={String(configuration.country ?? "US")}
      />
      <input
        type="hidden"
        name="currency"
        value={String(configuration.currency ?? "USD")}
      />
      <input
        type="hidden"
        name="timezone"
        value={String(configuration.timezone ?? "UTC")}
      />
      <input
        type="hidden"
        name="language"
        value={String(configuration.language ?? "en")}
      />
      <input type="hidden" name="companySize" value="1-10" />
      <Button type="submit">Create and launch workspace</Button>
    </form>
  );
}
