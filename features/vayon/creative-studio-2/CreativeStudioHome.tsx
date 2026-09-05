"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Button } from "@/features/platform/design-system";
import { FloatingSurface } from "@/features/vayon/floating-layout/FloatingLayoutManager";
import { Boxes, ChevronRight, FileText, FolderKanban, Globe2, Image as ImageIcon, LayoutTemplate, Mail, Megaphone, Palette, PanelRight, Plus, Presentation, Search, Share2, Sparkles, Video, X } from "lucide-react";
import { analyzeCreativeIntent, creativeExecutionStages, type CreativeExecutionPlan } from "./intent";
import type { CreativeModuleId, CreativeStudio2Snapshot } from "./types";
import styles from "./CreativeStudioHome.module.css";

const icons = { brand: Palette, images: ImageIcon, marketing: Megaphone, presentations: Presentation, documents: FileText, videos: Video, websites: Globe2, assets: Boxes, templates: LayoutTemplate, projects: FolderKanban } satisfies Record<CreativeModuleId, typeof Palette>;
const routes: Record<CreativeModuleId, string> = {
  brand: "/vayon/creative/brand", images: "/vayon/creative/images", marketing: "/vayon/creative/campaigns",
  presentations: "/vayon/creative/documents", documents: "/vayon/creative/documents", videos: "/vayon/creative/videos",
  websites: "/vayon/creative/campaigns", assets: "/vayon/creative-studio/assets", templates: "/vayon/creative-studio/templates", projects: "/vayon/creative/campaigns",
};
const groups = ["All studios", "Brand", "Marketing", "Content", "Publishing", "Management"] as const;
const studioGroup: Record<CreativeModuleId, string> = { brand: "Brand", marketing: "Marketing", images: "Content", presentations: "Content", documents: "Content", videos: "Content", websites: "Publishing", assets: "Management", templates: "Management", projects: "Management" };
const quickActions = [
  { title: "Brand Kit", icon: Palette, route: routes.brand },
  { title: "Campaign", icon: Megaphone, route: routes.marketing },
  { title: "Social Media", icon: Share2, prompt: "Create social media campaign." },
  { title: "Presentation", icon: Presentation, prompt: "Create pitch deck." },
  { title: "Landing Page", icon: Globe2, prompt: "Create a landing page." },
  { title: "Video", icon: Video, route: routes.videos },
  { title: "Image", icon: ImageIcon, route: routes.images },
  { title: "Email", icon: Mail, prompt: "Create an email campaign." },
  { title: "Document", icon: FileText, route: routes.documents },
];
const prompts = ["Create a luxury real estate brochure.", "Create a fintech logo.", "Create social media campaign.", "Create pitch deck.", "Create product mockups."];
const card = "rounded-3xl border border-vds-border bg-vds-surface";
const action = "focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-vds-primary hover:bg-vds-hover";
const date = (value: string) => new Date(value).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function CreativeStudioHome({ snapshot }: { readonly snapshot: CreativeStudio2Snapshot }) {
  const router = useRouter();
  const [dialog, setDialog] = useState(false), [assistant, setAssistant] = useState(false), [dockWidth, setDockWidth] = useState(320);
  const [prompt, setPrompt] = useState(() => typeof window === "undefined" ? "" : (window.sessionStorage.getItem("vayon.creative.prompt") ?? ""));
  const [plan, setPlan] = useState<CreativeExecutionPlan | null>(null), [executionStatus, setExecutionStatus] = useState("Ready");
  const [query, setQuery] = useState(""), [group, setGroup] = useState<string>("All studios"), [recent, setRecent] = useState("Campaigns");
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialogRef.current;
    if (dialog) { element?.showModal(); } else { element?.close(); }
  }, [dialog]);
  const updatePrompt = (value: string) => { setPrompt(value); window.sessionStorage.setItem("vayon.creative.prompt", value); setPlan(null); setExecutionStatus("Ready"); };
  const prepare = () => { setPlan(analyzeCreativeIntent(prompt)); setExecutionStatus(snapshot.governance.generationEnabled ? "Queued" : "Waiting Provider"); };
  const execute = () => { if (!plan) return; setExecutionStatus("Planning"); window.sessionStorage.setItem("vayon.creative.plan", JSON.stringify(plan)); router.push(plan.primaryRoute); };
  const projects = useMemo(() => [...snapshot.projects].sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)).filter(project => project.name.toLowerCase().includes(query.toLowerCase())), [query, snapshot.projects]);
  const assets = useMemo(() => [...snapshot.assets].sort((a,b) => b.generatedAt.localeCompare(a.generatedAt)), [snapshot.assets]);
  const recentAssets = assets.filter(asset => asset.name.toLowerCase().includes(query.toLowerCase()) && (recent !== "Exports" || asset.exports.length));
  const brand = snapshot.brandKits[0];
  return (
    <div className={styles.center}>
      <header className={`${card} ${styles.hero}`}>
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">Your creative workspace</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">AI Creative Center</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-vds-muted">Create every marketing asset your business needs using AI.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button onClick={() => setDialog(true)} className="min-h-12 gap-2 rounded-xl px-5"><Sparkles aria-hidden="true" className="size-5" />Create with AI</Button>
          <Link href="#featured-templates" className={`${action} border border-vds-border bg-vds-surface`}>Browse Templates<ChevronRight aria-hidden="true" className="size-4" /></Link>
        </div>
      </header>
      <nav aria-label="Creative Center sections" className="flex flex-wrap items-center gap-2 border-b border-vds-border py-3">
        {[["Quick actions", "quick-actions"], ["Studios", "studios"], ["Recent projects", "recent-projects"], ["Templates", "featured-templates"], ["Brand assets", "brand-assets"], ["Activity", "activity"]].map(([label,id]) => <a className={action} href={`#${id}`} key={id}>{label}</a>)}
        <Button variant="outline" className="min-h-11 gap-2 xl:ml-auto" aria-expanded={assistant} aria-controls="creative-assistant-dock" onClick={() => setAssistant(value => !value)}><PanelRight aria-hidden="true" className="size-4" />Assistant</Button>
      </nav>
      <div className={styles.workspace} data-docked={assistant} style={{ "--creative-dock-width": `${dockWidth}px` } as CSSProperties}>
        <div className={styles.content}>
          <section aria-labelledby="quick-actions">
            <h2 id="quick-actions" className="text-xl font-semibold">What would you like to create?</h2>
            <p className="mt-2 text-sm text-vds-muted">Start with an idea. Make it yours.</p>
            <div className={`${styles.quickGrid} mt-6`}>
              {quickActions.map(({title, icon: Icon, route, prompt: brief}) => {
                const content = <><span className="grid size-12 place-items-center rounded-2xl bg-vds-primary-soft text-vds-primary"><Icon className="size-6" aria-hidden="true" /></span><span className="font-semibold">{title}</span></>;
                return route ? <Link key={title} href={route} className={`${styles.quickCard} vds-card-motion focus-ring`}>{content}</Link> : <Button variant="control" type="button" key={title} className={`${styles.quickCard} vds-card-motion focus-ring`} onClick={() => { updatePrompt(brief!); setDialog(true); }}>{content}</Button>;
              })}
            </div>
          </section>
          <section aria-labelledby="studios">
            <h2 id="studios" className="text-xl font-semibold">Creative Studios</h2>
            <p className="mt-2 text-sm text-vds-muted">A dedicated workspace for every kind of creative work.</p>
            <div className="my-6 flex flex-wrap gap-2" role="group" aria-label="Filter studios by group">
              {groups.map(value => <Button key={value} variant={group === value ? "primary" : "outline"} aria-pressed={group === value} onClick={() => setGroup(value)} className="min-h-11 rounded-full">{value}</Button>)}
            </div>
            <div className={styles.studioGrid}>
              {snapshot.modules.filter(module => group === "All studios" || studioGroup[module.id] === group).map(module => {
                const Icon = icons[module.id];
                return <article key={module.id} className={`${card} ${styles.studioCard} vds-card-motion`}>
                  <div className="flex flex-wrap items-center justify-between gap-3"><span className="grid size-14 place-items-center rounded-2xl bg-vds-primary-soft text-vds-primary"><Icon className="size-7" aria-hidden="true" /></span><span className="rounded-full border border-vds-border px-3 py-1 text-xs capitalize text-vds-muted">{module.availability}</span></div>
                  <p className="mt-6 text-xs font-medium text-vds-primary">{studioGroup[module.id]}</p>
                  <h3 className="mt-2 text-lg font-semibold">{module.name}</h3><p className="mb-6 mt-2 text-sm leading-6 text-vds-muted">{module.outcome}</p>
                  <Link href={routes[module.id]} aria-label={`Open ${module.name}`} className={`${action} mt-auto justify-between border border-vds-border`}>Open Studio<ChevronRight className="size-4" aria-hidden="true" /></Link>
                </article>;
              })}
            </div>
          </section>
          <section id="recent-projects" aria-labelledby="recent-title" className={`${card} p-5 sm:p-7`}>
            <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 id="recent-title" className="text-xl font-semibold">Recent Projects</h2><p className="mt-2 text-sm text-vds-muted">Pick up where your team left off.</p></div><label className="flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-vds-border px-3 focus-within:ring-2 focus-within:ring-vds-focus"><Search className="size-4 shrink-0" aria-hidden="true" /><span className="sr-only">Search recent projects</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search recent work" className="h-11 w-full min-w-0 bg-transparent text-sm outline-none" /></label></div>
            <div role="group" aria-label="Recent project type" className="my-5 flex flex-wrap gap-2">{["Generations", "Campaigns", "Assets", "Exports"].map(value => <Button key={value} variant={recent === value ? "primary" : "outline"} aria-pressed={recent === value} onClick={() => setRecent(value)}>{value}</Button>)}</div>
            <div className={styles.recentGrid} aria-live="polite">
              {recent === "Campaigns" ? projects.slice(0,6).map(project => <Link href={routes.projects} key={project.id} className={`${styles.recentCard} focus-ring vds-card-motion`}><FolderKanban className="size-6 text-vds-primary" aria-hidden="true" /><h3 className="mt-4 font-semibold">{project.name}</h3><p className="mt-2 text-sm text-vds-muted">{project.assetCount} assets · {date(project.updatedAt)}</p><p className="mt-3 text-xs capitalize text-vds-muted">{project.status.replaceAll("-", " ")}</p></Link>) : recentAssets.slice(0,6).map(asset => <Link href={`/vayon/creative-studio/editor/${encodeURIComponent(asset.id)}`} key={asset.id} className={`${styles.recentCard} focus-ring vds-card-motion`}><ImageIcon className="size-6 text-vds-primary" aria-hidden="true" /><h3 className="mt-4 font-semibold">{asset.name}</h3><p className="mt-2 text-sm text-vds-muted">{recent === "Exports" ? asset.exports.join(" · ") : `${asset.format} · v${asset.version}`}</p><p className="mt-3 text-xs text-vds-muted">{date(asset.generatedAt)} · {asset.status.replaceAll("-", " ")}</p></Link>)}
            </div>
            {!(recent === "Campaigns" ? projects.length : recentAssets.length) && <div className="rounded-2xl border border-dashed border-vds-border p-8 text-center"><p className="text-sm text-vds-muted">{query ? "No matching work. Try a different search." : `Your recent ${recent.toLowerCase()} will appear here.`}</p>{!query && <Button variant="outline" onClick={() => setDialog(true)} className="mt-4">Create with AI</Button>}</div>}
            <div className="mt-5 flex flex-wrap gap-2">{snapshot.projectCapabilities.map(item => <span className="rounded-full bg-vds-elevated px-3 py-1 text-xs capitalize text-vds-muted" key={item}>{item}</span>)}</div>
          </section>
          <section id="featured-templates" aria-labelledby="templates-title">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h2 id="templates-title" className="text-xl font-semibold">Featured Templates</h2><p className="mt-2 text-sm text-vds-muted">A head start for your next campaign.</p></div><Link className={action} href={routes.templates}>Browse all templates<ChevronRight className="size-4" aria-hidden="true" /></Link></div>
            <div className={styles.recentGrid}>{snapshot.templates.slice(0,3).map(template => <Link href={routes.templates} key={template.id} className={`${card} overflow-hidden focus-ring vds-card-motion`}><div className={styles.templatePreview} aria-hidden="true"><LayoutTemplate className="size-12" /><span className="text-sm font-medium">{template.category}</span></div><div className="p-5"><h3 className="font-semibold">{template.name}</h3><p className="mt-2 text-sm text-vds-muted">Editable · Brand Kit aware</p></div></Link>)}</div>
            {!snapshot.templates.length && <p className="text-sm text-vds-muted">No templates available yet.</p>}
          </section>
          <section id="brand-assets" aria-labelledby="brand-title" className={`${card} p-5 sm:p-7`}>
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="brand-title" className="text-xl font-semibold">Brand Assets</h2><p className="mt-2 text-sm text-vds-muted">{brand?.name ?? "Build a consistent identity for everything you create."}</p></div><Link href={routes.brand} className={action}>Open Brand Studio<ChevronRight className="size-4" aria-hidden="true" /></Link></div>
            <div className={`${styles.recentGrid} mt-6`}>
              <Link href={routes.brand} className={`${styles.recentCard} focus-ring`}><Palette className="mb-4 size-7 text-vds-primary" aria-hidden="true" /><h3 className="font-semibold">Logo</h3><p className="mt-2 text-sm text-vds-muted">{brand?.logoPath ? "Logo saved in Brand Studio" : "Add your primary and secondary logos"}</p></Link>
              <Link href={routes.brand} className={`${styles.recentCard} focus-ring`}><span className="mb-4 block text-2xl text-vds-primary" aria-hidden="true">Aa</span><h3 className="font-semibold">Fonts</h3><p className="mt-2 text-sm text-vds-muted">{[...(brand?.fonts ?? []), ...(brand?.typography ?? [])].join(", ") || "Choose your brand typography"}</p></Link>
              <Link href={routes.brand} className={`${styles.recentCard} focus-ring`}><h3 className="font-semibold">Colors</h3><div className="mt-4 flex flex-wrap gap-3">{brand?.colors.length ? brand.colors.map(color => <span key={color} className="text-xs text-vds-muted"><span className="mb-2 block size-9 rounded-full border border-vds-border" style={{backgroundColor: color}} />{color}</span>) : <p className="text-sm text-vds-muted">Add your brand palette</p>}</div></Link>
            </div>
            <Link href={routes.brand} className={`${action} mt-5`}>Brand Guidelines<ChevronRight className="size-4" aria-hidden="true" /></Link><p className="mt-1 text-sm text-vds-muted">{brand?.tone || "Set your voice, tone, and brand standards in Brand Studio."}</p>
          </section>
          <section id="activity" aria-labelledby="activity-title" className={`${card} p-5 sm:p-7`}>
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="activity-title" className="text-xl font-semibold">Recent AI Activity</h2><p className="mt-2 text-sm text-vds-muted">Generation history and approval status from your creative assets.</p></div><Link href={routes.assets} className={action}>Open Asset Library<ChevronRight className="size-4" aria-hidden="true" /></Link></div>
            <ul className="mt-5 divide-y divide-vds-border">{assets.slice(0,5).map(asset => <li key={asset.id} className="flex flex-wrap items-start justify-between gap-3 py-4"><div className="min-w-0"><Link href={`/vayon/creative-studio/editor/${encodeURIComponent(asset.id)}`} className="focus-ring font-medium hover:underline">{asset.name}</Link><p className="mt-1 text-sm text-vds-muted">{asset.aiEmployee} · Generated {date(asset.generatedAt)}</p>{asset.approver && <p className="mt-1 text-xs text-vds-muted">Approver: {asset.approver}</p>}</div><span className="rounded-full border border-vds-border px-3 py-1 text-xs capitalize text-vds-muted">{asset.status.replaceAll("-", " ")}</span></li>)}</ul>
            {!assets.length && <p className="py-6 text-sm text-vds-muted">Your generation history and reviews will appear as your team creates assets.</p>}
          </section>
          <section className={`${card} flex flex-wrap items-center justify-between gap-4 p-6`} aria-label="Export formats"><div><h2 className="font-semibold">Ready for every channel</h2><p className="mt-2 text-sm text-vds-muted">Export formats depend on your selected studio.</p></div><div className="flex flex-wrap gap-2">{snapshot.exportFormats.map(format => <span key={format} className="rounded-lg border border-vds-border px-3 py-2 text-xs">{format}</span>)}</div></section>
        </div>
        <aside id="creative-assistant-dock" hidden={!assistant} className={`${styles.dock} ${card}`} aria-label="Creative Assistant">
          <div className="flex items-center justify-between gap-2"><h2 className="font-semibold">Creative Assistant</h2><Button variant="ghost" aria-label="Collapse assistant" onClick={() => { setAssistant(false); document.querySelector<HTMLButtonElement>('[aria-controls="creative-assistant-dock"]')?.focus(); }}><X className="size-5" /></Button></div>
          <p className="mt-4 text-sm leading-6 text-vds-muted">Turn your idea into a brief and a clear creation plan.</p><Button variant="outline" onClick={() => setDialog(true)} className="mt-4 w-full">Start a creative brief</Button>
          <label className={styles.resize}>Assistant width<input aria-label="Assistant width" type="range" min="280" max="440" step="20" value={dockWidth} onChange={event => setDockWidth(Number(event.target.value))} /></label>
          <div id="creative-intelligence-dock" className="mt-5 min-w-0" />
        </aside>
      </div>
      <FloatingSurface id="creative-create" kind="action" priority={50}><Button onClick={() => setDialog(true)} className={`${styles.createAction} min-h-12 gap-2 rounded-2xl shadow-lg`}><Plus className="size-5" aria-hidden="true" />Create with AI</Button></FloatingSurface>
      <dialog ref={dialogRef} onCancel={() => setDialog(false)} onClose={() => setDialog(false)}
          onKeyDown={event => {
            if (event.key !== "Tab") return;
            const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, textarea, select, summary, [tabindex="0"]')).filter(element => element.getClientRects().length);
            const first = controls[0], last = controls.at(-1);
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
          }}
          aria-labelledby="create-title"
          className={`${styles.dialog} vds-modal-enter rounded-3xl border border-vds-border bg-vds-surface text-vds-foreground p-0`}
        ><div
          className="p-4 sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDialog(false);
          }}
        >
          <section
            className="min-w-0"
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
              aria-label="Creative brief"
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
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <details className="text-xs text-vds-muted"><summary className="focus-ring cursor-pointer py-2">How creation works</summary>
                Creative Director → Pipeline → Runtime → Execution Engine →
                Provider Adapter
              </details>
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
      </dialog>
    </div>
  );
}
