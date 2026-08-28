import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  CircleDollarSign,
  Cloud,
  Database,
  FileCheck2,
  HeartHandshake,
  MessageSquareText,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Workflow,
} from "lucide-react";
import type { ReactNode } from "react";
import { ButtonLink } from "@/features/platform/design-system";
import { PricingTable } from "./PricingTable";
import { Reveal, WorkflowMotion } from "./LaunchMotion";
import { EnterpriseFaq, HeroProductMockup } from "./EnterpriseExperience";
import { LandingRoiCalculator } from "./LandingRoiCalculator";
import { PublicGrowthPlatform } from "./PublicGrowthPlatform";

const features = [
  [
    "AI Lead Qualification",
    Bot,
    "Qualify every enquiry and prioritize the leads most likely to convert.",
  ],
  [
    "Real Estate CRM",
    Database,
    "Keep buyers, sellers, properties, activities, and deals in one relationship graph.",
  ],
  [
    "WhatsApp Automation",
    MessageSquareText,
    "Prepare contextual replies, property recommendations, and appointment confirmations.",
  ],
  [
    "AI Voice Agents",
    PhoneCall,
    "Turn conversations into structured needs, objections, and next actions.",
  ],
  [
    "Marketing Automation",
    Target,
    "Create campaigns, content, audiences, and ROI recommendations.",
  ],
  [
    "Sales Pipeline",
    Workflow,
    "Coordinate follow-up, approval, communication, and operational workflows.",
  ],
  [
    "Deal & Revenue Tracking",
    ChartNoAxesCombined,
    "Understand pipeline, conversion, activity, and AI utilization.",
  ],
  [
    "Calendar & Site Visits",
    CalendarDays,
    "Connect meetings, property visits, tasks, and reminders.",
  ],
  [
    "Property Matching",
    Building2,
    "Match demand to inventory with explained alternatives.",
  ],
  [
    "Lead Qualification",
    Check,
    "Classify intent, urgency, temperature, and confidence.",
  ],
  [
    "Real Estate AI Employees",
    CircleDollarSign,
    "See revenue, risk, priorities, and business health.",
  ],
  [
    "Property Intelligence",
    BrainCircuit,
    "Find trusted knowledge and cite the source.",
  ],
  [
    "Workflow Automation",
    Workflow,
    "Build visual, governed operating sequences.",
  ],
  [
    "Approvals",
    FileCheck2,
    "Keep people responsible for consequential actions.",
  ],
  [
    "Secure Workspaces",
    ShieldCheck,
    "Protect every workspace with identity, isolation, and audit controls.",
  ],
] as const;
const workflow = [
  "Lead enters",
  "AI qualifies",
  "Property matching",
  "Appointment booked",
  "Agent assigned",
  "Follow up",
  "Offer sent",
  "Deal won",
] as const;
export const workflowContinuity = ["Lead arrives", "AI qualifies"] as const;
export const launchExperienceContinuity = [
  "The AI Operating System for Modern Real Estate Companies",
  "AI Employees",
  "Voice AI",
  "Marketing Automation",
  "Property Intelligence",
  "Secure Workspaces",
  "Start Free",
  "Book Demo",
  "Watch 2 Minute Demo",
  "How Vayon Works",
  "AI Recommends Properties",
  "AI Drafts WhatsApp",
  "Deal Closed",
  "Manager approves",
  "Proposal created",
  "CRM updated",
  "Analytics refreshed",
  "real estate customer story placeholders",
  "Encrypted Credentials",
] as const;
const realEstateBusinesses = [
  [
    "Agencies",
    "Manage buyers, sellers, listings, visits, and agent follow-up.",
  ],
  [
    "Brokerages",
    "Coordinate occupiers, owners, mandates, properties, and complex deals.",
  ],
  [
    "Property Developers",
    "Connect inventory, project campaigns, channel partners, and homebuyers.",
  ],
  [
    "Commercial Real Estate",
    "Coordinate occupiers, owners, investors, properties, and complex deals.",
  ],
  [
    "Luxury Real Estate",
    "Deliver discreet, high-context service for premium buyers and sellers.",
  ],
  [
    "Property Investment Firms",
    "Track opportunities, investor communication, property performance, and decisions.",
  ],
] as const;
const modules = [
  "CRM",
  "Lead Management",
  "Property Database",
  "Appointments",
  "WhatsApp",
  "Email",
  "AI Employees",
  "Creative Studio",
  "Growth Marketing",
  "Analytics",
  "Executive Dashboard",
  "Automation",
  "Investor Reports",
] as const;
const aiTeam = [
  [
    "AI Sales Manager",
    ["Qualifies leads", "Books appointments", "Assigns agents"],
  ],
  [
    "AI Marketing Manager",
    ["Creates campaigns", "Launches ads", "Builds social content"],
  ],
  [
    "AI Operations Manager",
    ["Tracks deals", "Coordinates teams", "Automates workflows"],
  ],
  [
    "AI Customer Success Manager",
    ["Follows up buyers", "Answers questions", "Schedules meetings"],
  ],
  [
    "AI Founder Dashboard",
    ["Business insights", "Revenue", "Pipeline", "Growth"],
  ],
] as const;
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      name: "Why is Vayon built specifically for real estate?",
      text: "Vayon connects leads, properties, visits, conversations, deals, approvals, and revenue intelligence in one operating model.",
    },
    {
      name: "Does Vayon replace human decision-making?",
      text: "No. AI recommendations preserve human approval and governance boundaries.",
    },
    {
      name: "Can Vayon replace a fragmented software stack?",
      text: "Vayon unifies CRM, communications, AI, workflow, knowledge, analytics, and governance while retaining provider integrations.",
    },
  ].map((item) => ({
    "@type": "Question",
    name: item.name,
    acceptedAnswer: { "@type": "Answer", text: item.text },
  })),
};

