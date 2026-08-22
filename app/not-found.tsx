import Link from "next/link";
import { ButtonLink } from "@/features/platform/design-system";

export default function NotFound() {
  return <main className="mx-auto grid min-h-[70vh] max-w-3xl place-content-center px-5 py-24 text-center">
    <p className="text-xs font-semibold uppercase tracking-[.22em] text-vds-primary">404 · Page not found</p>
    <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">This page is not available.</h1>
    <p className="mx-auto mt-5 max-w-xl text-vds-muted">The address may have changed, or the page may no longer exist. Return home or use the documentation to continue.</p>
    <div className="mt-8 flex flex-wrap justify-center gap-3"><ButtonLink href="/">Return home</ButtonLink><Link className="vds-focus rounded-xl border border-vds-border px-4 py-2.5 text-sm" href="/docs">Open documentation</Link></div>
  </main>;
}
