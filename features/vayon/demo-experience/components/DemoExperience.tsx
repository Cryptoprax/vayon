"use client";

import { Button, ButtonLink } from "@/features/platform/design-system";
import { DashboardShell } from "@/features/vayon/dashboard/components/DashboardShell";
import {
  Building2,
  CheckCircle2,
  Camera,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  Maximize2,
  Play,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import type {
  DemoCollection,
  DemoExperienceModel,
  DemoMode,
  DemoRecord,
} from "../domain/contracts";
import { BrandLogo } from "@/components/brand";
import { DemoObservabilityService } from "../services/demo-observability.service";
import { useMarketingCurrency } from "@/features/marketing/currency/CurrencyDisplay";
import { convertToUsd } from "@/features/marketing/currency/currency";
import { FloatingLayoutManager, FloatingSurface } from "@/features/vayon/floating-layout/FloatingLayoutManager";

const tabs = [
  "dashboard",
  "properties",
  "leads",
  "deals",
  "communications",
  "activity",
  "team",
  "workflows",
  "ai",
  "notifications",
  "billing",
  "analytics",
  "marketing",
  "growth",
  "landing-pages",
  "assistant",
  "knowledge",
  "customer-success",
  "creative",
  "reports",
  "investor",
] as const;
type Tab = (typeof tabs)[number];
const enterpriseTabs = [
  "team",
  "workflows",
  "ai",
  "notifications",
  "billing",
  "analytics",
  "marketing",
  "growth",
  "landing-pages",
  "assistant",
  "knowledge",
  "customer-success",
  "creative",
  "reports",
  "investor",
] as const;
const pageSize = 24;
const investorTours = [
  ["Executive Tour", "dashboard", 0],
  ["Founder Dashboard Tour", "dashboard", 0],
  ["Sales Tour", "deals", 4],
  ["Marketing Tour", "marketing", 7],
  ["CRM Tour", "leads", 2],
  ["AI Tour", "ai", 1],
  ["Creative Studio Tour", "creative", 14],
  ["Knowledge Tour", "knowledge", 10],
  ["Growth Studio Tour", "workflows", 15],
  ["CRM · unify the customer journey", "leads", 2],
  ["Marketing AI · turn goals into campaigns", "marketing", 7],
  ["Sales AI · prioritize revenue", "deals", 4],
  ["Customer Success · protect retention", "customer-success", 8],
  ["Founder AI · focus executive decisions", "dashboard", 8],
  ["Workflow Automation · govern execution", "workflows", 9],
  ["AI Command Center · coordinate specialists", "ai", 1],
  ["Knowledge Platform · ground every answer", "knowledge", 10],
  ["Creative Studio · scale brand-safe assets", "creative", 14],
  ["Integration Hub · connect without lock-in", "workflows", 15],
] as const satisfies readonly (readonly [string, Tab, number])[];

export function DemoExperience({
  model,
  initialMode = "visitor",
}: {
  readonly model: DemoExperienceModel;
  readonly initialMode?: DemoMode;
}) {
  const { currency, format, toLocal } = useMarketingCurrency();
  const [tab, setTab] = useState<Tab>("dashboard"),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(0),
    [notice, setNotice] = useState(false),
    [tourStep, setTourStep] = useState<number | null>(null),
    [mode, setMode] = useState<DemoMode>(initialMode),
    [presentation, setPresentation] = useState(false),
    [screenshot, setScreenshot] = useState(false),
    [storyStep, setStoryStep] = useState(0),
    [resetCount, setResetCount] = useState(0);
  useEffect(() => {
    const telemetry = new DemoObservabilityService();
    if (tab === "dashboard") telemetry.launch(tab);
    else telemetry.view(tab);
  }, [tab, resetCount]);
  useEffect(() => {
    if (!presentation) return;
    const navigate = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPresentation(false);
      if (event.key === "ArrowRight") setStoryStep((value) => Math.min(model.enterprise.executiveStory.length - 1, value + 1));
      if (event.key === "ArrowLeft") setStoryStep((value) => Math.max(0, value - 1));
    };
    window.addEventListener("keydown", navigate);
    return () => window.removeEventListener("keydown", navigate);
  }, [model.enterprise.executiveStory.length, presentation]);
  const dashboard = useMemo(
    () => ({
      ...model.dashboard,
      currency,
      kpis: model.dashboard.kpis.map((metric) =>
        metric.key === "revenue"
          ? { ...metric, displayValue: format(metric.value, true) }
          : metric.key === "deals"
            ? {
                ...metric,
                detail: `${format(
                  model.dashboard.pipeline.reduce(
                    (sum, item) => sum + item.value,
                    0,
                  ),
                  true,
                )} pipeline`,
              }
            : metric,
      ),
      pipeline: model.dashboard.pipeline.map((item) => ({
        ...item,
        value: toLocal(item.value),
      })),
      charts: model.dashboard.charts.map((item) => ({
        ...item,
        revenue: toLocal(item.revenue),
        pipeline: toLocal(item.pipeline),
      })),
    }),
    [currency, format, model.dashboard, toLocal],
  );
  const filtered = useMemo(() => {
    if (enterpriseTabs.includes(tab as (typeof enterpriseTabs)[number]))
      return [];
    const records =
      tab === "dashboard" ? [] : model.inventory[tab as DemoCollection];
    const term = query.trim().toLocaleLowerCase();
    return term
      ? records.filter((item) =>
          [item.title, item.subtitle, item.status, ...item.meta].some((value) =>
            value.toLocaleLowerCase().includes(term),
          ),
        )
      : records;
  }, [model.inventory, query, tab]);
  const visible = filtered.slice(page * pageSize, (page + 1) * pageSize),
    pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  function select(next: Tab) {
    setTab(next);
    setQuery("");
    setPage(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function protect(event: MouseEvent<HTMLDivElement>) {
    const anchor = (event.target as HTMLElement).closest("a");
    if (anchor?.getAttribute("href")?.startsWith("/vayon")) {
      event.preventDefault();
      setNotice(true);
    }
  }
  return (
    <FloatingLayoutManager sidebarCollapsed>
    <div
      onClickCapture={protect}
      className={`min-h-dvh bg-vds-background text-vds-foreground ${screenshot ? "demo-screenshot-mode" : ""}`}
      data-demo-tenant="aurora-demo-workspace"
      data-demo-mode={mode}
    >
      {!presentation && <header className="sticky top-0 z-50 border-b border-vds-border bg-vds-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[106rem] items-center gap-3 px-4 sm:px-6">
          <BrandLogo size="sm" priority />
          <div className="min-w-0">
            <p className="truncate text-[10px] text-vds-subtle">
              Aurora Realty Group
            </p>
          </div>
          <span className="ml-auto hidden items-center gap-2 rounded-full border border-vds-warning/20 bg-vds-warning-soft px-3 py-1.5 text-xs text-vds-warning sm:inline-flex">
            <LockKeyhole className="size-4" />
            Read-only demo
          </span>
          <label className="hidden text-xs text-vds-muted md:block"><span className="sr-only">Demo mode</span><select className="h-9 rounded-lg border border-vds-border bg-vds-input px-2" value={mode} onChange={(event)=>{const next=event.target.value as DemoMode;setMode(next);const profile=model.enterprise.modes.find(item=>item.id===next);if(profile?.openingTab&&tabs.includes(profile.openingTab as Tab))select(profile.openingTab as Tab);}}>{model.enterprise.modes.map((item)=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <ButtonLink href="/signup" className="shrink-0">
            Start free
          </ButtonLink>
        </div>
      </header>}
      {!presentation && <section className="border-b border-vds-border bg-vds-warning-soft">
        <div className="mx-auto flex max-w-[106rem] flex-col gap-2 px-4 py-3 text-xs sm:flex-row sm:items-center sm:px-6">
          <strong className="flex items-center gap-2 text-vds-warning">
            <Building2 className="size-4" />
            Demo Environment
          </strong>
          <span className="text-vds-muted">
            Using Aurora Realty Group · Changes are not persisted.
          </span>
          <span className="sm:ml-auto text-vds-subtle">
            Seeded, isolated fixtures
          </span>
        </div>
      </section>}
      {!presentation && <nav
        aria-label="Demo sections"
        className="sticky top-16 z-40 overflow-x-auto border-b border-vds-border bg-vds-background/90 px-4 backdrop-blur-xl sm:px-6"
      >
        <div className="mx-auto flex max-w-[100rem] gap-1 py-2">
          {tabs.map((item) => (
            <Button
              key={item}
              variant="control"
              type="button"
              onClick={() => select(item)}
              aria-current={tab === item ? "page" : undefined}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs capitalize ${tab === item ? "bg-vds-primary-soft text-vds-primary" : "text-vds-muted hover:bg-vds-hover hover:text-vds-foreground"}`}
            >
              {item}
            </Button>
          ))}
        </div>
      </nav>}
      {presentation ? <PresentationStory records={model.enterprise.executiveStory} step={storyStep} onStep={setStoryStep} onClose={()=>setPresentation(false)}/> : tab === "dashboard" ? (
        <DashboardShell
          data={dashboard}
          onBlockedAction={() => setNotice(true)}
          aiPrompts={[
            `Find buyers interested in villas below ${format(convertToUsd(30_000_000, "INR"), true)}`,
            "Show today's meetings",
            "Book site visits",
            "Create WhatsApp campaign",
            "Show highest priority leads",
          ]}
        />
      ) : enterpriseTabs.includes(tab as (typeof enterpriseTabs)[number]) ? (
        <EnterpriseBrowser
          title={tab}
          records={enterpriseRecords(model,tab)}
        />
      ) : (
        <DemoBrowser
          tab={tab}
          query={query}
          onQuery={(value) => {
            setQuery(value);
            setPage(0);
          }}
          records={visible}
          total={filtered.length}
          page={page}
          pages={pages}
          onPage={setPage}
        />
      )}
      {!presentation && <FloatingSurface id="demo-tour-actions" kind="action" priority={50}>
      <div className="flex items-end gap-2">
        <details className="group rounded-xl bg-vds-surface shadow-vds-lg">
          <summary className="vds-focus flex cursor-pointer list-none items-center gap-2 rounded-xl border border-vds-border px-4 py-2 text-sm">
            <Play className="size-4" />
            Start tour · Investor tours
          </summary>
          <div className="absolute bottom-12 left-0 grid w-56 gap-1 rounded-xl border border-vds-border bg-vds-surface p-2 shadow-vds-lg">
            {investorTours.map(([label, nextTab, step]) => (
              <Button
                key={label}
                variant="control"
                className="justify-start"
                onClick={() => {
                  select(nextTab);
                  setTourStep(step);
                }}
              >
                {label}
              </Button>
            ))}
          </div>
        </details>
        <Button variant="secondary" onClick={()=>{setStoryStep(0);setPresentation(true);}} aria-label="Start fullscreen-friendly presentation mode"><Maximize2 className="size-4"/>Present</Button>
        <Button variant="secondary" onClick={()=>setScreenshot(value=>!value)} aria-pressed={screenshot}><Camera className="size-4"/>Screenshot</Button>
        <Button
          variant="secondary"
          onClick={() => {
            new DemoObservabilityService().reset();
            setResetCount((value) => value + 1);
            setTab("dashboard");
            setQuery("");
            setPage(0);
            setNotice(true);
          }}
        >
          <RotateCcw className="size-4" />
          Reset demo
        </Button>
      </div>
      </FloatingSurface>}
      {tourStep !== null && (
        <FloatingSurface id="demo-walkthrough" kind="walkthrough" priority={20}>
        <div className="max-w-lg rounded-2xl border border-vds-accent-border bg-vds-surface p-5 shadow-vds-lg">
          <p className="text-xs text-vds-primary">
            Guided tour · {tourStep + 1}/{model.enterprise.tour.length}
          </p>
          <h2 className="mt-2 font-semibold">
            {model.enterprise.tour[tourStep]?.title}
          </h2>
          <p className="mt-1 text-sm text-vds-muted">
            {model.enterprise.tour[tourStep]?.detail}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setTourStep(null)}>
              Close
            </Button>
            <Button
              onClick={() =>
                setTourStep((value) => {
                  if (
                    value !== null &&
                    value < model.enterprise.tour.length - 1
                  )
                    return value + 1;
                  new DemoObservabilityService().completeTour();
                  return null;
                })
              }
            >
              Next
            </Button>
          </div>
        </div>
        </FloatingSurface>
      )}
      {notice && (
        <FloatingSurface id="demo-notice" kind="toast" priority={30}>
        <div
          role="status"
          className="flex max-w-sm items-start gap-3 rounded-2xl border border-vds-warning/25 bg-vds-surface p-4 shadow-xl shadow-vds-shadow"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-vds-warning" />
          <div>
            <p className="text-sm font-medium">
              Demo Mode — Changes are not saved.
            </p>
            <p className="mt-1 text-xs text-vds-muted">
              Create and edit actions are disabled in this isolated environment.
            </p>
          </div>
          <Button
            variant="control"
            type="button"
            aria-label="Dismiss message"
            onClick={() => setNotice(false)}
            className="p-1 text-vds-muted"
          >
            <X className="size-4" />
          </Button>
        </div>
        </FloatingSurface>
      )}
    </div>
    </FloatingLayoutManager>
  );
}

function EnterpriseBrowser({
  title,
  records,
}: {
  title: string;
  records: DemoExperienceModel["enterprise"]["team"];
}) {
  const { format } = useMarketingCurrency();
  return (
    <main className="mx-auto max-w-[100rem] px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">
        Enterprise demo data
      </p>
      <h1 className="mt-2 text-3xl font-semibold capitalize">{title}</h1>
      <p className="mt-2 text-sm text-vds-muted">
        Deterministic, cross-linked, recommendation-only sample data.
      </p>
      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {records.map((record) => (
          <article
            className="rounded-2xl border border-vds-border bg-vds-surface p-4"
            key={record.id}
          >
            <div className="flex justify-between gap-3">
              <h2 className="font-medium">{record.title}</h2>
              <span className="rounded-full bg-vds-primary-soft px-2 py-1 text-[10px] text-vds-primary">
                {record.status.replaceAll("_", " ")}
              </span>
            </div>
            <p className="mt-2 text-sm text-vds-muted">
              {record.monetaryValueUsd == null
                ? record.detail
                : `${format(record.monetaryValueUsd)} · ${record.detail}`}
            </p>
            <p className="mt-3 text-[10px] text-vds-subtle">
              {record.relatedIds.length} linked records · Demo data
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}

function enterpriseRecords(model: DemoExperienceModel, tab: Tab) {
  if (tab === "ai" || tab === "assistant") return model.enterprise.aiDemonstrations;
  if (tab === "marketing") return model.enterprise.campaigns;
  if (tab === "growth" || tab === "landing-pages" || tab === "workflows") return model.enterprise.workflows;
  if (tab === "billing") return [...model.enterprise.subscriptions, ...model.enterprise.billing];
  if (tab === "knowledge") return model.enterprise.knowledge;
  if (tab === "customer-success") return model.enterprise.customerSuccess;
  if (tab === "creative") return model.enterprise.creative;
  if (tab === "reports") return model.enterprise.reports;
  if (tab === "investor") return model.enterprise.investor;
  if (tab === "team") return model.enterprise.team;
  if (tab === "notifications") return model.enterprise.notifications;
  return model.enterprise.analytics;
}

function PresentationStory({ records, step, onStep, onClose }: { records: DemoExperienceModel["enterprise"]["executiveStory"]; step: number; onStep: (value: number) => void; onClose: () => void }) {
  const record = records[step];
  return <main className="grid min-h-dvh place-items-center overflow-hidden px-5 py-12" aria-live="polite"><section className="w-full max-w-6xl rounded-[2.5rem] border border-vds-accent-border bg-vds-surface/80 p-8 shadow-2xl backdrop-blur-xl sm:p-14 lg:p-20"><p className="text-xs font-semibold uppercase tracking-[.24em] text-vds-primary">Executive story · Demo content · {step+1}/{records.length}</p><h1 className="mt-6 text-4xl font-semibold tracking-[-.05em] sm:text-6xl lg:text-8xl">{record?.title}</h1><p className="mt-6 max-w-4xl text-lg leading-8 text-vds-muted sm:text-2xl sm:leading-10">{record?.detail}</p><div className="mt-12 flex flex-wrap items-center justify-between gap-4"><p className="text-xs text-vds-subtle">Use ← and → to navigate · Esc to exit</p><div className="flex gap-2"><Button variant="secondary" disabled={step===0} onClick={()=>onStep(Math.max(0,step-1))}><ChevronLeft className="size-4"/>Previous</Button><Button variant="secondary" onClick={onClose}>Exit</Button><Button disabled={step===records.length-1} onClick={()=>onStep(Math.min(records.length-1,step+1))}>Next<ChevronRight className="size-4"/></Button></div></div></section></main>;
}

function DemoBrowser({
  tab,
  query,
  onQuery,
  records,
  total,
  page,
  pages,
  onPage,
}: {
  readonly tab: Exclude<Tab, "dashboard">;
  readonly query: string;
  readonly onQuery: (value: string) => void;
  readonly records: readonly DemoRecord[];
  readonly total: number;
  readonly page: number;
  readonly pages: number;
  readonly onPage: (page: number) => void;
}) {
  return (
    <main className="mx-auto max-w-[100rem] px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">
            Aurora workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold capitalize tracking-tight">
            {tab}
          </h1>
          <p className="mt-2 text-sm text-vds-muted">
            {total.toLocaleString("en-IN")} deterministic demo records · Read
            only
          </p>
        </div>
        <label className="flex h-11 w-full items-center gap-2 rounded-xl border border-vds-border bg-vds-input px-3 focus-within:border-vds-accent-border md:max-w-sm">
          <Search className="size-4 text-vds-subtle" />
          <span className="sr-only">Search {tab}</span>
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder={`Search ${tab}...`}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-vds-subtle"
          />
        </label>
      </header>
      <div
        className={`mt-6 grid gap-3 ${tab === "properties" ? "sm:grid-cols-2 xl:grid-cols-3" : ""}`}
      >
        {records.map((record) => (
          <DemoRecordCard key={record.id} record={record} />
        ))}
      </div>
      {!records.length && (
        <div className="mt-6 rounded-3xl border border-dashed border-vds-border p-14 text-center">
          <Search className="mx-auto size-6 text-vds-subtle" />
          <p className="mt-3 text-sm">No matching demo records.</p>
        </div>
      )}
      <footer className="mt-6 flex items-center justify-between border-t border-vds-divider pt-5">
        <p className="text-xs text-vds-subtle">
          Page {page + 1} of {pages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            type="button"
            disabled={page === 0}
            onClick={() => onPage(page - 1)}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <Button
            variant="secondary"
            type="button"
            disabled={page >= pages - 1}
            onClick={() => onPage(page + 1)}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </footer>
    </main>
  );
}

function DemoRecordCard({ record }: { readonly record: DemoRecord }) {
  const { format } = useMarketingCurrency();
  return (
    <article
      className={`overflow-hidden rounded-2xl border border-vds-border bg-vds-surface ${record.kind === "properties" ? "" : "p-4"}`}
    >
      {record.image && (
        <Image
          src={record.image}
          alt=""
          width={640}
          height={360}
          className="aspect-[16/8] w-full object-cover"
        />
      )}
      <div className={record.image ? "p-4" : ""}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium text-vds-secondary">
              {record.title}
            </h2>
            <p className="mt-1 truncate text-xs text-vds-muted">
              {record.subtitle}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-vds-primary-soft px-2 py-1 text-[10px] capitalize text-vds-primary">
            {record.status.replaceAll("-", " ")}
          </span>
        </div>
        {record.monetaryRangeUsd && (
          <p className="mt-3 text-sm font-semibold text-vds-primary">
            {record.monetaryRangeUsd.minimum == null
              ? "Price on request"
              : record.monetaryRangeUsd.maximum == null
                ? format(record.monetaryRangeUsd.minimum)
                : `${format(record.monetaryRangeUsd.minimum)} – ${format(record.monetaryRangeUsd.maximum)}`}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {record.meta.slice(0, 4).map((item, index) => (
            <span
              key={`${record.id}-${index}`}
              className="rounded-lg bg-vds-elevated px-2 py-1 text-[10px] capitalize text-vds-subtle"
            >
              {item}
            </span>
          ))}
        </div>
        {record.occurredAt && (
          <time className="mt-3 block text-[10px] text-vds-subtle">
            {new Date(record.occurredAt).toLocaleString("en-IN")}
          </time>
        )}
      </div>
    </article>
  );
}
