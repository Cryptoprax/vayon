import { Bot, CalendarDays, Check, Mail, MessageCircle, Sparkles } from "lucide-react";
import { Badge, ButtonLink } from "@/features/platform/design-system";

const card = "rounded-2xl border border-vds-border bg-vds-surface p-5";

const aiChoices = [
  ["OpenAI", "Recommended", "Balanced for everyday sales, operations, and customer work."],
  ["Claude", "Great for writing", "A clear choice for long-form content and thoughtful drafts."],
  ["Gemini", "Fast responses", "Designed for quick assistance across daily work."],
  ["Local AI", "Private deployment", "For teams that require a privately managed environment."],
] as const;

export function AiChoiceCards() {
  return <section className={card} aria-labelledby="ai-choice-title">
    <div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-xl bg-vds-primary-soft text-vds-primary"><Bot className="size-5" aria-hidden="true" /></span><div><h2 id="ai-choice-title" className="font-semibold">Choose how VAYON assists your team</h2><p className="mt-1 text-sm text-vds-muted">Choose a card. VAYON handles the setup.</p></div></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2">{aiChoices.map(([name, label, description], index) => <article key={name} className={`rounded-2xl border p-4 ${index === 0 ? "border-vds-accent-border bg-vds-primary-soft" : "border-vds-border"}`}><div className="flex items-center justify-between gap-3"><h3 className="font-medium">{name}</h3><Badge>{index === 0 ? "Selected" : label}</Badge></div><p className="mt-2 text-sm text-vds-muted">{description}</p>{index === 0 ? <p className="mt-4 flex items-center gap-2 text-sm font-medium text-vds-success"><Check className="size-4" aria-hidden="true" />Ready to use</p> : <p className="mt-4 text-sm text-vds-subtle">Available when enabled for your workspace</p>}</article>)}</div>
  </section>;
}

const connections = [
  { group: "Email", icon: Mail, items: [["Connect Gmail", "/vayon/settings/google"], ["Connect Microsoft 365", "/vayon/settings/integrations/microsoft"]] },
  { group: "Calendar", icon: CalendarDays, items: [["Google Calendar", "/vayon/settings/google"], ["Microsoft Calendar", "/vayon/settings/integrations/microsoft"]] },
] as const;

export function OneClickConnections() {
  return <main className="mx-auto max-w-[96rem] px-5 py-8"><header><p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">One-click setup</p><h1 className="mt-2 text-3xl font-semibold">Connect the tools your team already uses</h1><p className="mt-2 max-w-2xl text-sm text-vds-muted">Choose a service and follow the secure sign-in. There are no keys, endpoints, or technical values to copy.</p></header>
    <section className="mt-7 grid gap-4 lg:grid-cols-2" aria-label="Quick connections">{connections.map(({ group, icon: Icon, items }) => <article className={card} key={group}><Icon className="size-5 text-vds-primary" aria-hidden="true" /><h2 className="mt-3 font-semibold">{group}</h2><div className="mt-4 flex flex-wrap gap-3">{items.map(([label, href]) => <ButtonLink key={label} href={href}>{label}</ButtonLink>)}</div>{group === "Email" && <p className="mt-4 text-sm text-vds-subtle">Additional providers coming soon.</p>}{group === "Calendar" && <p className="mt-4 text-sm text-vds-subtle">Apple Calendar · Coming Soon</p>}</article>)}</section>
    <section className="mt-4"><article className={card}><MessageCircle className="size-5 text-vds-primary" aria-hidden="true" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">WhatsApp Business</h2><p className="mt-1 text-sm text-vds-muted">Not Connected</p></div><ButtonLink href="/vayon/whatsapp/settings">Connect WhatsApp Business</ButtonLink></div></article></section>
  </main>;
}

export function SimpleConfigurationIntro() {
  return <section className={`${card} mb-5`}><div className="flex gap-3"><Sparkles className="size-5 shrink-0 text-vds-primary" aria-hidden="true" /><div><h2 className="font-semibold">VAYON is ready for your team</h2><p className="mt-1 text-sm text-vds-muted">Start with the recommended setup. Pipelines, forms, and automations use practical defaults and can be refined later.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-3">{["Sales workspace", "Real estate workflow", "Team preferences"].map((item) => <div key={item} className="flex items-center gap-2 rounded-xl bg-vds-input px-4 py-3 text-sm"><Check className="size-4 text-vds-success" aria-hidden="true" />{item}</div>)}</div></section>;
}
