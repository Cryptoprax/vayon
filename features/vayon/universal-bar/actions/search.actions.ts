"use server";

import { WorkspacePermissionService } from "@/features/platform/permissions/runtime/permission.service";
import { evaluateWorkspacePermission } from "@/features/platform/permissions/runtime/policy";
import type { PermissionModule } from "@/features/platform/permissions/runtime/types";
import { PlatformVisibilityService } from "@/features/platform/visibility/service";
import { canViewPath } from "@/features/platform/visibility/policy";
import { PropertyService } from "@/features/vayon/property/services/property.service";
import { LeadService } from "@/features/vayon/lead/services/lead.service";
import { CrmCompanyService } from "@/features/vayon/crm-company/service";
import { DealService } from "@/features/vayon/deal/services/deal.service";
import { CreativeStudioService } from "@/features/vayon/creative-studio/service";
import { SupabaseWorkforceRepository } from "@/features/vayon/operational-workforce/repositories/supabase.repository";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { CalendarService } from "@/features/vayon/operations/services/calendar.service";
import type { UniversalBarResult, UniversalSearchScope } from "../domain/contracts";

// Read adapter for the existing Universal Bar, using existing tenant-scoped services.
// No approval data is read from the process-local governance demonstration repository.
export async function searchWorkspaceRecords(query: string): Promise<{ results: UniversalBarResult[]; partial: boolean }> {
  if (typeof query !== "string" || query.trim().length < 2 || query.length > 100) return { results: [], partial: false };
  // Existing repositories compose PostgREST OR filters. Remove filter metacharacters.
  const term = query.trim().replace(/[^\p{L}\p{N}\s@.+-]/gu, " ").trim();
  if (term.length < 2) return { results: [], partial: false };
  const [context, visibility] = await Promise.all([new WorkspacePermissionService().context(), new PlatformVisibilityService().context()]);
  const allowed = (module: PermissionModule, path: string) => canViewPath(visibility, path) && evaluateWorkspacePermission(context.role, { module, action: "view", actorId: context.actorId }).allowed;
  const record = (id: string, label: string, href: string, scope: UniversalSearchScope): UniversalBarResult => ({ id: `${scope}-${id}`, label, href, scope, kind: "record", description: scope === "contacts" ? "Client details" : scope === "creative-assets" ? "Marketing file" : scope === "employees" ? "AI Assistant" : "Open this record to continue your work", keywords: [] });
  const jobs: Array<Promise<UniversalBarResult[]>> = [];
  const page = { search: term, page: 1, pageSize: 5, sort: "updated_at", direction: "desc" as const, view: "table" as const };
  if (allowed("crm", "/vayon/properties")) jobs.push(new PropertyService().list(page).then(data => data.items.map(item => ({ ...record(item.id, item.title, `/vayon/properties/${item.id}`, "properties"), description: "Open property to review details, marketing, and viewings" }))));
  if (allowed("leads", "/vayon/leads")) jobs.push(new LeadService().list(page).then(data => data.items.map(item => record(item.id, item.name, `/vayon/leads/${item.id}`, "leads"))));
  if (allowed("companies", "/vayon/crm/companies")) jobs.push(CrmCompanyService.production().then(service => service.list(term, 1, 5)).then(data => data.items.map(item => record(item.id, item.name, `/vayon/crm/companies/${item.id}`, "companies"))));
  if (allowed("contacts", "/vayon/crm/contacts")) jobs.push(CrmCompanyService.production().then(service => service.contacts(term)).then(data => data.slice(0, 5).map(item => record(item.id, item.name, `/vayon/crm/contacts/${item.id}`, "contacts"))));
  // These existing list contracts do not support query pagination; only five matches leave the server.
  const matches = (label: string) => label.toLocaleLowerCase().includes(term.toLocaleLowerCase());
  if (allowed("deals", "/vayon/deals")) jobs.push(new DealService().list().then(data => data.filter(item => matches(item.name)).slice(0, 5).map(item => record(item.id, item.name, `/vayon/deals/${item.id}`, "deals"))));
  if (allowed("calendar", "/vayon/calendar")) jobs.push(new CalendarService().entries().then(data => data.filter(item => matches(item.title)).slice(0, 5).map(item => record(item.id, item.title, item.entryType === "task" ? "/vayon/tasks" : "/vayon/calendar", item.entryType === "task" ? "tasks" : "meetings"))));
  if (allowed("creative_studio", "/vayon/creative")) jobs.push(CreativeStudioService.production().then(async service => {
    if (!service) return [];
    const data = await service.snapshot();
    return [
      ...data.campaigns.filter(item => matches(item.name)).slice(0, 5).map(item => ({ ...record(item.id, item.name, "/vayon/creative-studio", "campaigns"), description: item.status === "draft" ? "Review saved campaign draft in the creative overview" : `Review saved campaign in the creative overview: ${item.status.replaceAll("-", " ")}` })),
      ...data.assets.filter(item => matches(item.name)).slice(0, 5).map(item => ({ ...record(item.id, item.name, `/vayon/creative-studio/editor/${item.id}`, "creative-assets"), description: item.status === "draft" ? "Review saved draft instructions; rendering is separate" : `Review saved asset: ${item.status.replaceAll("-", " ")}` })),
      ...data.brandKits.filter(item => matches(item.name)).slice(0, 5).map(item => record(item.id, item.name, "/vayon/creative/brand", "creative-assets")),
      ...data.templates.filter(item => matches(item.name)).slice(0, 5).map(item => ({ ...record(item.id, item.name, "/vayon/creative-studio/templates", "creative-assets"), kind: "navigation" as const, description: "Campaign template" })),
    ];
  }));
  if (allowed("ai_employees", "/vayon/ai/workforce")) jobs.push(operationsContext().then(async c => {
    const employees = await new SupabaseWorkforceRepository(c.client, c.organizationId, c.workspaceId).employees();
    return employees.filter(item => matches(item.name)).slice(0, 5).map(item => record(item.id, item.name, `/vayon/ai/workforce/${item.code}`, "employees"));
  }));
  const settled = await Promise.allSettled(jobs);
  return { results: settled.flatMap(result => result.status === "fulfilled" ? result.value : []), partial: settled.some(result => result.status === "rejected") };
}
