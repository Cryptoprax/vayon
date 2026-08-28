"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Megaphone,
  MessageCircle,
  Network,
  Settings2,
  Users,
} from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import { Button } from "@/features/platform/design-system";
import { CurrencyDisplay } from "../currency/CurrencyDisplay";

const productViews = [
  "Property Pipeline",
  "AI Employees",
  "Property Listings",
  "Lead Qualification",
  "Appointments",
  "Executive Dashboard",
] as const;
export const productViewContinuity = [
  "AI Workforce",
  "Calendar",
  "Workflow Automation",
] as const;
const metrics: Record<
  (typeof productViews)[number],
  readonly [string, string | { readonly valueUsd: number }][]
> = {
  "Property Pipeline": [
    ["Active opportunities", "48"],
    ["Qualified buyers", "19"],
    ["Next actions", "12"],
  ],
  "AI Employees": [
    ["Employees online", "8"],
    ["Recommendations", "146"],
    ["Approvals", "12"],
  ],
  "Property Listings": [
    ["Active listings", "248"],
    ["Buyer matches", "36"],
    ["Site visits", "14"],
  ],
  "Lead Qualification": [
    ["New enquiries", "86"],
    ["High-intent leads", "19"],
    ["Ready for follow-up", "61"],
  ],
  Appointments: [
    ["Appointments today", "12"],
    ["Property visits", "7"],
    ["Follow-ups ready", "18"],
  ],
  "Executive Dashboard": [
    ["Business health", "91"],
    ["Critical risks", "2"],
    ["AI activity", "384"],
  ],
};

