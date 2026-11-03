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
  MessageSquareText,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Target,
  Workflow,
} from "lucide-react";
import { Fragment, type CSSProperties, type ReactNode } from "react";
import { ButtonLink } from "@/features/platform/design-system";
import { PricingTable } from "./PricingTable";
import { Reveal, WorkflowMotion } from "./LaunchMotion";
import { EnterpriseFaq } from "./EnterpriseExperience";
import { CommandCenter } from "./CommandCenter";
import { HeroGlow } from "./HeroGlow";
import { LandingRoiCalculator } from "./LandingRoiCalculator";
import { PublicGrowthPlatform } from "./PublicGrowthPlatform";
import { FoundingOffer } from "./FoundingOffer";
import motionStyles from "./homepage-motion.module.css";

const hasCustomerTestimonials = false;

const features = [
  [
    "AI Lead Qualification",
    Bot,
    "Qualify every enquiry and prioritize the leads most likely to convert.",
  ],
  [
    "CRM",
    Database,
    "Keep customers, contacts, activities, and deals in one relationship graph.",
  ],
  [
    "WhatsApp Automation",
    MessageSquareText,
    "Prepare contextual replies, recommendations, and appointment confirmations.",
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
    "Calendar & Appointments",
    CalendarDays,
    "Connect meetings, visits, tasks, and reminders.",
  ],
  [
    "Property Matching",
    Building2,
    "For real estate teams: match demand to inventory with explained alternatives.",
  ],
  [
    "Lead Qualification",
    Check,
    "Classify intent, urgency, temperature, and confidence.",
  ],
  [
    "Executive Intelligence",
    CircleDollarSign,
    "See revenue, risk, priorities, and business health.",
  ],
  [
    "Property Intelligence",
    BrainCircuit,
    "For real estate teams: find trusted property knowledge and cite the source.",
  ],
  [
    "Workflow Automation",
    Workflow,
    "Build clear operating sequences with approvals at every important step.",
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
  "Best-fit recommendation",
  "Appointment booked",
  "Owner assigned",
  "Follow up",
  "Proposal sent",
  "Deal won",
] as const;
const heroHeadline = ["One Intelligent AI Operating System.", "For Your Entire Business."] as const;
export const workflowContinuity = ["Lead arrives", "AI qualifies"] as const;
export const launchExperienceContinuity = [
  "The AI Operating System for Modern Real Estate Companies",
  "AI Employees",
  "Voice AI",
  "Marketing Automation",
  "Property Intelligence",
  "Secure Workspaces",
  "Start Free Trial",
  "Book Demo",
  "Watch 2-Minute Demo",
  "How Vayon Works",
  "AI Recommends Properties",
  "AI Drafts WhatsApp",
  "Deal Closed",
  "Manager approves",
  "Proposal created",
  "CRM updated",
  "Analytics refreshed",
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
    "Sarah · Sales Manager",
    ["Lead qualification", "Pipeline", "Follow-ups", "Appointments", "Negotiations"],
  ],
  [
    "Emma · Property Advisor",
    ["Property matching", "Buyer recommendations", "Property intelligence", "Availability", "Comparisons"],
  ],
  [
    "Alex · Marketing Director",
    ["Campaigns", "Creative", "Social Media", "Email Marketing", "Advertisements"],
  ],
  [
    "Olivia · Customer Success Manager",
    ["Customer support", "Reviews", "Retention", "Follow-ups", "Tickets"],
  ],
  [
    "David · Operations Manager",
    ["Tasks", "Calendar", "Documents", "Approvals", "Automation"],
  ],
] as const;
const aiTeamCapabilities = ["Qualify Leads", "Book Meetings", "Prepare Proposals", "Design Flyers", "Generate Videos", "Run Marketing", "Manage CRM", "Schedule Appointments", "Generate Reports", "Write Emails", "Answer Customers", "Manage Documents"] as const;
const aiTeamJourney = [["Create Your Workspace", "Choose your business type and create a secure workspace."], ["Meet Your AI Team", "Your sales, marketing, customer success and operations specialists are prepared automatically, with property specialists for real estate teams."], ["Start Growing", "Give your team its first goal and keep control of every important action."]] as const;
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      name: "Which businesses can use VAYON?",
      text: "VAYON brings customer relationships, conversations, sales, marketing, operations, approvals, and analytics into one AI workspace for businesses across industries, with dedicated property workflows for real estate teams.",
    },
    {
      name: "Does Vayon replace human decision-making?",
      text: "No. Vayon prepares recommendations while your team stays in control of every important action.",
    },
    {
      name: "Can Vayon replace a fragmented software stack?",
      text: "Vayon brings CRM, communications, AI, workflows, knowledge, and analytics into one connected workspace.",
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
              "Manage customers, conversations, sales, marketing, operations and AI employees in one AI business operating system, with dedicated workflows for real estate teams.",
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
        <div className={motionStyles.heroBackdrop} aria-hidden="true" />
        <HeroGlow />
        <div className="mx-auto grid max-w-[90rem] grid-cols-[minmax(0,1fr)] items-center gap-14 lg:grid-cols-[minmax(0,.92fr)_minmax(0,1.08fr)]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-vds-accent-border bg-vds-primary-soft px-3 py-1.5 text-xs font-semibold tracking-[.14em] text-vds-primary">
              <Sparkles className="size-3.5" aria-hidden="true" />
              THE FUTURE OF INTELLIGENT BUSINESS
            </span>
            <h1 className="mt-7 text-balance text-5xl font-semibold leading-[.98] tracking-[-.055em] sm:text-7xl">
              <HeroHeadline />
            </h1>
            <h2 className="mt-7 max-w-2xl text-xl font-medium leading-8 text-vds-secondary">
              Meet VAYON — an intelligent business operating system where AI employees work alongside your team to manage customer conversations, automate sales, coordinate operations, and turn everyday work into measurable progress.
            </h2>
            <p className="mt-5 max-w-2xl text-pretty leading-7 text-vds-muted">
              Build smarter workflows. Reduce repetitive work. Unlock the full potential of AI across your organization.
            </p>
            <FoundingOffer />
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/signup" size="lg">
                Start Free{" "}
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href="/contact?intent=demo" variant="outline" size="lg">
                Book a Demo
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
          <CommandCenter />
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
        eyebrow="Your AI team, working together"
        title="One AI Operating System for Every Part of Your Business"
        copy="AI Employees, CRM, Marketing, Communications, Automation, Calendar, Creative Studio, Growth Intelligence, Analytics and Connected Apps—everything working together."
      >
        <ModuleGrid />
      </Section>
      <Band>
        <Section
          eyebrow="Complete platform"
          title="A Complete Business Operating System"
          copy="Manage customers, pipelines, teams, appointments, communications and operations without losing context between tools."
        >
          <FeatureGrid />
        </Section>
      </Band>
      <Section
        eyebrow="Working from day one"
        title="Meet Your AI Team"
        copy="Your AI team is prepared to qualify leads, run marketing, coordinate operations and follow up—while you remain in control."
      >
        <AiTeamGrid />
      </Section>
      <Band>
        <Section eyebrow="One team, every outcome" title="Everything Your AI Team Can Do" copy="Give your AI Team a business goal and let each specialist prepare the work needed to move your business forward.">
          <AiTeamCapabilities />
        </Section>
      </Band>
      <Section eyebrow="Ready in minutes" title="How It Works" copy="Start with your business, meet the team prepared for you, and move directly into useful work.">
        <AiTeamJourney />
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
      {hasCustomerTestimonials ? <Testimonials /> : <WhyTeamsChooseVayon />}
      <section className="border-y border-vds-border bg-vds-elevated/30">
        <PricingTable />
      </section>
      <Section
        eyebrow="FAQ"
        title="The questions growing businesses ask."
        copy="Specific answers about security, AI, pricing, integrations, setup, and support."
      >
        <EnterpriseFaq />
      </Section>
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
        eyebrow="Industry solution · Real estate"
        title="Dedicated Workflows For Real Estate"
        copy="Alongside the core platform, VAYON includes property, viewing, and deal workflows for the teams that develop, market, sell, lease, and manage property."
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
  const cards: readonly { readonly title: string; readonly quote: string; readonly attribution: string }[] = [];
  return (
    <Band>
      <Section
        eyebrow="Customer stories"
        title="Teams building with VAYON"
        copy="Customer stories will appear here when they are ready to share."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {cards.map(({ title, quote, attribution }) => (
            <article
              className="rounded-3xl border border-vds-border bg-vds-surface p-6"
              key={title}
            >
              <h3 className="font-semibold">{title}</h3>
              <blockquote className="mt-4 text-sm leading-6 text-vds-muted">{quote}</blockquote>
              <p className="mt-5 text-xs font-medium text-vds-secondary">{attribution}</p>
            </article>
          ))}
        </div>
      </Section>
    </Band>
  );
}
function WhyTeamsChooseVayon() {
  const reasons = [
    ["One Platform Instead of 10+ Tools", Workflow, "Manage CRM, marketing, operations, AI, transactions, and reporting from one workspace."],
    ["Five AI Managers Working Together", Bot, "Sales, Marketing, Operations, Finance, and Customer Success collaborate with evidence-backed recommendations."],
    ["Industry Solutions", Building2, "Start with the core platform, or use dedicated workflows for real estate agencies, brokers, builders, and developers."],
    ["Enterprise Security", ShieldCheck, "Role-based permissions, approvals, audit history, and secure workspace isolation."],
    ["AI With Human Control", FileCheck2, "Nothing executes automatically. Every important action stays under your approval."],
    ["Scalable As You Grow", ChartNoAxesCombined, "Designed to support small teams through larger organizations."],
  ] as const;
  return (
    <Band>
      <Section eyebrow="A connected operating advantage" title="Why Growing Teams Choose VAYON" copy="Bring your people, customer relationships, operations, and AI managers together without sacrificing control.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map(([title, Icon, description]) => (
            <article className="vds-card-motion rounded-2xl border border-vds-border bg-vds-surface p-6" key={title}>
              <span className="grid size-10 place-items-center rounded-xl bg-vds-primary-soft text-vds-primary"><Icon className="size-5" aria-hidden="true" /></span>
              <h3 className="mt-5 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-vds-muted">{description}</p>
            </article>
          ))}
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
    "Communications",
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
      {aiTeam.map(([role, responsibilities], index) => (
        <article
          className="rounded-3xl border border-vds-border bg-vds-surface p-6"
          key={role}
        >
          <span className="grid size-10 place-items-center rounded-xl bg-vds-primary-soft text-vds-primary">
            <Bot className="size-5" aria-hidden="true" />
          </span>
          <div className="mt-5 flex items-center justify-between gap-2"><h3 className="font-semibold">{role}</h3><span className="inline-flex items-center gap-1 text-xs text-vds-success"><i className="size-2 rounded-full bg-vds-success motion-safe:animate-pulse"/>Working</span></div>
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
          <ButtonLink href={`/login?next=/vayon/ai/workforce/${["sales-ai","crm-ai","marketing-ai","whatsapp-ai","operations-ai"][index]}`} variant="ghost" size="sm" className="mt-5">Open Headquarters</ButtonLink>
        </article>
      ))}
    </div>
  );
}
function AiTeamCapabilities() {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{aiTeamCapabilities.map((capability) => <article key={capability} className="flex items-center gap-3 rounded-2xl border border-vds-border bg-vds-surface p-5"><span className="grid size-9 place-items-center rounded-xl bg-vds-primary-soft text-vds-primary"><Sparkles className="size-4" aria-hidden="true"/></span><h3 className="font-semibold">{capability}</h3></article>)}</div>;
}
function AiTeamJourney() {
  return <div className="grid gap-4 lg:grid-cols-3">{aiTeamJourney.map(([title, description]) => <article key={title} className="rounded-3xl border border-vds-border bg-vds-surface p-7"><span className="grid size-11 place-items-center rounded-2xl bg-vds-primary-soft text-vds-primary"><Bot className="size-5" aria-hidden="true"/></span><h3 className="mt-6 text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-vds-muted">{description}</p></article>)}</div>;
}
// The headline is server-rendered once for assistive technology; the visible copy is split into words for the
// staggered reveal (CSS only, skipped for reduced motion).
function HeroHeadline() {
  return (
    <>
      <span className="sr-only">{heroHeadline.join(" ")}</span>
      <span aria-hidden="true">
        {heroHeadline.map((line, lineIndex) => {
          const offset = heroHeadline.slice(0, lineIndex).reduce((count, previous) => count + previous.split(" ").length, 0);
          return (
            <span key={line} className={`block ${lineIndex ? "text-vds-primary" : "text-vds-foreground"}`}>
              {line.split(" ").map((word, wordIndex) => (
                <Fragment key={wordIndex}>
                  <span className={motionStyles.word} style={{ "--i": offset + wordIndex } as CSSProperties}>{word}</span>{" "}
                </Fragment>
              ))}
            </span>
          );
        })}
      </span>
    </>
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
