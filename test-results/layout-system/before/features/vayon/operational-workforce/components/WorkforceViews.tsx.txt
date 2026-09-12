import Link from "next/link";
import type {
  WorkforceActivity,
  WorkforceEmployee,
  WorkforceSnapshot,
  WorkforceTask,
} from "../domain/models";
import { workforceSummary } from "../view-models/workforce";
import { WorkforceDirectory } from "./WorkforceDirectory";
const card = "rounded-2xl border border-vds-border bg-vds-surface p-5";
export function CommandCenter({ snapshot }: { snapshot: WorkforceSnapshot }) {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-vds-border bg-gradient-to-br from-vds-primary-soft via-vds-surface to-vds-elevated p-6 sm:p-8" aria-labelledby="team-dashboard-title"><p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">Your AI Real Estate Company</p><h1 id="team-dashboard-title" className="mt-3 text-3xl font-semibold sm:text-4xl">Meet Your AI Team</h1><p className="mt-3 text-sm text-vds-muted">Your specialists prepare work from verified workspace evidence. You approve every important action.</p><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[["Workload Overview", snapshot.tasks.filter((task) => task.status === "pending" || task.status === "running").length ? `${snapshot.tasks.filter((task) => task.status === "pending" || task.status === "running").length} active assignments` : "Waiting for first assignments"],["Employee Health", snapshot.employees.some((employee) => employee.health === "degraded") ? "Needs attention" : "Team ready"],["Today's Productivity", `${snapshot.tasks.filter((task) => task.status === "completed").length} verified tasks completed`],["Current Priorities", snapshot.tasks.find((task) => task.status === "running")?.title ?? "Assign the first priority"],["Suggested Actions", "Review each employee’s recommendation"],["Upcoming Deadlines", snapshot.tasks.some((task) => task.deadline) ? "Review scheduled work" : "No verified deadlines"]].map(([label,value])=><article className={card} key={label}><p className="text-xs text-vds-muted">{label}</p><p className="mt-2 font-medium">{value}</p></article>)}</div></section>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {workforceSummary(snapshot).map((x) => (
          <article key={x.label} className={card}>
            <p className="text-xs text-vds-muted">{x.label}</p>
            <p className="mt-3 text-xl font-semibold">{x.value}</p>
          </article>
        ))}
      </section>
      <WorkforceDirectory items={snapshot.employees} />
      <section aria-labelledby="executive-workforce-title">
        <div className="mb-3"><p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">Executive dashboard</p><h2 id="executive-workforce-title" className="mt-2 font-semibold">AI workforce impact</h2></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">{[
          ["AI utilization", snapshot.employees.length ? `${Math.round(snapshot.employees.filter((item) => item.status === "processing").length / snapshot.employees.length * 100)}%` : "Unavailable"],
          ["Tasks completed", snapshot.tasks.filter((item) => item.status === "completed").length],
          ["Time saved", "Unavailable"],
          ["Revenue influenced", "Unavailable"],
          ["Meetings created", "Unavailable"],
          ["Emails drafted", "Unavailable"],
          ["Customer interactions", "Unavailable"],
        ].map(([label, value]) => <article className={card} key={label}><p className="text-xs text-vds-muted">{label}</p><p className="mt-3 text-lg font-semibold">{value}</p></article>)}</div>
      </section>
      <section className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <article className={card}>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">Multi-agent collaboration</p>
          <h2 className="mt-2 font-semibold">Governed customer workflow</h2>
          <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-2" aria-label="AI collaboration workflow">{["Sales Executive", "CRM Manager", "Meeting Coordinator", "Reporting Analyst", "Executive Assistant"].map((role, index) => <div className="flex shrink-0 items-center gap-2" key={role}><span className="rounded-xl border border-vds-border bg-vds-elevated px-3 py-2 text-xs">{role}</span>{index < 4 && <span aria-hidden="true" className="text-vds-primary">→</span>}</div>)}</div>
          <p className="mt-3 text-xs text-vds-muted">Agents exchange tenant-scoped recommendations only. Approval remains mandatory before sensitive execution.</p>
          <Link href="/vayon/ai/collaboration" className="mt-4 inline-block text-sm text-vds-primary">Open collaboration graph</Link>
        </article>
        <article className={card}>
          <h2 className="font-semibold">Operating controls</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><Link href="/vayon/approvals" className="rounded-xl bg-vds-elevated p-3">Approval queue</Link><Link href="/vayon/ai/tasks" className="rounded-xl bg-vds-elevated p-3">Task orchestration</Link><Link href="/vayon/ai/playground" className="rounded-xl bg-vds-elevated p-3">Prompt library</Link><Link href="/vayon/knowledge" className="rounded-xl bg-vds-elevated p-3">Knowledge hub</Link></div>
        </article>
      </section>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <section>
          <div className="mb-3 flex justify-between">
            <h2 className="font-semibold">Workforce overview</h2>
            <Link
              href="/vayon/ai/workforce"
              className="text-sm text-vds-primary"
            >
              View workforce
            </Link>
          </div>
          <ActivityList items={snapshot.activity.slice(0, 12)} />
        </section>
        <section>
          <h2 className="mb-3 font-semibold">Upcoming work</h2>
          <TaskList
            items={snapshot.tasks
              .filter((x) => x.status === "pending" || x.status === "running")
              .slice(0, 8)}
          />
        </section>
      </div>
      <section className="relative overflow-hidden rounded-[2rem] border border-vds-border bg-gradient-to-br from-vds-primary-soft via-vds-surface to-vds-elevated p-6 shadow-xl shadow-vds-shadow/10 sm:p-8">
        <h2 className="font-semibold">System observability</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(snapshot.observability).map(([key, value]) => (
            <div key={key}>
              <dt className="text-xs capitalize text-vds-muted">
                {key.replaceAll(/([A-Z])/g, " $1")}
              </dt>
              <dd className="mt-1 text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className={card}><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">Connector readiness</p><h2 className="mt-2 font-semibold">Future employee tools</h2></div><p className="text-xs text-vds-muted">Architecture placeholders · no provider calls</p></div><div className="mt-4 flex flex-wrap gap-2">{["WhatsApp", "Email", "Calendar", "Voice", "Slack", "Microsoft Teams", "Google Drive", "Dropbox", "Stripe", "Razorpay"].map((connector) => <span className="rounded-full border border-dashed border-vds-border px-3 py-1.5 text-xs text-vds-muted" key={connector}>{connector} · future</span>)}</div></section>
    </div>
  );
}
export function EmployeeGrid({
  items,
}: {
  items: readonly WorkforceEmployee[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Link
          href={`/vayon/ai/workforce/${item.id}`}
          key={item.id}
          className={`${card} block transition hover:-translate-y-0.5 hover:border-vds-border-strong`}
        >
          <div className="flex gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-vds-primary-soft font-semibold text-vds-primary">
              {item.avatar}
            </span>
            <div>
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-xs text-vds-muted">{item.role}</p>
            </div>
            <span className="ml-auto h-fit rounded-full border border-vds-border px-2 py-1 text-[10px] capitalize">
              {item.status}
            </span>
          </div>
          <p className="mt-4 text-sm text-vds-muted">{item.description}</p>
          <div className="mt-4 flex justify-between text-xs">
            <span>Queue {item.currentQueue}</span>
            <span>{item.health}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
export function TaskList({ items }: { items: readonly WorkforceTask[] }) {
  return (
    <div className="space-y-3">
      {items.length ? (
        items.map((item) => (
          <article
            key={item.id}
            className={`${card} [contain-intrinsic-size:0_180px] [content-visibility:auto]`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs text-vds-primary">{item.type}</p>
                <h3 className="mt-1 font-medium">{item.title}</h3>
              </div>
              <span className="rounded-full bg-vds-elevated px-2 py-1 text-xs capitalize">
                {item.status}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-vds-muted">
              <div>Priority: {item.priority}</div>
              <div>Owner: {item.owner}</div>
              <div>Created: {new Date(item.createdAt).toLocaleString()}</div>
              <div>Duration: {item.duration ?? "Awaiting completion"}</div>
              <div>Deadline: {item.deadline ? new Date(item.deadline).toLocaleString() : "Not scheduled"}</div>
              <div>Progress: {item.progress ?? (item.status === "completed" ? 100 : item.status === "running" ? 50 : 0)}%</div>
              <div>Approval: {item.approvalState ?? "pending"}</div>
              <div>Dependencies: {item.dependencies?.join(", ") || "None recorded"}</div>
            </dl>
          </article>
        ))
      ) : (
        <Empty text="Your AI Team is waiting to start working. Create your first property, import your first lead, or launch your first campaign." />
      )}
    </div>
  );
}
export function ActivityList({
  items,
}: {
  items: readonly WorkforceActivity[];
}) {
  return (
    <div className="space-y-3">
      {items.length ? (
        items.map((item) => (
          <article
            key={item.id}
            className={`${card} border-l-2 border-l-vds-primary`}
          >
            <h3 className="font-medium">{item.title}</h3>
            <p className="mt-1 text-sm text-vds-muted">{item.detail}</p>
            <time className="mt-2 block text-xs text-vds-muted">
              {new Date(item.occurredAt).toLocaleString()}
            </time>
          </article>
        ))
      ) : (
        <Empty text="Your AI Team is waiting to start working. Assign the first approved task to begin the activity feed." />
      )}
    </div>
  );
}
export function EmployeeProfile({
  item,
  tasks,
  activity,
}: {
  item: WorkforceEmployee;
  tasks: readonly WorkforceTask[];
  activity: readonly WorkforceActivity[];
}) {
  return (
    <div className="space-y-6">
      <section className={card}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <span className="grid size-24 place-items-center rounded-[2rem] border border-vds-accent-border bg-vds-primary-soft text-3xl font-semibold text-vds-primary shadow-lg">
            {item.avatar}
          </span>
          <div>
            <h2 className="text-2xl font-semibold">{item.name}</h2>
            <p className="text-sm text-vds-muted">
              {item.role} · v{item.version}
            </p>
          </div>
          <span className="md:ml-auto inline-flex items-center gap-2 rounded-full border border-vds-border bg-vds-input px-3 py-1.5 text-xs capitalize">
            <i className={`size-2 rounded-full ${item.status === "processing" ? "bg-vds-warning motion-safe:animate-pulse" : item.status === "error" || item.status === "offline" ? "bg-vds-danger" : "bg-vds-success"}`}/>{headquartersStatus(item)}
          </span>
        </div>
        <div className="mt-6 max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">Mission</p><p className="mt-2 text-sm leading-6 text-vds-muted">{item.description}</p></div>
      </section>
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Overview">
          <p>{item.description}</p>
          <p className="mt-3"><b>Availability:</b> {item.availability}</p>
        </Panel>
        <Panel title="Personality">
          <p><b>Working Style:</b> {personality(item.code).workingStyle}</p>
          <p className="mt-2"><b>Strengths:</b> {personality(item.code).strengths}</p>
          <p className="mt-2"><b>Communication Style:</b> {personality(item.code).communication}</p>
        </Panel>
        <Panel title="Experience and Mission">
          <p><b>Specialization:</b> {item.capabilities.slice(0, 3).join(", ")}</p>
          <p className="mt-2"><b>Experience:</b> Real estate operations and customer journey support.</p>
          <p className="mt-2"><b>Mission:</b> {personality(item.code).mission}</p>
        </Panel>
        <Panel title="Recommendations">
          <p>{tasks.length ? "Review the highest-priority assignment and approve the recommended next action." : waitingMessage(item.code)}</p>
          <p className="mt-3">Recommendations prepare actions only. You remain in control.</p>
        </Panel>
        <Panel title="Assigned Customers"><p>{item.memory.assignedCustomers ? `${item.memory.assignedCustomers} assigned customers` : `${item.name} is waiting for assigned customers.`}</p></Panel>
        <Panel title="Assigned Properties"><p>{item.code === "crm-ai" ? "Emma is waiting for properties." : "Property assignments will appear when verified workspace records are connected."}</p></Panel>
      </div>
      <section>
        <h2 className="mb-3 font-semibold">Today&apos;s Work and Current Work</h2>
        <TaskList items={tasks} />
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Performance">
          {item.performance.map((x) => (
            <p
              key={x.label}
              className="flex justify-between border-b border-vds-border py-2"
            >
              <span>{x.label}</span>
              <strong>{x.value}</strong>
            </p>
          ))}
        </Panel>
        <Panel title="Deterministic memory">
          <p>
            <b>Customer context:</b> {item.memory.customerContext}
          </p>
          <p className="mt-3">
            <b>Recent decisions:</b> {item.memory.recentDecisions}
          </p>
          <p className="mt-3">
            <b>Learned preferences:</b> {item.memory.learnedPreferences}
          </p>
          <p className="mt-3">
            <b>Recent outcomes:</b> {item.memory.recentOutcomes}
          </p>
          <p className="mt-3">
            <b>Objectives:</b> {item.memory.currentObjectives}
          </p>
        </Panel>
      </div>
      <section>
        <h2 className="mb-3 font-semibold">Activity Feed</h2>
        <ActivityList items={activity} />
      </section>
      <div className="grid gap-5 lg:grid-cols-2"><Panel title="Upcoming Tasks"><p>{tasks.some((task) => task.status === "pending") ? "Upcoming assignments are listed in Today’s Work." : "Waiting for first assignment."}</p></Panel><Panel title="Recent Achievements"><p>{activity.length ? `${activity.length} verified achievement${activity.length === 1 ? "" : "s"} recorded.` : "Achievements will appear after completed, verified work."}</p></Panel></div>
    </div>
  );
}
function personality(code: string) { const profiles: Record<string, {workingStyle:string;strengths:string;communication:string;mission:string}> = {
  "sales-ai": { workingStyle: "Persistent and relationship-focused", strengths: "Lead qualification and negotiation", communication: "Confident, clear and considerate", mission: "Help the sales team focus on the buyers and deals that matter most." },
  "crm-ai": { workingStyle: "Analytical and attentive", strengths: "Buyer matching and neighborhood knowledge", communication: "Practical and consultative", mission: "Connect every buyer with the right verified property context." },
  "marketing-ai": { workingStyle: "Creative and growth-focused", strengths: "Campaign strategy and storytelling", communication: "Concise, energetic and brand-aware", mission: "Prepare campaigns that create demand and support revenue growth." },
  "operations-ai": { workingStyle: "Organized and dependable", strengths: "Prioritization and coordination", communication: "Calm, direct and structured", mission: "Keep the real estate operation moving without missed work." },
  "whatsapp-ai": { workingStyle: "Warm and customer-focused", strengths: "Customer care and retention", communication: "Empathetic, timely and professional", mission: "Make every customer feel heard and supported." },
}; return profiles[code] ?? { workingStyle: "Thoughtful and evidence-led", strengths: "Business support", communication: "Professional and clear", mission: "Prepare useful work while keeping people in control." }; }
function waitingMessage(code: string) { return ({"sales-ai":"Sarah is waiting for her first leads.","crm-ai":"Emma is waiting for properties.","marketing-ai":"Alex is ready to launch your first campaign.","operations-ai":"David is waiting to organize your operations.","whatsapp-ai":"Olivia is ready to support your customers."} as Record<string,string>)[code] ?? "Waiting for first assignment."; }
function headquartersStatus(item: WorkforceEmployee) { if (item.status === "processing") return "Working"; if (item.status === "error") return "Review Required"; if (item.status === "offline") return "Offline"; return "Available"; }
function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={card}>
      <h2 className="mb-4 font-semibold">{title}</h2>
      <div className="text-sm leading-6 text-vds-muted">{children}</div>
    </section>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-vds-border p-10 text-center text-sm text-vds-muted">
      {text}
    </div>
  );
}
