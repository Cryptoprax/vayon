"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/features/platform/design-system";
import {
  Boxes,
  BriefcaseBusiness,
  ChevronRight,
  FileImage,
  FileText,
  FolderKanban,
  Globe2,
  Heart,
  Image,
  LayoutTemplate,
  Megaphone,
  Palette,
  PanelRight,
  Plus,
  Presentation,
  Search,
  Sparkles,
  Star,
  Video,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  analyzeCreativeIntent,
  creativeExecutionStages,
  type CreativeExecutionPlan,
} from "./intent";
import type { CreativeModuleId, CreativeStudio2Snapshot } from "./types";

const icons = {
  brand: Palette,
  images: Image,
  marketing: Megaphone,
  presentations: Presentation,
  documents: FileText,
  videos: Video,
  websites: Globe2,
  assets: Boxes,
  templates: LayoutTemplate,
  projects: FolderKanban,
} satisfies Record<CreativeModuleId, typeof Palette>;
const nav: readonly [string, CreativeModuleId | "home"][] = [
  ["Creative Home", "home"],
  ["Brand", "brand"],
  ["Images", "images"],
  ["Marketing", "marketing"],
  ["Presentations", "presentations"],
  ["Documents", "documents"],
  ["Videos", "videos"],
  ["Websites", "websites"],
  ["Assets", "assets"],
  ["Templates", "templates"],
  ["Projects", "projects"],
];
const routes: Record<CreativeModuleId | "home", string> = {
  home: "/vayon/creative",
  brand: "/vayon/creative/brand",
  images: "/vayon/creative/images",
  marketing: "/vayon/creative/campaigns",
  presentations: "/vayon/creative/documents",
  documents: "/vayon/creative/documents",
  videos: "/vayon/creative/videos",
  websites: "/vayon/creative/campaigns",
  assets: "/vayon/creative-studio/assets",
  templates: "/vayon/creative-studio/templates",
  projects: "/vayon/creative/campaigns",
};
const prompts = [
  "Create a luxury real estate brochure.",
  "Create a fintech logo.",
  "Create social media campaign.",
  "Create pitch deck.",
  "Create product mockups.",
];
const card =
  "rounded-3xl border border-vds-border bg-vds-surface/75 shadow-xl shadow-vds-shadow/10 backdrop-blur-xl";

