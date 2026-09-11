"use client";
import { Button, ButtonLink } from "@/features/platform/design-system";
export default function Error({ reset }: { reset: () => void }) {
  return <section className="rounded-2xl border border-vds-border p-6" aria-labelledby="ai-recovery-title"><h1 id="ai-recovery-title" className="text-xl font-semibold">Your AI team could not be loaded</h1><p role="alert" className="mt-3 text-sm text-vds-muted">Try again, or review your AI connection in Settings. You can continue working with your properties.</p><div className="mt-5 flex flex-wrap gap-3"><Button onClick={reset}>Try again</Button><ButtonLink variant="secondary" href="/vayon/settings/ai/openai">Review AI settings</ButtonLink><ButtonLink variant="secondary" href="/vayon/properties">Return to properties</ButtonLink></div></section>;
}
