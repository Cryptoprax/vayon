"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Clapperboard,
  Clock3,
  Film,
  History,
  Plus,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/features/platform/design-system";
import { generateVideo } from "./actions";
import {
  videoOutputs,
  type VideoOutput,
  type VideoStudioSnapshot,
  type VideoWizardInput,
} from "./types";
const card =
    "rounded-3xl border border-vds-border bg-vds-surface/80 shadow-xl shadow-vds-shadow/10 backdrop-blur-xl",
  field =
    "w-full rounded-xl border border-vds-border bg-vds-elevated px-3 py-2 text-sm";
const initial: VideoWizardInput = {
  prompt: "",
  company: "",
  industry: "",
  audience: "",
  language: "English",
  brandId: null,
  campaignId: null,
  projectId: null,
  duration: 30,
  aspectRatio: "Landscape",
  platform: "Website",
  tone: "Professional",
  musicStyle: "Modern corporate",
  voiceStyle: "Professional",
  callToAction: "",
  output: "30 Second Advertisement",
};
export function VideoStudio({
  snapshot,
}: {
  readonly snapshot: VideoStudioSnapshot;
}) {
  const [open, setOpen] = useState(false),
    [form, setForm] = useState(initial),
    [status, setStatus] = useState<string | null>(null),
    [pending, startTransition] = useTransition(),
    update = <K extends keyof VideoWizardInput>(
      key: K,
      value: VideoWizardInput[K],
    ) => setForm((current) => ({ ...current, [key]: value })),
    submit = () =>
      startTransition(async () => {
        const result = await generateVideo(form);
        setStatus(
          result.status === "WaitingProvider"
            ? `WaitingProvider · ${snapshot.providerReason}`
            : `${result.status} · ${result.provider ?? "Unavailable"}${result.latencyMs === null ? "" : ` · ${result.latencyMs} ms`}`,
        );
        if (result.assetId) setOpen(false);
      });
  return (
    <main className="mx-auto w-full max-w-[120rem] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className={`${card} relative overflow-hidden p-6 sm:p-8`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,var(--vds-color-primary-soft),transparent_40%)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <Link
              href="/vayon/creative"
              className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary"
            >
              Creative Cloud
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">
              AI Video Studio
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-vds-muted">
              Create governed scripts, storyboards, private video drafts, and
              approval-ready assets.
            </p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Create video
          </Button>
        </div>
      </header>
      {status && (
        <div
          role="status"
          className={`${card} flex items-center gap-3 p-4 text-sm`}
        >
          <Clock3 className="size-5 text-vds-warning" />
          {status}
        </div>
      )}
      <section className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <article className={`${card} p-5`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-vds-muted">
                Asset Library
              </p>
              <h2 className="mt-1 text-xl font-semibold">Video projects</h2>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs ${snapshot.providerState === "available" ? "bg-vds-success-soft text-vds-success" : "bg-vds-warning-soft text-vds-warning"}`}
            >
              {snapshot.providerState}
            </span>
          </div>
          {snapshot.videos.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {snapshot.videos.map((video) => (
                <article
                  className="rounded-2xl bg-vds-elevated p-4"
                  key={video.id}
                >
                  <div className="grid aspect-video place-items-center rounded-xl bg-vds-surface">
                    <Film className="size-8 text-vds-primary" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold">{video.name}</h3>
                  <p className="mt-1 text-xs text-vds-muted">
                    Version {video.version}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-vds-border p-10 text-center">
              <Film className="mx-auto size-8 text-vds-primary" />
              <h3 className="mt-3 font-semibold">No generated videos</h3>
              <p className="mt-2 text-sm text-vds-muted">
                Videos appear only after a live provider completes and the
                private asset is stored.
              </p>
            </div>
          )}
        </article>
        <aside className={`${card} p-5`}>
          <h2 className="font-semibold">Creative Director pipeline</h2>
          <ol className="mt-4 space-y-2">
            {snapshot.pipeline.map((item, index) => (
              <li
                className="flex items-center gap-3 rounded-xl bg-vds-elevated p-3 text-sm"
                key={item}
              >
                <span className="grid size-7 place-items-center rounded-full bg-vds-primary-soft text-xs text-vds-primary">
                  {index + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </aside>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <Info
          icon={Clapperboard}
          title="Production outputs"
          text="Storyboard, scene plan, voiceover, subtitles, CTA, and thumbnail direction."
        />
        <Info
          icon={Sparkles}
          title="Editing"
          text={snapshot.edits.join(" · ")}
        />
        <Info
          icon={History}
          title="Exports & versions"
          text={snapshot.exports.join(" · ")}
        />
      </section>
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-vds-overlay p-4"
          role="dialog"
          aria-modal="true"
        >
          <section className={`${card} my-6 w-full max-w-4xl p-6`}>
            <div className="flex justify-between">
              <h2 className="text-xl font-semibold">Create a governed video</h2>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
            <label className="mt-5 block text-sm font-medium">
              Creative brief
              <textarea
                autoFocus
                className={`${field} mt-2 min-h-28`}
                value={form.prompt}
                onChange={(e) => update("prompt", e.target.value)}
                placeholder="Create a 30 second advertisement for a solar company."
              />
            </label>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input
                label="Company"
                value={form.company}
                onChange={(v) => update("company", v)}
              />
              <Input
                label="Industry"
                value={form.industry}
                onChange={(v) => update("industry", v)}
              />
              <Input
                label="Audience"
                value={form.audience}
                onChange={(v) => update("audience", v)}
              />
              <Input
                label="Language"
                value={form.language}
                onChange={(v) => update("language", v)}
              />
              <Select
                label="Output"
                value={form.output}
                values={videoOutputs}
                onChange={(v) => update("output", v as VideoOutput)}
              />
              <Select
                label="Duration"
                value={String(form.duration)}
                values={["15", "30", "60"]}
                onChange={(v) => update("duration", Number(v) as 15 | 30 | 60)}
              />
              <Select
                label="Aspect ratio"
                value={form.aspectRatio}
                values={["Landscape", "Portrait", "Square"]}
                onChange={(v) =>
                  update("aspectRatio", v as VideoWizardInput["aspectRatio"])
                }
              />
              <Input
                label="Platform"
                value={form.platform}
                onChange={(v) => update("platform", v)}
              />
              <Input
                label="Tone"
                value={form.tone}
                onChange={(v) => update("tone", v)}
              />
              <Input
                label="Music style"
                value={form.musicStyle}
                onChange={(v) => update("musicStyle", v)}
              />
              <Input
                label="Voice style"
                value={form.voiceStyle}
                onChange={(v) => update("voiceStyle", v)}
              />
              <Input
                label="Call to action"
                value={form.callToAction}
                onChange={(v) => update("callToAction", v)}
              />
              <Select
                label="Brand"
                value={form.brandId ?? ""}
                values={snapshot.brand ? [snapshot.brand.id] : []}
                labels={
                  snapshot.brand
                    ? { [snapshot.brand.id]: snapshot.brand.name }
                    : {}
                }
                onChange={(v) => update("brandId", v || null)}
              />
              <Select
                label="Project"
                value={form.projectId ?? ""}
                values={snapshot.projects.map((x) => x.id)}
                labels={Object.fromEntries(
                  snapshot.projects.map((x) => [x.id, x.name]),
                )}
                onChange={(v) => update("projectId", v || null)}
              />
              <Select
                label="Campaign"
                value={form.campaignId ?? ""}
                values={snapshot.campaigns.map((x) => x.id)}
                labels={Object.fromEntries(
                  snapshot.campaigns.map((x) => [x.id, x.name]),
                )}
                onChange={(v) => update("campaignId", v || null)}
              />
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-vds-muted">
                Planning → Storyboarding → Rendering → Reviewing → Completed
              </p>
              <Button
                disabled={
                  pending ||
                  !form.prompt.trim() ||
                  !form.projectId ||
                  !form.campaignId
                }
                onClick={submit}
              >
                {pending ? (
                  <>
                    <RefreshCcw className="size-4 animate-spin" />
                    Rendering…
                  </>
                ) : (
                  "Create video"
                )}
              </Button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input
        className={`${field} mt-2`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function Select({
  label,
  value,
  values,
  labels = {},
  onChange,
}: {
  label: string;
  value: string;
  values: readonly string[];
  labels?: Readonly<Record<string, string>>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <select
        className={`${field} mt-2`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Not selected</option>
        {values.map((item) => (
          <option value={item} key={item}>
            {labels[item] ?? item}
          </option>
        ))}
      </select>
    </label>
  );
}
function Info({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Film;
  title: string;
  text: string;
}) {
  return (
    <article className={`${card} p-5`}>
      <Icon className="size-5 text-vds-primary" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-vds-muted">{text}</p>
    </article>
  );
}
