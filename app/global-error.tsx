"use client";
import { useEffect } from "react";
import { Button } from "@/features/platform/design-system";
import "./globals.css";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(JSON.stringify({ level: "error", event: "ui.global_error", diagnostic: error.digest ?? "unavailable" })); }, [error]);
  return <html lang="en"><body className="min-h-screen bg-vds-background text-vds-foreground"><main className="mx-auto grid min-h-screen max-w-3xl place-content-center px-5 text-center" role="alert"><p className="text-xs font-semibold uppercase tracking-[.22em] text-vds-danger">Recovery required</p><h1 className="mt-4 text-4xl font-semibold">Vayon could not load this view.</h1><p className="mt-4 text-vds-muted">Your data remains safe. Retry the request, or return later if the provider is temporarily unavailable.</p><div className="mt-8"><Button onClick={reset}>Retry</Button></div></main></body></html>;
}
