import Link from "next/link";
import type { ReactNode } from "react";
import type {
  DealChecklist,
  DealContract,
  DealGuidance,
  DealOffer,
  DealRoomSnapshot,
} from "../domain/models";
import { dealAnalytics, pipelineStages } from "../view-models/deal";
const card =
  "rounded-2xl border border-vds-border bg-vds-surface p-5 shadow-vds-sm";
export function DealRoomShell({ children }: { children: ReactNode }) {
  const nav = [
    ["Transactions", "/vayon/deals"],
    ["Pipeline", "/vayon/deals/pipeline"],
    ["Offers", "/vayon/deals/offers"],
    ["Contracts", "/vayon/deals/contracts"],
    ["Checklists", "/vayon/deals/checklists"],
    ["Analytics", "/vayon/deals/analytics"],
  ];
  return (
    <div>
      <nav
        aria-label="Deal room"
        className="mx-auto flex max-w-[110rem] gap-2 overflow-x-auto px-5 pt-6"
      >
        {nav.map(([l, h]) => (
          <Link
            className="shrink-0 rounded-full border border-vds-border bg-vds-surface px-4 py-2 text-sm text-vds-muted hover:text-vds-foreground"
            href={h}
            key={h}
          >
            {l}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
export function Header({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header>
      <p className="text-xs uppercase tracking-[.2em] text-vds-primary">
        Real Estate Transaction Center
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm text-vds-muted">{description}</p>
    </header>
  );
}
export function Pipeline({ s }: { s: DealRoomSnapshot }) {
  return (
    <section className="mt-6 flex gap-4 overflow-x-auto pb-4">
      {pipelineStages.map((stage) => (
        <article className={`${card} min-w-72`} key={stage}>
          <div className="flex justify-between">
            <h2 className="font-semibold capitalize">
              {stage.replaceAll("-", " ")}
            </h2>
            <span className="text-sm text-vds-muted">
              {s.deals.filter((d) => d.currentStage === stage).length}
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {s.deals
              .filter((d) => d.currentStage === stage)
              .slice(0, 8)
              .map((d) => (
                <Link
                  className="block rounded-xl bg-vds-elevated p-3"
                  href={`/vayon/deals/${d.id}`}
                  key={d.id}
                >
                  <p className="text-sm font-medium">{d.title}</p>
                  <p className="mt-1 text-xs text-vds-muted">
                    {d.referenceNumber} · {d.probability}%
                  </p>
                </Link>
              ))}
          </div>
          <p className="mt-4 text-xs text-vds-muted">
            Read-only drag preview · stage mutation disabled
          </p>
        </article>
      ))}
    </section>
  );
}
function Records({
  title,
  items,
}: {
  title: string;
  items: readonly (DealOffer | DealContract)[];
}) {
  return (
    <section className={`${card} mt-6`}>
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-4 divide-y divide-vds-divider">
        {items.map((x) => (
          <article
            className="grid gap-2 py-4 sm:grid-cols-[1fr_auto]"
            key={x.id}
          >
            <div>
              <p className="font-medium">
                {"offerNumber" in x ? x.offerNumber : x.title}
              </p>
              <p className="mt-1 text-xs text-vds-muted">
                Transaction {x.dealId} ·{" "}
                {"amount" in x
                  ? `${x.currency} ${x.amount.toLocaleString()}`
                  : `Version ${x.version}`}
              </p>
            </div>
            <span className="self-start rounded-full border border-vds-border px-3 py-1 text-xs">
              {"status" in x ? x.status : x.approvalStatus}
            </span>
          </article>
        ))}
        {!items.length && (
          <p className="py-12 text-center text-sm text-vds-muted">
            No authoritative records available.
          </p>
        )}
      </div>
    </section>
  );
}
export const Offers = ({ items }: { items: readonly DealOffer[] }) => (
  <Records title="Read-only offers" items={items} />
);
export const Contracts = ({ items }: { items: readonly DealContract[] }) => (
  <Records title="Read-only contracts" items={items} />
);
export function Checklists({ items }: { items: readonly DealChecklist[] }) {
  return (
    <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((x) => (
        <article className={card} key={x.dealId}>
          <div className="flex justify-between">
            <h2 className="font-semibold">Transaction {x.dealId}</h2>
            <span>{x.completionPercentage}%</span>
          </div>
          <div className="mt-4 space-y-2">
            {x.sections.map((y) => (
              <div className="flex justify-between text-sm" key={y.name}>
                <span className="text-vds-muted">{y.name}</span>
                <span>
                  {y.completed}/{y.total}
                </span>
              </div>
            ))}
          </div>
        </article>
      ))}
      {!items.length && (
        <p className="text-sm text-vds-muted">
          No authoritative checklists available.
        </p>
      )}
    </section>
  );
}
export function Analytics({ s }: { s: DealRoomSnapshot }) {
  return (
    <>
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {dealAnalytics(s).map(([l, v]) => (
          <article className={card} key={l}>
            <p className="text-xs text-vds-muted">{l}</p>
            <p className="mt-3 text-xl font-semibold">{v}</p>
          </article>
        ))}
      </section>
      <section className={`${card} mt-6`}>
        <h2 className="font-semibold">Stage distribution</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {pipelineStages.map((x) => (
            <div
              className="flex justify-between rounded-xl bg-vds-elevated p-3 text-sm"
              key={x}
            >
              <span className="capitalize">{x.replaceAll("-", " ")}</span>
              <span>{s.deals.filter((d) => d.currentStage === x).length}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
export function Guidance({ items }: { items: readonly DealGuidance[] }) {
  return (
    <section className={`${card} mt-6`}>
      <h2 className="font-semibold">Deterministic AI guidance</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((x) => (
          <article className="rounded-xl bg-vds-elevated p-4" key={x.kind}>
            <p className="text-xs uppercase text-vds-primary">
              {x.kind.replaceAll("-", " ")}
            </p>
            <p className="mt-2 font-medium">{x.value}</p>
            <p className="mt-2 text-xs text-vds-muted">{x.rationale}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
