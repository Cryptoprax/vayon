import Link from "next/link";
import { Bot, Megaphone, TrendingUp, Users } from "lucide-react";

const cards = [
  {
    label: "Revenue",
    value: "—",
    copy: "No revenue yet.",
    action: "Create first opportunity",
    href: "/vayon/deals/new",
    icon: TrendingUp,
  },
  {
    label: "Customers",
    value: "0",
    copy: "Build your customer pipeline.",
    action: "Import contacts",
    href: "/onboarding/crm",
    icon: Users,
  },
  {
    label: "AI Employees",
    value: "0",
    copy: "Meet your first AI employee.",
    action: "Create AI employee",
    href: "/onboarding/ai-workforce",
    icon: Bot,
  },
  {
    label: "Campaigns",
    value: "0",
    copy: "Turn an idea into a campaign.",
    action: "Generate campaign",
    href: "/vayon/creative/campaigns",
    icon: Megaphone,
  },
] as const;

export function ExecutiveActivationCards() {
  return (
    <section aria-label="Workspace activation" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, copy, action, href, icon: Icon }) => (
        <Link
          className="vds-card-motion group rounded-3xl border border-vds-border bg-vds-surface p-5 shadow-sm shadow-vds-shadow transition hover:-translate-y-0.5 hover:border-vds-accent-border hover:shadow-lg motion-reduce:transform-none"
          href={href}
          key={label}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[.14em] text-vds-subtle">
                {label}
              </p>
              <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
            </div>
            <span className="grid size-10 place-items-center rounded-2xl bg-vds-primary-soft text-vds-primary transition group-hover:scale-105 motion-reduce:transform-none">
              <Icon className="size-5" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-4 text-sm text-vds-muted">{copy}</p>
          <p className="mt-3 text-xs font-medium text-vds-primary">{action} →</p>
        </Link>
      ))}
    </section>
  );
}
