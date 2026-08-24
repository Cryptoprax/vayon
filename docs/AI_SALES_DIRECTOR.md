# AI Sales Director

## Purpose

The AI Sales Director is the Founder-only sales command center at `/platform/founder/sales`. It combines measured executive KPIs, the canonical tenant-scoped deal pipeline, existing Sales AI intelligence, customer activity, governed follow-up frameworks, and export-ready reporting without creating another CRM or AI runtime.

## Access and security

- The route uses the Sprint 100 `founderContext` server boundary.
- Access requires `founder`, or `super_admin` with the explicit Boolean founder claim.
- Unauthorized requests receive a not-found response.
- The route is linked only inside the hidden Founder Portal.
- Existing organization/workspace scoping, RLS, optimistic versions, RPC authorization, and audit behavior remain authoritative.

## Executive sales dashboard

The dashboard presents today's and monthly revenue, forecast revenue, pipeline value, new and qualified leads, won and lost deals, active site visits, average deal size, conversion, and sales velocity. Values come from existing platform metrics and operational repositories; absent evidence is displayed as unavailable.

## Pipeline

The Director embeds the existing `DealBoard` and `PipelineService`. Drag-and-drop therefore continues through the existing `move_deal_stage` RPC with organization/workspace scoping, optimistic version checks, RBAC, RLS, and audit boundaries. No second pipeline mutation path was added. Existing production stages map the requested sales lifecycle through new lead, qualification, meetings/site visits, proposal, negotiation, booking, agreement/payment, registration, completion, and loss.

## Sales intelligence

The existing `SalesAIService` supplies evidence-backed lead temperature, confidence, explanation, deal risk, forecast, and recommendations. The Director surfaces purchase probability, budget fit, engagement, buying intent, urgency, and the CRM property profile. Missing evidence is explicit and no profile or score is fabricated.

The natural-language copilot is the existing `sales-ai` Workforce Runtime, preserving streaming, conversation history, token and cost observability, workspace attribution, recommendation-only governance, and provider fallback.

## Customer activity and workflows

The read-only customer timeline surfaces authorized activity evidence for attribution, calls, email, meetings, site visits, documents, proposals, and payments when those events exist. Call, email, proposal, site-visit, and renewal reminders route to the existing Workflow Engine and remain consent-aware and approval-required.

## Reporting and performance

Daily, weekly, and monthly reports reuse the shared Founder report exporter for browser PDF and Office-compatible PowerPoint output. Charts are lazy-loaded, loading skeletons reserve layout space, realtime refreshes are coalesced, and responsive breakpoints support desktop, tablet, and mobile.

## Architecture

```text
Founder Sales UI
  -> SalesDirectorService -> SalesDirectorRepository -> platform metrics / activity
  -> PipelineService -> DealRepository -> existing move_deal_stage RPC
  -> SalesAIService -> existing tenant-scoped Sales AI evidence
  -> WorkforceRuntimeService (sales-ai)
  -> existing Workflow Engine
```

No deployment scripts, reconciliation SQL, migrations, providers, or database objects were added or changed.

## Validation

- TypeScript: PASS
- ESLint: PASS (zero errors; one unrelated pre-existing script warning)
- Founder RBAC and focused director tests: PASS (14/14)
- Full regression suite: PASS (1,022/1,022)
- Production build: PASS (334 routes)
- Theme audit: PASS
- Responsive and accessibility readiness: PASS through the repository UX audit and focused responsive semantics
- Performance audit: PASS (109 chunks, 1.87 MiB aggregate emitted JavaScript, 17 dynamic imports)
