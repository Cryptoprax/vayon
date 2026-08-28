import { CalendarDays, Clock3 } from "lucide-react";

export function ExecutiveGreeting({ userName, workspaceName, organizationDescription }: { readonly userName: string; readonly workspaceName: string; readonly organizationDescription?: string }) {
  const now = new Date();
  return <div>
    <p className="text-sm text-vds-muted">Meet Your AI Team</p>
    <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">Good Morning, {userName.split(" ")[0]}</h1>
    <p className="mt-2 text-base text-vds-secondary">Your AI Team is already working.</p>
    <div className="mt-4 grid gap-2 text-sm text-vds-muted sm:grid-cols-2"><p>Today&apos;s AI activity is shown below.</p><p>Recommended actions use verified workspace evidence.</p></div>
    {organizationDescription && <p className="mt-2 max-w-2xl text-sm text-vds-muted">{organizationDescription}</p>}
    <div className="mt-5 flex flex-wrap gap-2 text-xs text-vds-muted"><span className="rounded-full border border-vds-border bg-vds-input px-3 py-1.5">{workspaceName}</span><span className="inline-flex items-center gap-2 rounded-full border border-vds-border bg-vds-input px-3 py-1.5" suppressHydrationWarning><CalendarDays className="size-4"/>{new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(now)}</span><span className="inline-flex items-center gap-2 rounded-full border border-vds-border bg-vds-input px-3 py-1.5" suppressHydrationWarning><Clock3 className="size-4"/>{new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(now)}</span></div>
  </div>;
}
