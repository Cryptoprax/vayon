"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  CircleAlert,
  Download,
  Maximize2,
  Minimize2,
  Pin,
  Plus,
  Search,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/features/platform/design-system";
import { FloatingSurface } from "@/features/vayon/floating-layout/FloatingLayoutManager";
import { intelligenceModuleRegistry, moduleForRoute } from "../module-registry";
import type {
  IntelligenceConversation,
  IntelligenceTab,
  SuccessSnapshot,
} from "../contracts";
import { buildContextGraph } from "../context-graph";
import { resolveCopilotCommand } from "../copilot-commands";
import {
  detectOnboardingMilestone,
  detectSuccessSignals,
  explainFailure,
} from "../success-engine";
const storageKey = "vayon.intelligence.conversations.v1",
  uiKey = "vayon.intelligence.ui.v1";
const clean = (value: string) =>
  value.replace(/[<>\u0000-\u001f]/g, "").slice(0, 1000);
export function VayonIntelligence({
  route,
  organization,
  workspace,
  user,
  role,
  subscriptionPlan,
  permissions = [],
  diagnostic,
}: {
  route: string;
  organization: string;
  workspace: string;
  user: string;
  role: string;
  subscriptionPlan?: string;
  permissions?: readonly string[];
  diagnostic?: string | null;
}) {
  const intelligenceModule = moduleForRoute(route),
    contextGraph = buildContextGraph(route, {
      organization,
      workspace,
      user,
      role,
      subscriptionPlan,
      permissions,
    }),
    [storedState] = useState(() => {
      try {
        return {
          conversations: JSON.parse(
            localStorage.getItem(storageKey) ?? "[]",
          ) as IntelligenceConversation[],
          ui: JSON.parse(localStorage.getItem(uiKey) ?? "{}") as {
            open?: boolean;
            full?: boolean;
          },
        };
      } catch {
        return { conversations: [], ui: {} };
      }
    }),
    [open, setOpen] = useState(Boolean(storedState.ui.open)),
    [full, setFull] = useState(Boolean(storedState.ui.full)),
    [tab, setTab] = useState<IntelligenceTab>("assistant"),
    [items, setItems] = useState<IntelligenceConversation[]>(
      storedState.conversations,
    ),
    [active, setActive] = useState(""),
    [query, setQuery] = useState(""),
    [prompt, setPrompt] = useState(""),
    [dismissedRecommendation, setDismissedRecommendation] = useState(false),
    [successState, setSuccessState] = useState<SuccessSnapshot>(() => {
      const visitKey = `vayon.intelligence.visited.${workspace}.${intelligenceModule.id}`;
      const failureKey = `vayon.intelligence.failures.${workspace}.${intelligenceModule.id}`;
      let firstVisit = true;
      let failureCount = 0;
      try {
        firstVisit = localStorage.getItem(visitKey) !== "true";
        localStorage.setItem(visitKey, "true");
        failureCount = diagnostic
          ? Number(localStorage.getItem(failureKey) ?? "0") + 1
          : 0;
        if (diagnostic) localStorage.setItem(failureKey, String(failureCount));
        else localStorage.removeItem(failureKey);
      } catch {}
      const bodyText = document.body.textContent?.toLowerCase() ?? "";
      return {
        firstVisit,
        emptyState:
          Boolean(document.querySelector("[data-empty-state]")) ||
          /no (records|leads|projects|units|campaigns|visits|results)\b/.test(
            bodyText,
          ),
        inactiveMs: 0,
        failureCount,
        validationError:
          diagnostic && /valid|required|invalid/i.test(diagnostic)
            ? clean(diagnostic)
            : null,
        permissionDenied: Boolean(
          diagnostic && /permission|forbidden|unauthorized/i.test(diagnostic),
        ),
        configurationIssue: Boolean(
          diagnostic && /connect|configuration|provider/i.test(diagnostic),
        ),
        onboardingComplete: true,
        workflowLatencyMs: null,
      };
    }),
    successSignals = detectSuccessSignals(successState, intelligenceModule),
    proactive = dismissedRecommendation ? undefined : successSignals[0],
    safeFailure = explainFailure(diagnostic ?? null),
    [milestone] = useState(() => {
      const detected = detectOnboardingMilestone(
        route,
        contextGraph.selectedRecord,
        successState.emptyState,
      );
      if (!detected) return null;
      const key = `vayon.intelligence.milestone.${workspace}.${detected}`;
      try {
        if (localStorage.getItem(key) === "true") return null;
        localStorage.setItem(key, "true");
      } catch {}
      return detected;
    });
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items.slice(0, 30)));
      localStorage.setItem(uiKey, JSON.stringify({ open, full }));
    } catch {}
  }, [items, open, full]);
  useEffect(() => {
    let timer = window.setTimeout(
      () => setSuccessState((current) => ({ ...current, inactiveMs: 300000 })),
      300000,
    );
    const active = () => {
      window.clearTimeout(timer);
      setSuccessState((current) =>
        current.inactiveMs ? { ...current, inactiveMs: 0 } : current,
      );
      timer = window.setTimeout(
        () =>
          setSuccessState((current) => ({ ...current, inactiveMs: 300000 })),
        300000,
      );
    };
    window.addEventListener("pointerdown", active, { passive: true });
    window.addEventListener("keydown", active);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", active);
      window.removeEventListener("keydown", active);
    };
  }, []);
  useEffect(() => {
    const openCopilot = (event: Event) => {
      const detail = (event as CustomEvent<{ prompt?: string }>).detail;
      setOpen(true);
      setTab("assistant");
      if (detail?.prompt) setPrompt(clean(detail.prompt));
    };
    window.addEventListener("vayon:copilot:open", openCopilot);
    return () => window.removeEventListener("vayon:copilot:open", openCopilot);
  }, []);
  const visible = useMemo(
    () =>
      items.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()),
      ),
    [items, query],
  );
  function add(prompt = "Welcome") {
    track("search_performed", { topic: contextGraph.moduleId });
    const now = new Date().toISOString(),
      id = crypto.randomUUID(),
      resolution = resolveCopilotCommand(prompt, contextGraph),
      conversation: IntelligenceConversation = {
        id,
        title: `${intelligenceModule.name}: ${prompt}`.slice(0, 80),
        pinned: false,
        messages: [
          { id: `${id}-user`, role: "user", content: clean(prompt), createdAt: now },
          { id: `${id}-assistant`, role: "assistant", content: resolution.response, createdAt: now },
        ],
        createdAt: now,
        updatedAt: now,
      };
    setItems((current) => [conversation, ...current]);
    setActive(id);
    setPrompt("");
  }
  function track(
    name: "quick_action_used" | "search_performed" | "feedback_submitted",
    metadata: Record<string, string>,
  ) {
    dispatchEvent(
      new CustomEvent("vayon:product-event", {
        detail: {
          name,
          module: contextGraph.moduleId,
          path: route,
          outcome: "success",
          metadata,
        },
      }),
    );
  }
  function exportHistory() {
    const blob = new Blob([JSON.stringify(items, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      link = document.createElement("a");
    link.href = url;
    link.download = "vayon-intelligence-conversations.json";
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <FloatingSurface
      id="vayon-intelligence"
      kind="assistant"
      priority={10}
      expanded={open}
      fullscreen={full}
    >
      {!open ? (
        <div className="flex items-center gap-2">
          {proactive && (
            <Button
              variant="ghost"
              className="vds-focus hidden max-w-64 rounded-2xl border border-vds-border bg-vds-surface/95 px-4 py-3 text-left text-sm shadow-xl backdrop-blur-xl sm:block"
              onClick={() => setOpen(true)}
            >
              <span className="font-semibold">{proactive.title}</span>
              <span className="mt-1 block text-xs text-vds-muted">
                {proactive.nextStep}
              </span>
            </Button>
          )}
          <Button
            aria-label="Open VAYON Copilot"
            title={proactive?.title}
            className="size-14 rounded-full shadow-2xl"
            onClick={() => setOpen(true)}
          >
            <Bot />
          </Button>
        </div>
      ) : (
        <aside
          role="dialog"
          aria-label="VAYON Copilot"
          aria-modal={full || undefined}
          className={`overflow-hidden border border-vds-border bg-vds-surface/95 shadow-2xl backdrop-blur-xl transition-all motion-reduce:transition-none ${full ? "h-full w-full rounded-3xl" : "h-[min(42rem,calc(100dvh-2rem))] w-[min(29rem,calc(100vw-2rem))] rounded-3xl max-md:h-[min(85dvh,44rem)] max-md:w-screen max-md:rounded-b-none max-md:rounded-t-3xl"}`}
        >
          <header className="flex items-center gap-2 border-b border-vds-border p-3">
            <Bot className="text-vds-primary" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">VAYON Copilot</p>
              <p className="truncate text-xs text-vds-muted">
                Chief Operating Officer · {intelligenceModule.name}
              </p>
            </div>
            <Button
              variant="ghost"
              aria-label={full ? "Exit full screen" : "Enter full screen"}
              onClick={() => setFull((x) => !x)}
            >
              {full ? <Minimize2 /> : <Maximize2 />}
            </Button>
            <Button
              variant="ghost"
              aria-label="Minimize VAYON Copilot"
              onClick={() => setOpen(false)}
            >
              <X />
            </Button>
          </header>
          <nav
            aria-label="Intelligence panels"
            className="flex border-b border-vds-border p-2"
          >
            {(["assistant", "help", "tasks", "feedback"] as const).map(
              (value) => (
                <Button
                  variant="ghost"
                  className={`vds-focus flex-1 rounded-lg p-2 text-xs capitalize ${tab === value ? "bg-vds-primary-soft text-vds-primary" : ""}`}
                  onClick={() => setTab(value)}
                  key={value}
                >
                  {value}
                </Button>
              ),
            )}
          </nav>
          <div className="grid h-[calc(100%-7.5rem)] grid-cols-[8rem_1fr] sm:grid-cols-[11rem_1fr]">
            <section className="border-r border-vds-border p-2">
              <Button variant="ghost" className="w-full" onClick={() => add()}>
                <Plus />
                New
              </Button>
              <label className="sr-only" htmlFor="intelligence-search">
                Search conversations
              </label>
              <div className="mt-2 flex items-center rounded-lg border border-vds-border px-2">
                <Search className="h-3.5 w-3.5" />
                <input
                  id="intelligence-search"
                  value={query}
                  onChange={(e) => setQuery(clean(e.target.value))}
                  className="min-w-0 bg-transparent p-2 text-xs outline-none"
                />
              </div>
              <div className="mt-2 max-h-[24rem] overflow-y-auto">
                {visible.map((item) => (
                  <Button
                    variant="ghost"
                    className="vds-focus flex w-full items-center gap-1 rounded-lg p-2 text-left text-xs hover:bg-vds-hover"
                    onClick={() => setActive(item.id)}
                    key={item.id}
                  >
                    {item.pinned && <Pin className="size-3" />}
                    <span className="truncate">{item.title}</span>
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                className="vds-focus mt-2 flex items-center gap-1 text-xs text-vds-muted"
                onClick={exportHistory}
              >
                <Download className="size-3" />
                Export
              </Button>
              <Button
                variant="ghost"
                className="vds-focus mt-2 text-xs text-vds-danger"
                onClick={() => {
                  setItems([]);
                  setActive("");
                }}
              >
                Clear history
              </Button>
            </section>
            <section className="overflow-y-auto p-4">
              {tab === "assistant" && (
                <>
                  <p className="text-xs uppercase text-vds-primary">
                    Page-aware foundation
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">
                    How can I help run {workspace}?
                  </h2>
                  <p className="mt-2 text-sm text-vds-muted">
                    I understand the current page and tenant-safe workspace context. I never infer a customer, campaign, project, document, or employee that is not present in the route.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-[.12em] text-vds-subtle" aria-label="Active Copilot context">
                    <span className="rounded-full border border-vds-border px-2.5 py-1">Page · {contextGraph.page}</span>
                    <span className="rounded-full border border-vds-border px-2.5 py-1">Workspace · {workspace}</span>
                    <span className="rounded-full border border-vds-border px-2.5 py-1">Module · {contextGraph.moduleName}</span>
                    {contextGraph.selectedRecord && <span className="rounded-full border border-vds-border px-2.5 py-1">Selected record · {contextGraph.selectedRecord}</span>}
                  </div>
                  <form className="mt-4 rounded-2xl border border-vds-accent-border bg-vds-primary-soft p-3" onSubmit={(event) => { event.preventDefault(); if (prompt.trim()) add(prompt); }}>
                    <label className="sr-only" htmlFor="copilot-prompt">Ask VAYON Copilot</label>
                    <textarea id="copilot-prompt" rows={3} value={prompt} onChange={(event) => setPrompt(clean(event.target.value))} placeholder="Create a proposal, summarize activity, or open any workspace…" className="vds-focus w-full resize-none rounded-xl border border-vds-border bg-vds-input p-3 text-sm" />
                    <div className="mt-2 flex items-center justify-between gap-3"><span className="text-[10px] text-vds-subtle">Recommendations only · no autonomous execution</span><Button type="submit" size="sm" disabled={!prompt.trim()}><Send className="size-4" aria-hidden="true" />Send</Button></div>
                  </form>
                  {active && (() => { const conversation = items.find((item) => item.id === active); const resolution = conversation ? resolveCopilotCommand(conversation.messages[0]?.content ?? "", contextGraph) : undefined; return conversation ? <article className="mt-4 space-y-3" aria-live="polite">{conversation.messages.map((message) => <div className={`rounded-2xl p-3 text-sm leading-6 ${message.role === "user" ? "ml-6 bg-vds-primary-soft" : "mr-6 border border-vds-border bg-vds-elevated"}`} key={message.id}><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-vds-subtle">{message.role === "user" ? "You" : "Copilot"}</p><p className="mt-1 text-vds-muted">{message.content}</p></div>)}{resolution?.href && <Link className="vds-focus inline-flex rounded-xl border border-vds-border px-3 py-2 text-sm font-semibold text-vds-primary" href={resolution.href}>{resolution.actionLabel}</Link>}</article> : null; })()}
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold">Executive brief</h3>
                    <div className="mt-2 flex flex-wrap gap-2">{["Morning Brief", "Afternoon Brief", "End of Day Summary"].map((brief) => <Button variant="secondary" size="sm" onClick={() => add(brief)} key={brief}>{brief}</Button>)}</div>
                    <p className="mt-2 text-xs text-vds-subtle">Briefs use only context available in this experience and disclose missing evidence.</p>
                  </div>
                  {safeFailure && (
                    <div
                      className="mt-4 rounded-2xl border border-vds-danger bg-vds-danger-soft p-4"
                      role="alert"
                    >
                      <div className="flex items-center gap-2 font-semibold text-vds-danger">
                        <CircleAlert className="size-4" /> What happened
                      </div>
                      <p className="mt-2 text-sm">{safeFailure}</p>
                      <p className="mt-2 text-xs text-vds-muted">
                        Workaround: review the relevant guide or Integration
                        Settings. Retrying never bypasses permissions or
                        approvals.
                      </p>
                      <Button
                        className="mt-3"
                        variant="outline"
                        onClick={() => window.location.reload()}
                      >
                        Retry page
                      </Button>
                    </div>
                  )}
                  {proactive && (
                    <article className="mt-4 rounded-2xl border border-vds-accent-border bg-vds-primary-soft p-4">
                      <div className="flex items-center gap-2 font-semibold">
                        <Sparkles className="size-4 text-vds-primary" />
                        {proactive.title}
                        <Button variant="ghost" size="sm" className="ml-auto size-8 p-0" aria-label={`Dismiss ${proactive.title}`} onClick={() => setDismissedRecommendation(true)}><X className="size-4" aria-hidden="true" /></Button>
                      </div>
                      <p className="mt-2 text-sm text-vds-muted">
                        {proactive.explanation}
                      </p>
                      <p className="mt-2 text-sm">{proactive.nextStep}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button onClick={() => add(proactive.prompt)}>
                          {proactive.prompt}
                        </Button>
                        <Link
                          className="vds-focus rounded-xl border border-vds-border px-3 py-2 text-sm font-semibold"
                          href={`${proactive.helpHref}${proactive.helpHref.includes("?") ? "&" : "?"}module=${encodeURIComponent(contextGraph.moduleId)}`}
                        >
                          Open guide
                        </Link>
                        {proactive.videoHref && (
                          <Link
                            className="vds-focus rounded-xl border border-vds-border px-3 py-2 text-sm font-semibold"
                            href={proactive.videoHref}
                          >
                            Video
                          </Link>
                        )}
                      </div>
                    </article>
                  )}
                  {milestone && (
                    <div
                      className="mt-4 rounded-2xl border border-vds-success bg-vds-success-soft p-4"
                      role="status"
                    >
                      <p className="font-semibold">Milestone completed</p>
                      <p className="mt-1 text-sm text-vds-muted">
                        {milestone.replaceAll("_", " ")} is now part of your
                        workspace progress. Nice work.
                      </p>
                    </div>
                  )}
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold">Quick actions</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {contextGraph.availableActions.map((action) =>
                        action.href ? (
                          <Link
                            className="vds-focus rounded-xl border border-vds-border px-3 py-2 text-xs font-semibold"
                            href={action.href}
                            onClick={() =>
                              track("quick_action_used", {
                                action: action.kind,
                              })
                            }
                            key={`${action.kind}-${action.label}`}
                          >
                            {action.label}
                          </Link>
                        ) : null,
                      )}
                    </div>
                    <p className="mt-2 text-xs text-vds-subtle">
                      Navigation and drafts remain user initiated. No action is
                      executed autonomously.
                    </p>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {intelligenceModule.suggestedPrompts.map((prompt) => (
                      <Button
                        variant="ghost"
                        className="vds-focus rounded-xl border border-vds-border p-3 text-left text-sm hover:bg-vds-hover"
                        onClick={() => add(prompt)}
                        key={prompt}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                  <p className="mt-5 text-xs text-vds-subtle">
                    Context: {contextGraph.page} · {contextGraph.role} · Plan{" "}
                    {contextGraph.subscriptionPlan} · Permissions{" "}
                    {contextGraph.permissions.length
                      ? contextGraph.permissions.length
                      : "unavailable"}
                  </p>
                </>
              )}
              {tab === "help" && (
                <>
                  <h2 className="font-semibold">Help and documentation</h2>
                  <div className="mt-3 grid gap-2">
                    {intelligenceModule.helpResources.map((resource) => (
                      <Link
                        className="rounded-xl border border-vds-border p-3 text-sm text-vds-primary"
                        href={`${resource.href}${resource.href.includes("?") ? "&" : "?"}module=${encodeURIComponent(contextGraph.moduleId)}`}
                        key={resource.href}
                      >
                        {resource.label}
                      </Link>
                    ))}
                    <Link
                      className="rounded-xl border border-vds-border p-3 text-sm"
                      href="/docs/faq"
                    >
                      FAQ
                    </Link>
                    <Link
                      className="rounded-xl border border-vds-border p-3 text-sm"
                      href="/docs/release-notes"
                    >
                      Release notes
                    </Link>
                  </div>
                </>
              )}
              {tab === "tasks" && (
                <Empty
                  title="Intelligence tasks"
                  text="Task architecture is ready. Autonomous task execution is intentionally unavailable."
                />
              )}
              {tab === "feedback" && (
                <div className="rounded-2xl border border-vds-border p-5">
                  <h2 className="font-semibold">Product feedback</h2>
                  <p className="mt-2 text-sm text-vds-muted">
                    Report a bug, request a feature, suggest an improvement, or
                    flag a knowledge correction. Do not include customer data,
                    credentials, or confidential documents.
                  </p>
                  <Link
                    className="vds-focus mt-4 inline-block rounded-xl border border-vds-border px-3 py-2 text-sm font-semibold text-vds-primary"
                    href="/vayon/settings/product-intelligence"
                    onClick={() =>
                      track("feedback_submitted", { intent: "open_form" })
                    }
                  >
                    Open feedback form
                  </Link>
                </div>
              )}
              {active && (
                <p className="mt-5 text-xs text-vds-subtle">
                  Conversation {active.slice(0, 8)} · Session persistence active
                </p>
              )}
            </section>
          </div>
        </aside>
      )}
    </FloatingSurface>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-vds-border p-6">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-vds-muted">{text}</p>
    </div>
  );
}
export { intelligenceModuleRegistry };