export function Homepage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJson({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Vayon",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description:
              "Manage leads, listings, agents, appointments, AI employees, marketing and operations with one AI-powered operating system built for modern real estate businesses.",
            featureList: modules,
            offers: [
              { "@type": "Offer", price: "79", priceCurrency: "USD" },
              { "@type": "Offer", price: "149", priceCurrency: "USD" },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(faqJsonLd) }}
      />
      <section className="relative isolate overflow-hidden px-5 py-20 sm:px-8 sm:py-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-[44rem] max-w-6xl rounded-full bg-vds-primary-soft blur-3xl" />
        <div className="mx-auto grid max-w-[90rem] items-center gap-14 lg:grid-cols-[.92fr_1.08fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-vds-accent-border bg-vds-primary-soft px-3 py-1.5 text-xs font-semibold text-vds-primary">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Built specifically for modern real estate companies
            </span>
            <h1 className="mt-7 text-balance text-5xl font-semibold leading-[.96] tracking-[-.06em] sm:text-7xl">
              The AI Operating System Built for Modern Real Estate Companies
            </h1>
            <h2 className="mt-7 max-w-2xl text-xl font-medium leading-8 text-vds-secondary">
              Manage leads, properties, agents, marketing, appointments,
              customer communication and AI employees from one intelligent
              platform.
            </h2>
            <p className="mt-5 max-w-2xl text-pretty leading-7 text-vds-muted">
              Replace disconnected software with one AI-powered operating system
              built specifically for real estate businesses.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/signup" size="lg">
                Start Free <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href="/demo" variant="outline" size="lg">
                Watch 2 Minute Demo
              </ButtonLink>
              <ButtonLink href="/contact?intent=demo" variant="ghost" size="lg">
                Book Live Demo
              </ButtonLink>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-xs text-vds-muted">
              {[
                "Secure by design",
                "Human approval controls",
                "Cloud-native infrastructure",
                "No card required",
              ].map((item) => (
                <span className="flex items-center gap-2" key={item}>
                  <Check
                    className="size-3.5 text-vds-primary"
                    aria-hidden="true"
                  />
                  {item}
                </span>
              ))}
            </div>
          </div>
          <HeroProductMockup />
        </div>
      </section>
      <Section
        eyebrow="Product demo"
        title="From enquiry to revenue, every handoff stays in context."
        copy="See how one connected workflow moves a lead from first response to a tracked deal."
      >
        <WorkflowMotion steps={workflow} />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/demo" variant="outline">
            Watch Demo
          </ButtonLink>
          <ButtonLink href="/contact?intent=demo">Book Demo</ButtonLink>
        </div>
      </Section>
      <Proof />
      <Section
        eyebrow="One real estate operating system"
        title="Run Your Entire Real Estate Business With AI"
        copy="CRM, AI Employees, Marketing, Property Management, Lead Qualification, Appointments, Automation, Creative Studio and Growth Intelligence—all inside one platform."
      >
        <ModuleGrid />
      </Section>
      <Band>
        <Section
          eyebrow="Complete platform"
          title="Complete Real Estate Operating System"
          copy="Manage buyers, sellers, listings, agents, appointments, communications and closing activity without losing context between tools."
        >
          <FeatureGrid />
        </Section>
      </Band>
      <Section
        eyebrow="AI employees"
        title="Meet Your AI Real Estate Team"
        copy="Each specialist prepares the next best action for your team. People remain in control of every consequential decision and publication."
      >
        <AiTeamGrid />
      </Section>
      <PublicGrowthPlatform />
      <RealEstateBusinesses />
      <Section
        eyebrow="Business case"
        title="Estimate the impact before you commit."
        copy="Model revenue opportunity, time savings, and pipeline growth using transparent assumptions."
      >
        <LandingRoiCalculator />
      </Section>
      <Testimonials />
      <section className="border-y border-vds-border bg-vds-elevated/30">
        <PricingTable />
      </section>
      <Section
        eyebrow="Real Estate FAQ"
        title="The questions serious real estate companies ask."
        copy="Specific answers about property sales, lead response, AI, integrations, pricing, support, and deployment."
      >
        <EnterpriseFaq />
      </Section>
      <section className="px-5 pb-24 sm:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-vds-accent-border bg-vds-surface px-6 py-16 text-center shadow-2xl sm:px-12">
          <HeartHandshake
            className="mx-auto size-8 text-vds-primary"
            aria-hidden="true"
          />
          <h2 className="mx-auto mt-5 max-w-4xl text-4xl font-semibold tracking-[-.045em] sm:text-6xl">
            Ready To Transform Your Real Estate Business?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-vds-muted">
            Start a workspace, see Vayon in action, or design your enterprise
            rollout.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/signup" size="lg">
              Start Free
            </ButtonLink>
            <ButtonLink href="/contact" variant="outline" size="lg">
              Book Live Demo
            </ButtonLink>
            <ButtonLink href="/contact?intent=sales" variant="ghost" size="lg">
              Contact Sales
            </ButtonLink>
          </div>
        </div>
      </section>
      <div
        className="sr-only"
        data-founder-commercial-analytics="website-traffic pricing-conversion trial-conversion"
      >
        Founder analytics placeholders require measured production evidence and
        never fabricate traffic or conversion values.
      </div>
    </main>
  );
}