export function CreativeStudioHome({
  snapshot,
}: {
  readonly snapshot: CreativeStudio2Snapshot;
}) {
  const router = useRouter(),
    [dialog, setDialog] = useState(false),
    [assistant, setAssistant] = useState(true),
    [prompt, setPrompt] = useState(() =>
      typeof window === "undefined"
        ? ""
        : (window.sessionStorage.getItem("vayon.creative.prompt") ?? ""),
    ),
    [plan, setPlan] = useState<CreativeExecutionPlan | null>(null),
    [executionStatus, setExecutionStatus] = useState("Ready"),
    [query, setQuery] = useState("");
  const updatePrompt = (value: string) => {
      setPrompt(value);
      window.sessionStorage.setItem("vayon.creative.prompt", value);
      setPlan(null);
      setExecutionStatus("Ready");
    },
    prepare = () => {
      setPlan(analyzeCreativeIntent(prompt));
      setExecutionStatus(
        snapshot.governance.generationEnabled ? "Queued" : "Waiting Provider",
      );
    },
    execute = () => {
      if (!plan) return;
      setExecutionStatus("Planning");
      window.sessionStorage.setItem(
        "vayon.creative.plan",
        JSON.stringify(plan),
      );
      router.push(plan.primaryRoute);
    };
  const projects = useMemo(
    () =>
      snapshot.projects.filter((project) =>
        project.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, snapshot.projects],
  );
  return (
    <main className="mx-auto grid w-full max-w-[120rem] gap-5 px-4 py-5 lg:grid-cols-[13rem_minmax(0,1fr)] lg:px-6">
      <aside
        className={`${card} hidden h-fit p-3 lg:block`}
        aria-label="Creative Studio navigation"
      >
        <p className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[.2em] text-vds-primary">
          Creative Studio 2.0
        </p>
        <nav className="grid gap-1">
          {nav.map(([label, id]) => {
            const Icon = id === "home" ? Sparkles : icons[id];
            return (
              <Link
                href={routes[id]}
                className="focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-vds-muted hover:bg-vds-hover hover:text-vds-foreground"
                key={id}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 space-y-6" id="creative-home">
        <header className={`${card} relative overflow-hidden p-6 sm:p-8`}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,var(--vds-color-primary-soft),transparent_35%)]" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.22em] text-vds-primary">
                AI Creative Operating System
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">
                What will you create?
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-vds-muted">
                Bring brand, campaigns, presentations, documents, media, and
                every creative asset into one governed project workspace.
              </p>
            </div>
            <Button
              onClick={() => setDialog(true)}
              className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-2xl bg-vds-primary px-5 font-semibold text-vds-on-primary shadow-lg"
            >
              <Plus className="size-5" />
              Create with AI
            </Button>
          </div>
        </header>
        <section aria-labelledby="studios">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold" id="studios">
              Creative studios
            </h2>
            <span className="text-xs text-vds-muted">
              Live execution through Creative Runtime
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {snapshot.modules.map((module) => {
              const Icon = icons[module.id];
              return (
                <article
                  id={module.id}
                  className={`${card} group p-4 transition hover:-translate-y-0.5 hover:border-vds-accent-border`}
                  key={module.id}
                >
                  <div className="flex items-center justify-between">
                    <span className="grid size-10 place-items-center rounded-2xl bg-vds-primary-soft text-vds-primary">
                      <Icon className="size-5" />
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-vds-subtle">
                      {module.availability}
                    </span>
                  </div>
                  <h3 className="mt-5 font-semibold">{module.name}</h3>
                  <p className="mt-2 text-xs leading-5 text-vds-muted">
                    {module.outcome}
                  </p>
                  <Link
                    href={routes[module.id]}
                    className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-vds-primary"
                  >
                    Open workflow <ChevronRight className="size-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
        <div className="grid gap-5 xl:grid-cols-[1.45fr_.8fr]">
          <section className={`${card} p-5`} id="projects">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Recent projects</h2>
                <p className="mt-1 text-xs text-vds-muted">
                  Every creative belongs to a tenant-scoped project.
                </p>
              </div>
              <label className="flex items-center gap-2 rounded-xl border border-vds-border bg-vds-elevated px-3">
                <Search className="size-4 text-vds-muted" />
                <span className="sr-only">Search projects</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-10 bg-transparent text-sm outline-none"
                  placeholder="Search projects"
                />
              </label>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {projects.slice(0, 6).map((project) => (
                <article
                  className="rounded-2xl border border-vds-border bg-vds-elevated/60 p-4"
                  key={project.id}
                >
                  <div className="flex justify-between gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-vds-primary-soft text-vds-primary">
                      <BriefcaseBusiness className="size-5" />
                    </span>
                    <span className="text-[10px] uppercase text-vds-muted">
                      {project.status}
                    </span>
                  </div>
                  <h3 className="mt-4 font-medium">{project.name}</h3>
                  <p className="mt-2 text-xs text-vds-muted">
                    {project.assetCount} assets · Updated{" "}
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                </article>
              ))}
              {!projects.length && (
                <Button
                  onClick={() => setDialog(true)}
                  className="col-span-full rounded-2xl border border-dashed border-vds-border p-10 text-center text-sm text-vds-muted"
                >
                  <Plus className="mx-auto mb-2 size-6" />
                  Create your first creative project
                </Button>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {snapshot.projectCapabilities.map((item) => (
                <span
                  className="rounded-full bg-vds-elevated px-3 py-1 text-[10px] capitalize text-vds-muted"
                  key={item}
                >
                  {item}
                </span>
              ))}
            </div>
          </section>
          <div className="space-y-5">
            <section className={`${card} p-5`} id="brand">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Brand Kit</h2>
                <Palette className="size-5 text-vds-primary" />
              </div>
              {snapshot.brandKits[0] ? (
                <>
                  <p className="mt-4 text-sm font-medium">
                    {snapshot.brandKits[0].name}
                  </p>
                  <div className="mt-3 flex gap-2">
                    {snapshot.brandKits[0].colors.map((color) => (
                      <span
                        className="size-8 rounded-full border border-vds-border"
                        style={{ backgroundColor: color }}
                        title={color}
                        key={color}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-vds-muted">
                    {snapshot.brandKits[0].tone}
                  </p>
                </>
              ) : (
                <p className="mt-4 text-sm text-vds-muted">
                  Add logos, colors, typography, icons, voice, tone, and company
                  details.
                </p>
              )}
            </section>
            <section className={`${card} p-5`} id="templates">
              <div className="flex justify-between">
                <h2 className="font-semibold">Favorites & pinned templates</h2>
                <Star className="size-5 text-vds-primary" />
              </div>
              <p className="mt-4 text-sm text-vds-muted">
                Pin the creative systems your team uses most. Favorites remain
                workspace-scoped.
              </p>
              <Link
                href="/vayon/creative-studio/templates"
                className="mt-4 inline-flex items-center gap-1 text-sm text-vds-primary"
              >
                Browse existing templates <ChevronRight className="size-4" />
              </Link>
            </section>
          </div>
        </div>
        <section className={`${card} p-5`} id="assets">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Asset Library</h2>
              <p className="mt-1 text-xs text-vds-muted">
                Folders, collections, tags, search, favorites, brand, uploaded,
                and AI-generated asset foundations.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="rounded-full bg-vds-elevated px-3 py-1 text-xs">
                {snapshot.assets.length} assets
              </span>
              <Heart className="size-5 text-vds-muted" />
            </div>
          </div>
          <div className="mt-5 grid gap-3 grid-cols-2 md:grid-cols-4">
            {snapshot.assets.slice(0, 8).map((asset) => (
              <article
                className="aspect-[4/3] rounded-2xl border border-vds-border bg-vds-elevated p-3"
                key={asset.id}
              >
                <FileImage className="size-6 text-vds-primary" />
                <p className="mt-4 truncate text-xs font-medium">
                  {asset.name}
                </p>
                <p className="mt-1 text-[10px] text-vds-muted">
                  {asset.category} · v{asset.version}
                </p>
              </article>
            ))}
            {!snapshot.assets.length && (
              <div className="col-span-full rounded-2xl border border-dashed border-vds-border p-8 text-center text-sm text-vds-muted">
                No governed assets yet.
              </div>
            )}
          </div>
        </section>
        <section
          className={`${card} flex flex-wrap items-center justify-between gap-4 p-5`}
        >
          <div>
            <h2 className="font-semibold">Export engine</h2>
            <p className="mt-1 text-xs text-vds-muted">
              Available formats are produced by each governed studio workflow.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {snapshot.exportFormats.map((format) => (
              <span
                className="rounded-lg border border-vds-border px-2.5 py-1 text-xs"
                key={format}
              >
                {format}
              </span>
            ))}
          </div>
        </section>
      </div>
      <Button
        onClick={() => setAssistant((value) => !value)}
        aria-expanded={assistant}
        className="focus-ring fixed bottom-5 right-5 z-40 grid size-12 place-items-center rounded-full bg-vds-primary text-vds-on-primary shadow-xl"
        title="Creative Assistant"
      >
        <PanelRight className="size-5" />
      </Button>
      {assistant && (
        <aside
          aria-label="AI Creative Assistant"
          className={`${card} fixed bottom-20 right-5 z-30 w-[min(23rem,calc(100vw-2.5rem))] p-5`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-vds-primary" />
              <h2 className="font-semibold">Creative Assistant</h2>
            </div>
            <Button
              onClick={() => setAssistant(false)}
              aria-label="Close assistant"
            >
              <X className="size-4" />
            </Button>
          </div>
          <p className="mt-3 text-sm text-vds-muted">
            I analyze intent, prepare a governed execution plan, and route work
            through the existing Creative Director and studio runtimes.
          </p>
          <Button
            onClick={() => setDialog(true)}
            className="mt-4 w-full rounded-xl border border-vds-border px-3 py-2 text-sm"
          >
            Start a creative brief
          </Button>
        </aside>
      )}
      {dialog && (
        <div
          className="fixed inset-0 z-[90] grid place-items-center bg-vds-overlay p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDialog(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-title"
            className={`${card} w-full max-w-2xl p-6`}
          >
            <div className="flex justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold" id="create-title">
                  Describe what you want to create
                </h2>
                <p className="mt-2 text-sm text-vds-muted">
                  Natural language is enough. Technical settings can wait.
                </p>
              </div>
              <Button
                onClick={() => setDialog(false)}
                aria-label="Close create dialog"
              >
                <X className="size-5" />
              </Button>
            </div>
            <textarea
              autoFocus
              value={prompt}
              onChange={(event) => updatePrompt(event.target.value)}
              rows={5}
              className="mt-5 w-full rounded-2xl border border-vds-border bg-vds-elevated p-4 outline-none focus:ring-2 focus:ring-vds-focus"
              placeholder="Create a luxury real estate brochure."
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {prompts.map((value) => (
                <Button
                  onClick={() => updatePrompt(value)}
                  className="rounded-full border border-vds-border px-3 py-1.5 text-xs text-vds-muted"
                  key={value}
                >
                  {value}
                </Button>
              ))}
            </div>
            {plan && (
              <div className="mt-5 rounded-2xl border border-vds-border bg-vds-elevated p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">
                    Execution Plan · {plan.title}
                  </h3>
                  <span className="text-xs text-vds-primary">
                    {executionStatus}
                  </span>
                </div>
                <div className="mt-3 grid gap-2">
                  {plan.items.map((item) => (
                    <div
                      key={item.output}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span>✓ {item.output}</span>
                      <span className="text-xs text-vds-muted">
                        {item.studio}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-vds-muted sm:grid-cols-4">
                  <span>{plan.estimatedMinutes} min estimated</span>
                  <span>
                    {plan.estimatedCostUsd === null
                      ? "No provider cost"
                      : `$${plan.estimatedCostUsd.toFixed(2)} estimated`}
                  </span>
                  <span>
                    {plan.requiredProviders.join(", ") ||
                      "No provider required"}
                  </span>
                  <span>
                    {plan.items.filter((item) => item.approvalRequired).length}{" "}
                    approvals
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-1">
                  {creativeExecutionStages.map((stage) => (
                    <span
                      key={stage}
                      className="rounded-full border border-vds-border px-2 py-1 text-[10px]"
                    >
                      {stage}
                    </span>
                  ))}
                </div>
                {!snapshot.governance.generationEnabled && (
                  <p className="mt-3 text-xs text-vds-warning">
                    {snapshot.governance.providerReason} Retry later; no output
                    will be fabricated.
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {plan.suggestedFollowUps.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => updatePrompt(`${prompt} ${suggestion}.`)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6 flex items-center justify-between gap-3">
              <p className="text-xs text-vds-muted">
                Creative Director → Pipeline → Runtime → Execution Engine →
                Provider Adapter
              </p>
              <Button
                disabled={!prompt.trim()}
                onClick={plan ? execute : prepare}
                className="rounded-xl bg-vds-primary px-4 py-2 text-sm font-semibold text-vds-on-primary disabled:opacity-40"
              >
                {plan ? "Begin execution" : "Prepare execution plan"}
              </Button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
