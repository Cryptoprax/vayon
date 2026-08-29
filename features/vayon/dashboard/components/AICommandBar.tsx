"use client";

import { Button } from "@/features/platform/design-system";
import { ArrowUp, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const defaultPrompts = [
  "Find buyers interested in villas below ₹3 Cr",
  "Show today's meetings",
  "Book site visits",
  "Create WhatsApp campaign",
  "Show highest priority leads",
] as const;

export function AICommandBar({
  onBlockedAction,
  prompts = defaultPrompts,
}: {
  readonly onBlockedAction?: () => void;
  readonly prompts?: readonly string[];
} = {}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const prompt = query.trim();
    if (prompt && onBlockedAction) {
      onBlockedAction();
      return;
    }
    if (prompt)
      router.push(`/vayon/ai/playground?prompt=${encodeURIComponent(prompt)}`);
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-vds-accent-border bg-vds-surface p-5 shadow-[0_24px_80px_var(--vds-shadow-color)] sm:p-7 2xl:p-8">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-vds-primary" />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">
          <Sparkles className="size-4" aria-hidden="true" /> Vayon intelligence
        </div>
        <form
          onSubmit={submit}
          className="mt-4 flex items-center gap-3 rounded-2xl border border-vds-border bg-vds-input p-2 focus-within:border-vds-accent-border focus-within:ring-2 focus-within:ring-vds-focus/20"
        >
          <Sparkles
            className="ml-2 size-5 shrink-0 text-vds-primary"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Ask Vayon AI"
            placeholder="Ask Vayon AI anything..."
            className="h-11 min-w-0 flex-1 bg-transparent text-sm text-vds-foreground outline-none placeholder:text-vds-subtle sm:text-base"
          />
          <Button
            type="submit"
            disabled={!query.trim()}
            aria-label="Open prompt in AI playground"
            className="grid size-10 shrink-0 place-items-center rounded-xl p-0"
          >
            <ArrowUp className="size-4" />
          </Button>
        </form>
        <div
          className="mt-3 flex gap-2 overflow-x-auto pb-1"
          aria-label="Example AI prompts"
        >
          {prompts.map((prompt) => (
            <Button
              key={prompt}
              variant="control"
              type="button"
              onClick={() => setQuery(prompt)}
              className="shrink-0 rounded-full border border-vds-border bg-vds-elevated px-3 py-1.5 text-xs text-vds-muted hover:border-vds-accent-border hover:text-vds-foreground"
            >
              {prompt}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
