"use client";
import { FormEvent, useMemo, useState } from "react";
import type { AIEmployeeCode, OpenAIHealth } from "../domain/models";
import type { ConversationSnapshot, WorkforceMessage } from "./models";
import { Button } from "@/features/platform/design-system";

export function WorkforceChatPanel({
  employee,
  initial,
  health,
  initialPrompt = "",
  explainability,
}: {
  employee: AIEmployeeCode;
  initial: ConversationSnapshot;
  health: OpenAIHealth;
  initialPrompt?: string;
  explainability?: { readonly evidence: number; readonly entities: number; readonly confidence: number | null; readonly sources: readonly string[]; readonly timestamp: string };
}) {
  const [conversationId, setConversationId] = useState(
    initial.conversations[0]?.id,
  );
  const [messages, setMessages] = useState<readonly WorkforceMessage[]>(
    initial.messages,
  );
  const [query, setQuery] = useState("");
  const [value, setValue] = useState(initialPrompt);
  const [status, setStatus] = useState<
    "online" | "processing" | "idle" | "offline" | "error"
  >(health.connected ? "online" : "offline");
  const visible = useMemo(
    () =>
      initial.conversations.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()),
      ),
    [initial.conversations, query],
  );
  const salesPrompts = [
    "Generate today’s sales briefing",
    "Qualify the highest-priority leads and explain confidence",
    "Analyze pipeline risk and recommend next actions",
    "Draft a follow-up email for human review",
    "Draft a WhatsApp follow-up for human review",
    "Prepare me for today’s customer meetings",
    "Identify CRM cleanup opportunities",
    "Explain this month’s revenue forecast",
  ];
  const crmPrompts = [
    "Summarize the highest-value customers",
    "Find customers who haven't replied in 30 days",
    "Explain CRM health and cleanup priorities",
    "Identify duplicate and orphaned records",
    "Summarize recent relationship timelines",
    "Recommend next engagement for at-risk customers",
    "Find customers with missing emails",
    "Recommend data enrichment for human review",
  ];
  const whatsappPrompts = [
    "Analyze priority WhatsApp conversations",
    "Draft first responses for human review",
    "Draft follow-up replies for human review",
    "Recommend CRM tags for qualified leads",
    "Find matching properties and explain why",
    "Summarize customer needs and unanswered questions",
    "Recommend meetings or property visits",
    "Identify escalations and cold conversations",
  ];
  const marketingPrompts = [
    "Design a campaign with objectives, audience, channels, budget, and confidence",
    "Draft Facebook ads for human review",
    "Draft Google ads and keyword groups",
    "Create an SEO topic and internal-linking plan",
    "Draft an email nurture series",
    "Build a LinkedIn, Facebook, Instagram, X, and YouTube Shorts calendar",
    "Recommend lead magnets, landing pages, forms, CTAs, and funnels",
    "Analyze lead sources without fabricating CAC or ROI",
  ];
  const executivePrompts = [
    "Generate today's executive briefing",
    "Explain the business health score",
    "Analyze authoritative revenue and unavailable fields",
    "Prioritize critical, high, medium, and low recommendations",
    "Summarize every department",
    "Generate the executive business timeline",
    "Identify company-wide risks and bottlenecks",
    "Generate an export-ready daily, weekly, monthly, or quarterly report",
  ];

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = value.trim();
    if (!message || status === "processing") return;
    setValue("");
    setStatus("processing");
    const temporary: WorkforceMessage = {
      id: crypto.randomUUID(),
      conversationId: conversationId ?? "pending",
      role: "user",
      content: message,
      model: null,
      usage: null,
      cost: null,
      latencyMs: null,
      createdAt: new Date().toISOString(),
      recommendationOnly: true,
    };
    setMessages((current) => [...current, temporary]);
    try {
      const response = await fetch("/api/ai/workforce/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee, conversationId, message }),
      });
      if (!response.ok || !response.body)
        throw new Error("Runtime unavailable");
      const reader = response.body.getReader(),
        decoder = new TextDecoder(),
        assistantId = crypto.randomUUID();
      let buffer = "",
        assistant = "";
      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line) continue;
          const item = JSON.parse(line) as {
            type: string;
            value?: string;
            conversationId?: string;
            message?: string;
            usage?: WorkforceMessage["usage"];
            cost?: WorkforceMessage["cost"];
            model?: string;
            latencyMs?: number;
          };
          if (item.type === "error") throw new Error(item.message);
          if (item.conversationId) setConversationId(item.conversationId);
          if (item.type === "delta") {
            assistant += item.value ?? "";
            const next: WorkforceMessage = {
              id: assistantId,
              conversationId: item.conversationId ?? "pending",
              role: "assistant",
              content: assistant,
              model: health.model,
              usage: null,
              cost: null,
              latencyMs: null,
              createdAt: new Date().toISOString(),
              recommendationOnly: true,
            };
            setMessages((current) => [
              ...current.filter((entry) => entry.id !== assistantId),
              next,
            ]);
          }
          if (item.type === "complete")
            setMessages((current) =>
              current.map((entry) =>
                entry.id === assistantId
                  ? {
                      ...entry,
                      usage: item.usage ?? null,
                      cost: item.cost ?? null,
                      model: item.model ?? entry.model,
                      latencyMs: item.latencyMs ?? null,
                    }
                  : entry,
              ),
            );
        }
      }
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[18rem_1fr]">
      <aside className="rounded-2xl border border-vds-border bg-vds-surface p-4">
        <h2 className="font-semibold">Conversation history</h2>
        <input
          aria-label="Search conversations"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search conversations"
          className="mt-3 w-full rounded-xl border border-vds-border bg-vds-elevated px-3 py-2 text-sm"
        />
        <div className="mt-3 space-y-2">
          {visible.map((item) => (
            <Button
              variant="control"
              fullWidth
              onClick={() => setConversationId(item.id)}
              key={item.id}
              className="rounded-xl border border-vds-border p-3 text-left text-sm"
            >
              <span className="line-clamp-2">{item.title}</span>
            </Button>
          ))}
        </div>
      </aside>
      <div className="rounded-2xl border border-vds-border bg-vds-surface p-5">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Live chat</h2>
            <p className="text-xs text-vds-muted">
              Workspace-attributed · {health.model} ·{" "}
              {health.connected
                ? `Provider healthy · ${health.latencyMs ?? "—"} ms`
                : health.reason}{" "}
              · recommendation only
            </p>
          </div>
          <span className="rounded-full border border-vds-border px-3 py-1 text-xs font-semibold uppercase">
            {status}
          </span>
        </header>
        <div
          aria-live="polite"
          className="mt-4 min-h-64 space-y-3 rounded-xl bg-vds-elevated p-4"
        >
          {messages
            .filter(
              (item) =>
                !conversationId ||
                item.conversationId === conversationId ||
                item.conversationId === "pending",
            )
            .map((item) => (
              <article
                key={item.id}
                className={`max-w-[85%] rounded-xl border border-vds-border p-3 text-sm ${item.role === "user" ? "ml-auto bg-vds-primary-soft" : "bg-vds-surface"}`}
              >
                <p className="whitespace-pre-wrap">{item.content}</p>
                {item.role === "assistant" && (
                  <div className="mt-2 text-[11px] text-vds-muted">
                  <p>
                    {item.model ?? health.model} ·{" "}
                    {item.usage
                      ? `${item.usage.totalTokens} tokens`
                      : "Streaming"}{" "}
                    ·{" "}
                    {item.cost
                      ? `$${item.cost.totalUsd.toFixed(6)}`
                      : "Cost pending"}{" "}
                    ·{" "}
                    {item.latencyMs === null
                      ? "Latency pending"
                      : `${item.latencyMs} ms`}{" "}
                    · Approval required
                  </p>
                  {explainability && <p className="mt-1">Evidence {explainability.evidence} · Entities {explainability.entities} · Confidence {explainability.confidence ?? "unavailable"} · Memory sources {explainability.sources.join(", ") || "unavailable"} · {new Date(explainability.timestamp).toLocaleString()}</p>}
                  </div>
                )}
              </article>
            ))}
        </div>
        {employee === "sales-ai" && (
          <div
            className="mt-4 flex flex-wrap gap-2"
            aria-label="Sales AI playbooks"
          >
            {salesPrompts.map((prompt) => (
              <Button
                variant="control"
                onClick={() => setValue(prompt)}
                key={prompt}
                className="rounded-full border border-vds-border px-3 py-1.5 text-xs"
              >
                {prompt}
              </Button>
            ))}
          </div>
        )}
        {employee === "crm-ai" && (
          <div
            className="mt-4 flex flex-wrap gap-2"
            aria-label="CRM AI playbooks"
          >
            {crmPrompts.map((prompt) => (
              <Button
                variant="control"
                onClick={() => setValue(prompt)}
                key={prompt}
                className="rounded-full border border-vds-border px-3 py-1.5 text-xs"
              >
                {prompt}
              </Button>
            ))}
          </div>
        )}
        {employee === "whatsapp-ai" && (
          <div
            className="mt-4 flex flex-wrap gap-2"
            aria-label="WhatsApp AI playbooks"
          >
            {whatsappPrompts.map((prompt) => (
              <Button
                variant="control"
                onClick={() => setValue(prompt)}
                key={prompt}
                className="rounded-full border border-vds-border px-3 py-1.5 text-xs"
              >
                {prompt}
              </Button>
            ))}
          </div>
        )}
        {employee === "marketing-ai" && (
          <div
            className="mt-4 flex flex-wrap gap-2"
            aria-label="Marketing AI playbooks"
          >
            {marketingPrompts.map((prompt) => (
              <Button
                variant="control"
                onClick={() => setValue(prompt)}
                key={prompt}
                className="rounded-full border border-vds-border px-3 py-1.5 text-xs"
              >
                {prompt}
              </Button>
            ))}
          </div>
        )}
        {employee === "executive-ai" && (
          <div
            className="mt-4 flex flex-wrap gap-2"
            aria-label="Executive AI playbooks"
          >
            {executivePrompts.map((prompt) => (
              <Button
                variant="control"
                onClick={() => setValue(prompt)}
                key={prompt}
                className="rounded-full border border-vds-border px-3 py-1.5 text-xs"
              >
                {prompt}
              </Button>
            ))}
          </div>
        )}
        <form onSubmit={submit} className="mt-4 flex gap-2">
          <label className="sr-only" htmlFor="workforce-message">
            Message
          </label>
          <textarea
            id="workforce-message"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            rows={2}
            maxLength={20_000}
            placeholder="Ask for analysis or a recommendation…"
            className="min-w-0 flex-1 rounded-xl border border-vds-border bg-vds-elevated px-3 py-2 text-sm"
          />
          <Button
            type="submit"
            disabled={!health.connected || status === "processing"}
          >
            Send
          </Button>
        </form>
        {!health.connected && (
          <p className="mt-2 text-xs text-vds-danger">
            Provider unavailable: {health.reason}. Deterministic fallback
            remains active for non-chat workforce operations.
          </p>
        )}
      </div>
    </section>
  );
}
