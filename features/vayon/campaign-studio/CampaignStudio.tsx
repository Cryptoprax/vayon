"use client";
import Link from "next/link";
import { Button } from "@/features/platform/design-system";
import { SmartEmptyState } from "@/features/vayon/components/SmartEmptyState";
import {
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileStack,
  Heart,
  Megaphone,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { deliverableGroups } from "./catalog";
import { buildCampaignBlueprint } from "./creative-director";
import type {
  CampaignAudience,
  CampaignBrief,
  CampaignObjective,
  CampaignStyle,
  CampaignStudioSnapshot,
} from "./types";
const card =
    "rounded-3xl border border-vds-border bg-vds-surface/75 shadow-xl shadow-vds-shadow/10 backdrop-blur-xl",
  objectives: readonly CampaignObjective[] = [
    "Launch Product",
    "Generate Leads",
    "Sell Product",
    "Brand Awareness",
    "Investor Presentation",
    "Hiring Campaign",
    "Franchise Expansion",
    "Government Tender",
    "Real Estate Launch",
    "Solar Campaign",
    "Healthcare Campaign",
    "Education Campaign",
    "Hospitality Campaign",
    "Retail Promotion",
    "Custom",
  ],
  audiences: readonly CampaignAudience[] = [
    "B2B",
    "B2C",
    "Government",
    "Industrial",
    "Residential",
    "Commercial",
    "Investors",
    "Partners",
    "Distributors",
    "Custom",
  ],
  styles: readonly CampaignStyle[] = [
    "Luxury",
    "Corporate",
    "Modern",
    "Minimal",
    "Eco Friendly",
    "Premium",
    "Bold",
    "Elegant",
    "Industrial",
    "Technology",
    "Healthcare",
    "Government",
  ],
  steps = [
    "Campaign Details",
    "Campaign Objective",
    "Target Audience",
    "Brand",
    "Deliverables",
    "Campaign Style",
    "Creative Recommendation",
  ];
const empty: CampaignBrief = {
  name: "",
  description: "",
  industry: "",
  businessType: "",
  targetCountry: "",
  languages: [],
  objective: "Generate Leads",
  audiences: [],
  brandIds: [],
  deliverables: [],
  style: "Modern",
};
export function CampaignStudio({
  snapshot,
}: {
  readonly snapshot: CampaignStudioSnapshot;
}) {
  const [wizard, setWizard] = useState(false),
    [step, setStep] = useState(0),
    [brief, setBrief] = useState<CampaignBrief>(empty),
    blueprint = useMemo(
      () =>
        buildCampaignBlueprint(
          brief,
          snapshot.brands.find((item) => brief.brandIds.includes(item.id))
            ?.score ?? 0,
        ),
      [brief, snapshot.brands],
    );
  useEffect(() => { const saved = window.localStorage.getItem("vayon-campaign-draft"); if (!saved) return; queueMicrotask(() => { try { setBrief({ ...empty, ...JSON.parse(saved) as CampaignBrief }); } catch { window.localStorage.removeItem("vayon-campaign-draft"); } }); }, []);
  useEffect(() => { window.localStorage.setItem("vayon-campaign-draft", JSON.stringify(brief)); }, [brief]);
  const kpis: readonly {
    readonly label: string;
    readonly value: string | number;
    readonly Icon: typeof Megaphone;
  }[] = [
    {
      label: "Recent Campaigns",
      value: snapshot.campaigns.length,
      Icon: Megaphone,
    },
    {
      label: "Creative Projects",
      value: snapshot.projects.length,
      Icon: FileStack,
    },
    {
      label: "Brand Health",
      value: snapshot.brands[0]?.score ?? 0,
      Icon: ShieldCheck,
    },
    { label: "Campaign Analytics", value: "Placeholder", Icon: BarChart3 },
  ];
  const toggle = <T extends string>(
    key: "languages" | "audiences" | "brandIds" | "deliverables",
    value: T,
  ) =>
    setBrief((current) => ({
      ...current,
      [key]: (current[key] as readonly string[]).includes(value)
        ? (current[key] as readonly string[]).filter((item) => item !== value)
        : [...current[key], value],
    }));
  return (
    <main className="mx-auto w-full max-w-[120rem] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className={`${card} relative overflow-hidden p-6 sm:p-8`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,var(--vds-color-primary-soft),transparent_38%)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <Link
              href="/vayon/creative"
              className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary"
            >
              Creative Studio 2.0
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">
              Creative Campaign Studio
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-vds-muted">
              Plan complete campaigns through one Creative Director—not
              disconnected assets.
            </p>
          </div>
          <Button
            onClick={() => {
              setStep(0);
              setWizard(true);
            }}
          >
            <Plus className="size-4" />
            New campaign
          </Button>
        </div>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, Icon }) => (
          <article className={`${card} p-5`} key={label}>
            <Icon className="size-5 text-vds-primary" />
            <p className="mt-4 text-xs text-vds-muted">{label}</p>
            <p className="mt-2 text-2xl font-semibold">
              {value}
              {label === "Brand Health" && "%"}
            </p>
          </article>
        ))}
      </section>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_.7fr]">
        <section className={`${card} p-5`}>
          <div className="flex justify-between">
            <div>
              <h2 className="font-semibold">Recent campaigns</h2>
              <p className="mt-1 text-xs text-vds-muted">
                Existing governed Marketing Studio campaigns
              </p>
            </div>
            <Heart className="size-5 text-vds-muted" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {snapshot.campaigns.slice(0, 6).map((item) => (
              <article
                className="rounded-2xl border border-vds-border bg-vds-elevated p-4"
                key={item.id}
              >
                <div className="flex justify-between">
                  <Megaphone className="size-5 text-vds-primary" />
                  <span className="text-[10px] uppercase text-vds-muted">
                    {item.state}
                  </span>
                </div>
                <h3 className="mt-4 font-medium">{item.name}</h3>
                <p className="mt-2 text-xs text-vds-muted">
                  {item.assets} assets ·{" "}
                  {new Date(item.updatedAt).toLocaleDateString()}
                </p>
              </article>
            ))}
            {!snapshot.campaigns.length && (
              <SmartEmptyState
                className="col-span-full"
                title="Create your first AI campaign."
                description="Turn a business goal into a governed campaign blueprint with Creative Director AI."
                primaryLabel="Generate with AI"
                onPrimary={() => setWizard(true)}
              />
            )}
          </div>
        </section>
        <aside className={`${card} p-5`}>
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-vds-primary" />
            <h2 className="font-semibold">Creative Director AI</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-vds-muted">
            Coordinates specialized creative departments through plans and
            approval gates. No provider or generation engine is connected.
          </p>
          <div className="mt-5 grid gap-2">
            {snapshot.departments.map((item) => (
              <div
                className="flex items-center gap-2 rounded-xl bg-vds-elevated px-3 py-2 text-xs"
                key={item}
              >
                <Users className="size-3 text-vds-primary" />
                {item}
              </div>
            ))}
          </div>
        </aside>
      </div>
      <section className={`${card} p-5`}>
        <h2 className="font-semibold">Campaign templates & recommendations</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {snapshot.templates.map((item) => (
            <Button
              variant="control"
              onClick={() => {
                setBrief((current) => ({ ...current, name: item }));
                setWizard(true);
              }}
              className="h-auto min-h-24 justify-start rounded-2xl border border-vds-border p-4 text-left"
              key={item}
            >
              {item}
            </Button>
          ))}
        </div>
        <ul className="mt-5 grid gap-2 text-xs text-vds-muted lg:grid-cols-3">
          {snapshot.recommendations.map((item) => (
            <li className="rounded-xl bg-vds-elevated p-3" key={item}>
              {item}
            </li>
          ))}
        </ul>
      </section>
      <section
        className={`${card} flex flex-wrap items-center justify-between gap-4 p-5`}
      >
        <div>
          <h2 className="font-semibold">Campaign export contracts</h2>
          <p className="mt-1 text-xs text-vds-muted">
            Prepared packaging only; no assets are generated.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {snapshot.exports.map((item) => (
            <span
              className="inline-flex items-center gap-1 rounded-xl border border-vds-border px-3 py-2 text-xs"
              key={item}
            >
              <Download className="size-3" />
              {item}
            </span>
          ))}
        </div>
      </section>
      {wizard && (
        <Wizard
          step={step}
          setStep={setStep}
          brief={brief}
          setBrief={setBrief}
          toggle={toggle}
          snapshot={snapshot}
          blueprint={blueprint}
          close={() => setWizard(false)}
        />
      )}
    </main>
  );
}
function Wizard({
  step,
  setStep,
  brief,
  setBrief,
  toggle,
  snapshot,
  blueprint,
  close,
}: {
  step: number;
  setStep: (value: number) => void;
  brief: CampaignBrief;
  setBrief: (
    value: CampaignBrief | ((current: CampaignBrief) => CampaignBrief),
  ) => void;
  toggle: <T extends string>(
    key: "languages" | "audiences" | "brandIds" | "deliverables",
    value: T,
  ) => void;
  snapshot: CampaignStudioSnapshot;
  blueprint: ReturnType<typeof buildCampaignBlueprint>;
  close: () => void;
}) {
  const requirements = [
    ["Campaign Name", Boolean(brief.name.trim())], ["Business Type", Boolean(brief.businessType.trim())], ["Industry", Boolean(brief.industry.trim())], ["Target Country", Boolean(brief.targetCountry.trim())], ["Campaign Goal", Boolean(brief.objective)], ["Language", brief.languages.length > 0], ["Primary Deliverable", brief.deliverables.length > 0],
  ] as const;
  const valid = step === 0 ? requirements.slice(0, 6).every(([, done]) => done) : step === 1 ? Boolean(brief.objective) : step === 2 ? brief.audiences.length > 0 : step === 4 ? brief.deliverables.length > 0 : true;
  const complete = requirements.every(([, done]) => done);
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-vds-overlay p-4">
      <section
        className={`${card} my-6 w-full max-w-5xl p-6`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="campaign-wizard"
      >
        <div className="flex justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-vds-primary">
              {Math.round(((step + 1) / 7) * 100)}% complete · {step} completed · {6 - step} remaining
            </p>
            <h2 className="mt-2 text-xl font-semibold" id="campaign-wizard">
              {steps[step]}
            </h2>
          </div>
          <Button variant="control" onClick={close} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>
        <div className="mt-4 h-1.5 rounded-full bg-vds-elevated">
          <div
            className="h-full rounded-full bg-vds-primary"
            style={{ width: `${((step + 1) / 7) * 100}%` }}
          />
        </div>
        <div className="mt-6 min-h-80 max-h-[55vh] overflow-y-auto pr-1">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  "name",
                  "description",
                  "industry",
                  "businessType",
                  "targetCountry",
                ] as const
              ).map((key) => (
                <label className="text-sm" key={key}>
                  {key.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase())} *
                  <input
                    value={brief[key]}
                    onChange={(event) =>
                      setBrief((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                    className="mt-2 h-11 w-full rounded-xl border border-vds-border bg-vds-elevated px-3"
                  />
                </label>
              ))}
              <label className="text-sm">
                Language *
                <input
                  value={brief.languages.join(", ")}
                  onChange={(event) =>
                    setBrief((current) => ({
                      ...current,
                      languages: event.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    }))
                  }
                  placeholder="English, Hindi"
                  className="mt-2 h-11 w-full rounded-xl border border-vds-border bg-vds-elevated px-3"
                />
              </label>
            </div>
          )}
          {step === 1 && (
            <Choices
              values={objectives}
              selected={[brief.objective]}
              select={(value) =>
                setBrief((current) => ({ ...current, objective: value }))
              }
            />
          )}{" "}
          {step === 2 && (
            <Choices
              values={audiences}
              selected={brief.audiences}
              select={(value) => toggle("audiences", value)}
            />
          )}{" "}
          {step === 3 && (
            <div>
              <p className="mb-4 text-sm text-vds-muted">
                Automatically resolved from Brand Studio. Select default,
                alternate, or multiple brands.
              </p>
              <Choices
                values={snapshot.brands.map((item) => item.name)}
                selected={snapshot.brands
                  .filter((item) => brief.brandIds.includes(item.id))
                  .map((item) => item.name)}
                select={(value) => {
                  const brand = snapshot.brands.find(
                    (item) => item.name === value,
                  );
                  if (brand) toggle("brandIds", brand.id);
                }}
              />
            </div>
          )}{" "}
          {step === 4 && (
            <div className="space-y-5">
              {Object.entries(deliverableGroups).map(([group, items]) => (
                <fieldset key={group}>
                  <legend className="font-medium">{group}</legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {items.map((item) => (
                      <Button
                        variant="control"
                        onClick={() => toggle("deliverables", item)}
                        className={`justify-start ${brief.deliverables.includes(item) ? "bg-vds-primary-soft text-vds-primary" : ""}`}
                        key={item}
                      >
                        {brief.deliverables.includes(item) && (
                          <Check className="size-3" />
                        )}
                        {item}
                      </Button>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          )}{" "}
          {step === 5 && (
            <Choices
              values={styles}
              selected={[brief.style]}
              select={(value) =>
                setBrief((current) => ({ ...current, style: value }))
              }
            />
          )}{" "}
          {step === 6 && (complete ? <Blueprint blueprint={blueprint} /> : <div className="rounded-2xl border border-vds-border bg-vds-elevated p-5"><h3 className="font-semibold">Complete the required campaign information before AI recommendations can be generated.</h3><ul className="mt-4 grid gap-2 text-sm text-vds-muted sm:grid-cols-2">{requirements.map(([label, done]) => <li key={label}>{done ? "✓" : "○"} {label}</li>)}</ul></div>)}
        </div>
        <div className="mt-6 flex justify-between">
          <Button
            variant="control"
            disabled={!step}
            onClick={() => setStep(Math.max(0, step - 1))}
          >
            <ChevronLeft className="size-4" />
            Back
          </Button>
          {step < 6 ? (
            <Button disabled={!valid} onClick={() => valid && setStep(Math.min(6, step + 1))}>
              Continue
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button disabled>Save campaign blueprint</Button>
          )}
        </div>
        <p className="mt-4 text-center text-[10px] text-vds-muted">
          Planning only · provider unavailable · no assets will be generated
        </p>
      </section>
    </div>
  );
}
function Choices<T extends string>({
  values,
  selected,
  select,
}: {
  values: readonly T[];
  selected: readonly T[];
  select: (value: T) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {values.map((value) => (
        <Button
          variant="control"
          onClick={() => select(value)}
          className={`min-h-12 justify-start ${selected.includes(value) ? "bg-vds-primary-soft text-vds-primary" : ""}`}
          key={value}
        >
          {selected.includes(value) && <Check className="size-4" />}
          {value}
        </Button>
      ))}
    </div>
  );
}
function Blueprint({
  blueprint,
}: {
  blueprint: ReturnType<typeof buildCampaignBlueprint>;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Outputs", blueprint.estimatedOutputs],
          ["Days", blueprint.estimatedCompletionDays],
          ["Creative score", `${blueprint.creativeScore}%`],
          ["Completeness", `${blueprint.completeness}%`],
        ].map(([label, value]) => (
          <article className="rounded-2xl bg-vds-elevated p-4" key={label}>
            <p className="text-xs text-vds-muted">{label}</p>
            <p className="mt-2 text-xl font-semibold">{value}</p>
          </article>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-vds-border p-4">
          <h3 className="font-medium">Deliverables & dependencies</h3>
          {blueprint.tasks.map((item) => (
            <p className="mt-2 text-xs text-vds-muted" key={item.id}>
              {item.deliverable} → {item.department} · approval required
            </p>
          ))}
        </section>
        <section className="rounded-2xl border border-vds-border p-4">
          <h3 className="font-medium">Readiness & risks</h3>
          <p className="mt-2 text-xs">
            Brand readiness {blueprint.brandReadiness}% · Creative readiness{" "}
            {blueprint.creativeReadiness}%
          </p>
          {[
            ...blueprint.missingAssets,
            ...blueprint.risks,
            ...blueprint.recommendations,
          ].map((item) => (
            <p className="mt-2 text-xs text-vds-muted" key={item}>
              {item}
            </p>
          ))}
        </section>
      </div>
      <p className="text-xs text-vds-muted">
        Approvals: {blueprint.requiredApprovals.join(" → ")}
      </p>
    </div>
  );
}
