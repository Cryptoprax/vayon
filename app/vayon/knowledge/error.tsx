"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/features/platform/design-system";

export default function KnowledgeError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("knowledge.route.unexpected", { digest: error.digest ?? "unavailable" }); }, [error]);
  return <main className="mx-auto max-w-4xl px-4 py-10"><section role="alert" className="rounded-3xl border border-vds-danger bg-vds-surface p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-danger">Knowledge recovery</p><h1 className="mt-3 text-2xl font-semibold">Knowledge temporarily unavailable.</h1><p className="mt-3 text-sm text-vds-muted">Navigation remains available. Retry the request or use the support resources below.</p><div className="mt-6 flex flex-wrap gap-3"><Button type="button" onClick={reset}>Retry</Button><Link href="/docs" className="vds-focus rounded-xl border border-vds-border px-4 py-2.5 text-sm font-semibold">Documentation</Link><Link href="/contact" className="vds-focus rounded-xl border border-vds-border px-4 py-2.5 text-sm font-semibold">Support</Link><Link href="/vayon/intelligence" className="vds-focus rounded-xl border border-vds-border px-4 py-2.5 text-sm font-semibold">AI Assistant</Link></div></section></main>;
}
