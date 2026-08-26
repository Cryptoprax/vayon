"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/features/platform/design-system";
import { prepareBusinessLaunch } from "./actions";
import {
  businessGoals,
  businessTypes,
  launchDeliverables,
  targetAudiences,
  type BusinessLaunchInput,
  type BusinessLaunchProject,
  type BusinessLaunchSnapshot,
} from "./types";
const card =
    "rounded-3xl border border-vds-border bg-vds-surface/85 shadow-xl shadow-vds-shadow/10 backdrop-blur-xl",
  field =
    "w-full rounded-xl border border-vds-border bg-vds-elevated px-3 py-2.5 text-sm",
  initial: BusinessLaunchInput = {
    businessName: "",
    industry: "",
    country: "",
    primaryLanguage: "English",
    website: "",
    businessType: "Startup",
    goals: [],
    customGoal: "",
    audiences: [],
    customAudience: "",
    deliverables: [],
  };
function Choices<T extends string>({
  values,
  selected,
  onChange,
}: {
  values: readonly T[];
  selected: readonly T[];
  onChange: (next: T[]) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {values.map((value) => {
        const active = selected.includes(value);
        return (
          <Button
            key={value}
            type="button"
            variant={active ? "primary" : "outline"}
            fullWidth
            aria-pressed={active}
            onClick={() =>
              onChange(
                active
                  ? selected.filter((x) => x !== value)
                  : [...selected, value],
              )
            }
            className="min-h-12 justify-start rounded-2xl px-3 text-left text-sm"
          >
            {value}
          </Button>
        );
      })}
    </div>
  );
}
export function BusinessLaunchWizard({
  snapshot,
}: {
  readonly snapshot: BusinessLaunchSnapshot;
}) {
  const [step, setStep] = useState(snapshot.project ? 6 : 1),
    [form, setForm] = useState<BusinessLaunchInput>(
      snapshot.project?.input ?? initial,
    ),
    [project, setProject] = useState<BusinessLaunchProject | null>(
      snapshot.project,
    ),
    [message, setMessage] = useState<string | null>(null),
    [pending, startTransition] = useTransition();
  const update = <K extends keyof BusinessLaunchInput>(
    key: K,
    value: BusinessLaunchInput[K],
  ) => setForm((x) => ({ ...x, [key]: value }));
  const submit = () =>
    startTransition(async () => {
      try {
        const result = await prepareBusinessLaunch(form);
        setProject(result);
        setStep(6);
        setMessage(
          "Business Launch Project prepared. Review approvals before opening each existing system.",
        );
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Launch preparation failed.",
        );
      }
    });
  return (
    <main className="min-h-dvh bg-vds-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className={`${card} relative overflow-hidden p-6 sm:p-8`}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_5%,var(--vds-color-primary-soft),transparent_44%)]" />
          <div className="relative flex flex-wrap items-end justify-between gap-5">
            <div>
              <Link
                href="/onboarding"
                className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary"
              >
                Customer onboarding
              </Link>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">
                Business Launch Mode
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-vds-muted">
                Describe your business once. VAYON prepares an approval-gated
                launch project across the systems you already use.
              </p>
            </div>
            <div className="rounded-2xl border border-vds-border bg-vds-elevated px-4 py-3 text-sm">
              <span className="text-vds-muted">Setup progress</span>{" "}
              <strong>{Math.round((step / 6) * 100)}%</strong>
            </div>
          </div>
        </header>
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <section className={`${card} p-5 sm:p-7`}>
            {step === 1 && (
              <div className="space-y-5">
                <Title title="Tell us about the business" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Business name"
                    value={form.businessName}
                    onChange={(v) => update("businessName", v)}
                  />
                  <Input
                    label="Industry"
                    value={form.industry}
                    onChange={(v) => update("industry", v)}
                  />
                  <Input
                    label="Country"
                    value={form.country}
                    onChange={(v) => update("country", v)}
                  />
                  <Input
                    label="Primary language"
                    value={form.primaryLanguage}
                    onChange={(v) => update("primaryLanguage", v)}
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="Website (optional)"
                      value={form.website}
                      onChange={(v) => update("website", v)}
                      type="url"
                    />
                  </div>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-5">
                <Title title="Choose a business type" />
                <Choices
                  values={businessTypes}
                  selected={[form.businessType]}
                  onChange={(v) => update("businessType", v.at(-1) ?? "Other")}
                />
              </div>
            )}
            {step === 3 && (
              <div className="space-y-5">
                <Title title="What should the launch achieve?" />
                <Choices
                  values={businessGoals}
                  selected={form.goals}
                  onChange={(v) => update("goals", v)}
                />
                {form.goals.includes("Custom") && (
                  <Input
                    label="Custom goal"
                    value={form.customGoal}
                    onChange={(v) => update("customGoal", v)}
                  />
                )}
              </div>
            )}
            {step === 4 && (
              <div className="space-y-5">
                <Title title="Who should VAYON prepare for?" />
                <Choices
                  values={targetAudiences}
                  selected={form.audiences}
                  onChange={(v) => update("audiences", v)}
                />
                {form.audiences.includes("Custom") && (
                  <Input
                    label="Custom audience"
                    value={form.customAudience}
                    onChange={(v) => update("customAudience", v)}
                  />
                )}
              </div>
            )}
            {step === 5 && (
              <div className="space-y-5">
                <Title title="Select what VAYON should prepare" />
                <Choices
                  values={launchDeliverables}
                  selected={form.deliverables}
                  onChange={(v) => update("deliverables", v)}
                />
              </div>
            )}
            {step === 6 && <Preview form={form} project={project} />}
            {message && (
              <p
                role="status"
                className="mt-5 rounded-2xl border border-vds-border bg-vds-elevated p-4 text-sm"
              >
                {message}
              </p>
            )}
            <div className="mt-7 flex justify-between gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={step === 1 || pending}
                onClick={() => setStep((x) => Math.max(1, x - 1))}
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
              {step < 5 ? (
                <Button
                  type="button"
                  onClick={() => setStep((x) => Math.min(6, x + 1))}
                >
                  Continue
                  <ArrowRight className="size-4" />
                </Button>
              ) : step === 5 ? (
                <Button type="button" disabled={pending} onClick={submit}>
                  <Sparkles className="size-4" />
                  {pending ? "Preparing…" : "Prepare launch"}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(1)}
                >
                  Edit launch
                </Button>
              )}
            </div>
          </section>
          <aside className={`${card} h-fit p-5`}>
            <h2 className="font-semibold">Existing systems</h2>
            <ul className="mt-4 space-y-2 text-sm text-vds-muted">
              {snapshot.systems.map((system) => (
                <li key={system} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-vds-success" />
                  {system}
                </li>
              ))}
            </ul>
            <div className="mt-5 border-t border-vds-border pt-5 text-sm text-vds-muted">
              <p>{snapshot.brands.length} Brand Kit(s)</p>
              <p>{snapshot.campaigns} campaign(s)</p>
              <p>{snapshot.existingAssets} governed asset(s)</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
