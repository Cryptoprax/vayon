import React from "react";
import { createRoot } from "react-dom/client";
import { VayonIntelligence } from "@/features/vayon/intelligence-core/components/VayonIntelligence";
import { FloatingLayoutManager } from "@/features/vayon/floating-layout/FloatingLayoutManager";
import { AppShell } from "@/features/vayon/product-shell/AppShell";
import { CrmShell } from "@/features/vayon/crm-engine/components/CrmShell";
import { GrowthOverview } from "@/features/vayon/growth-intelligence/GrowthOverview";
import { LeadToolbar } from "@/features/vayon/lead/components/LeadToolbar";
import { OperationsHeader } from "@/features/vayon/operations/components/OperationsUI";
import { ButtonLink } from "@/features/platform/design-system/components/core/Actions";
import { WorkspacePageLayout, WorkspaceContent, WorkspaceHeader, WorkspaceEmptyState, WorkspaceAttentionPanel, WorkspacePagination, WorkspaceAssistantDock } from "@/features/platform/design-system/layout/WorkspaceLayouts";

// Presentation fixtures only. No authentication, records, or service calls are simulated as live evidence.
const name = new URLSearchParams(location.search).get("workspace") || "leads";
const titles = { leads: "Leads", clients: "Clients", companies: "Companies", tasks: "Tasks", growth: "Marketing Performance", empty: "Clients", properties: "Properties" };
const title = titles[name];
const breadcrumb = <nav aria-label="Breadcrumb"><a href="?workspace=leads">Workspace</a><span aria-hidden="true"> / </span><span aria-current="page">{title}</span></nav>;
const table = <div className="overflow-x-auto rounded-2xl border border-vds-border"><table className="w-full text-left text-sm"><caption className="sr-only">QA fixture records</caption><thead><tr>{["Name", "Status", "Next action"].map(x => <th scope="col" className="p-4" key={x}>{x}</th>)}</tr></thead><tbody>{Array.from({ length: 8 }, (_, i) => <tr className="border-t border-vds-border" key={i}><td className="p-4">QA example {i + 1}</td><td className="p-4">Follow-up</td><td className="p-4"><a href={`#record-${i}`} className="focus-ring">Open record</a></td></tr>)}</tbody></table></div>;
const records = <><WorkspaceAttentionPanel title="Needs attention"><p className="text-sm text-vds-muted">QA fixture: plan the next conversation.</p></WorkspaceAttentionPanel><LeadToolbar query={{}} />{table}<WorkspacePagination page={1} pageCount={2} total={16} nextHref="?workspace=leads&page=2" /></>;
let content;
if (name === "growth") content = <GrowthOverview userName="QA broker" marketingAvailable />;
else if (name === "clients" || name === "companies") content = <CrmShell title={title} description="Find relationships and continue your next conversation." actions={<ButtonLink href="#create">Create record</ButtonLink>}>{records}</CrmShell>;
else if (name === "tasks") content = <WorkspaceContent><OperationsHeader title="Tasks" eyebrow="Today's work" description="Plan the next follow-up and review work due today." action={{ href: "#create", label: "Create task" }} />{records}</WorkspaceContent>;
else if (name === "empty") content = <WorkspaceContent><WorkspaceHeader title="Clients" description="Keep your buyer and seller relationships in one place." /><WorkspaceEmptyState title="No clients yet" description="Your workspace has no client relationships recorded." nextStep="Record your first relationship to plan a follow-up." action={{ href: "#create", label: "Create client" }} /></WorkspaceContent>;
else content = <WorkspaceContent><WorkspaceHeader title="Leads" description="Choose a lead to plan your next conversation." actions={<ButtonLink href="#create">Create Lead</ButtonLink>} />{records}</WorkspaceContent>;

const assistant = <WorkspaceAssistantDock><VayonIntelligence embedded route={`/vayon/${name}`} organization="QA organization" workspace="QA workspace" user="QA broker" role="workspace-owner" permissions={[]} /></WorkspaceAssistantDock>;
const header = <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center border-b border-vds-border bg-vds-background px-4 text-sm">VAYON · Presentation QA fixture</header>;
const sidebar = <aside className="fixed bottom-0 left-0 top-16 hidden w-64 border-r border-vds-border bg-vds-background p-5 lg:block"><p className="font-semibold">Workspace</p><nav aria-label="Fixture pages" className="mt-5 grid gap-4">{Object.entries(titles).map(([key, label]) => <a className="focus-ring" href={`?workspace=${key}`} key={key}>{label}</a>)}</nav></aside>;
createRoot(document.getElementById("root")).render(<FloatingLayoutManager sidebarCollapsed={false} inline={name !== "properties"}><div className="vayon-premium-canvas vayon-product"><AppShell sidebarCollapsed={false} header={header} sidebar={sidebar}><main id="main-content">{name === "properties" ? <div className="vayon-content-container" style={{ maxWidth: "none" }} dangerouslySetInnerHTML={{ __html: window.propertyReference }} /> : <WorkspacePageLayout breadcrumbs={breadcrumb} assistant={assistant}>{content}</WorkspacePageLayout>}</main></AppShell></div></FloatingLayoutManager>);
