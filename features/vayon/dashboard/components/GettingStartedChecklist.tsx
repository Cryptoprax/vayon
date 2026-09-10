import Link from "next/link";
import { Check } from "lucide-react";
import type { ExecutiveDashboardData } from "../types";

export function GettingStartedChecklist({ data }: { readonly data: ExecutiveDashboardData }) {
  const count = (key: string) => data.kpis.find((item) => item.key === key)?.value ?? 0;
  const observed = (event: RegExp) => data.activities.some(item => event.test(item.eventType));
  const items = [
    ["Create First Property", "/vayon/properties/new", count("properties") > 0],
    ["Create First Lead", "/vayon/leads/new", count("leads") > 0],
    ["Invite Team", "/vayon/settings/members", observed(/(?:member|team)[._]invited/)],
    ["Create First Task", "/vayon/tasks", count("tasks") > 0 || observed(/task[._](?:created|completed)/)],
    ["Promote a Property", "/vayon/properties", observed(/campaign[._]created/)],
  ] as const;
  const next = items.find(([, , done]) => !done);
  return <section className="rounded-2xl border border-vds-border bg-vds-surface p-5" aria-labelledby="getting-started-title">
    <h2 id="getting-started-title" className="text-xl font-semibold">Getting Started</h2>
    <p className="mt-2 text-sm text-vds-muted">Start with a property and a lead, then plan your first follow-up. Choose any step you need.</p>
    {next && <p className="mt-4 text-sm font-semibold text-vds-primary">Suggested next step: {next[0]}</p>}
    <ol aria-label="Your first steps" className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([label, href, done], index) => <li key={label}>
        <Link className="vds-focus flex min-h-11 h-full items-center gap-3 rounded-xl border border-vds-border p-3 text-sm hover:bg-vds-elevated" href={href}>
          <span aria-hidden="true" className={`grid size-5 shrink-0 place-items-center rounded-full border ${done ? "border-vds-success bg-vds-success-soft text-vds-success" : "border-vds-border"}`}>{done ? <Check className="size-3" /> : index + 1}</span>
          <span>{label}{done && <span className="sr-only"> — activity recorded</span>}</span>
        </Link>
      </li>)}
    </ol>
    <details className="mt-3">
      <summary className="focus-ring flex min-h-11 cursor-pointer items-center rounded-lg text-sm font-medium">Business details and optional setup</summary>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        <Link className="focus-ring rounded-xl border border-vds-border p-3 text-sm" href="/vayon/settings/organization">Business details</Link>
        <Link className="focus-ring rounded-xl border border-vds-border p-3 text-sm" href="/vayon/whatsapp/settings">Connect WhatsApp{data.whatsappConversations.length > 0 && <span className="sr-only"> — activity recorded</span>}</Link>
        <Link className="focus-ring rounded-xl border border-vds-border p-3 text-sm" href="/vayon/settings/integrations/data-import">Import existing contacts</Link>
      </div>
    </details>
  </section>;
}
