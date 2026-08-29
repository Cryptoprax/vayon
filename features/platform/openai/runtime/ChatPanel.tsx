"use client";
import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import type { AIEmployeeCode, OpenAIHealth } from "../domain/models";
import type { ConversationSnapshot, WorkforceMessage } from "./models";
import { Button } from "@/features/platform/design-system";

export interface EmployeeConversationContext {
  readonly name: string;
  readonly role: string;
  readonly avatar: string;
  readonly workspace: string;
  readonly currentFocus: string;
  readonly goals: readonly string[];
  readonly knowledgeCoverage: string;
  readonly businessImpact: string;
  readonly evidenceCount: number;
  readonly sourceModules: readonly string[];
  readonly relatedRecords: readonly { readonly type: string; readonly label: string }[];
  readonly lastActivity: string | null;
  readonly recommendationIds: readonly string[];
}

export function WorkforceChatPanel({
  employee,
  initial,
  health,
  initialPrompt = "",
  explainability,
  context,
}: {
  employee: AIEmployeeCode;
  initial: ConversationSnapshot;
  health: OpenAIHealth;
  initialPrompt?: string;
  explainability?: { readonly evidence: number; readonly entities: number; readonly confidence: number | null; readonly sources: readonly string[]; readonly timestamp: string };
  context?: EmployeeConversationContext;
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
  const visibleMessages = useMemo(() => messages.filter((item) => item.content.toLowerCase().includes(query.toLowerCase())), [messages, query]);
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
  const colleaguePrompts: Partial<Record<AIEmployeeCode, readonly string[]>> = {
    "sales-ai": ["Show me today's hottest leads.", "Which deals are stalled?", "Who needs follow-up?", "Show high-value customers."],
    "crm-ai": ["Match buyers to listings.", "Show luxury buyers.", "Which properties need updates?", "Show upcoming viewings."],
    "marketing-ai": ["Show marketing opportunities.", "What campaign should we launch next?", "Which listings need promotion?", "Show creative recommendations."],
    "operations-ai": ["Show today's operations.", "Do I have scheduling conflicts?", "Show pending approvals.", "Give me a task overview."],
    "whatsapp-ai": ["Show customer health.", "Which customers are inactive?", "Show review requests.", "Show retention opportunities."],
  };
  const suggested = colleaguePrompts[employee] ?? (employee === "executive-ai" ? executivePrompts : employee === "sales-ai" ? salesPrompts : employee === "crm-ai" ? crmPrompts : employee === "whatsapp-ai" ? whatsappPrompts : marketingPrompts);

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
    if (context && context.evidenceCount === 0) {
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        conversationId: conversationId ?? "pending",
        role: "assistant",
        content: "I don't have enough verified information to answer that yet.",
        model: null,
        usage: null,
        cost: null,
        latencyMs: null,
        createdAt: new Date().toISOString(),
        recommendationOnly: true,
      }]);
      setStatus("idle");
      return;
    }
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
    <section className="grid gap-5 xl:grid-cols-[16rem_minmax(0,1fr)_18rem]" aria-labelledby="conversation-workspace-title">
      <aside className="rounded-3xl border border-vds-border bg-vds-surface/90 p-4 backdrop-blur [content-visibility:auto]">
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
          {!visible.length && <p className="rounded-xl border border-dashed border-vds-border p-3 text-xs text-vds-muted">No matching conversation history.</p>}
        </div>
        <div className="mt-6 border-t border-vds-border pt-4"><p className="text-xs font-semibold uppercase tracking-[.14em] text-vds-primary">Session Memory</p><p className="mt-3 text-xs text-vds-muted">Recent Questions · {messages.filter(item => item.role === "user").length}</p><p className="mt-2 text-xs text-vds-muted">Recent Topics · {context?.sourceModules.join(", ") || "Awaiting context"}</p><p className="mt-2 text-xs text-vds-muted">Recent Recommendations · {context?.recommendationIds.length ?? 0}</p><p className="mt-3 text-[10px] text-vds-subtle">Presentation only · session scoped · no long-term LLM memory</p></div>
      </aside>
      <div className="rounded-[2rem] border border-vds-accent-border bg-gradient-to-br from-vds-primary-soft/40 via-vds-surface to-vds-elevated p-5 shadow-2xl shadow-vds-shadow/10">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-vds-primary-soft text-sm font-semibold text-vds-primary" aria-label={`${context?.name ?? "AI employee"} avatar`}>{context?.avatar ?? "AI"}</span>
            <div>
            <h2 id="conversation-workspace-title" className="font-semibold">Conversation with {context?.name ?? "your AI employee"}</h2>
            <p className="text-xs text-vds-muted">
              Workspace-attributed · {health.model} ·{" "}
              {health.connected
                ? `Provider healthy · ${health.latencyMs ?? "—"} ms`
                : health.reason}{" "}
              · recommendation only
            </p>
            </div>
          </div>
          <span className="rounded-full border border-vds-border px-3 py-1 text-xs font-semibold uppercase">
            {status}
          </span>
        </header>
        <div
          aria-live="polite"
          className="mt-4 min-h-64 space-y-3 rounded-xl bg-vds-elevated p-4"
        >
          {!messages.length && <div className="grid min-h-52 place-items-center text-center"><div><p className="text-lg font-semibold">Ask me anything about your business.</p><p className="mt-2 text-sm text-vds-muted">I&apos;ll answer from verified workspace evidence and clearly explain any limitations.</p></div></div>}
          {visibleMessages
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
                {item.role === "assistant" ? <div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-vds-primary">Summary</p><p className="mt-2 whitespace-pre-wrap">{item.content}</p><div className="mt-4 grid gap-2 sm:grid-cols-2"><ResponseField label="Reasoning" value={context?.evidenceCount ? `Prepared from ${context.evidenceCount} verified workspace signals.` : "I don't have enough verified information to answer that yet."}/><ResponseField label="Confidence" value={context?.evidenceCount ? `${Math.round((explainability?.confidence ?? .7) * 100)}%` : "Not available"}/><ResponseField label="Business Impact" value={context?.businessImpact ?? "Not available"}/><ResponseField label="Approval Required" value="Yes · recommendation only"/></div><details className="mt-4 rounded-xl border border-vds-border bg-vds-elevated/60 p-3 [content-visibility:auto]"><summary className="cursor-pointer font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vds-focus">Evidence Panel</summary><dl className="mt-3 grid gap-2 text-xs"><ResponseField label="Related Customer" value={related(context,"Customer")}/><ResponseField label="Related Property" value={related(context,"Property")}/><ResponseField label="Related Task" value={related(context,"Task")}/><ResponseField label="Related Campaign" value={related(context,"Campaign")}/><ResponseField label="Related Meeting" value={related(context,"Meeting")}/><ResponseField label="Last Activity" value={context?.lastActivity ?? "No verified activity"}/><ResponseField label="Source Module" value={context?.sourceModules.join(", ") || "No verified source"}/></dl></details><div className="mt-4"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-vds-primary">Recommended Actions</p><div className="mt-2 flex flex-wrap gap-3 text-xs"><Link href={approvalHref(context,"approve")} className="text-vds-primary">Approve</Link><Link href={approvalHref(context,"modify")} className="text-vds-primary">Modify</Link><Link href={approvalHref(context,"reject")} className="text-vds-primary">Reject</Link><Link href={approvalHref(context,"explain")} className="text-vds-primary">Explain</Link><Link href={relatedHref(employee)} className="text-vds-primary">View Related Record</Link></div></div><div className="mt-4 border-t border-vds-border pt-3"><p className="text-xs text-vds-muted">Follow-up questions</p><div className="mt-2 flex flex-wrap gap-2">{suggested.slice(0,3).map(prompt=><Button variant="control" className="rounded-full px-3 py-1 text-xs" onClick={()=>setValue(prompt)} key={prompt}>{prompt}</Button>)}</div></div></div> : <p className="whitespace-pre-wrap">{item.content}</p>}
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
          {status === "processing" && <div className="flex items-center gap-2 text-xs text-vds-muted" role="status"><span className="sr-only">Typing Indicator:</span><span className="motion-safe:animate-pulse" aria-hidden="true">● ● ●</span>{context?.name ?? "AI employee"} is reviewing verified evidence…</div>}
        </div>
        {suggested.length > 0 && (
          <div
            className="mt-4 flex flex-wrap gap-2"
            aria-label={`${context?.name ?? "AI employee"} suggested questions`}
          >
            {suggested.map((prompt) => (
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
      <aside className="space-y-4 [content-visibility:auto]" aria-label="Conversation context"><section className="rounded-3xl border border-vds-border bg-vds-surface/90 p-5 backdrop-blur"><p className="text-xs font-semibold uppercase tracking-[.15em] text-vds-primary">Workspace Context</p><h2 className="mt-2 font-semibold">{context?.workspace ?? "Current workspace"}</h2><dl className="mt-4 space-y-2 text-xs"><ResponseField label="Current Employee" value={`${context?.name ?? "AI employee"} · ${context?.role ?? "Business colleague"}`}/><ResponseField label="Current Focus" value={context?.currentFocus ?? "Awaiting evidence"}/><ResponseField label="Today's Goals" value={context?.goals.join(" · ") || "Awaiting evidence"}/><ResponseField label="Knowledge Coverage" value={context?.knowledgeCoverage ?? "Ready"}/><ResponseField label="Business Impact" value={context?.businessImpact ?? "Not available"}/></dl></section><section className="rounded-3xl border border-vds-border bg-vds-surface/90 p-5"><p className="text-xs font-semibold uppercase tracking-[.15em] text-vds-primary">Governance</p><p className="mt-3 text-sm text-vds-muted">Workspace scoped · evidence backed · recommendation only · human approval governed.</p><p className="mt-3 text-xs text-vds-subtle">No CRM mutations, workflow execution, outbound communication, or autonomous action.</p></section></aside>
    </section>
  );
}

function ResponseField({label,value}:{label:string;value:string}) { return <div className="rounded-lg bg-vds-surface/60 p-2"><dt className="text-vds-subtle">{label}</dt><dd className="mt-1 text-vds-muted">{value}</dd></div>; }
function related(context:EmployeeConversationContext|undefined,type:string) { return context?.relatedRecords.find(record=>record.type===type)?.label ?? "No verified record"; }
function approvalHref(context:EmployeeConversationContext|undefined,decision:string) { const id=context?.recommendationIds[0]; return `/vayon/approvals?${id?`recommendation=${encodeURIComponent(id)}&`:""}decision=${decision}`; }
function relatedHref(employee:AIEmployeeCode) { return employee==="crm-ai"?"/vayon/properties":employee==="marketing-ai"?"/vayon/marketing":employee==="operations-ai"?"/vayon/calendar":employee==="whatsapp-ai"?"/vayon/communications":"/vayon/crm"; }
