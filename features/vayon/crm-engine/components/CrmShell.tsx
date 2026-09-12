import { WorkspaceContent, WorkspaceHeader } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import type { ReactNode } from "react";
export function CrmShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <WorkspaceContent >
      <WorkspaceHeader title={title} description={description} actions={actions} />
      {children}
    </WorkspaceContent>
  );
}
