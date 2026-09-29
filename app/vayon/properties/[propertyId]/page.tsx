import type { ReactNode } from "react";
import { WorkspaceHeader } from "@/features/platform/design-system/layout/WorkspaceLayouts";
﻿import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/features/platform/design-system";
import { PropertyService } from "@/features/vayon/property/services/property.service";
import { WorkspaceTimeline } from "@/features/vayon/workspace-engine/components/WorkspaceEngine";
import { propertyWorkspaceModel } from "@/features/vayon/workspace-engine/services/workspace-adapter.service";
import { ContextualAIActions } from "@/features/vayon/cross-module-intelligence/ContextualAIActions";
import { EntityCollaboration } from "@/features/vayon/enterprise-collaboration/CollaborationSurfaces";
import { WorkspacePermissionService } from "@/features/platform/permissions/runtime/permission.service";
import { PropertyKnowledgeDocumentService } from "@/features/vayon/property-knowledge/services/property-knowledge-document.service";
import { PropertyKnowledgeDocuments } from "@/features/vayon/property-knowledge/components/PropertyKnowledgeDocuments";
import { PropertyKnowledgeRetrievalService } from "@/features/vayon/property-knowledge/retrieval/retrieval.service";
import { PropertyKnowledgeSearch } from "@/features/vayon/property-knowledge/components/PropertyKnowledgeSearch";
import { RetrievalQueryError, type PropertyKnowledgeRetrievalResult } from "@/features/vayon/property-knowledge/retrieval/types";
import { PropertyFactsService } from "@/features/vayon/property-facts/services/property-facts.service";
import { PropertyPricingFacts } from "@/features/vayon/property-facts/components/PropertyPricingFacts";

