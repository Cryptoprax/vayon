"use client";
import { Button } from "@/features/platform/design-system";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock3,
  Command,
  CornerDownLeft,
  Pin,
  Plus,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import type { NavigationItem } from "@/features/platform/builder/types";
import { defaultAdaptiveSuggestions } from "../config/adaptive-suggestions";
import { quickCreateActions } from "../config/quick-create";
import type {
  AdaptiveSuggestion,
  UniversalBarMode,
  UniversalBarResult,
  UniversalHistoryItem,
  UniversalSearchScope,
} from "../domain/contracts";
import { StaticNavigationSearchProvider } from "../providers/static-navigation.provider";
import { DeterministicIntentRouter } from "../services/deterministic-intent-router";
import { ProviderNeutralUniversalSearch } from "../services/universal-search.service";
import { LocalUniversalBarHistory } from "../storage/local-history.store";
import { UniversalPreviewCard } from "./UniversalPreviewCard";
import { AuroraCrmSearchProvider } from "@/features/vayon/demo-workspace/crm-network/search.provider";
import { AuroraPropertySearchProvider } from "@/features/vayon/demo-workspace/property-portfolio/search.provider";
import { AuroraSalesOperationsSearchProvider } from "@/features/vayon/demo-workspace/sales-operations/search.provider";
import { AuroraBusinessActivitySearchProvider } from "@/features/vayon/demo-workspace/business-activity/search.provider";

const scopes: readonly UniversalSearchScope[] = [
  "projects",
  "inventory",
  "properties",
  "leads",
  "deals",
  "contacts",
  "companies",
  "campaigns",
  "meetings",
  "tasks",
  "documents",
  "creative-assets",
  "reports",
  "communications",
  "employees",
  "workflows",
  "analytics",
  "pages",
  "navigation",
  "universal-objects",
  "business-timeline",
  "executive-home",
  "growth",
  "settings",
];

