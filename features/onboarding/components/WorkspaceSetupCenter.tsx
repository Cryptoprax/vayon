"use client";

import Link from "next/link";
import { Check, Circle, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/features/platform/design-system";

type Session = {
  completed_steps: number[];
  configuration: Record<string, unknown>;
  completed_at: string | null;
} | null;

const setupItems = [
  ["Company created", "company", 2, "/onboarding/organization", "20 seconds"],
  ["Connect Gmail", "gmail", 5, "/onboarding/gmail", "30 seconds"],
  ["Connect Google Calendar", "calendar", 6, "/onboarding/calendar", "30 seconds"],
  ["Connect WhatsApp", "whatsapp", 7, "/onboarding/whatsapp", "1 minute"],
  ["Configure AI Workforce", "ai", 8, "/onboarding/ai-workforce", "45 seconds"],
  ["Import CRM", "crm", 9, "/onboarding/crm", "2 minutes"],
  ["Import Properties", "properties", 10, "/onboarding/properties", "2 minutes"],
  ["Choose Subscription", "subscription", 14, "/onboarding/subscription", "1 minute"],
  ["Configure Notifications", "notifications", 12, "/onboarding/notifications", "30 seconds"],
  ["Configure Email", "email", 13, "/onboarding/email", "1 minute"],
  ["Launch Workspace", "launch", 15, "/onboarding/launch", "20 seconds"],
] as const;
const healthCategories = [
  ["Brand", [2, 3]],
  ["CRM", [9]],
  ["Email", [5, 13]],
  ["Calendar", [6]],
  ["Marketing", [11]],
  ["AI Workforce", [8]],
  ["Automation", [11]],
  ["Security", [2]],
  ["Billing", [14]],
  ["Knowledge", [15]],
] as const;

export function WorkspaceSetupCenter({
  session,
  provisioned,
  userName,
}: {
  session: Session;
  provisioned: boolean;
  userName: string;
}) {
  const completed = new Set(session?.completed_steps ?? []);
  const isDone = (key: string, step: number) =>
    (key === "company" && provisioned) ||
    Boolean(session?.completed_at) ||
    completed.has(step);
  const completedCount = setupItems.filter(([, key, step]) =>
    isDone(key, step),
  ).length;
  const health = Math.round((completedCount / setupItems.length) * 100);
  const recommendation = setupItems.find(([, key, step]) => !isDone(key, step));

  return (
    <section className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
      <article className="rounded-3xl border border-vds-border bg-vds-surface p-6 shadow-vds-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">
              Setup progress
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Workspace Setup</h2>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold">{health}%</p>
            <p className="text-xs text-vds-muted">
              {health >= 85 ? "Excellent" : health >= 50 ? "On track" : "Getting started"}
            </p>
          </div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-vds-elevated">
          <div
            className="h-full rounded-full bg-vds-primary transition-[width]"
            style={{ width: `${health}%` }}
          />
        </div>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {setupItems.map(([label, key, step, href]) => {
            const done = isDone(key, step);
            return (
              <Link
                className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm transition hover:border-vds-border hover:bg-vds-elevated"
                href={href}
                key={key}
              >
                {done ? (
                  <span className="grid size-6 place-items-center rounded-full bg-vds-primary text-vds-on-accent">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                ) : (
                  <Circle className="size-6 text-vds-subtle" aria-hidden="true" />
                )}
                <span className={done ? "text-vds-muted" : "font-medium"}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
        <div className="mt-6 border-t border-vds-border pt-5">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-vds-subtle">
            Workspace health
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {healthCategories.map(([label, steps]) => {
              const count = steps.filter((step) => completed.has(step)).length;
              const status =
                (label === "Security" && provisioned) || count === steps.length
                  ? "Complete"
                  : count
                    ? "Partial"
                    : "Not Configured";
              return (
                <div
                  className="rounded-xl border border-vds-border bg-vds-input p-3 transition hover:border-vds-border-strong"
                  key={label}
                >
                  <p className="text-xs font-medium">{label}</p>
                  <p
                    className={`mt-2 text-[10px] uppercase tracking-wide ${status === "Complete" ? "text-vds-success" : status === "Partial" ? "text-vds-warning" : "text-vds-subtle"}`}
                  >
                    {status}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </article>
      <AiConcierge
        recommendation={recommendation}
        health={health}
        userName={userName}
      />
    </section>
  );
}

function AiConcierge({
  recommendation,
  health,
  userName,
}: {
  recommendation: (typeof setupItems)[number] | undefined;
  health: number;
  userName: string;
}) {
  const [later, setLater] = useState(false);
  if (later) return null;
  return (
    <aside className="relative rounded-3xl border border-vds-accent-border bg-gradient-to-br from-vds-primary-soft to-vds-surface p-6">
      <Button
        aria-label="Dismiss recommendation"
        className="absolute right-3 top-3 size-9 rounded-full"
        onClick={() => setLater(true)}
        variant="control"
      >
        <X className="size-4" />
      </Button>
      <span className="grid size-11 place-items-center rounded-2xl bg-vds-primary text-vds-on-accent">
        <Sparkles className="size-5" aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-xl font-semibold">Welcome {userName}.</h2>
      <p className="mt-2 text-sm text-vds-muted">
        {recommendation
          ? "I've already prepared your workspace. Your workspace is almost ready."
          : "Your workspace setup is complete."}
      </p>
      {recommendation && (
        <>
          <p className="mt-6 text-xs uppercase tracking-[.16em] text-vds-subtle">
            Recommended next action
          </p>
          <p className="mt-2 font-medium">{recommendation[0]}</p>
          <p className="mt-2 text-xs text-vds-muted">
            Estimated time: {recommendation[4]}
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              className="rounded-xl bg-vds-primary px-4 py-2 text-sm font-medium text-vds-on-accent"
              href={recommendation[3]}
            >
              Configure
            </Link>
            <Button onClick={() => setLater(true)} variant="ghost">
              Later
            </Button>
          </div>
        </>
      )}
      {!recommendation && (
        <p className="mt-6 text-sm text-vds-muted">Workspace health: {health}%</p>
      )}
    </aside>
  );
}
