import Link from "next/link";
import { Check } from "lucide-react";
import { Progress } from "@/features/platform/design-system";
import type { ExecutiveDashboardData } from "../types";

export function GettingStartedChecklist({ data }: { readonly data: ExecutiveDashboardData }) {
  const count = (key: string) => data.kpis.find((item) => item.key === key)?.value ?? 0;
  const imported = data.activities.some((item) => /import/i.test(`${item.eventType} ${item.title}`));
  const items = [
    ["Complete Company Profile", "/vayon/settings/organization", data.organizationName !== "Organization"],
    ["Add First Property", "/vayon/properties/new", count("properties") > 0],
    ["Add First Lead", "/vayon/leads/new", count("leads") > 0],
    ["Invite Team", "/vayon/settings/members", false],
    ["Connect WhatsApp (Optional)", "/vayon/whatsapp/settings", data.whatsappConversations.length > 0],
    ["Import Contacts (Optional)", "/vayon/settings/integrations/data-import", imported],
  ] as const;
  const completed = items.filter((item) => item[2]).length;
  const percentage = Math.round((completed / items.length) * 100);

  return <section className="rounded-2xl border border-vds-border bg-vds-surface p-5" aria-labelledby="getting-started-title"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-vds-primary">Workspace activation</p><h2 id="getting-started-title" className="mt-1 text-xl font-semibold">Getting Started</h2></div><p className="text-sm font-medium" aria-label={`${percentage}% workspace completion`}>{percentage}% complete</p></div><div className="mt-4"><Progress value={percentage} label="Workspace completion" /></div><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{items.map(([label, href, done]) => <Link className="vds-focus flex min-h-11 items-center gap-3 rounded-xl border border-vds-border p-3 text-sm hover:bg-vds-elevated" href={href} key={label}><span aria-hidden="true" className={`grid size-5 shrink-0 place-items-center rounded-full border ${done ? "border-vds-success bg-vds-success-soft text-vds-success" : "border-vds-border"}`}>{done && <Check className="size-3" />}</span><span className={done ? "text-vds-muted line-through" : ""}>{label}</span></Link>)}</div></section>;
}