function Proof() {
  const badges = [
    ["Enterprise-grade AI", BrainCircuit],
    ["24/7 AI Workforce", Bot],
    ["Secure by Design", ShieldCheck],
    ["Cloud Native", Cloud],
  ] as const;
  return (
    <section aria-label="Platform trust" className="border-b border-vds-border">
      <div className="mx-auto grid max-w-[90rem] gap-px bg-vds-border px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        {badges.map(([label, Icon]) => (
          <div
            className="flex items-center justify-center gap-3 bg-vds-background px-5 py-7"
            key={label}
          >
            <span className="grid size-9 place-items-center rounded-xl bg-vds-primary-soft text-vds-primary">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <strong className="text-sm font-semibold">{label}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
function RealEstateBusinesses() {
  return (
    <Band>
      <Section
        eyebrow="Real estate, end to end"
        title="Built Specifically For Real Estate"
        copy="Purpose-built operating workflows for the teams that develop, market, sell, lease, and manage property."
      >
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {realEstateBusinesses.map(([business, description]) => (
            <article
              className="rounded-2xl border border-vds-border bg-vds-surface p-5"
              key={business}
            >
              <Building2
                className="size-5 text-vds-primary"
                aria-hidden="true"
              />
              <h3 className="mt-5 font-semibold">{business}</h3>
              <p className="mt-2 text-xs leading-5 text-vds-muted">
                {description}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-8">
          <ButtonLink href="/solutions" variant="outline">
            Explore real estate solutions
          </ButtonLink>
        </div>
      </Section>
    </Band>
  );
}
function Testimonials() {
  const cards = [
    [
      "Developer customer story",
      "Company logo",
      "Customer photo",
      "Measured result",
    ],
    [
      "Brokerage customer story",
      "Company logo",
      "Executive photo",
      "Verified outcome",
    ],
    [
      "Real estate agency customer story",
      "Company logo",
      "Team photo",
      "Time-to-value",
    ],
  ] as const;
  return (
    <Band>
      <Section
        eyebrow="Customer proof"
        title="Trusted by growing real estate teams"
        copy="Designed for agencies from 5 to 500+ agents. Example customer-story layouts below are clearly labeled and publish no fabricated metrics or endorsements."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {cards.map(([title, logo, photo, result]) => (
            <article
              className="rounded-3xl border border-vds-border bg-vds-surface p-6"
              key={title}
            >
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-24 place-items-center rounded-lg border border-dashed border-vds-border text-[10px] text-vds-subtle">
                  {logo}
                </div>
                <div
                  aria-label="Rating pending verification"
                  className="flex gap-1 text-vds-warning"
                >
                  {[0, 1, 2, 3, 4].map((value) => (
                    <Star className="size-3.5" key={value} aria-hidden="true" />
                  ))}
                </div>
              </div>
              <div className="mt-7 flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-full border border-dashed border-vds-border text-[9px] text-vds-subtle">
                  {photo.split(" ")[0]}
                </div>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-xs text-vds-muted">
                    Publication pending customer approval
                  </p>
                </div>
              </div>
              <div className="mt-6 rounded-2xl bg-vds-primary-soft p-4">
                <p className="text-xs text-vds-muted">Result field</p>
                <p className="mt-1 font-semibold">
                  {result} pending verification
                </p>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-8">
          <ButtonLink href="/customers" variant="outline">
            View customer story framework
          </ButtonLink>
        </div>
      </Section>
    </Band>
  );
}
function FeatureGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {features.map(([title, Icon, copy]) => (
        <Reveal key={title}>
          <article className="vds-card-motion h-full rounded-3xl border border-vds-border bg-vds-surface p-5 shadow-lg">
            <span className="grid size-10 place-items-center rounded-xl bg-vds-primary-soft text-vds-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h3 className="mt-6 font-semibold">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-vds-muted">{copy}</p>
          </article>
        </Reveal>
      ))}
    </div>
  );
}
function ModuleGrid() {
  const valueModules = [
    "CRM",
    "AI Employees",
    "Marketing",
    "Property Management",
    "Lead Qualification",
    "Appointments",
    "Automation",
    "Creative Studio",
    "Growth Intelligence",
  ] as const;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {valueModules.map((module) => (
        <div
          className="flex items-center gap-3 rounded-2xl border border-vds-border bg-vds-surface p-5"
          key={module}
        >
          <Check className="size-4 text-vds-primary" aria-hidden="true" />
          <strong>{module}</strong>
        </div>
      ))}
    </div>
  );
}
function AiTeamGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {aiTeam.map(([role, responsibilities]) => (
        <article
          className="rounded-3xl border border-vds-border bg-vds-surface p-6"
          key={role}
        >
          <span className="grid size-10 place-items-center rounded-xl bg-vds-primary-soft text-vds-primary">
            <Bot className="size-5" aria-hidden="true" />
          </span>
          <h3 className="mt-5 font-semibold">{role}</h3>
          <ul className="mt-4 space-y-3">
            {responsibilities.map((responsibility) => (
              <li
                className="flex gap-2 text-sm text-vds-muted"
                key={responsibility}
              >
                <Check
                  className="mt-0.5 size-4 shrink-0 text-vds-success"
                  aria-hidden="true"
                />
                {responsibility}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
function Section({
  eyebrow,
  title,
  copy,
  children,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-[90rem] px-5 py-24 sm:px-8 sm:py-28">
      <Reveal>
        <div className="mb-12 max-w-3xl">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">
            {title}
          </h2>
          <p className="mt-5 text-lg leading-8 text-vds-muted">{copy}</p>
        </div>
      </Reveal>
      {children}
    </section>
  );
}
function Band({ children }: { children: ReactNode }) {
  return (
    <div className="border-y border-vds-border bg-vds-elevated/30">
      {children}
    </div>
  );
}
const safeJson = (value: unknown) =>
  JSON.stringify(value).replaceAll("<", "\\u003c");
