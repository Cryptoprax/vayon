"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, CirclePlay, LayoutDashboard, Play, Sparkles, X } from "lucide-react";
import { Button } from "@/features/platform/design-system";

const storageKey = "vayon.welcome.experience.v2";
// Supersedes the timed 2400ms sequence: "Preparing your AI Business Operating System", "Checking workspace", "Preparing AI", "Loading business intelligence", "Workspace ready". The replacement is user-controlled and still honors prefers-reduced-motion.
const tourStops = [
  ["Dashboard", "See the priorities, activity, and business signals that need your attention."],
  ["CRM", "Keep leads, contacts, companies, and deals in one connected workspace."],
  ["Properties", "Manage listings, availability, matching, and property activity."],
  ["AI Employees", "Prepare governed assistance for sales, marketing, and operations."],
  ["Marketing", "Plan campaigns and creative work, then approve what goes live."],
  ["Calendar", "Coordinate meetings, property visits, follow-ups, and team schedules."],
  ["Communications", "Keep customer conversations and follow-up context together."],
  ["Billing", "Manage your plan and payment details from one secure place."],
] as const;

export function PremiumWelcomeExperience({ userName: _userName }: { userName: string }) {
  const [visible, setVisible] = useState(false);
  const [tour, setTour] = useState<number | null>(null);

  useEffect(() => {
    queueMicrotask(() => { if (!hasCompletedWelcome()) setVisible(true); });
  }, []);

  function finish() {
    rememberWelcome();
    setVisible(false);
    setTour(null);
  }

  if (!visible) return null;
  if (tour !== null) {
    const stop = tourStops[tour];
    const complete = tour === tourStops.length;
    return <div className="fixed inset-0 z-[100] grid place-items-center bg-vds-background/90 p-4 backdrop-blur-lg motion-safe:animate-[vds-fade-rise_180ms_ease-out]" role="dialog" aria-modal="true" aria-live="polite" aria-labelledby="product-tour-title">
      <section className="w-full max-w-xl rounded-3xl border border-vds-border bg-vds-elevated p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between gap-4"><p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">Product tour</p><Button variant="control" onClick={finish} aria-label="Skip product tour" className="grid size-9 place-items-center rounded-xl"><X className="size-4" /></Button></div>
        {complete ? <div className="py-8 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-vds-primary-soft text-vds-primary"><Sparkles className="size-6" /></span><h1 id="product-tour-title" className="mt-5 text-2xl font-semibold">You&apos;re ready to start using VAYON.</h1><p className="mt-2 text-sm text-vds-muted">Start with the dashboard and follow the recommendation that matters most.</p></div> : <div className="py-8"><p className="text-sm text-vds-subtle">{tour + 1} of {tourStops.length}</p><h1 id="product-tour-title" className="mt-3 text-3xl font-semibold">{stop[0]}</h1><p className="mt-3 text-sm leading-6 text-vds-muted">{stop[1]}</p></div>}
        <div className="flex items-center justify-between gap-3"><Button variant="ghost" onClick={finish}>Skip tour</Button><div className="flex gap-2">{tour > 0 && <Button variant="secondary" onClick={() => setTour(tour - 1)}><ArrowLeft className="size-4" />Back</Button>}<Button onClick={() => complete ? finish() : setTour(tour + 1)}>{complete ? "Start using VAYON" : "Next"}{!complete && <ArrowRight className="size-4" />}</Button></div></div>
      </section>
    </div>;
  }

  return <div className="fixed inset-0 z-[100] grid place-items-center bg-vds-background/90 p-4 backdrop-blur-lg motion-safe:animate-[vds-fade-rise_180ms_ease-out]" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
    <section className="w-full max-w-2xl rounded-3xl border border-vds-border bg-vds-elevated p-6 text-center shadow-2xl sm:p-10">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-vds-primary-soft text-vds-primary"><Sparkles className="size-6" aria-hidden="true" /></span>
      <h1 id="welcome-title" className="mt-5 text-3xl font-semibold sm:text-4xl">Welcome to VAYON</h1>
      <p className="mt-2 text-sm text-vds-muted">Choose how you would like to begin.</p>
      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <WelcomeLink href="/demo" icon={LayoutDashboard} label="Explore Demo Workspace" onClick={finish} />
        <WelcomeLink href="/onboarding" icon={Building2} label="Create My Workspace" onClick={finish} />
        <Button variant="control" onClick={() => setTour(0)} className="min-h-32 flex-col rounded-2xl border border-vds-border p-4 text-center hover:border-vds-accent-border hover:bg-vds-primary-soft"><CirclePlay className="size-6 text-vds-primary" /><span>Watch 2-Minute Product Tour</span></Button>
      </div>
    </section>
  </div>;
}

function WelcomeLink({ href, icon: Icon, label, onClick }: { href: string; icon: typeof Play; label: string; onClick: () => void }) {
  return <Link href={href} onClick={onClick} className="focus-ring flex min-h-32 flex-col items-center justify-center gap-3 rounded-2xl border border-vds-border p-4 text-sm font-medium hover:border-vds-accent-border hover:bg-vds-primary-soft"><Icon className="size-6 text-vds-primary" aria-hidden="true" />{label}</Link>;
}

function hasCompletedWelcome() { try { return Boolean(window.localStorage.getItem(storageKey)); } catch { return false; } }
function rememberWelcome() { try { window.localStorage.setItem(storageKey, "complete"); } catch { /* Storage can be unavailable in private browsing. */ } }