export function UniversalBar({
  navigation,
  suggestions = defaultAdaptiveSuggestions,
  includeAuroraCrm = false,
}: {
  readonly navigation: readonly NavigationItem[];
  readonly suggestions?: readonly AdaptiveSuggestion[];
  readonly includeAuroraCrm?: boolean;
}) {
  const router = useRouter(),
    trigger = useRef<HTMLButtonElement>(null),
    input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false),
    [mode, setMode] = useState<UniversalBarMode>("search"),
    [query, setQuery] = useState(""),
    [active, setActive] = useState(0),
    [suggestionIndex, setSuggestionIndex] = useState(0),
    [historyVersion, setHistoryVersion] = useState(0);
  const history = useMemo(() => new LocalUniversalBarHistory(), []),
    intentRouter = useMemo(() => new DeterministicIntentRouter(), []),
    search = useMemo(
      () =>
        new ProviderNeutralUniversalSearch(
          includeAuroraCrm
            ? [
                new StaticNavigationSearchProvider(navigation),
                new AuroraCrmSearchProvider(),
                new AuroraPropertySearchProvider(),
                new AuroraSalesOperationsSearchProvider(),
                new AuroraBusinessActivitySearchProvider(),
              ]
            : [new StaticNavigationSearchProvider(navigation)],
        ),
      [includeAuroraCrm, navigation],
    );
  const intent = useMemo(
    () => intentRouter.resolve(query),
    [intentRouter, query],
  );
  const results = useMemo(() => {
    void historyVersion;
    if (mode === "ask") return [];
    if (intent.type === "recent" || intent.type === "favorites")
      return history
        .list(intent.type === "recent" ? "recently-opened" : "favorites")
        .filter((item) => item.href)
        .map(historyResult);
    if (mode === "actions" && !intent.query) return quickCreateActions;
    const found = search.search({ query: intent.query, scopes, limit: 18 });
    return intent.type === "create" || mode === "actions"
      ? found.filter((item) => item.kind === "quick-create")
      : found;
  }, [history, historyVersion, intent, mode, search]);
  const selected = results[active];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLocaleLowerCase() === "k"
      ) {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape" && open) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  useEffect(() => {
    if (open) requestAnimationFrame(() => input.current?.focus());
  }, [open]);
  useEffect(() => {
    if (!open || query || suggestions.length < 2) return;
    const timer = window.setInterval(
      () => setSuggestionIndex((index) => (index + 1) % suggestions.length),
      4000,
    );
    return () => window.clearInterval(timer);
  }, [open, query, suggestions.length]);

  function close() {
    setOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
  }
  function choose(result: UniversalBarResult) {
    const now = new Date().toISOString();
    history.record({
      id: result.id,
      label: result.label,
      href: result.href,
      kind: "recently-opened",
      recordedAt: now,
    });
    history.record({
      id: result.id,
      label: result.label,
      href: result.href,
      kind: "recently-viewed",
      recordedAt: now,
    });
    if (query.trim())
      history.record({
        id: `search-${query.trim().toLocaleLowerCase()}`,
        label: query.trim(),
        query: query.trim(),
        kind: "recently-searched",
        recordedAt: now,
      });
    router.push(result.href);
    close();
  }
  function chooseSuggestion(suggestion: AdaptiveSuggestion) {
    if (suggestion.href) {
      choose({
        id: suggestion.id,
        label: suggestion.label,
        description: suggestion.hint,
        href: suggestion.href,
        scope: "settings",
        kind: "navigation",
        keywords: [],
      });
    } else if (suggestion.query) {
      setQuery(suggestion.query);
      setActive(0);
    }
  }
  function keyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) =>
        Math.min(index + 1, Math.max(results.length - 1, 0)),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(Math.max(results.length - 1, 0));
    } else if (event.key === "Enter" && mode === "ask" && query.trim()) {
      event.preventDefault();
      openCopilot(query);
    } else if (event.key === "Enter" && selected) {
      event.preventDefault();
      choose(selected);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }
  function openCopilot(prompt: string) {
    window.dispatchEvent(
      new CustomEvent("vayon:copilot:open", { detail: { prompt } }),
    );
    close();
  }
  function toggle(kind: "pinned" | "favorites", result: UniversalBarResult) {
    history.toggle(kind, {
      id: result.id,
      label: result.label,
      href: result.href,
    });
    setHistoryVersion((value) => value + 1);
  }

  return (
    <div className="min-w-0 flex-1 sm:max-w-xl">
      <Button
        variant="control"
        ref={trigger}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Vayon Universal Bar (Control K)"
        aria-keyshortcuts="Control+K Meta+K"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="group flex h-10 w-full items-center gap-2 rounded-xl border border-vds-border bg-vds-input px-3 text-left text-sm text-vds-muted transition hover:border-vds-accent-border hover:bg-vds-hover focus-visible:outline-2 focus-visible:outline-vds-focus"
      >
        <Search className="size-4 text-vds-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">
          Ask, search or create anything...
        </span>
        <kbd className="hidden rounded-md border border-vds-border bg-vds-elevated px-1.5 py-0.5 text-[10px] text-vds-subtle sm:inline">
          Ctrl K
        </kbd>
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-vds-overlay px-3 pt-[7vh] backdrop-blur-md sm:px-5 sm:pt-[10vh]"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) close();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Vayon Universal Bar"
            className="mx-auto max-h-[82vh] w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-vds-border bg-vds-surface/95 shadow-[0_35px_100px_var(--vds-overlay)] ring-1 ring-vds-focus/[.04]"
          >
            <header className="border-b border-vds-border/[.07]">
              <div className="flex items-center gap-3 px-4 sm:px-5">
                <Command
                  className="size-5 shrink-0 text-vds-primary"
                  aria-hidden="true"
                />
                <input
                  ref={input}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActive(0);
                  }}
                  onKeyDown={keyDown}
                  role="combobox"
                  aria-label="Search, create, or navigate Vayon"
                  aria-expanded="true"
                  aria-controls="universal-bar-results"
                  aria-activedescendant={
                    selected ? `universal-result-${selected.id}` : undefined
                  }
                  placeholder={
                    mode === "actions"
                      ? "Create or run an action…"
                      : "Search, open, create, navigate, view recent or favorites…"
                  }
                  className="h-16 min-w-0 flex-1 bg-transparent text-sm text-vds-foreground outline-none placeholder:text-vds-subtle sm:text-base"
                />
                <Button
                  variant="control"
                  type="button"
                  onClick={close}
                  aria-label="Close Universal Bar"
                  className="grid size-9 place-items-center rounded-lg text-vds-subtle hover:bg-vds-surface/[.05] hover:text-vds-foreground focus-visible:outline-2 focus-visible:outline-vds-focus"
                >
                  <X className="size-4" />
                </Button>
              </div>
              <div
                className="flex items-center gap-1 overflow-x-auto px-4 pb-3 sm:px-5"
                role="tablist"
                aria-label="Universal Bar modes"
              >
                {(["search", "actions", "ask"] as const).map((item) => (
                  <Button
                    variant="control"
                    key={item}
                    type="button"
                    role="tab"
                    aria-selected={mode === item}
                    onClick={() => {
                      setMode(item);
                      setActive(0);
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs capitalize transition ${mode === item ? "bg-vds-primary-soft text-vds-primary" : "text-vds-subtle hover:bg-vds-surface/[.04] hover:text-vds-secondary"} disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {item === "ask" ? "Ask Copilot" : item}
                  </Button>
                ))}
                <span className="ml-auto hidden text-[10px] text-vds-subtle sm:block">
                  ↑↓ Select · Enter Open · Esc Close
                </span>
              </div>
            </header>
            {mode === "ask" ? (
              <div className="grid min-h-72 place-items-center p-8 text-center">
                <div>
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-vds-accent/[.08] text-vds-accent">
                    <Sparkles aria-hidden="true" />
                  </span>
                  <h2 className="mt-4 font-semibold">Ask VAYON Copilot</h2>
                  <p className="mt-2 text-sm text-vds-muted">
                    Press Enter to send this request to the context-aware Copilot. Actions remain user initiated.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {["Summarize today's activity", "Create a proposal", "Open CRM"].map((prompt) => (
                      <Button variant="secondary" size="sm" onClick={() => openCopilot(prompt)} key={prompt}>{prompt}</Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid min-h-72 max-h-[62vh] lg:grid-cols-[1fr_20rem]">
                <div
                  id="universal-bar-results"
                  role="listbox"
                  aria-label="Universal Bar results"
                  className="overflow-y-auto p-3 sm:p-4"
                >
                  {query && (
                    <p className="px-2 pb-3 text-[10px] uppercase tracking-[.16em] text-vds-subtle">
                      Deterministic intent: {intent.type}
                    </p>
                  )}
                  {!query && mode === "search" && (
                    <EmptyExperience
                      history={history.list()}
                      suggestion={suggestions[suggestionIndex]}
                      onSuggestion={chooseSuggestion}
                      onHistory={(item) => choose(historyResult(item))}
                    />
                  )}{" "}
                  {(query || mode === "actions") &&
                    results.map((result, index) => (
                      <div key={result.id}>
                      {(index === 0 || results[index - 1]?.scope !== result.scope) && <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[.16em] text-vds-subtle">{searchGroup(result.scope)}</p>}
                      <div
                        id={`universal-result-${result.id}`}
                        role="option"
                        aria-selected={active === index}
                        className={`group flex items-center gap-2 rounded-2xl p-1 transition ${active === index ? "bg-vds-surface/[.065]" : "hover:bg-vds-surface/[.04]"}`}
                        onMouseEnter={() => setActive(index)}
                      >
                        <Button
                          variant="control"
                          type="button"
                          onClick={() => choose(result)}
                          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-3 text-left focus-visible:outline-2 focus-visible:outline-vds-focus"
                        >
                          <span
                            className={`grid size-9 shrink-0 place-items-center rounded-xl ${result.kind === "quick-create" ? "bg-vds-success/[.08] text-vds-success" : "bg-vds-primary/[.07] text-vds-primary"}`}
                          >
                            {result.kind === "quick-create" ? (
                              <Plus className="size-4" />
                            ) : (
                              <Search className="size-4" />
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm text-vds-secondary">
                              {result.label}
                            </span>
                            <span className="mt-1 block truncate text-xs text-vds-subtle">
                              {result.description}
                            </span>
                          </span>
                        </Button>
                        <Button
                          variant="control"
                          type="button"
                          onClick={() => toggle("pinned", result)}
                          aria-label={`Pin ${result.label}`}
                          aria-pressed={history.has("pinned", result.id)}
                          className="rounded-lg p-2 text-vds-subtle hover:text-vds-primary focus-visible:outline-2 focus-visible:outline-vds-focus"
                        >
                          <Pin className="size-4" />
                        </Button>
                        <Button
                          variant="control"
                          type="button"
                          onClick={() => toggle("favorites", result)}
                          aria-label={`Favorite ${result.label}`}
                          aria-pressed={history.has("favorites", result.id)}
                          className="rounded-lg p-2 text-vds-subtle hover:text-vds-warning focus-visible:outline-2 focus-visible:outline-vds-focus"
                        >
                          <Star className="size-4" />
                        </Button>
                        <CornerDownLeft
                          className="mr-3 hidden size-4 text-vds-subtle sm:block"
                          aria-hidden="true"
                        />
                      </div>
                      </div>
                    ))}
                  {query && !results.length && (
                    <div className="p-10 text-center">
                      <p className="text-sm text-vds-muted">
                        No local provider results.
                      </p>
                      <p className="mt-2 text-xs text-vds-subtle">
                        No database or indexing engine is connected.
                      </p>
                    </div>
                  )}
                </div>
                <UniversalPreviewCard preview={selected?.preview} />
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
function searchGroup(scope: UniversalSearchScope) {
  const labels: Partial<Record<UniversalSearchScope, string>> = { properties: "Properties", contacts: "Clients", leads: "Leads", employees: "Agents", companies: "Builders & Developers", deals: "Transactions", documents: "Documents", projects: "Communities", inventory: "Properties" };
  return labels[scope] ?? "VAYON";
}

function EmptyExperience({
  history,
  suggestion,
  onSuggestion,
  onHistory,
}: {
  readonly history: readonly UniversalHistoryItem[];
  readonly suggestion?: AdaptiveSuggestion;
  readonly onSuggestion: (suggestion: AdaptiveSuggestion) => void;
  readonly onHistory: (item: UniversalHistoryItem) => void;
}) {
  const recent = history
      .filter(
        (item) =>
          item.kind === "recently-opened" || item.kind === "recently-searched",
      )
      .slice(0, 4),
    saved = history
      .filter((item) => item.kind === "pinned" || item.kind === "favorites")
      .slice(0, 4);
  return (
    <div className="space-y-5">
      {suggestion && (
        <Button
          variant="control"
          type="button"
          onClick={() => onSuggestion(suggestion)}
          className="flex w-full items-center gap-4 rounded-2xl border border-vds-accent bg-vds-accent/[.045] p-4 text-left hover:bg-vds-accent/[.075] focus-visible:outline-2 focus-visible:outline-vds-focus"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-vds-accent/[.08] text-vds-accent">
            <Sparkles className="size-4" />
          </span>
          <span>
            <span className="block text-sm text-vds-secondary">
              {suggestion.label}
            </span>
            <span className="mt-1 block text-xs text-vds-subtle">
              {suggestion.hint}
            </span>
          </span>
        </Button>
      )}
      <HistoryGroup
        title="Recent"
        icon={<Clock3 className="size-4" />}
        items={recent}
        onSelect={onHistory}
      />
      <HistoryGroup
        title="Pinned & favorites"
        icon={<Star className="size-4" />}
        items={saved}
        onSelect={onHistory}
      />
      {!recent.length && !saved.length && (
        <p className="rounded-2xl border border-dashed border-vds-border/[.08] p-6 text-center text-xs text-vds-subtle">
          Your local Universal Bar history will appear here.
        </p>
      )}
    </div>
  );
}
function HistoryGroup({
  title,
  icon,
  items,
  onSelect,
}: {
  readonly title: string;
  readonly icon: React.ReactNode;
  readonly items: readonly UniversalHistoryItem[];
  readonly onSelect: (item: UniversalHistoryItem) => void;
}) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="flex items-center gap-2 px-2 text-[10px] uppercase tracking-[.15em] text-vds-subtle">
        {icon}
        {title}
      </h2>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <Button
            variant="control"
            type="button"
            onClick={() => onSelect(item)}
            key={`${item.kind}-${item.id}`}
            className="rounded-xl border border-vds-border/[.06] px-3 py-2.5 text-left hover:bg-vds-hover"
          >
            <span className="block truncate text-xs text-vds-muted">
              {item.label}
            </span>
            <span className="mt-1 block text-[10px] capitalize text-vds-subtle">
              {item.kind.replaceAll("-", " ")}
            </span>
          </Button>
        ))}
      </div>
    </section>
  );
}
function historyResult(item: UniversalHistoryItem): UniversalBarResult {
  return {
    id: item.id,
    label: item.label,
    description: item.kind.replaceAll("-", " "),
    href: item.href ?? "/vayon/dashboard",
    scope: "settings",
    kind: "navigation",
    keywords: [],
  };
}
