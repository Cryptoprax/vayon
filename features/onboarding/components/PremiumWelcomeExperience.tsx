"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/features/platform/design-system";

const milestones = ["Hiring Sales Manager", "Hiring Marketing Director", "Hiring Property Advisor", "Hiring Operations Manager", "Hiring Customer Success Manager", "Preparing Workspace", "Training AI Team", "Connecting Intelligence", "Ready"] as const;

export function PremiumWelcomeExperience({ userName, workspaceName }: { userName: string; workspaceName: string }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const storageKey = `vayon.ai-company-welcome.v1:${workspaceName}`;

  useEffect(() => {
    queueMicrotask(() => { if (!hasCompletedWelcome(storageKey)) setVisible(true); });
  }, [storageKey]);

  useEffect(() => {
    if (!visible) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { queueMicrotask(() => setProgress(milestones.length)); return; }
    const timer = window.setInterval(() => setProgress((value) => {
      if (value >= milestones.length) { window.clearInterval(timer); return value; }
      return value + 1;
    }), 650);
    return () => window.clearInterval(timer);
  }, [visible]);

  function finish() {
    rememberWelcome(storageKey);
    setVisible(false);
  }

  if (!visible) return null;
  const ready = progress >= milestones.length;
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-vds-background/95 p-4 backdrop-blur-2xl motion-safe:animate-[vds-fade-rise_300ms_ease-out]" role="dialog" aria-modal="true" aria-live="polite" aria-labelledby="welcome-title">
    <section className="w-full max-w-xl rounded-[2rem] border border-vds-border bg-vds-elevated/90 p-6 shadow-2xl sm:p-10">
      <div className="flex items-start justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[.22em] text-vds-primary">Welcome to VAYON, {userName}</p><h1 id="welcome-title" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{ready ? "Meet Your AI Team." : "Building Your AI Real Estate Company..."}</h1></div><Button variant="ghost" onClick={finish}>Skip</Button></div>
      <div className="mt-8 grid gap-2" aria-label="AI team preparation progress">{milestones.map((label, index) => <div className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-opacity motion-reduce:transition-none ${index < progress ? "opacity-100" : "opacity-30"}`} key={label}><span className="grid size-6 place-items-center rounded-full bg-vds-primary-soft text-vds-primary">{index < progress ? <Check className="size-4" aria-hidden="true"/> : <Sparkles className="size-3" aria-hidden="true"/>}</span>{label}</div>)}</div>
      <div className="mt-8 h-1 overflow-hidden rounded-full bg-vds-input"><div className="h-full rounded-full bg-vds-primary transition-[width] duration-500 motion-reduce:transition-none" style={{width:`${Math.round(progress / milestones.length * 100)}%`}}/></div>
      {ready && <Button className="mt-6 w-full" onClick={finish}>Meet Your AI Team</Button>}
    </section>
  </div>;
}

function hasCompletedWelcome(key: string) { try { return Boolean(window.localStorage.getItem(key)); } catch { return false; } }
function rememberWelcome(key: string) { try { window.localStorage.setItem(key, "complete"); } catch { /* Storage can be unavailable in private browsing. */ } }