export default async function Page({ params, searchParams }: {
  params: Promise<{ propertyId: string }>;
  searchParams: Promise<{ tab?: string; success?: string; error?: string; q?: string }>;
}) {
  const id = (await params).propertyId;
  const property = await new PropertyService().detail(id);
  if (!property) notFound();
  const query = await searchParams;
  const hasInsights = typeof property.aiScore === "number" && Number.isFinite(property.aiScore);
  const tabs = [{ id: "overview", label: "Next steps" }, ...(hasInsights ? [{ id: "insights", label: "Insights" }] : []), { id: "history", label: "History" }, { id: "pricing", label: "Pricing" }, { id: "knowledge", label: "Knowledge" }, { id: "ai-assistant", label: "AI" }];
  const active = tabs.some(tab => tab.id === query.tab) ? query.tab : "overview";
  const base = `/vayon/properties/${encodeURIComponent(id)}`;
  const price = property.salePrice ?? property.rentalPrice;
  let pricingSection: ReactNode = null;
  if (active === "pricing") {
    const [{ facts, revisions }, viewPermission, managePermission] = await Promise.all([
      (await PropertyFactsService.production()).load(id),
      new WorkspacePermissionService().check("knowledge", "view").catch(() => ({ decision: { allowed: false } })),
      new WorkspacePermissionService().check("knowledge", "approve").catch(() => ({ decision: { allowed: false } })),
    ]);
    if (!facts) notFound();
    const documents = viewPermission.decision.allowed ? await (await PropertyKnowledgeDocumentService.production()).listForProperty(id) : [];
    pricingSection = <PropertyPricingFacts propertyId={id} facts={facts} revisions={revisions} documents={documents} canManage={managePermission.decision.allowed} error={query.error} />;
  }
  let knowledgeSection: ReactNode = null;
  if (active === "knowledge") {
    const [viewPermission, managePermission] = await Promise.all([
      new WorkspacePermissionService().check("knowledge", "view").catch(() => ({ decision: { allowed: false } })),
      new WorkspacePermissionService().check("knowledge", "approve").catch(() => ({ decision: { allowed: false } })),
    ]);
    if (!viewPermission.decision.allowed) {
      knowledgeSection = <section className="rounded-2xl border border-vds-border p-5"><p className="text-sm text-vds-muted">You do not have permission to view property knowledge documents.</p></section>;
    } else {
      const knowledgeService = await PropertyKnowledgeDocumentService.production();
      const documents = await knowledgeService.listForProperty(id);
      const documentUrls: Record<string, string> = {};
      await Promise.all(documents.map(async (document) => {
        try {
          documentUrls[document.id] = await knowledgeService.signedUrl(document.id);
        } catch {
          // Signed URL generation failing (e.g. object missing) must not break the page.
        }
      }));
      const searchText = (query.q ?? "").slice(0, 400);
      let searchResult: PropertyKnowledgeRetrievalResult | null = null;
      let searchError: string | undefined;
      if (searchText.trim()) {
        try {
          searchResult = await (await PropertyKnowledgeRetrievalService.production()).retrieve({ propertyId: id, query: searchText });
        } catch (error) {
          searchError = error instanceof RetrievalQueryError ? "That search is too long. Please shorten it." : "Search is unavailable right now.";
        }
      }
      knowledgeSection = (
        <div className="space-y-5">
          <PropertyKnowledgeSearch propertyId={id} queryText={searchText} error={searchError} result={searchResult} documentUrls={documentUrls} />
          <PropertyKnowledgeDocuments
            propertyId={id}
            documents={documents}
            documentUrls={documentUrls}
            canManage={managePermission.decision.allowed}
          />
        </div>
      );
    }
  }
  return <div className="min-w-0 py-4">
    <WorkspaceHeader breadcrumbs={false} className="sticky top-16 z-20 border-b border-vds-border bg-vds-background/95 py-3 backdrop-blur-lg">
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap gap-2 text-xs text-vds-muted"><Link href="/vayon/dashboard" className="focus-ring">Dashboard</Link><span aria-hidden="true">/</span><Link href="/vayon/properties" className="focus-ring">Properties</Link><span aria-hidden="true">/</span><span aria-current="page" className="min-w-0 break-words">{property.title}</span></nav>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><h1 className="break-words text-2xl font-semibold">{property.title}</h1><p className="mt-1 text-sm text-vds-muted">{property.reference} - {property.address.city} - {property.status.replaceAll("_", " ")}</p></div><ButtonLink href={`${base}/edit`}>{property.description?.trim() ? "Edit property" : "Complete property details"}</ButtonLink></div>
    </WorkspaceHeader>
    <nav className="flex flex-wrap gap-2 py-4" aria-label="Property sections">{tabs.map(tab => <Link key={tab.id} href={`${base}?tab=${tab.id}`} aria-current={active === tab.id ? "page" : undefined} className={`focus-ring min-h-11 rounded-xl px-3 py-3 text-sm ${active === tab.id ? "bg-vds-primary-soft text-vds-primary" : "text-vds-muted"}`}>{tab.label}</Link>)}<Link className="focus-ring min-h-11 rounded-xl px-3 py-3 text-sm text-vds-muted" href="/vayon/properties/analytics">Analytics</Link></nav>
    {active === "overview" && <>
      <section className="rounded-2xl border border-vds-border p-5" aria-labelledby="property-next"><h2 id="property-next" className="text-lg font-semibold">What should I do next?</h2><p className="mt-2 text-sm text-vds-muted">{property.description?.trim() ? "Review this property's details, then prepare marketing or plan a buyer conversation." : "Start by adding a clear description. Then prepare marketing or plan a buyer conversation."}</p><div className="mt-4 grid gap-3 md:grid-cols-3">{[["Generate Brochure", "/vayon/creative/documents", "Open the document studio and supply this property's details."], ["Generate Campaign", `/vayon/creative-studio/wizard?propertyId=${property.id}`, "Open the campaign wizard with this property already selected."], ["Match Buyers", "/vayon/property-matching", "Review existing buyer requirements and property matches."], ["Schedule Viewing", "/vayon/site-visits", "Choose the property and buyer in the existing visit form."]].map(([label, href, description]) => <Link key={href} href={href} className="focus-ring rounded-xl border border-vds-border p-4 hover:bg-vds-elevated"><span className="font-medium">{label}</span><span className="mt-2 block text-sm text-vds-muted">{description}</span></Link>)}</div></section>
      <section className="mt-5 rounded-2xl border border-vds-border p-5" aria-labelledby="property-details"><h2 id="property-details" className="font-semibold">Property details</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Price", price ? `${price.amount.toLocaleString()} ${price.currency}` : "Add a price"], ["Address", [...property.address.lines, property.address.city, property.address.countryCode].join(", ")], ["Area", property.specification.area === undefined ? "Add the property area" : `${property.specification.area} ${property.specification.areaUnit}`], ["Listing status", property.published ? "Published" : "Not published"]].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-vds-muted">{label}</dt><dd className="mt-1 break-words text-sm">{value}</dd></div>)}</dl>{property.description && <p className="mt-4 whitespace-pre-wrap break-words text-sm text-vds-muted">{property.description}</p>}</section>
    </>}
    {active === "insights" && hasInsights && <section className="rounded-2xl border border-vds-border p-5"><h2 className="font-semibold">Recorded listing score</h2><p className="mt-2">{property.aiScore}</p></section>}
    {active === "history" && <section aria-label="Property history"><WorkspaceTimeline events={propertyWorkspaceModel(property).events}/><div className="mt-5"><EntityCollaboration entityType="property" entityId={id} entityLabel={property.title}/></div></section>}
    {active === "pricing" && pricingSection}
    {active === "knowledge" && knowledgeSection}
    {active === "ai-assistant" && <ContextualAIActions kind="property" evidence={{ description: property.description, published: property.published }} recordId={id} recordLabel={property.title}/>}
  </div>;
}
