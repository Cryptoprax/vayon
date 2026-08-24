"use client";
import Link from "next/link";
import { Button } from "@/features/platform/design-system";
import {
  Archive,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Palette,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  SwatchBook,
} from "lucide-react";
import { useMemo, useState } from "react";
import type {
  Audience,
  BrandStudioSnapshot,
  BusinessType,
  LogoPreference,
  Personality,
  PhotographyStyle,
} from "./types";
const card =
  "rounded-3xl border border-vds-border bg-vds-surface/75 shadow-xl shadow-vds-shadow/10 backdrop-blur-xl";
const business: readonly BusinessType[] = [
    "Startup",
    "SMB",
    "Enterprise",
    "Agency",
    "Manufacturer",
    "Healthcare",
    "Education",
    "Construction",
    "Solar",
    "Real Estate",
    "Hospitality",
    "Other",
  ],
  audiences: readonly Audience[] = [
    "B2B",
    "B2C",
    "Government",
    "Industrial",
    "Residential",
    "Investors",
    "Distributors",
    "Custom",
  ],
  personalities: readonly Personality[] = [
    "Luxury",
    "Modern",
    "Corporate",
    "Premium",
    "Eco-Friendly",
    "Bold",
    "Minimal",
    "Elegant",
    "Innovative",
    "Friendly",
    "Professional",
    "Custom",
  ],
  logos: readonly LogoPreference[] = [
    "Wordmark",
    "Icon",
    "Combination",
    "Monogram",
    "Emblem",
    "Abstract",
  ],
  photos: readonly PhotographyStyle[] = [
    "Corporate",
    "Lifestyle",
    "Product",
    "Architectural",
    "Industrial",
    "Minimal",
    "Luxury",
    "Documentary",
  ];
