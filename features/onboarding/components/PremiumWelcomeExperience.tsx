"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/features/platform/design-system";

const storageKey = "vayon.welcome.experience.v1";
const messages = [
  "Preparing your AI Business Operating System…",
  "Checking workspace…",
  "Preparing AI…",
  "Loading business intelligence…",
  "Workspace ready.",
] as const;

export function PremiumWelcomeExperience({ userName }: { userName: string }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState(0);

  useEffect(() => {
    let active = true;
    let interval: ReturnType<typeof setInterval> | undefined;
    let completion: ReturnType<typeof setTimeout> | undefined;
    queueMicrotask(() => {
      if (!active || hasCompletedWelcome()) return;
      setVisible(true);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        setMessage(messages.length - 1);
        completion = setTimeout(() => finish(), 350);
        return;
      }
      interval = setInterval(
        () => setMessage((current) => Math.min(messages.length - 1, current + 1)),
        420,
      );
      completion = setTimeout(() => finish(), 2400);
    });
    function finish() {
      rememberWelcome();
      setVisible(false);
      if (interval) clearInterval(interval);
    }
    return () => {
      active = false;
      if (interval) clearInterval(interval);
      if (completion) clearTimeout(completion);
    };
  }, []);

  function skip() {
    rememberWelcome();
    setVisible(false);
  }

  if (!visible) return null;
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-vds-background/95 p-6 backdrop-blur-xl motion-safe:animate-[vds-fade-rise_240ms_ease-out]"
      role="status"
      aria-live="polite"
      aria-label="Preparing your VAYON workspace"
    >
      <div className="w-full max-w-xl text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-3xl border border-vds-accent-border bg-vds-primary-soft text-vds-primary shadow-vds-lg">
          <Sparkles className="size-7 motion-safe:animate-pulse" aria-hidden="true" />
        </span>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[.24em] text-vds-primary">
          Welcome {userName}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          Welcome to VAYON
        </h1>
        <p className="mt-5 min-h-6 text-sm text-vds-muted">{messages[message]}</p>
        <div className="mx-auto mt-6 h-1 w-56 overflow-hidden rounded-full bg-vds-elevated">
          <div
            className="h-full rounded-full bg-vds-primary transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${((message + 1) / messages.length) * 100}%` }}
          />
        </div>
        <Button className="mt-8" onClick={skip} variant="ghost">
          Skip
        </Button>
      </div>
    </div>
  );
}

function hasCompletedWelcome() {
  try {
    return Boolean(window.localStorage.getItem(storageKey));
  } catch {
    return false;
  }
}

function rememberWelcome() {
  try {
    window.localStorage.setItem(storageKey, "complete");
  } catch {
    // Private browsing policies may disable persistent browser storage.
  }
}
