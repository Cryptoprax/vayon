"use client";
import { useEffect, useState } from "react";
import { BrandIcon } from "@/components/brand";
import { Button, ButtonLink } from "@/features/platform/design-system";
import { LifeBuoy, RefreshCw } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [recovering, setRecovering] = useState(true);
  useEffect(() => {
    const key = "vayon:onboarding:auto-recovery";
    if (sessionStorage.getItem(key)) {
      const timeout = window.setTimeout(() => setRecovering(false), 0);
      return () => window.clearTimeout(timeout);
    }
    sessionStorage.setItem(key, "attempted");
    const timeout = window.setTimeout(reset, 900);
    return () => window.clearTimeout(timeout);
  }, [error, reset]);

  return <main className="grid min-h-dvh place-items-center bg-vds-background px-5"><section role={recovering ? "status" : "alert"} aria-live="polite" aria-busy={recovering} className="w-full max-w-lg rounded-3xl border border-vds-border bg-vds-surface p-8 text-center"><BrandIcon size="md" className="mx-auto"/><RefreshCw className={`mx-auto mt-5 text-vds-primary ${recovering ? "motion-safe:animate-spin" : ""}`} aria-hidden="true"/><h1 className="mt-4 text-xl font-semibold">{recovering ? "We’re preparing your workspace…" : "We couldn’t finish preparing your workspace"}</h1><p className="mt-2 text-sm leading-6 text-vds-muted">{recovering ? "We found an incomplete setup and are safely restoring the required workspace records." : "Your data is safe. Try the recovery again, or contact Support if it continues."}</p>{process.env.NODE_ENV === "development" && <details className="mt-5 rounded-xl border border-vds-border p-3 text-left text-xs"><summary className="cursor-pointer font-semibold">Developer diagnostics</summary><pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap">{error.message}{error.stack ? `\n${error.stack}` : ""}</pre></details>}{!recovering && <div className="mt-6 flex flex-wrap justify-center gap-2"><Button onClick={() => { sessionStorage.removeItem("vayon:onboarding:auto-recovery"); setRecovering(true); reset(); }}><RefreshCw size={16} aria-hidden="true"/>Retry recovery</Button><ButtonLink variant="ghost" href="/contact?intent=support"><LifeBuoy size={16} aria-hidden="true"/>Contact Support</ButtonLink></div>}</section></main>;
}
