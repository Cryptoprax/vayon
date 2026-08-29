import {
  Analytics,
  Checklists,
  Contracts,
  Guidance,
  Header,
  Offers,
  Pipeline,
} from "../components/DealRoomViews";
import { DealRoomService } from "../services/deal-room.service";
export async function DealRoomRoute({
  view,
}: {
  view: "pipeline" | "offers" | "contracts" | "checklists" | "analytics";
}) {
  const service = await DealRoomService.production(),
    s = await service.snapshot();
  return (
    <main className="mx-auto max-w-[110rem] px-5 py-8">
      <Header
        title={view[0]!.toUpperCase() + view.slice(1)}
        description="A governance-first property transaction workspace connecting clients, properties, communications, viewings, approvals, documents, tasks, and evidence-backed guidance."
      />
      {view === "pipeline" && <Pipeline s={s} />}{" "}
      {view === "offers" && <Offers items={s.offers} />}{" "}
      {view === "contracts" && <Contracts items={s.contracts} />}{" "}
      {view === "checklists" && <Checklists items={s.checklists} />}{" "}
      {view === "analytics" && <Analytics s={s} />}{" "}
      {view === "analytics" && s.deals[0] && (
        <Guidance items={service.guidance(s, s.deals[0].id)} />
      )}
    </main>
  );
}
