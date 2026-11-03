"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  Bot,
  CheckCircle2,
  Megaphone,
  MessagesSquare,
  Pause,
  Play,
  Settings2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { Button } from "@/features/platform/design-system";
import styles from "./homepage-motion.module.css";

// Every number, notification and activity in this component is illustrative demo data for the homepage
// preview. None of it describes a real customer, a real workspace or real activity.
type Metric = readonly [label: string, value: number, suffix?: string];
type CommandView = {
  readonly label: string;
  readonly icon: LucideIcon;
  readonly metrics: readonly [Metric, Metric, Metric];
  readonly bars: readonly number[];
  readonly focus: readonly [string, string, string];
};

export const commandCenterViews: readonly CommandView[] = [
  {
    label: "AI Employees",
    icon: Bot,
    metrics: [["AI employees active", 6], ["Tasks prepared today", 128], ["Waiting for approval", 9]],
    bars: [42, 55, 48, 63, 58, 71, 66, 79, 74, 86, 82, 92],
    focus: ["Follow-up drafts for qualified leads", "Campaign brief for next week", "Weekly business summary"],
  },
  {
    label: "Sales Pipeline",
    icon: TrendingUp,
    metrics: [["Open opportunities", 64], ["Qualified this week", 23], ["Follow-ups due", 17]],
    bars: [36, 44, 52, 49, 61, 58, 67, 72, 69, 81, 88, 94],
    focus: ["Proposal ready for review", "Meeting requested by a new lead", "Stalled opportunity flagged"],
  },
  {
    label: "Customer Engagement",
    icon: MessagesSquare,
    metrics: [["Conversations today", 142], ["Replies drafted", 58], ["Awaiting a response", 11]],
    bars: [58, 64, 61, 70, 66, 74, 69, 77, 73, 80, 84, 88],
    focus: ["Reply drafted for a pricing question", "Conversation summary prepared", "Appointment confirmation ready"],
  },
  {
    label: "Marketing Automation",
    icon: Megaphone,
    metrics: [["Active campaigns", 5], ["Content drafts ready", 8], ["New leads this week", 37]],
    bars: [28, 39, 47, 44, 56, 63, 59, 68, 75, 71, 83, 90],
    focus: ["Three headline options to compare", "Audience suggestion for review", "Email draft for a product update"],
  },
  {
    label: "Business Operations",
    icon: Settings2,
    metrics: [["Open tasks", 38], ["Approvals pending", 6], ["Meetings today", 9]],
    bars: [52, 47, 58, 54, 62, 57, 66, 61, 70, 68, 74, 79],
    focus: ["Agenda shared for today's meeting", "Overdue task reassigned for approval", "Document checklist completed"],
  },
  {
    label: "Analytics",
    icon: BarChart3,
    metrics: [["Business health score", 91], ["Weekly progress", 18, "%"], ["Risks flagged", 2]],
    bars: [44, 49, 53, 58, 55, 63, 68, 66, 74, 79, 85, 91],
    focus: ["Pipeline stage slowing this week", "Response times improving", "Marketing spend summary ready"],
  },
];

const activity = [
  ["Sales AI", "Drafted a follow-up for a qualified enquiry", "Awaiting your approval"],
  ["Marketing AI", "Prepared three campaign headline options", "Ready for review"],
  ["Customer AI", "Summarised today's customer conversations", "Prepared"],
  ["Operations AI", "Proposed a meeting time and shared the agenda", "Approved by your team"],
  ["Analytics AI", "Flagged a slowing pipeline stage", "For your review"],
  ["Sales AI", "Logged notes from a customer meeting", "Prepared"],
] as const;

const ROTATE_MS = 5200, FEED_MS = 3400, PULSE_MS = 2400, FEED_SIZE = 4;

const subscribeVisibility = (onChange: () => void) => {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
};
// Loops stop while the browser tab is hidden.
const usePageVisible = () => useSyncExternalStore(subscribeVisibility, () => document.visibilityState === "visible", () => true);

function useLoop(active: boolean, ms: number, step: () => void) {
  const latest = useRef(step);
  useEffect(() => { latest.current = step; });
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => latest.current(), ms);
    return () => window.clearInterval(timer);
  }, [active, ms]);
}