const steps = [
  "Company Profile",
  "Business Type",
  "Target Audience",
  "Brand Personality",
  "Colour Strategy",
  "Logo Preferences",
  "Photography Style",
] as const;
export function BrandStudio({
  snapshot,
}: {
  readonly snapshot: BrandStudioSnapshot;
}) {
  const [step, setStep] = useState(0),
    [wizard, setWizard] = useState(false),
    [active, setActive] = useState(snapshot.activeBrandId),
    [form, setForm] = useState({
      companyName: "",
      industry: "",
      website: "",
      country: "",
      targetMarket: "",
      businessType: "Other" as BusinessType,
      audiences: [] as Audience[],
      personality: "Professional" as Personality,
      colorStrategy: "recommend" as "recommend" | "manual",
      primary: "#7c5cff",
      secondary: "#151526",
      accent: "#d7b56d",
      background: "#ffffff",
      typography: "#151526",
      logo: "Combination" as LogoPreference,
      photo: "Corporate" as PhotographyStyle,
    });
  const brand =
      snapshot.brands.find((item) => item.id === active) ?? snapshot.brands[0],
    result = brand ? snapshot.consistency[brand.id] : undefined,
    progress = Math.round(((step + 1) / steps.length) * 100),
    toggleAudience = (value: Audience) =>
      setForm((current) => ({
        ...current,
        audiences: current.audiences.includes(value)
          ? current.audiences.filter((item) => item !== value)
          : [...current.audiences, value],
      }));
  const missing = useMemo(() => result?.missingAssets ?? [], [result]);
  return (
    <main className="mx-auto w-full max-w-[110rem] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className={`${card} relative overflow-hidden p-6 sm:p-8`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,var(--vds-color-primary-soft),transparent_38%)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <Link
              href="/vayon/creative"
              className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary"
            >
              Creative Studio 2.0
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">
              Brand Studio
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-vds-muted">
              The permanent identity system behind every campaign, presentation,
              website, image, document, and video.
            </p>
          </div>
          <Button
            onClick={() => {
              setStep(0);
              setWizard(true);
            }}
          >
            <Plus className="size-4" />
            Create brand
          </Button>
        </div>
      </header>
      <section className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
        <div className={`${card} p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Brand portfolio</h2>
              <p className="mt-1 text-xs text-vds-muted">
                Switch, duplicate, archive, or restore brands without changing
                the default automatically.
              </p>
            </div>
            <span className="rounded-full bg-vds-elevated px-3 py-1 text-xs">
              {snapshot.brands.length} brands
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {snapshot.brands.map((item) => (
              <Button
                variant="control"
                onClick={() => setActive(item.id)}
                className={`h-auto min-h-36 justify-start rounded-2xl border p-4 text-left ${active === item.id ? "border-vds-accent-border bg-vds-primary-soft" : "border-vds-border bg-vds-elevated"}`}
                key={item.id}
              >
                <div className="w-full">
                  <div className="flex items-center justify-between">
                    <Palette className="size-5 text-vds-primary" />
                    <span className="text-[10px] uppercase text-vds-muted">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-4 font-semibold">{item.name}</p>
                  <div className="mt-3 flex gap-1.5">
                    {item.kit.colors.slice(0, 5).map((color) => (
                      <span
                        className="size-5 rounded-full border border-vds-border"
                        style={{ backgroundColor: color }}
                        key={color}
                      />
                    ))}
                  </div>
                </div>
              </Button>
            ))}
            {!snapshot.brands.length && (
              <div className="col-span-full rounded-2xl border border-dashed border-vds-border p-10 text-center text-sm text-vds-muted">
                No stored Brand Kit yet. Create a draft identity to begin.
              </div>
            )}
          </div>
          {brand && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="control" size="sm">
                <Star className="size-4" />
                Set default
              </Button>
              <Button variant="control" size="sm">
                <Copy className="size-4" />
                Duplicate
              </Button>
              <Button variant="control" size="sm">
                <Archive className="size-4" />
                Archive
              </Button>
              <Button variant="control" size="sm">
                <RotateCcw className="size-4" />
                Restore
              </Button>
            </div>
          )}
        </div>
        <aside className={`${card} p-5`}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Brand consistency</h2>
            <ShieldCheck className="size-5 text-vds-primary" />
          </div>
          <p className="mt-5 text-5xl font-semibold">
            {result ? `${result.score}%` : "—"}
          </p>
          <p className="mt-2 text-xs text-vds-muted">
            Deterministic readiness score · no automatic corrections
          </p>
          <div className="mt-5 space-y-3">
            <Metric label="Missing assets" value={missing.length} />
            <Metric
              label="Outdated assets"
              value={result?.outdatedAssets.length ?? 0}
            />
            <Metric
              label="Recommendations"
              value={result?.recommendations.length ?? 0}
            />
          </div>
          <ul className="mt-5 space-y-2 text-xs text-vds-muted">
            {result?.recommendations.slice(0, 4).map((item) => (
              <li className="flex gap-2" key={item}>
                <ChevronRight className="mt-0.5 size-3 shrink-0 text-vds-primary" />
                {item}
              </li>
            ))}
          </ul>
        </aside>
      </section>
      <section className={`${card} p-5`}>
        <h2 className="font-semibold">Brand intelligence</h2>
        <p className="mt-2 text-sm text-vds-muted">
          Company profile, values, mission, vision, tone, writing, typography,
          colours, icons, photography, illustration, motion, CTA, legal
          disclaimers, keywords, and brand do&apos;s and don&apos;ts share one
          typed model.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {snapshot.consumers.map((item) => (
            <article
              className="rounded-2xl border border-vds-border bg-vds-elevated p-4"
              key={item}
            >
              <Check className="size-4 text-vds-success" />
              <p className="mt-3 text-sm font-medium">{item}</p>
              <p className="mt-1 text-[10px] text-vds-muted">
                Resolves Brand Studio defaults
              </p>
            </article>
          ))}
        </div>
      </section>
      <section
        className={`${card} flex flex-wrap items-center justify-between gap-4 p-5`}
      >
        <div>
          <h2 className="font-semibold">Brand export foundation</h2>
          <p className="mt-1 text-xs text-vds-muted">
            Prepared formats only. No export provider is connected.
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
        <div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-vds-overlay p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="brand-wizard"
            className={`${card} my-6 w-full max-w-3xl p-6`}
          >
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-vds-primary">
                  Step {step + 1} of {steps.length}
                </p>
                <h2 className="mt-2 text-xl font-semibold" id="brand-wizard">
                  {steps[step]}
                </h2>
              </div>
              <Button
                variant="control"
                onClick={() => setWizard(false)}
                aria-label="Close brand wizard"
              >
                Close
              </Button>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-vds-elevated">
              <div
                className="h-full bg-vds-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-6 min-h-72">
              {step === 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {(
                    [
                      "companyName",
                      "industry",
                      "website",
                      "country",
                      "targetMarket",
                    ] as const
                  ).map((key) => (
                    <label className="text-sm" key={key}>
                      {label(key)}
                      <input
                        value={form[key]}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                        className="mt-2 h-11 w-full rounded-xl border border-vds-border bg-vds-elevated px-3"
                      />
                    </label>
                  ))}
                </div>
              )}
              {step === 1 && (
                <Choices
                  values={business}
                  selected={[form.businessType]}
                  onSelect={(value) =>
                    setForm((current) => ({ ...current, businessType: value }))
                  }
                />
              )}{" "}
              {step === 2 && (
                <Choices
                  values={audiences}
                  selected={form.audiences}
                  onSelect={toggleAudience}
                />
              )}{" "}
              {step === 3 && (
                <Choices
                  values={personalities}
                  selected={[form.personality]}
                  onSelect={(value) =>
                    setForm((current) => ({ ...current, personality: value }))
                  }
                />
              )}{" "}
              {step === 4 && (
                <div>
                  <div className="flex gap-2">
                    <Button
                      variant={
                        form.colorStrategy === "recommend"
                          ? "primary"
                          : "control"
                      }
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          colorStrategy: "recommend",
                        }))
                      }
                    >
                      <Sparkles className="size-4" />
                      Let AI Recommend
                    </Button>
                    <Button
                      variant={
                        form.colorStrategy === "manual" ? "primary" : "control"
                      }
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          colorStrategy: "manual",
                        }))
                      }
                    >
                      <SwatchBook className="size-4" />
                      Choose manually
                    </Button>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
                    {(
                      [
                        "primary",
                        "secondary",
                        "accent",
                        "background",
                        "typography",
                      ] as const
                    ).map((key) => (
                      <label className="text-xs capitalize" key={key}>
                        {key}
                        <input
                          type="color"
                          value={form[key]}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              [key]: event.target.value,
                            }))
                          }
                          className="mt-2 h-12 w-full"
                        />
                      </label>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-vds-muted">
                    AI recommendation is prepared only; no provider is
                    connected.
                  </p>
                </div>
              )}{" "}
              {step === 5 && (
                <Choices
                  values={logos}
                  selected={[form.logo]}
                  onSelect={(value) =>
                    setForm((current) => ({ ...current, logo: value }))
                  }
                />
              )}{" "}
              {step === 6 && (
                <Choices
                  values={photos}
                  selected={[form.photo]}
                  onSelect={(value) =>
                    setForm((current) => ({ ...current, photo: value }))
                  }
                />
              )}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="control"
                disabled={step === 0}
                onClick={() => setStep((value) => Math.max(0, value - 1))}
              >
                <ChevronLeft className="size-4" />
                Back
              </Button>
              {step < steps.length - 1 ? (
                <Button
                  onClick={() =>
                    setStep((value) => Math.min(steps.length - 1, value + 1))
                  }
                >
                  Continue
                  <ChevronRight className="size-4" />
                </Button>
              ) : (
                <Button onClick={() => setWizard(false)}>
                  Save draft identity
                </Button>
              )}
            </div>
            <p className="mt-4 text-center text-[10px] text-vds-muted">
              Draft preview only · Existing Brand Kit persistence remains
              authoritative
            </p>
          </section>
        </div>
      )}
    </main>
  );
}
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-vds-elevated px-3 py-2 text-sm">
      <span className="text-vds-muted">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
function Choices<T extends string>({
  values,
  selected,
  onSelect,
}: {
  values: readonly T[];
  selected: readonly T[];
  onSelect: (value: T) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {values.map((value) => (
        <Button
          variant="control"
          onClick={() => onSelect(value)}
          className={`min-h-12 justify-start rounded-xl border px-4 ${selected.includes(value) ? "border-vds-accent-border bg-vds-primary-soft text-vds-primary" : "border-vds-border"}`}
          key={value}
        >
          {selected.includes(value) && <Check className="size-4" />}
          {value}
        </Button>
      ))}
    </div>
  );
}
function label(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}
