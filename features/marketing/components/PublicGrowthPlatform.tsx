"use client";
import { useState } from "react";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  ChartNoAxesCombined,
  Check,
  CircleDollarSign,
  FileImage,
  HeartHandshake,
  PlugZap,
  ShieldCheck,
} from "lucide-react";
import { Button, ButtonLink } from "@/features/platform/design-system";
const experiences = [
  [
    "Marketing AI",
    "Turn a listing, development launch, or open house into a governed campaign, channel plan, creative pack, and review workflow.",
    ChartNoAxesCombined,
    "/marketing",
  ],
  [
    "Sales AI",
    "Prioritize buyer intent, expose pipeline risk, prepare follow-ups, and keep recommendations tied to CRM evidence.",
    CircleDollarSign,
    "/ai-workforce",
  ],
  [
    "Founder AI",
    "Bring revenue, listing pipeline, agent activity, property demand, and business growth into one executive brief.",
    Bot,
    "/demo",
  ],
  [
    "Creative Studio",
    "Move from brand-approved campaign ideas to flyers, brochures, landing pages, sales kits, and review-ready assets.",
    FileImage,
    "/marketing",
  ],
  [
    "Property Knowledge",
    "Answer buyer, seller, agent, and investor questions from approved property and company knowledge with citations.",
    BrainCircuit,
    "/docs",
  ],
  [
    "Integrations",
    "Connect communications, calendars, billing, advertising, analytics, and AI through provider-neutral adapters.",
    PlugZap,
    "/integrations",
  ],
  [
    "Buyer Success",
    "Understand buyer needs, site-visit readiness, objections, follow-up priorities, and closing opportunities using CRM evidence.",
    HeartHandshake,
    "/demo",
  ],
  [
    "Enterprise security",
    "Preserve tenant isolation, RBAC, approvals, audit history, secret protection, and human accountability.",
    ShieldCheck,
    "/security",
  ],
] as const;
const tour = [
  [
    "Real Estate CRM",
    "Explore linked buyers, sellers, listings, properties, agents, deals, activities, and tasks.",
  ],
  [
    "Property Marketing",
    "Review listing campaigns, open-house content, attribution, creative workflows, and lead conversion evidence.",
  ],
  [
    "Property Sales",
    "Inspect qualified buyers, property matches, deal stages, forecasts, site visits, and follow-up priorities.",
  ],
  [
    "Founder Dashboard",
    "See listing pipeline, agent activity, revenue, and growth using isolated demo metrics.",
  ],
  [
    "Creative Studio",
    "Walk through property campaign packs, brochures, social content, and governed creative generation.",
  ],
  [
    "Property Knowledge",
    "Find approved listing details, buyer guidance, company messaging, and source-aware help.",
  ],
  [
    "AI Real Estate Team",
    "Meet specialist AI employees supporting sales, marketing, operations, and buyer success in recommendation-only mode.",
  ],
] as const;
export function PublicGrowthPlatform() {
  const [selected, setSelected] = useState(0);
  return (
    <>
      <section className="border-y border-vds-border bg-vds-elevated/30">
        <div className="mx-auto max-w-[90rem] px-5 py-24 sm:px-8">
          <p className="eyebrow">One intelligent real estate platform</p>
          <h2 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-.04em] sm:text-5xl">
            Turn every property enquiry into coordinated, accountable growth.
          </h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-vds-muted">
            VAYON connects lead acquisition, property sales, listing creative,
            buyer communication, agent coordination, and executive intelligence
            without losing context between teams.
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {experiences.map(([title, copy, Icon, href]) => (
              <article
                className="group rounded-3xl border border-vds-border bg-vds-surface p-5 transition hover:-translate-y-1 hover:border-vds-accent-border"
                key={title}
              >
                <span className="grid size-10 place-items-center rounded-xl bg-vds-primary-soft text-vds-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-6 font-semibold">{title}</h3>
                <p className="mt-3 min-h-24 text-sm leading-6 text-vds-muted">
                  {copy}
                </p>
                <ButtonLink href={href} variant="ghost" className="mt-3 px-0">
                  Explore <ArrowRight className="size-4" aria-hidden="true" />
                </ButtonLink>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[90rem] px-5 py-24 sm:px-8">
        <p className="eyebrow">Interactive product tour</p>
        <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-.04em] sm:text-5xl">
          Explore the operating system before creating an account.
        </h2>
        <div className="mt-10 grid gap-5 lg:grid-cols-[19rem_1fr]">
          <div
            className="grid content-start gap-2"
            role="tablist"
            aria-label="Product tour modules"
          >
            {tour.map(([title], index) => (
              <Button
                variant="control"
                role="tab"
                aria-selected={selected === index}
                onClick={() => setSelected(index)}
                className={`justify-start rounded-xl px-4 py-3 ${selected === index ? "bg-vds-primary-soft text-vds-primary" : "border border-vds-border"}`}
                key={title}
              >
                <span className="mr-2 text-xs text-vds-subtle">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {title}
              </Button>
            ))}
          </div>
          <article
            role="tabpanel"
            className="relative min-h-80 overflow-hidden rounded-3xl border border-vds-accent-border bg-vds-surface p-7 shadow-2xl sm:p-10"
          >
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_20%,var(--vds-color-primary-soft),transparent_45%)]" />
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">
              Guided demo · {selected + 1} of {tour.length}
            </p>
            <h3 className="mt-5 text-3xl font-semibold">
              {tour[selected]![0]}
            </h3>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-vds-muted">
              {tour[selected]![1]}
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                "Read-only isolated workspace",
                "Realistic cross-linked sample data",
                "No production tenant access",
                "No live provider credentials",
              ].map((item) => (
                <li className="flex items-center gap-2 text-sm" key={item}>
                  <Check
                    className="size-4 text-vds-success"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
            <ButtonLink href="/demo" className="mt-9">
              Launch guided demo{" "}
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          </article>
        </div>
      </section>
    </>
  );
}
