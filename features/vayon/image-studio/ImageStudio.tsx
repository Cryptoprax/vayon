"use client";
import Link from "next/link";
import { Button } from "@/features/platform/design-system";
import {
  Archive,
  Check,
  ChevronRight,
  Clock3,
  Download,
  Folder,
  Heart,
  Image as ImageIcon,
  Layers3,
  MessageSquare,
  Palette,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { editImage, generateImage } from "./actions";
import type {
  ImageInspector,
  ImageStudioSnapshot,
  ImageStyle,
  ImageType,
} from "./types";
const card =
    "rounded-3xl border border-vds-border bg-vds-surface/75 shadow-xl shadow-vds-shadow/10 backdrop-blur-xl",
  types: readonly ImageType[] = [
    "Product Image",
    "Hero Image",
    "Lifestyle Image",
    "Team Photo",
    "Office Image",
    "Product Mockup",
    "Marketing Image",
    "Photography",
    "Illustration",
    "Vector",
    "Icon",
    "Logo Concept",
    "Product Render",
    "Architecture",
    "Interior",
    "Landscape",
    "Portrait",
    "Background",
    "Texture",
    "Pattern",
    "Mockup",
  ],
  styles: readonly ImageStyle[] = [
    "Luxury",
    "Corporate",
    "Minimal",
    "Modern",
    "Realistic",
    "Cinematic",
    "Editorial",
    "Flat",
    "3D",
    "Photorealistic",
    "Watercolor",
    "Sketch",
    "Anime",
    "Custom",
  ],
  examples = [
    "Create luxury hotel hero image",
    "Create solar panel advertisement",
    "Create SaaS landing page illustration",
    "Create healthcare brochure cover",
    "Create product packaging",
    "Create office interior",
    "Create Instagram campaign",
  ];
export function ImageStudio({
  snapshot,
}: {
  readonly snapshot: ImageStudioSnapshot;
}) {
  const [create, setCreate] = useState(false),
    [editor, setEditor] = useState<ImageInspector | null>(null),
    [selected, setSelected] = useState<ImageInspector | null>(
      snapshot.images[0] ?? null,
    ),
    [prompt, setPrompt] = useState(""),
    [type, setType] = useState<ImageType>("Photography"),
    [style, setStyle] = useState<ImageStyle>("Luxury"),
    [projectId, setProjectId] = useState(snapshot.projects[0]?.id ?? ""),
    [campaignId, setCampaignId] = useState(snapshot.campaigns[0]?.id ?? ""),
    [generationStatus, setGenerationStatus] = useState<string | null>(null),
    [pending, startTransition] = useTransition(),
    [query, setQuery] = useState(""),
    [tab, setTab] = useState("Recent Images");
  const tabs = [
      "Recent Images",
      "Projects",
      "Brand Assets",
      "AI Images",
      "Uploaded Images",
      "Collections",
      "Favorites",
      "Templates",
    ],
    images = useMemo(
      () =>
        snapshot.images.filter((item) =>
          item.name.toLowerCase().includes(query.toLowerCase()),
        ),
      [query, snapshot.images],
    );
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
              Image Studio
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-vds-muted">
              Create, edit, organize, inspect, and collaborate around every
              visual—from one brand-aware workspace.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="control">
              <Upload className="size-4" />
              Upload
            </Button>
            <Button onClick={() => setCreate(true)}>
              <Sparkles className="size-4" />
              Create image
            </Button>
          </div>
        </div>
      </header>
      <nav
        className="flex gap-2 overflow-x-auto pb-1"
        aria-label="Image Studio views"
      >
        {tabs.map((item) => (
          <Button
            variant="control"
            onClick={() => setTab(item)}
            className={`shrink-0 rounded-full ${tab === item ? "bg-vds-primary-soft text-vds-primary" : ""}`}
            key={item}
          >
            {item}
          </Button>
        ))}
      </nav>
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className={`${card} p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">{tab}</h2>
              <p className="mt-1 text-xs text-vds-muted">
                Workspace-scoped assets only
              </p>
            </div>
            <label className="flex items-center gap-2 rounded-xl border border-vds-border bg-vds-elevated px-3">
              <Search className="size-4 text-vds-muted" />
              <span className="sr-only">Search images</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-10 bg-transparent text-sm outline-none"
                placeholder="Search images, tags, collections"
              />
            </label>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-4">
            {images.map((item) => (
              <Button
                variant="control"
                onClick={() => setSelected(item)}
                onDoubleClick={() => setEditor(item)}
                className={`group h-auto min-h-48 flex-col items-stretch justify-between rounded-2xl border p-3 text-left ${selected?.id === item.id ? "border-vds-accent-border bg-vds-primary-soft" : "border-vds-border bg-vds-elevated"}`}
                key={item.id}
              >
                <div className="grid aspect-[4/3] place-items-center rounded-xl bg-vds-surface">
                  <ImageIcon className="size-10 text-vds-primary" />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium">
                    {item.name}
                  </span>
                  <Heart className="size-4 text-vds-muted" />
                </div>
              </Button>
            ))}
            {!images.length && (
              <Button
                variant="control"
                onClick={() => setCreate(true)}
                className="col-span-full h-52 flex-col rounded-2xl border border-dashed border-vds-border text-vds-muted"
              >
                <Plus className="mb-2 size-6" />
                Create or upload your first image
              </Button>
            )}
          </div>
        </div>
        <Inspector
          item={selected}
          snapshot={snapshot}
          onEdit={() => selected && setEditor(selected)}
        />
      </section>
      <section className={`${card} p-5`}>
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <h2 className="font-semibold">Asset organization</h2>
            <p className="mt-1 text-xs text-vds-muted">
              Folders, collections, tags, search, brand, AI, uploaded, and
              shared assets.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="control">
              <Folder className="size-4" />
              New folder
            </Button>
            <Button variant="control">
              <Plus className="size-4" />
              Collection
            </Button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Projects", snapshot.projects.length],
            ["Brand assets", snapshot.brandAssets.length],
            ["AI assets", snapshot.aiImages.length],
            ["Shared assets", snapshot.sharedImages.length],
          ].map(([label, value]) => (
            <article className="rounded-2xl bg-vds-elevated p-4" key={label}>
              <p className="text-xs text-vds-muted">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </article>
          ))}
        </div>
      </section>
      <section
        className={`${card} flex flex-wrap items-center justify-between gap-4 p-5`}
      >
        <div>
          <h2 className="font-semibold">Export foundation</h2>
          <p className="mt-1 text-xs text-vds-muted">
            Format infrastructure prepared; rendering is unavailable until a
            provider is configured.
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
      {create && (
        <CreateDialog
          prompt={prompt}
          setPrompt={setPrompt}
          type={type}
          setType={setType}
          style={style}
          setStyle={setStyle}
          brand={snapshot.brand}
          projects={snapshot.projects}
          campaigns={snapshot.campaigns}
          projectId={projectId}
          campaignId={campaignId}
          setProjectId={setProjectId}
          setCampaignId={setCampaignId}
          pending={pending}
          providerAvailable={snapshot.generationEnabled}
          status={generationStatus}
          onGenerate={() =>
            startTransition(async () => {
              const result = await generateImage({
                prompt,
                type,
                style,
                brandId: snapshot.brand?.id ?? null,
                projectId: projectId || null,
                campaignId: campaignId || null,
                brandMode: true,
              });
              setGenerationStatus(
                result.status === "WaitingProvider"
                  ? "Provider unavailable. Request remains in WaitingProvider."
                  : `${result.status} · ${result.provider ?? "Provider unavailable"}${result.latencyMs === null ? "" : ` · ${result.latencyMs} ms`}`,
              );
              if (result.assetId) setCreate(false);
            })
          }
          onClose={() => setCreate(false)}
        />
      )}{" "}
      {editor && (
        <Editor
          asset={editor}
          snapshot={snapshot}
          onClose={() => setEditor(null)}
          pending={pending}
          onOperation={(operation) =>
            startTransition(async () => {
              const result = await editImage(
                {
                  prompt: `Apply ${operation} while preserving the approved visual identity.`,
                  type: "Photography",
                  style,
                  brandId: snapshot.brand?.id ?? null,
                  projectId: editor.asset.projectId,
                  campaignId: editor.asset.campaignId,
                  brandMode: true,
                },
                editor.id,
                operation,
              );
              setGenerationStatus(
                result.status === "WaitingProvider"
                  ? "Provider unavailable. Original image preserved."
                  : `${operation} · ${result.status}`,
              );
              if (result.assetId) setEditor(null);
            })
          }
        />
      )}
    </main>
  );
}
function Inspector({
  item,
  snapshot,
  onEdit,
}: {
  item: ImageInspector | null;
  snapshot: ImageStudioSnapshot;
  onEdit: () => void;
}) {
  return (
    <aside className={`${card} h-fit p-5`}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Image inspector</h2>
        <SlidersHorizontal className="size-5 text-vds-primary" />
      </div>
      {item ? (
        <>
          <dl className="mt-5 space-y-3 text-xs">
            {[
              ["Name", item.name],
              ["Prompt", item.prompt || "Unavailable"],
              ["Brand", item.brand],
              ["Project", item.project],
              ["Creator", item.creator],
              ["Created", new Date(item.created).toLocaleString()],
              ["Resolution", item.resolution],
              ["Aspect ratio", item.aspectRatio],
              ["Usage", item.usage.join(", ") || "None"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-vds-muted">{label}</dt>
                <dd className="mt-1 break-words">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex gap-1">
            {item.colourPalette.slice(0, 6).map((color) => (
              <span
                className="size-6 rounded-full border border-vds-border"
                style={{ backgroundColor: color }}
                key={color}
              />
            ))}
          </div>
          <Button onClick={onEdit} className="mt-5 w-full">
            <Layers3 className="size-4" />
            Open editor
          </Button>
        </>
      ) : (
        <p className="mt-5 text-sm text-vds-muted">
          Select an image to inspect metadata.
        </p>
      )}
      <div className="mt-6 border-t border-vds-border pt-4">
        <h3 className="text-sm font-medium">Collaboration</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {snapshot.collaboration.map((value) => (
            <span
              className="rounded-full bg-vds-elevated px-2.5 py-1 text-[10px]"
              key={value}
            >
              {value}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
function CreateDialog({
  prompt,
  setPrompt,
  type,
  setType,
  style,
  setStyle,
  brand,
  projects,
  campaigns,
  projectId,
  campaignId,
  setProjectId,
  setCampaignId,
  pending,
  providerAvailable,
  status,
  onGenerate,
  onClose,
}: {
  prompt: string;
  setPrompt: (value: string) => void;
  type: ImageType;
  setType: (value: ImageType) => void;
  style: ImageStyle;
  setStyle: (value: ImageStyle) => void;
  brand: ImageStudioSnapshot["brand"];
  projects: ImageStudioSnapshot["projects"];
  campaigns: ImageStudioSnapshot["campaigns"];
  projectId: string;
  campaignId: string;
  setProjectId: (value: string) => void;
  setCampaignId: (value: string) => void;
  pending: boolean;
  providerAvailable: boolean;
  status: string | null;
  onGenerate: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-vds-overlay p-4">
      <section
        className={`${card} my-6 w-full max-w-4xl p-6`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-image"
      >
        <div className="flex justify-between">
          <div>
            <h2 className="text-xl font-semibold" id="create-image">
              Create an image
            </h2>
            <p className="mt-1 text-sm text-vds-muted">
              Describe the outcome in natural language.
            </p>
          </div>
          <Button variant="control" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>
        <textarea
          autoFocus
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={4}
          className="mt-5 w-full rounded-2xl border border-vds-border bg-vds-elevated p-4"
          placeholder="Create luxury hotel hero image"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {examples.map((item) => (
            <Button
              variant="control"
              size="sm"
              onClick={() => setPrompt(item)}
              className="rounded-full"
              key={item}
            >
              {item}
            </Button>
          ))}
        </div>
        <Picker
          label="Image type"
          values={types}
          selected={type}
          onSelect={setType}
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Project
            <select
              className="mt-2 w-full rounded-xl border border-vds-border bg-vds-elevated p-3"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
            >
              {projects.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Campaign
            <select
              className="mt-2 w-full rounded-xl border border-vds-border bg-vds-elevated p-3"
              value={campaignId}
              onChange={(event) => setCampaignId(event.target.value)}
            >
              {campaigns.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Picker
          label="Style"
          values={styles}
          selected={style}
          onSelect={setStyle}
        />
        <div className="mt-5 rounded-2xl border border-vds-border bg-vds-primary-soft p-4">
          <div className="flex items-center gap-2">
            <Palette className="size-4 text-vds-primary" />
            <h3 className="text-sm font-semibold">Brand mode · automatic</h3>
          </div>
          <p className="mt-2 text-xs text-vds-muted">
            {brand
              ? `${brand.name}: colours, typography, tone, logo placement, and spacing will define the request.`
              : "No default Brand Kit is available."}
          </p>
        </div>
        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-xs text-vds-muted">
            {status ??
              (providerAvailable
                ? "Planning → Generating → Reviewing → Completed"
                : "Provider unavailable · requests remain in WaitingProvider")}
          </p>
          <Button
            disabled={pending || !prompt.trim() || !projectId || !campaignId}
            onClick={onGenerate}
          >
            {pending ? "Generating…" : "Create image"}{" "}
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
function Picker<T extends string>({
  label,
  values,
  selected,
  onSelect,
}: {
  label: string;
  values: readonly T[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <fieldset className="mt-5">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <Button
            variant="control"
            size="sm"
            onClick={() => onSelect(value)}
            className={`rounded-full ${selected === value ? "bg-vds-primary-soft text-vds-primary" : ""}`}
            key={value}
          >
            {selected === value && <Check className="size-3" />}
            {value}
          </Button>
        ))}
      </div>
    </fieldset>
  );
}
function Editor({
  asset,
  snapshot,
  onClose,
  pending,
  onOperation,
}: {
  asset: ImageInspector;
  snapshot: ImageStudioSnapshot;
  onClose: () => void;
  pending: boolean;
  onOperation: (operation: ImageStudioSnapshot["aiOperations"][number]) => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-vds-background">
      <header className="flex items-center justify-between border-b border-vds-border bg-vds-surface px-4 py-3">
        <div>
          <p className="font-medium">{asset.name}</p>
          <p className="text-[10px] text-vds-muted">
            Editing architecture · changes are not persisted
          </p>
        </div>
        <Button variant="control" onClick={onClose}>
          <X className="size-4" />
          Close
        </Button>
      </header>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[14rem_minmax(0,1fr)_20rem]">
        <aside className="overflow-y-auto border-r border-vds-border bg-vds-surface p-3">
          <h2 className="px-2 text-xs font-semibold uppercase text-vds-muted">
            Tools
          </h2>
          <div className="mt-3 grid gap-1">
            {snapshot.editTools.map((item) => (
              <Button variant="control" className="justify-start" key={item}>
                {item}
              </Button>
            ))}
          </div>
        </aside>
        <section className="grid min-h-96 place-items-center bg-vds-elevated p-6">
          <div className="grid aspect-[4/3] w-full max-w-3xl place-items-center rounded-2xl border border-vds-border bg-vds-surface shadow-2xl">
            <ImageIcon className="size-20 text-vds-primary" />
            <span className="sr-only">Image editing canvas placeholder</span>
          </div>
        </section>
        <aside className="overflow-y-auto border-l border-vds-border bg-vds-surface p-4">
          <h2 className="text-sm font-semibold">AI edit operations</h2>
          <p className="mt-2 text-xs text-vds-muted">
            Every edit creates a governed image version through Creative
            Runtime.
          </p>
          <div className="mt-4 grid gap-2">
            {snapshot.aiOperations.map((item) => (
              <Button
                variant="control"
                disabled={pending}
                onClick={() => onOperation(item)}
                className="justify-start"
                key={item}
              >
                <Sparkles className="size-3" />
                {item}
              </Button>
            ))}
          </div>
          <div className="mt-6 border-t border-vds-border pt-4">
            <h3 className="text-sm font-medium">Activity</h3>
            <p className="mt-2 flex items-center gap-2 text-xs text-vds-muted">
              <Clock3 className="size-3" />
              No edit history yet
            </p>
            <p className="mt-2 flex items-center gap-2 text-xs text-vds-muted">
              <MessageSquare className="size-3" />
              Comments prepared
            </p>
            <p className="mt-2 flex items-center gap-2 text-xs text-vds-muted">
              <Archive className="size-3" />
              Version lifecycle prepared
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
