"use client";
import { BrandIcon } from "@/components/brand";
import { Button, ButtonLink } from "@/features/platform/design-system";
import { AlertTriangle, LifeBuoy, RefreshCw } from "lucide-react";

export function RouteSkeleton({ label = "Loading workspace" }: { label?: string }) {
  return <main className="mx-auto max-w-[96rem] px-5 py-8" role="status" aria-live="polite" aria-busy="true"><span className="sr-only">{label}</span><BrandIcon size="sm" className="mb-5 opacity-70"/><div className="skeleton h-3 w-28 rounded"/><div className="skeleton mt-4 h-9 w-64 max-w-full rounded-lg"/><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({length:4},(_,i)=><div key={i} className="skeleton h-28 rounded-2xl"/>)}</div><div className="skeleton mt-6 h-80 rounded-3xl"/></main>;
}

export function RouteError({ reset, title = "This workspace view could not load" }: { reset: () => void; title?: string }) {
  return <main className="grid min-h-[60vh] place-items-center px-5"><section role="alert" className="max-w-lg rounded-3xl border border-vds-danger bg-vds-danger/[.04] p-8 text-center"><BrandIcon size="md" className="mx-auto"/><AlertTriangle className="mx-auto mt-4 text-vds-danger" aria-hidden="true"/><h1 className="mt-4 text-xl font-semibold">{title}</h1><p className="mt-2 text-sm leading-6 text-vds-muted">The requested information is temporarily unavailable. Your data is safe and existing records have not been changed.</p><p className="mt-2 text-sm leading-6 text-vds-muted">Try loading this view again. If the problem continues, return to the dashboard or contact Support.</p><div className="mt-6 flex flex-wrap justify-center gap-2"><Button onClick={reset}><RefreshCw size={16} aria-hidden="true"/>Try again</Button><ButtonLink variant="secondary" href="/vayon/dashboard">Dashboard</ButtonLink><ButtonLink variant="ghost" href="/help"><LifeBuoy size={16} aria-hidden="true"/>Support</ButtonLink></div></section></main>;
}