function Title({ title }: { title: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">
        Business builder
      </p>
      <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
    </div>
  );
}
function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        className={field}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
function Preview({
  form,
  project,
}: {
  form: BusinessLaunchInput;
  project: BusinessLaunchProject | null;
}) {
  const estimated =
      project?.estimatedMinutes ?? Math.max(10, form.deliverables.length * 8),
    business =
      project?.readiness.business ??
      Math.min(100, 40 + form.goals.length * 8 + form.audiences.length * 8),
    creative =
      project?.readiness.creative ??
      Math.min(100, form.deliverables.length * 6);
  return (
    <div className="space-y-6">
      <Title title="Execution preview" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric
          icon={Clock3}
          label="Estimated time"
          value={`${estimated} min`}
        />
        <Metric
          icon={Sparkles}
          label="Generated assets"
          value={String(form.deliverables.length)}
        />
        <Metric
          icon={ShieldCheck}
          label="Required approvals"
          value={String(
            project?.items.filter((x) => x.approvalRequired).length ??
              form.deliverables.length,
          )}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Score label="Business readiness" value={business} />
        <Score label="Creative readiness" value={creative} />
      </div>
      {project && (
        <div>
          <h3 className="font-semibold">Business Launch Project</h3>
          <div className="mt-3 grid gap-2">
            {project.items.map((item) => (
              <Link
                href={item.route}
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-vds-border bg-vds-elevated p-3 text-sm hover:border-vds-primary"
              >
                <span>
                  <strong>{item.deliverable}</strong>
                  <span className="ml-2 text-vds-muted">{item.owner}</span>
                </span>
                <span className="text-xs text-vds-primary">{item.state}</span>
              </Link>
            ))}
          </div>
          {project.warnings.map((warning) => (
            <p key={warning} className="mt-3 text-sm text-vds-warning">
              {warning}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-vds-border bg-vds-elevated p-4">
      <Icon className="size-5 text-vds-primary" />
      <p className="mt-3 text-xs text-vds-muted">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}
function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-vds-border bg-vds-elevated p-4">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-vds-surface">
        <div
          className="h-full rounded-full bg-vds-primary"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
