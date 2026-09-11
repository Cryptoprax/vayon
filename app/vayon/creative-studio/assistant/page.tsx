import Link from "next/link";
import { notFound } from "next/navigation";
import { CreativeAssistant } from "@/features/vayon/creative-studio/components/CreativeAssistant";
import { StudioShell } from "@/features/vayon/creative-studio/components/StudioViews";
import { CreativeGenerationService } from "@/features/vayon/creative-studio/generation.service";
import { CreativeStudioService } from "@/features/vayon/creative-studio/service";

const diagnosticMessages: Readonly<Record<string, string>> = {
  authentication_failed: "AI provider authentication is unavailable.",
  billing_required: "AI generation requires provider billing.",
  insufficient_quota: "AI generation quota is currently exhausted.",
  model_unavailable: "The configured AI image model is unavailable.",
  network_error: "The AI provider could not be reached.",
  timeout: "The AI provider timed out.",
  provider_exception: "The AI provider returned an unexpected error.",
};

function diagnosticMessage(value?: string) {
  return value ? diagnosticMessages[value] ?? "AI generation is temporarily unavailable." : "";
}

export default async function Page() {
  const studio = await CreativeStudioService.production();
  if (!studio) notFound();
  const [{ inventory }, jobs] = await Promise.all([
    studio.projectContext(),
    new CreativeGenerationService().jobs(),
  ]);
  const providerUnavailable = jobs.some((job) => job.status === "failed");
  return (
    <StudioShell
      title="AI Creative Assistant"
      description="Describe the real estate campaign you need. The assistant resolves project context and queues a real, privately stored marketing image for human review."
    >
      {providerUnavailable && (
        <aside className="mb-5 rounded-2xl border border-vds-warning/30 bg-vds-warning-soft p-4 text-sm" role="status">
          <p className="font-medium">AI generation is temporarily unavailable</p>
          <p className="mt-1 text-vds-muted">Existing drafts remain editable. Continue with templates, Brand Kit, Asset Library, and the editor while the provider recovers.</p>
        </aside>
      )}
      <CreativeAssistant projects={inventory.projects} />
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Generation jobs</h2>
          <Link href="/vayon/creative/assets" className="text-sm text-vds-primary">Asset library</Link>
        </div>
        <div className="mt-3 space-y-3">
          {jobs.map((job) => (
            <article className="rounded-2xl border border-vds-border bg-vds-surface p-4" key={job.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="font-medium">{job.format} · {job.layoutStyle}</p><p className="mt-1 line-clamp-1 text-xs text-vds-muted">{job.prompt}</p></div>
                <span className="text-xs font-medium uppercase text-vds-primary">{job.status}</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-vds-elevated"><div className="h-full rounded-full bg-vds-primary transition-all" style={{ width: `${job.progress}%` }} /></div>
              <p className="mt-2 text-xs text-vds-muted">Attempt {job.attempts}/{job.maxAttempts}{job.diagnostic ? ` · ${diagnosticMessage(job.diagnostic)}` : ""}{job.assetId && <> · <Link className="text-vds-primary" href={`/vayon/creative-studio/editor/${job.assetId}`}>Open editor</Link></>}</p>
            </article>
          ))}
          {!jobs.length && <p className="rounded-2xl border border-dashed border-vds-border p-10 text-center text-sm text-vds-muted">No generation jobs yet.</p>}
        </div>
      </section>
    </StudioShell>
  );
}
