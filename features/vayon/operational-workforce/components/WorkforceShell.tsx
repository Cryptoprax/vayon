import Link from "next/link";
import type { ReactNode } from "react";
const links = [
  ["Command Center", "/vayon/ai"],
  ["Workforce", "/vayon/ai/workforce"],
  ["Collaboration", "/vayon/ai/collaboration"],
  ["Tasks", "/vayon/ai/tasks"],
  ["History", "/vayon/ai/history"],
  ["Work Queue", "/vayon/ai/work-queue"],
  ["Goals", "/vayon/ai/goals"],
  ["Automations", "/vayon/ai/automations"],
  ["Approvals", "/vayon/approvals"],
  ["Prompts", "/vayon/ai/playground"],
  ["Knowledge", "/vayon/knowledge"],
] as const;
export function WorkforceShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-[96rem] px-4 py-7 sm:px-6 lg:px-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">
          Live AI Workforce
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-vds-muted">{description}</p>
      </header>
      <nav
        aria-label="AI Workforce"
        className="mt-5 flex gap-1 overflow-x-auto border-y border-vds-border py-3"
      >
        {links.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="vds-focus shrink-0 rounded-lg px-3 py-2 text-sm text-vds-muted hover:bg-vds-hover hover:text-vds-foreground"
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="py-6">{children}</div>
    </main>
  );
}