export function HeroProductMockup() {
  const [active, setActive] = useState(0),
    reduced = useReducedMotion(),
    view = productViews[active];
  useEffect(() => {
    if (reduced) return;
    const timer = window.setInterval(
      () => setActive((value) => (value + 1) % productViews.length),
      3600,
    );
    return () => window.clearInterval(timer);
  }, [reduced]);
  return (
    <motion.div
      className="relative rounded-[2rem] border border-vds-border-strong bg-vds-elevated p-2 shadow-2xl"
      animate={reduced ? undefined : { y: [0, -5, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="overflow-hidden rounded-[1.55rem] border border-vds-border bg-vds-background">
        <div className="flex items-center justify-between border-b border-vds-border px-5 py-4">
          <div className="flex gap-2">
            <i className="size-2 rounded-full bg-vds-danger" />
            <i className="size-2 rounded-full bg-vds-warning" />
            <i className="size-2 rounded-full bg-vds-success" />
          </div>
          <span className="text-xs text-vds-subtle">
            Vayon enterprise workspace
          </span>
        </div>
        <div className="grid min-h-[29rem] sm:grid-cols-[9rem_1fr]">
          <nav
            aria-label="Product preview"
            className="hidden border-r border-vds-border p-3 sm:block"
          >
            {productViews.map((item, index) => (
              <Button
                key={item}
                variant="control"
                onClick={() => setActive(index)}
                aria-pressed={index === active}
                className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-xs ${index === active ? "bg-vds-primary-soft text-vds-primary" : "text-vds-muted hover:bg-vds-hover"}`}
              >
                {item}
              </Button>
            ))}
          </nav>
          <div className="p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                aria-live="polite"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-vds-muted">Live workspace</p>
                    <h3 className="mt-1 text-xl font-semibold">{view}</h3>
                  </div>
                  <span className="rounded-full bg-vds-success-soft px-3 py-1 text-xs text-vds-success">
                    Connected
                  </span>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {metrics[view].map(([label, value]) => (
                    <div
                      className="rounded-2xl border border-vds-border bg-vds-surface p-4"
                      key={label}
                    >
                      <p className="text-xs text-vds-muted">{label}</p>
                      <p className="mt-3 text-xl font-semibold">
                        {typeof value === "string" ? (
                          value
                        ) : (
                          <CurrencyDisplay valueUsd={value.valueUsd} compact />
                        )}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl border border-vds-border bg-vds-surface p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Operating momentum
                    </span>
                    <span className="text-xs text-vds-success">Live</span>
                  </div>
                  <div className="mt-10 flex h-32 items-end gap-2">
                    {[38, 54, 45, 67, 59, 76, 69, 88, 82, 96, 91, 100].map(
                      (height, index) => (
                        <motion.span
                          className="flex-1 rounded-t bg-vds-primary"
                          key={index}
                          initial={{ height: 0 }}
                          animate={{
                            height: `${height}%`,
                            opacity: 0.35 + index * 0.04,
                          }}
                          transition={{ delay: index * 0.025 }}
                        />
                      ),
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const employees: readonly [
  string,
  string,
  readonly string[],
  ComponentType<{ className?: string }>,
][] = [
  [
    "AI Sales Assistant",
    "Converts enquiries into qualified opportunities",
    ["Lead scoring", "Follow-ups"],
    BriefcaseBusiness,
  ],
  [
    "AI Marketing Strategist",
    "Builds campaigns around real buyer demand",
    ["Campaigns", "ROI"],
    Megaphone,
  ],
  [
    "AI CRM Manager",
    "Keeps every relationship complete and current",
    ["Data health", "Summaries"],
    Users,
  ],
  [
    "AI WhatsApp Assistant",
    "Prepares timely, contextual customer replies",
    ["Drafts", "Qualification"],
    MessageCircle,
  ],
  [
    "AI Voice Agent",
    "Turns calls into structured sales intelligence",
    ["Call prep", "Insights"],
    BrainCircuit,
  ],
  [
    "AI Property Advisor",
    "Matches demand with the right inventory",
    ["Matching", "Alternatives"],
    CircleDollarSign,
  ],
  [
    "AI Operations Manager",
    "Coordinates tasks, approvals, and delivery",
    ["Tasks", "Bottlenecks"],
    Settings2,
  ],
  [
    "AI Executive Assistant",
    "Surfaces property sales priorities, forecast, and company risk",
    ["Briefings", "Risk"],
    BarChart3,
  ],
];
export const workforceRoleContinuity = [
  "AI Sales Assistant",
  "AI CRM Manager",
  "AI Marketing Strategist",
  "AI WhatsApp Assistant",
  "AI Voice Agent",
  "AI Property Advisor",
  "AI Operations Manager",
  "AI Executive Assistant",
] as const;

export function WorkforceOrbit() {
  const reduced = useReducedMotion();
  return (
    <div className="relative mx-auto grid max-w-6xl gap-3 lg:min-h-[42rem] lg:grid-cols-3 lg:place-content-center">
      <div className="pointer-events-none absolute inset-1/2 hidden size-[31rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-vds-accent-border lg:block" />
      <motion.div
        className="relative z-10 order-first mx-auto mb-5 grid size-40 place-items-center rounded-full border border-vds-accent-border bg-vds-primary-soft text-center shadow-2xl lg:absolute lg:inset-1/2 lg:mb-0 lg:-translate-x-1/2 lg:-translate-y-1/2"
        animate={reduced ? undefined : { scale: [1, 1.035, 1] }}
        transition={{ repeat: Infinity, duration: 3 }}
      >
        <div>
          <Network
            className="mx-auto size-7 text-vds-primary"
            aria-hidden="true"
          />
          <strong className="mt-2 block text-sm tracking-[.15em]">
            VAYON CORE
          </strong>
          <span className="mt-1 block text-[10px] text-vds-muted">
            Governed runtime
          </span>
        </div>
      </motion.div>
      {employees.map(([name, title, abilities, Icon], index) => (
        <motion.article
          key={name}
          className={`vds-card-motion relative z-10 rounded-2xl border border-vds-border bg-vds-surface p-5 lg:w-72 ${index % 2 ? "lg:col-start-3" : "lg:col-start-1"}`}
          whileHover={
            reduced
              ? undefined
              : { scale: 1.025, y: -4, borderColor: "var(--vds-color-primary)" }
          }
          animate={reduced ? undefined : { y: [0, index % 2 ? -3 : 3, 0] }}
          transition={{ duration: 4 + index * 0.15, repeat: Infinity }}
        >
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-vds-primary-soft text-vds-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-semibold">{name}</h3>
              <p className="mt-1 text-xs text-vds-muted">{title}</p>
            </div>
          </div>
          <ul className="mt-4 flex flex-wrap gap-2">
            {abilities.map((item) => (
              <li
                className="rounded-full border border-vds-border px-2.5 py-1 text-[10px] text-vds-secondary"
                key={item}
              >
                {item}
              </li>
            ))}
          </ul>
        </motion.article>
      ))}
    </div>
  );
}

const architecture = [
  "Users",
  "AI Employees",
  "Workflow Engine",
  "Knowledge Layer",
  "Integrations",
  "CRM",
  "Analytics",
  "Security",
  "Infrastructure",
] as const;
export function ArchitectureFlow() {
  const reduced = useReducedMotion();
  return (
    <div className="mx-auto max-w-3xl">
      {architecture.map((layer, index) => (
        <div key={layer}>
          <motion.div
            className="rounded-2xl border border-vds-border bg-vds-surface px-5 py-4 text-center font-medium"
            initial={reduced ? false : { opacity: 0, x: index % 2 ? 15 : -15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
          >
            <span className="mr-3 text-xs text-vds-primary">0{index + 1}</span>
            {layer}
          </motion.div>
          {index < architecture.length - 1 && (
            <motion.div
              className="mx-auto h-7 w-px bg-vds-primary"
              animate={
                reduced
                  ? undefined
                  : { opacity: [0.2, 1, 0.2], scaleY: [0.5, 1, 0.5] }
              }
              transition={{
                repeat: Infinity,
                duration: 1.8,
                delay: index * 0.08,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

const dashboardTabs = [
  "Dashboard",
  "CRM",
  "Messages",
  "Calendar",
  "Analytics",
  "AI",
  "Deals",
  "Documents",
] as const;
const dashboardMetrics: readonly [
  string,
  string | { readonly valueUsd: number },
][] = [
  ["Revenue", { valueUsd: 100600 }],
  ["Meetings", "42"],
  ["Pipeline", { valueUsd: 512575 }],
  ["Lead Sources", "12"],
  ["Tasks", "86%"],
  ["Conversation volume", "1,284"],
];
export function EnterpriseDashboardPreview() {
  const [tab, setTab] = useState<(typeof dashboardTabs)[number]>("Dashboard"),
    reduced = useReducedMotion();
  return (
    <div className="overflow-hidden rounded-[2rem] border border-vds-border-strong bg-vds-elevated p-2 shadow-2xl">
      <div className="rounded-[1.55rem] border border-vds-border bg-vds-background">
        <div className="flex gap-1 overflow-x-auto border-b border-vds-border p-3">
          {dashboardTabs.map((item) => (
            <Button
              variant="control"
              className={`shrink-0 rounded-lg px-3 py-2 text-xs ${tab === item ? "bg-vds-primary-soft text-vds-primary" : "text-vds-muted"}`}
              onClick={() => setTab(item)}
              aria-pressed={tab === item}
              key={item}
            >
              {item}
            </Button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            className="p-5"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              {dashboardMetrics.map(([label, value]) => (
                <div
                  className="rounded-2xl border border-vds-border bg-vds-surface p-4"
                  key={label}
                >
                  <p className="text-xs text-vds-muted">{label}</p>
                  <p className="mt-3 text-2xl font-semibold">
                    {typeof value === "string" ? (
                      value
                    ) : (
                      <CurrencyDisplay valueUsd={value.valueUsd} compact />
                    )}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-[1.5fr_1fr]">
              <div className="rounded-2xl border border-vds-border bg-vds-surface p-5">
                <p className="text-sm font-medium">{tab} performance</p>
                <div className="mt-8 flex h-40 items-end gap-2">
                  {[42, 65, 52, 78, 69, 88, 81, 98].map((height, index) => (
                    <motion.span
                      className="flex-1 rounded-t bg-vds-primary"
                      key={index}
                      animate={{
                        height: `${height}%`,
                        opacity: 0.42 + index * 0.055,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-vds-border bg-vds-surface p-5">
                <p className="text-sm font-medium">Priority work</p>
                {[
                  "Approve proposal",
                  "Review AI recommendation",
                  "Prepare customer meeting",
                  "Resolve pipeline risk",
                ].map((item, index) => (
                  <div
                    className="mt-4 flex items-center gap-3 text-xs text-vds-secondary"
                    key={item}
                  >
                    <CheckCircle2
                      className="size-4 text-vds-primary"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                    <span className="ml-auto text-vds-subtle">
                      0{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

const questions = [
  [
    "How is company data secured?",
    "Vayon applies role-based access, tenant and workspace isolation, audited operations, encrypted credential handling, and approval governance.",
  ],
  [
    "How does Vayon use AI?",
    "Specialized AI employees provide contextual recommendations through one governed runtime. Consequential actions remain under human control.",
  ],
  [
    "How does pricing work?",
    "Starter and Growth plans are available monthly, while Enterprise is configured around commercial, scale, and governance requirements.",
  ],
  [
    "Which integrations are supported?",
    "The platform includes existing Google Workspace, Microsoft 365, WhatsApp, OpenAI, Stripe, and Supabase integrations.",
  ],
  [
    "How is data privacy maintained?",
    "Workspace attribution, tenant isolation, least-privilege access, secret-safe diagnostics, and audit trails protect organizational data.",
  ],
  [
    "How quickly can a team get set up?",
    "Guided onboarding covers organization setup, integrations, AI configuration, imports, workflows, notifications, and launch readiness.",
  ],
  [
    "Can existing CRM data be migrated?",
    "The onboarding platform supports validated CSV imports with preview, duplicate detection, and explicit error reporting.",
  ],
  [
    "What support is available?",
    "Documentation, guided onboarding, success resources, and enterprise engagement are available through existing support surfaces.",
  ],
] as const;
export function EnterpriseFaq() {
  const [open, setOpen] = useState(0),
    reduced = useReducedMotion();
  return (
    <div className="mx-auto max-w-4xl divide-y divide-vds-border border-y border-vds-border">
      {questions.map(([question, answer], index) => (
        <div key={question}>
          <Button
            variant="control"
            className="flex w-full items-center justify-between py-5 text-left font-semibold"
            onClick={() => setOpen(open === index ? -1 : index)}
            aria-expanded={open === index}
          >
            {question}
            <ChevronDown
              className={`size-5 text-vds-muted ${open === index ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </Button>
          <AnimatePresence initial={false}>
            {open === index && (
              <motion.div
                initial={reduced ? false : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="pb-5 pr-10 text-sm leading-7 text-vds-muted">
                  {answer}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
