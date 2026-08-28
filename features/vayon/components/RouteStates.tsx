"use client";
import { BrandIcon } from "@/components/brand";
import { Button, ButtonLink } from "@/features/platform/design-system";
import { AlertTriangle, ArrowLeft, LifeBuoy, RefreshCw } from "lucide-react";

export function RouteSkeleton({ label = "Loading your workspace…" }: { label?: string }) {
  return <main className="mx-auto max-w-[96rem] px-5 py-8" role="status" aria-live="polite" aria-busy="true"><BrandIcon size="sm" className="mb-5 opacity-70"/><p className="text-sm text-vds-muted">{label}</p><div className="skeleton mt-4 h-9 w-64 max-w-full rounded-lg"/><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({length:4},(_,i)=><div key={i} className="skeleton h-28 rounded-2xl"/>)}</div><div className="skeleton mt-6 h-80 rounded-3xl"/></main>;
}

export function RouteError({ reset, title = "This workspace view could not load" }: { reset: () => void; title?: string }) {
  return <main className="grid min-h-[60vh] place-items-center px-5"><section role="alert" className="max-w-lg rounded-3xl border border-vds-danger bg-vds-danger/[.04] p-8 text-center"><BrandIcon size="md" className="mx-auto"/><AlertTriangle className="mx-auto mt-4 text-vds-danger" aria-hidden="true"/><h1 className="mt-4 text-xl font-semibold">{title}</h1><p className="mt-2 text-sm leading-6 text-vds-muted">The requested information is temporarily unavailable. Your data is safe and existing records have not been changed.</p><p className="mt-2 text-sm leading-6 text-vds-muted">Try again. If the problem continues, go back or contact Support.</p><span className="sr-only">You can also return to the Dashboard.</span><div className="mt-6 flex flex-wrap justify-center gap-2"><Button onClick={reset}><RefreshCw size={16} aria-hidden="true"/>Retry</Button><Button variant="secondary" onClick={() => window.history.back()}><ArrowLeft size={16} aria-hidden="true"/>Go Back</Button><ButtonLink variant="ghost" href="/contact?intent=support"><LifeBuoy size={16} aria-hidden="true"/>Contact Support</ButtonLink></div></section></main>;
}
