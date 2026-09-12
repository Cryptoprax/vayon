import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import {
  Inbox,
  NotificationHeader,
  NotificationNav,
  Preferences,
} from "../components/NotificationViews";
import { NotificationService } from "../services/notification.service";
export async function NotificationRoute({
  view,
}: {
  view: "inbox" | "preferences" | "history";
}) {
  const service = new NotificationService(),
    items = await service.inbox("current-user");
  return (
    <WorkspaceContent >
      <NotificationNav />
      <NotificationHeader
        title={view[0]!.toUpperCase() + view.slice(1)}
        description="Read-only deterministic notifications derived from domain events. External delivery channels remain disabled."
      />
      {view === "preferences" ? (
        <Preferences items={await service.preferences("current-user")} />
      ) : (
        <Inbox
          items={
            view === "history"
              ? items.filter((x) => x.status === "archived" || x.dismissed)
              : items
          }
        />
      )}
    </WorkspaceContent>
  );
}
