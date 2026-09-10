import type { ReactNode } from "react";
import type { WorkspaceModel } from "../types";
import { WorkspaceRegistryService } from "../services/workspace-registry.service";
import {
  WorkspaceActivity,
  WorkspaceAI,
  WorkspaceEmptyState,
  WorkspaceFiles,
  WorkspaceHeader,
  WorkspaceInsights,
  WorkspaceLayout,
  WorkspaceNotes,
  WorkspaceOverview,
  WorkspaceRelations,
  WorkspaceRightPanel,
  WorkspaceTabs,
  WorkspaceTasks,
  WorkspaceTimeline,
} from "./WorkspaceEngine";

export function WorkspaceRenderer({
  model,
  activeTab,
  editHref,
  overview,
  panels = {},
}: {
  model: WorkspaceModel;
  activeTab: string;
  editHref: string;
  overview?: ReactNode;
  panels?: Readonly<Record<string, ReactNode>>;
}) {
  const registry = new WorkspaceRegistryService();
  const tabs = registry.visibleTabs(model.definitionId);
  const actions = registry
    .actions(model.definitionId, ["entity.*"])
    .map((action) => (action.id === "edit" ? { ...action, href: editHref } : action));
  const content: Record<string, ReactNode> = {
    overview: overview ?? <WorkspaceOverview widgets={model.widgets} />,
    timeline: <WorkspaceTimeline events={model.events} />,
    activity: <WorkspaceActivity items={model.activities} />,
    notes: <WorkspaceNotes />,
    files: <WorkspaceFiles />,
    tasks: <WorkspaceTasks />,
    messages: <WorkspaceEmptyState title="Messages" description="WhatsApp, email, SMS, notes, and system events connected to this record appear here." />,
    calls: <WorkspaceEmptyState title="Calls" description="Customer call history and outcomes connected to this record appear here." />,
    "follow-ups": <WorkspaceEmptyState title="Follow-ups" description="Open and completed communication commitments appear here." />,
    knowledge: <WorkspaceEmptyState title="Knowledge" description="Trusted organizational knowledge sources assigned to this AI employee appear here." />,
    recommendations: <WorkspaceEmptyState title="Recommendations" description="Suggestions are not connected here yet. Continue updating this record using the actions above." />,
    history: <WorkspaceEmptyState title="History" description="Future executions, decisions, and human review history appear here." />,
    capabilities: <WorkspaceEmptyState title="Capabilities" description="Review what this assistant can help with. Automatic actions are not active here." />,
    meetings: <WorkspaceEmptyState title="Meetings" description="Meetings connected to this workspace object appear here." />,
    "site-visits": <WorkspaceEmptyState title="Site visits" description="Scheduled and completed property visits appear here." />,
    relations: <WorkspaceRelations relations={model.relations} />,
    analytics: <WorkspaceInsights />,
    "ai-assistant": <WorkspaceAI />,
    settings: (
      <WorkspaceEmptyState
        title="Workspace settings"
        description="Your workspace settings depend on your role. Contact your workspace administrator if you need access."
      />
    ),
    ...panels,
  };
  return (
    <WorkspaceLayout
      header={<WorkspaceHeader model={model} actions={actions} />}
      tabs={<WorkspaceTabs tabs={tabs} active={activeTab} baseHref={editHref.replace("/edit", "")} />}
      rightPanel={<WorkspaceRightPanel sections={model.sidebar} />}
      timeline={activeTab !== "timeline" ? <WorkspaceTimeline events={model.events.slice(0, 3)} /> : undefined}
    >
      {content[activeTab] ?? content.overview}
    </WorkspaceLayout>
  );
}