function CountUp({ value, suffix = "", animate }: { readonly value: number; readonly suffix?: string; readonly animate: boolean }) {
  const [shown, setShown] = useState(value),
    current = useRef(value);
  useEffect(() => {
    const from = current.current, began = performance.now(), duration = animate && from !== value ? 900 : 0;
    let frame = requestAnimationFrame(function tick(now) {
      const progress = duration ? Math.min(1, (now - began) / duration) : 1;
      current.current = Math.round(from + (value - from) * (1 - (1 - progress) ** 3));
      setShown(current.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [value, animate]);
  return <>{shown.toLocaleString("en-US")}{suffix}</>;
}

const wobble = (pulse: number, index: number) => ((pulse * 7 + index * 13) % 11) - 5;

export function CommandCenter() {
  const [active, setActive] = useState(0),
    [paused, setPaused] = useState(false),
    [held, setHeld] = useState(false),
    [feedStart, setFeedStart] = useState(0),
    [pulse, setPulse] = useState(0),
    reduced = useReducedMotion() ?? false,
    root = useRef<HTMLElement>(null),
    tabs = useRef<(HTMLButtonElement | null)[]>([]),
    inView = useInView(root, { amount: 0.3 }),
    pageVisible = usePageVisible(),
    // Motion runs only while the demo is on screen, the tab is visible, nobody paused it, the pointer or
    // keyboard focus is not inside it, and the visitor has not asked for reduced motion.
    running = inView && pageVisible && !paused && !held && !reduced,
    baseId = useId(),
    view = commandCenterViews[active];
  useLoop(running, ROTATE_MS, () => setActive((value) => (value + 1) % commandCenterViews.length));
  useLoop(running, FEED_MS, () => setFeedStart((value) => value + 1));
  useLoop(running, PULSE_MS, () => setPulse((value) => value + 1));

  const select = (index: number) => { setActive(index); setPaused(true); };
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const count = commandCenterViews.length,
      step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    const next = step ? (index + step + count) % count : event.key === "Home" ? 0 : event.key === "End" ? count - 1 : -1;
    if (next < 0) return;
    event.preventDefault();
    select(next);
    tabs.current[next]?.focus();
  };
  const feed = Array.from({ length: FEED_SIZE }, (_, offset) => feedStart + offset);
  const ViewIcon = view.icon;

  return (
    <section
      ref={root}
      aria-label="AI Business Command Center, an illustrative product demo"
      className="relative min-w-0 rounded-[2rem] border border-vds-border-strong bg-vds-elevated p-2 shadow-2xl"
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeld(false); }}
    >
      <div className="overflow-hidden rounded-[1.55rem] border border-vds-border bg-vds-background">
        <div className="flex items-center justify-between gap-3 border-b border-vds-border px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden gap-1.5 sm:flex" aria-hidden="true">
              <i className="size-2 rounded-full bg-vds-danger" />
              <i className="size-2 rounded-full bg-vds-warning" />
              <i className="size-2 rounded-full bg-vds-success" />
            </span>
            <span className="truncate text-xs font-medium text-vds-secondary">AI Business Command Center</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full border border-vds-border px-2.5 py-1 text-[10px] font-medium text-vds-muted">Illustrative demo data</span>
            {reduced ? null : (
              <Button
                variant="control"
                onClick={() => setPaused((value) => !value)}
                aria-pressed={paused}
                aria-label={paused ? "Play the demo animation" : "Pause the demo animation"}
                className="grid size-7 place-items-center rounded-lg text-vds-muted hover:bg-vds-hover hover:text-vds-foreground"
              >
                {paused ? <Play className="size-3.5" aria-hidden="true" /> : <Pause className="size-3.5" aria-hidden="true" />}
              </Button>
            )}
          </div>
        </div>
        {/* minmax(0,…) keeps the scrollable tab strip from widening the card on small screens. */}
        <div className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-[11.5rem_minmax(0,1fr)]">
          <div
            role="tablist"
            aria-label="Command Center areas"
            className={`${styles.tabs} flex gap-1 overflow-x-auto border-b border-vds-border p-2 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r sm:p-3`}
          >
            {commandCenterViews.map((item, index) => {
              const Icon = item.icon, selected = index === active;
              return (
                <Button
                  key={item.label}
                  ref={(node) => { tabs.current[index] = node; }}
                  variant="control"
                  role="tab"
                  id={`${baseId}-tab-${index}`}
                  aria-selected={selected}
                  aria-controls={`${baseId}-panel`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => select(index)}
                  onKeyDown={(event) => onTabKey(event, index)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-xs ${selected ? "bg-vds-primary-soft text-vds-primary" : "text-vds-muted hover:bg-vds-hover"}`}
                >
                  <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                  {item.label}
                </Button>
              );
            })}
          </div>
          <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${active}`} className="min-h-[24.5rem] p-4 sm:p-5">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={view.label}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.28 }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-xl bg-vds-primary-soft text-vds-primary">
                      <ViewIcon className="size-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs text-vds-muted">Demo workspace</p>
                      <h3 className="text-lg font-semibold">{view.label}</h3>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-vds-success-soft px-3 py-1 text-xs text-vds-success">
                    <i className={`size-1.5 rounded-full bg-vds-success ${styles.live}`} aria-hidden="true" />
                    Sample
                  </span>
                </div>
                <dl className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                  {view.metrics.map(([label, value, suffix]) => (
                    <div className="rounded-2xl border border-vds-border bg-vds-surface p-3 sm:p-4" key={label}>
                      <dt className="text-[11px] leading-4 text-vds-muted sm:text-xs">{label}</dt>
                      <dd className="mt-2 text-lg font-semibold tabular-nums sm:mt-3 sm:text-xl">
                        <CountUp value={value} suffix={suffix} animate={!reduced} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </motion.div>
            </AnimatePresence>
            <div className="mt-3 grid gap-3 lg:grid-cols-[1.25fr_1fr]">
              <div className="rounded-2xl border border-vds-border bg-vds-surface p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-vds-secondary">Weekly momentum</span>
                  <span className="text-vds-muted">Sample trend</span>
                </div>
                <div className="mt-4 flex h-24 items-end gap-1.5" aria-hidden="true">
                  {view.bars.map((height, index) => (
                    <i key={index} className={styles.bar} style={{ height: `${Math.max(8, Math.min(100, height + wobble(pulse, index)))}%` }} />
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-vds-border bg-vds-surface p-4">
                <p className="text-xs font-medium text-vds-secondary">Prepared for your review</p>
                <ul className="mt-3 space-y-2.5">
                  {view.focus.map((item) => (
                    <li className="flex gap-2 text-xs leading-5 text-vds-muted" key={item}>
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-vds-primary" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-vds-border">
          <div className="flex items-center justify-between px-4 pt-3 text-xs sm:px-5">
            <span className="font-medium text-vds-secondary">AI team activity</span>
            <span className="inline-flex items-center gap-1.5 text-vds-primary">
              <i className={`size-1.5 rounded-full bg-vds-primary ${styles.live}`} aria-hidden="true" />
              Demo feed
            </span>
          </div>
          <ul aria-label="Illustrative AI team activity" className="flex h-[12.5rem] flex-col justify-end gap-2 overflow-hidden px-3 py-3 sm:px-4">
            {feed.map((position) => {
              const [who, what, status] = activity[position % activity.length];
              return (
                <li key={position} className={`${styles.feedEnter} flex items-start gap-3 rounded-xl border border-vds-border bg-vds-surface px-3 py-2`}>
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-vds-primary-soft text-vds-primary">
                    <Bot className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs"><b className="font-semibold">{who}</b> <span className="text-vds-muted">· {what}</span></span>
                    <span className="mt-0.5 block text-[11px] text-vds-subtle">{status}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="border-t border-vds-border px-4 py-2.5 text-[11px] leading-4 text-vds-subtle sm:px-5">
            Illustrative demo data, not real customer activity. In VAYON, important actions wait for your approval.
          </p>
        </div>
      </div>
    </section>
  );
}
