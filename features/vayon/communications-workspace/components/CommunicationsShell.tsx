import { WorkspaceContent, WorkspaceHeader } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import Link from "next/link";
import type { ReactNode } from "react";
const links = [
  ["Overview", "/vayon/communications"],
  ["Inbox", "/vayon/communications/inbox"],
  ["Conversations", "/vayon/communications/conversations"],
  ["Templates", "/vayon/communications/templates"],
  ["Campaigns", "/vayon/communications/campaigns"],
  ["Notifications", "/vayon/communications/notifications"],
  ["Connectors", "/vayon/communications/connectors"],
  ["Reports", "/vayon/communications/reports"],
] as const;
export function CommunicationsShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <WorkspaceContent >
      <WorkspaceHeader title={title} description={description} />
      <nav
        aria-label="Communications Hub"
        className="my-5 flex flex-wrap gap-3 border-y border-vds-border py-3"
      >
        {links.map(([label, href]) => (
          <Link
            href={href}
            key={href}
            className="vds-focus shrink-0 rounded-lg px-3 py-2 text-sm text-vds-muted hover:bg-vds-hover"
          >
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </WorkspaceContent>
  );
}
