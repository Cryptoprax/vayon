# Action Language Report

## Implemented vocabulary

| Before | After | Surface |
|---|---|---|
| Dashboard / CRM group | Today's work / Sell & follow up | Shared shell catalog |
| Marketing / Reports / Settings groups | Market properties / Understand performance / Configure workspace | Shared shell catalog |
| Creative Center / Asset Library | Create marketing assets / Marketing assets | Navigation |
| Growth planning / Real Estate Growth Center | Marketing Performance | Navigation / growth overview |
| Today's AI Work / AI Workforce | Today's AI Tasks / AI Assistant | Navigation / dashboard |
| New property / New lead / New transaction | Create Property / Create Lead / Create Deal | List primary actions |
| Ingest, validate, understand... | Choose a property to update its details, prepare marketing, and move toward a sale | Properties introduction |
| Creative Campaign Studio / Generate with AI | Market this property / Create Campaign | Campaign heading / existing wizard entry |
| Enterprise Analytics & Intelligence | Understand performance | Analytics overview |
| Deterministic executive insights | What the figures show | Analytics observations |
| Unavailable | No figures yet + next-step guidance | Analytics / Marketing Performance |
| Enterprise Settings | Configure workspace | Settings overview |
| Generic automatic AI suggestion | Optional supplied suggestion only | Shared empty-state component |

Creation labels name the operation the existing screen actually supports. A link that opens an editor is not relabeled Sell or Convert if it does not perform that outcome. Record headers keep existing action labels; their job is to move the property/lead/deal toward that outcome.

## Copy review boundaries

JSX text and title/description/label/placeholder attributes were scanned across app and VAYON components. Dynamic service messages, translations, server errors, user content and all conditional runtime variants are not certified by this scan. No blanket text replacement was applied to contracts, identifiers or customer data. Existing success/error behavior was retained.

The following 135 files still contain candidate technical/availability wording. These are review findings, not all defects: specialist configuration and measurement details legitimately need some precise terms. Remove provider/tenant/schema jargon from broker-facing descriptions when the outcome can be stated accurately; retain necessary evidence behind disclosure.

| Source | Candidate customer-facing text (line) |
|---|---|
| app/global-error.tsx | 8: Your data remains safe. Retry the request, or return later if the provider is temporarily unavailable. |
| app/vayon/executions/page.tsx | 12: Governed action proposals and their lifecycle. No adapter in this release can perform an external action. |
| app/(marketing)/api/page.tsx | 18: VAYON's internal API contracts remain governed and production APIs are not advertised as publicly available until access, documentation and support are certified. |
| app/(marketing)/media-kit/page.tsx | 8: Company context, downloadable brand assets, product imagery, founder-information status, and a governed press contact.<br>8: VAYON is a governed AI workforce and connected operating platform for customer-centric organizations. |
| app/(marketing)/investors/page.tsx | 1: A presentation-ready overview that distinguishes released capability, roadmap direction, and unavailable external market evidence. |
| app/vayon/crm/page.tsx | 15: A tenant-safe view of leads, customers, companies, and relationship activity. |
| app/vayon/documents/onedrive/page.tsx | 1: Live provider files and folders with reference-only CRM integration.<br>1: OneDrive data is temporarily unavailable.<br>1: Vayon stores CRM references only. Preview uses the provider URL. |
| app/vayon/deals/pipeline/page.tsx | 7: Move deals through workspace stages, inspect weighted value, and keep forecast changes tenant-scoped and audit-ready. |
| features/vayon/demo-experience/components/DemoExperience.tsx | 511: Deterministic, cross-linked, recommendation-only sample data.<br>653: deterministic demo records · Read only |
| app/vayon/crm/leads/[leadId]/page.tsx | 15: Unified lead qualification, relationship history, related work, and deterministic intelligence. |
| app/(marketing)/data-ownership/page.tsx | 11: VAYON is designed so organizations retain ownership of the business information they provide. Access remains governed by workspace permissions and authenticated product boundaries. |
| app/vayon/objects/page.tsx | 2: One canonical layer for people, companies, addresses, documents, activity, knowledge, tags, and relationships. Local architecture preview—no production CRM records are rewritten. |
| app/vayon/notifications/page.tsx | 2: One tenant-scoped inbox for AI work, approvals, assignments, mentions, CRM replies, tasks, meetings and operational events. Every item opens its existing source workflow. |
| features/vayon/workflow-orchestrator/components/WorkflowOrchestrator.tsx | 99: AI Workflow Orchestrator<br>109: Reusable governed starting points<br>111: governed steps<br>171: Executed, cancelled, failed, and successful workflows appear only when governed evidence exists. Local preview decisions are listed below. |
| app/vayon/calendar/outlook/page.tsx | 1: Outlook Calendar data is temporarily unavailable. |
| features/vayon/components/RouteStates.tsx | 11: The requested information is temporarily unavailable. Your data is safe and existing records have not been changed. |
| app/vayon/contacts/microsoft/page.tsx | 1: Personal and directory contacts with deterministic CRM suggestions and no automatic merges.<br>1: Microsoft People data is temporarily unavailable. |
| features/vayon/workflow-approval/components/GovernanceViews.tsx | 40: Governed automation · no autonomous execution<br>69: governed steps · v<br>165: Deterministic adapter can prepare approved requests but cannot execute them. |
| features/vayon/video-studio/VideoStudio.tsx | 82: Create governed scripts, storyboards, private video drafts, and approval-ready assets.<br>137: Start with a creative brief and build a governed storyboard, voiceover, and production plan.<br>186: Create a governed video |
| app/vayon/communications/templates/page.tsx | 10: Read-only governed templates for consistent customer communication. |
| app/vayon/knowledge/error.tsx | 8: Knowledge temporarily unavailable. |
| app/vayon/communications/teams/page.tsx | 1: Teams data unavailable. |
| app/vayon/creative-studio/page.tsx | 1: Build governed real estate campaign drafts from authoritative project, inventory, pricing and organization brand data. |
| app/vayon/intelligence/page.tsx | 2: Knowledge, events, audit, recommendations, predictions, analytics, memory, and provider contracts—without production AI calls or direct CRM coupling. |
| features/vayon/communications-workspace/components/InboxList.tsx | 18: Bulk actions remain disabled until governed mutations are approved. |
| features/vayon/communications-workspace/components/CommunicationViews.tsx | 45: Governed outbound lifecycle<br>151: AI Workforce<br>152: Deterministic assistance |
| features/vayon/communications-workspace/components/CommunicationsShell.tsx | 25: Unified communications · governed |
| features/vayon/deal-room/components/DealRoomViews.tsx | 204: Deterministic AI guidance |
| app/(marketing)/support-policy/page.tsx | 4: Vayon provides a governed path for product questions, account assistance, and production incident reports. |
| app/(marketing)/status/page.tsx | 32: VAYON distinguishes live evidence from unavailable data. Historical incident reporting is prepared and will appear after verified events exist. |
| app/vayon/communications/reports/page.tsx | 5: Measured workspace communication activity. Unavailable provider metrics remain explicitly labeled. |
| app/vayon/communications/page.tsx | 15: Every tenant-scoped customer conversation, relationship, governed AI recommendation, and follow-up in one workspace. |
| app/vayon/workflows/loading.tsx | 2: Loading AI Workflow Orchestrator |
| app/vayon/approvals/[approvalId]/page.tsx | 19: Immutable decision context and audit evidence for a governed execution request. |
| app/vayon/creative-studio/loading.tsx | 18: Loading campaign data and provider status. |
| app/vayon/creative-studio/growth/page.tsx | 17: Plan complete multilingual real estate campaign packs from authoritative project data. Every output remains a governed draft. |
| app/vayon/creative-studio/error.tsx | 11: Marketing Studio unavailable<br>15: Campaign data could not be loaded. No publishing or provider action was attempted. |
| features/vayon/universal-bar/components/UniversalPreviewCard.tsx | 22: Select a result supplied by an authorized local provider to preview existing view-model fields. |
| app/vayon/settings/users/page.tsx | 4: Search, filter, and review roles, departments, teams, status, activity, permissions, and workforce assignments. |
| features/vayon/deal/components/DealWorkspaceContent.tsx | 21: Registration and mortgage dates unavailable |
| features/vayon/calendar-platform/dashboard/CalendarRoute.tsx | 23: A tenant-scoped operational schedule across meetings, visits, tasks, reminders, CRM context, communications, workflows, and AI Workforce advice.<br>40: Deterministic scheduling reminders. External delivery remains disabled. |
| features/vayon/real-estate-experience/RealEstateSurfaces.tsx | 23: Unavailable |
| app/vayon/settings/teams/page.tsx | 4: Create, staff, manage capacity, and archive teams inside tenant-scoped departments. |
| features/vayon/calendar-platform/components/CalendarViews.tsx | 248: Deterministic scheduling assistance<br>251: Advisory only. No provider calls or autonomous scheduling. |
| app/vayon/communications/outlook/page.tsx | 90: Outlook data is temporarily unavailable.<br>141: Reply, reply all, and forward are supported by the provider service and remain user-initiated operations. |
| app/vayon/communications/notifications/page.tsx | 10: Workflow, approval, meeting, task, provider, conversation, and AI notices with governed links. |
| app/vayon/analytics/executive/page.tsx | 9: Measured business intelligence and clearly labeled AI recommendations, sourced only from this tenant's authoritative repositories. |
| app/vayon/communications/inbox/page.tsx | 18: Search, filter, sort, and review every tenant-scoped customer interaction without connecting external providers. |
| features/vayon/brand-studio/BrandStudio.tsx | 262: Deterministic readiness score · no automatic corrections<br>314: Prepared formats only. No export provider is connected.<br>474: AI recommendation is prepared only; no provider is connected. |
| app/vayon/communications/conversations/[conversationId]/page.tsx | 17: Chronological communication, CRM context, deterministic assistance, and governed next actions. |
| app/vayon/communications/conversations/page.tsx | 10: Customer, lead, assignment, channel, deal, property, workflow, and task relationships in one provider-neutral directory. |
| app/vayon/settings/plans/page.tsx | 4: Choose a production Stripe subscription plan with tenant-scoped entitlements. |
| app/vayon/creative-studio/assistant/page.tsx | 37: AI generation is temporarily unavailable<br>38: Existing drafts remain editable. Continue with templates, Brand Kit, Asset Library, and the editor while the provider recovers. |
| app/vayon/settings/permissions/page.tsx | 4: Effective module and action access across the canonical enterprise RBAC roles. |
| app/vayon/communications/connectors/page.tsx | 5: Provider-neutral channel adapters. Live authentication and delivery remain disabled until Sprint 82.<br>5: Live delivery: disabled · Provider health: not connected |
| features/vayon/dashboard/components/RealEstateIntelligence.tsx | 15: Unavailable<br>31: Market data unavailable. No authoritative market-data provider is connected.<br>59: Unavailable |
| features/vayon/dashboard/components/AIWorkforceGrid.tsx | 77: Your approved workforce appears here when configured. |
| features/vayon/dashboard/components/AIWidget.tsx | 5: AI Workforce<br>5: Open workforce → |
| app/vayon/settings/page.tsx | 5: Organization → Departments → Users → AI Workforce → CRM → Finish |
| app/vayon/creative-studio/analytics/page.tsx | 1: Measured draft activity and AI campaign quality. Publishing performance remains unavailable until providers are connected. |
| features/vayon/property-platform/inventory/InventoryViews.tsx | 14: Coordinates are stored provider-neutrally. Google Maps API is not connected.<br>17: Tenant-scoped RBAC |
| features/vayon/communication-hub/components/CommunicationHubArchitecture.tsx | 5: Provider-neutral communication workspace |
| features/vayon/property-platform/dashboard/PropertyRoute.tsx | 39: A provider-neutral location workspace. No external map or MLS connection is active.<br>68: Evidence-safe analytics derived only from authoritative repository relationships. Unavailable metrics are never fabricated. |
| features/vayon/creative-studio-2/CreativeStudioHome.tsx | 264: Creative Director → Pipeline → Runtime → Execution Engine → Provider Adapter |
| app/vayon/settings/notifications/page.tsx | 2: Provider delivery remains governed by workspace notification capabilities. |
| features/vayon/creative-studio/components/StudioViews.tsx | 10: · Tenant scoped · External rendering disabled<br>11: Generate governed draft |
| features/vayon/campaign-studio/CampaignStudio.tsx | 503: Planning only · provider unavailable · no assets will be generated |
| features/vayon/creative-runtime/CreativeRuntimeDashboard.tsx | 64: Provider-independent routing, capabilities, job health, and fail-closed generation infrastructure.<br>70: Unavailable<br>90: Provider registry<br>91: Descriptors only. Provider names are never exposed to customer generation flows.<br>+3 further candidates in local copy-audit.json |
| features/vayon/analytics-platform/components/ExecutiveBI.tsx | 21: Compare recorded salespeople and teams. Personal rankings reflect tenant-scoped pipeline and closed outcomes only. |
| features/vayon/creative-execution/ExecutionDashboard.tsx | 46: Provider-independent planning, queueing, execution, events, and approval handoff. Live adapters are composed outside the engine.<br>86: Capability & provider readiness<br>96: Provider readiness<br>103: Live document provider<br>+2 further candidates in local copy-audit.json |
| features/vayon/crm-engine/components/CrmLeadProfile.tsx | 176: Deterministic intelligence<br>203: Prepare client communication, property recommendations, viewing plans, and transaction documents using the existing governed AI runtime. No message, proposal, meeting, or CRM change is executed automatically. |
| features/vayon/property-platform/components/PropertyViews.tsx | 108: Provider-neutral map surface<br>109: Coordinates and map tiles remain unavailable until an approved maps provider is connected.<br>254: Deterministic property assistance |
| features/vayon/creative-cloud/CreativeCloudDashboard.tsx | 120: Single orchestration authority<br>138: specialists · orchestrated only<br>292: Future provider strategy<br>306: Cost attribution prepares estimated cost, provider cost, token cost, generation cost, export cost, and budget allocation. Billing is not integrated. |
| features/vayon/creative-pipeline/CreativePipelineDashboard.tsx | 205: Provider boundary<br>206: Creative Director orchestrates every stage. Nodes communicate only through the Creative Runtime. Runtime is unavailable, so execution is disabled. |
| features/vayon/property-matching/MatchingViews.tsx | 4: Rental potential: placeholder · Future appreciation: unavailable<br>7: Governed recommendation engine<br>7: Scores use tenant-scoped CRM, inventory, pricing, and visit evidence. AI may explain and draft, but never decides, reserves, contacts customers, or fabricates relationships. |
| features/vayon/crm-automation/PropertyCrmSummary.tsx | 27: Unavailable · classification evidence missing |
| app/vayon/settings/billing/provider-health/page.tsx | 9: Live tenant-scoped health evidence for commercial, AI, communication, productivity, storage, and database providers. |
| app/vayon/settings/billing/page.tsx | 16: Choose and manage your VAYON plan. Billing remains available even while provider setup is incomplete. |
| app/vayon/settings/billing/error.tsx | 4: Your account and workspace remain safe. Billing information is temporarily unavailable, and no payment action has been taken. |
| features/vayon/enterprise-collaboration/CollaborationSurfaces.tsx | 12: Priorities derived from the current workspace dashboard, calendar, activity and AI work projections. |
| app/vayon/ai/work-queue/page.tsx | 3: AI Work Queue<br>3: Live, approval-gated work prepared by the AI workforce across the workspace. |
| app/vayon/ai/tasks/page.tsx | 7: Workforce Task Queue<br>8: Pending, running, completed, failed, and cancelled work across the tenant-scoped operational workforce. |
| app/vayon/settings/ai/openai/loading.tsx | 1: Loading OpenAI provider diagnostics… |
| app/vayon/ai/playground/page.tsx | 5: Versioned role and system prompt templates, tested only through governed workspace-attributed AI employee workflows. |
| app/vayon/settings/integrations/data-import/page.tsx | 6: Bring existing CRM records into VAYON after workspace activation. Imports remain tenant-scoped and user initiated. |
| app/vayon/creative/pipelines/page.tsx | 6: Creative Production Orchestration |
| app/vayon/creative/page.tsx | 7: This workspace does not have Creative access yet. Join Early Access and we will notify you when governed creative production is available for your workspace. |
| app/vayon/ai/history/page.tsx | 7: Workforce History<br>8: A read-only timeline of governed workforce outcomes derived from existing workspace tasks and conversations. |
| app/vayon/settings/google/page.tsx | 2: Provider version |
| features/vayon/document-studio/DocumentStudio.tsx | 138: Create brand-governed, editable business documents through the Creative Runtime and approval pipeline.<br>257: Start with a natural-language brief and move through the governed Creative Runtime.<br>316: Comments, version history and approval precede every governed export. |
| app/vayon/providers/loading.tsx | 5: Loading provider readiness |
| app/vayon/providers/error.tsx | 6: Provider readiness unavailable<br>7: The local provider model could not be assembled. |
| app/vayon/property-matching/page.tsx | 1: Match explicit buyer requirements with live tenant inventory, recent pricing, CRM activity, and site-visit outcomes—without autonomous decisions. |
| features/vayon/demo-workspace/sales-operations/SalesOperationsPanel.tsx | 2: Deterministic workforce examples |
| features/vayon/founder-command-center/SystemHealthCard.tsx | 2: System health evidence is temporarily unavailable. |
| features/vayon/founder-command-center/ExecutiveAIInbox.tsx | 32: Completed · not represented by the current collaboration approval projection<br>32: Archived · not represented by the current collaboration approval projection |
| features/vayon/founder-approval-center/FounderApprovalCenter.tsx | 5: Record a session draft before handing off to the governed approval history.<br>8: Open AI Company Orchestration Center |
| features/vayon/property-intelligence/components/PropertyDashboard.tsx | 2: Property mix appears after ingestion. |
| features/vayon/property-intelligence/components/MapPreview.tsx | 1: Clustering activates when an approved maps provider is connected.<br>1: Provider placeholder |
| features/vayon/property-intelligence/components/ImportWizard.tsx | 1: https://approved-provider.example/listing<br>1: Vayon does not fetch or scrape this URL. An official provider must be connected. |
| features/vayon/property-intelligence/components/ImportCenter.tsx | 1: Ingestion studio |
| features/vayon/demo-workspace/executive-intelligence/ExecutiveIntelligencePanels.tsx | 3: Connected deterministic advisors |
| features/vayon/ai-workforce/components/AIWorkforceUI.tsx | 10: Live AI Workforce<br>16: Provider health |
| features/vayon/operational-workforce/components/WorkforceViews.tsx | 25: AI workforce impact<br>39: Governed customer workflow<br>41: Agents exchange tenant-scoped recommendations only. Approval remains mandatory before sensitive execution.<br>46: Task orchestration<br>+4 further candidates in local copy-audit.json |
| features/vayon/operational-workforce/components/WorkforceDirectory.tsx | 23: Memory is isolated to this workspace. Empty values remain explicit and are never inferred from another tenant. |
| features/vayon/operational-workforce/components/OliviaCustomerSuccessManagerDashboard.tsx | 27: Unavailable |
| features/vayon/operational-workforce/components/DavidFinanceManagerDashboard.tsx | 24: Unavailable<br>24: Evidence: no commission ledger projection. Confidence: unknown. Dependencies: transaction-linked commission records and release status.<br>25: Projection explanation:<br>26: Unavailable — periodized revenue evidence missing<br>+1 further candidates in local copy-audit.json |
| features/vayon/operational-workforce/components/AlexOperationsManagerDashboard.tsx | 28: Unavailable<br>29: Pending confirmations: Unavailable<br>29: Missed: Unavailable<br>29: Required documents: Unavailable |
| app/vayon/creative/campaigns/page.tsx | 6: You can keep working on your properties and leads while campaign creation is unavailable in this workspace. |
| app/vayon/ai/collaboration/page.tsx | 13: AI Company Orchestration Center<br>14: The executive boardroom for coordinated, evidence-backed recommendations and governed Founder decisions. |
| features/vayon/property/components/PropertyCard.tsx | 31: Unavailable<br>32: Unavailable<br>33: Unavailable<br>34: Unavailable |
| features/vayon/ai-runtime/components/PromptLibrary.tsx | 7: Test through governed employee chat |
| features/vayon/ai-runtime/components/AIRuntimeHeader.tsx | 1: Provider-independent runtime · human approval required |
| features/vayon/ai-runtime/components/AIRecommendationPanel.tsx | 2: Generate a governed recommendation |
| app/vayon/properties/projects/page.tsx | 3: Manage developments, towers, construction progress, teams, documents, and unit availability from one tenant-scoped workspace. |
| features/vayon/intelligence-core/components/VayonIntelligence.tsx | 379: I understand the current page and tenant-safe workspace context. I never infer a client, property, transaction, document, or agent that is not present in the route. |
| features/vayon/image-studio/ImageStudio.tsx | 261: Format infrastructure prepared; rendering is unavailable until a provider is configured.<br>654: Every edit creates a governed image version through Creative Runtime. |
| features/vayon/growth-intelligence/GrowthShell.tsx | 2: Real Estate Growth Center |
| features/vayon/growth-intelligence/GrowthSectionPage.tsx | 10: Real Estate Growth Center |
| features/vayon/executive-home/components/ExecutiveHome.tsx | 10: Awaiting governed business connections<br>10: Layout personalization, role-based arrangements, and saved executive views are architected but intentionally unavailable until governed persistence is introduced. |
| features/vayon/operations/components/OperationsUI.tsx | 2: Your work queue is clear. |
| features/vayon/admin-platform/components/AdminViews.tsx | 46: Read-only governance visibility. Role, permission, execution, provider, and organization mutations are disabled.<br>89: Unavailable<br>210: provider records · approval required |
| app/platform/notifications/page.tsx | 8: A unified, tenant-aware presentation layer for platform, application, organization, security, billing, AI, marketing, and support attention. |
| app/platform/integrations/page.tsx | 1: One governed control plane for providers, health, webhooks, retries, synchronization, and credential metadata. |
| app/platform/customers/error.tsx | 2: Mission Control data unavailable |
| app/platform/customer-success/page.tsx | 1: Renewals, health, churn risk, expansion opportunities, open issues, NPS readiness, and governed AI recommendations. |
| app/platform/roles/page.tsx | 10: Compose reusable responsibility profiles from governed permissions and explicit platform, organization, or workspace scopes. |
| app/platform/permissions/page.tsx | 10: A capability-based permission catalog designed for default-deny authorization, explicit scope, and future multi-tenant enforcement. |
| app/platform/audit/page.tsx | 8: Enterprise-grade visibility into significant actions, identities, tenant context, applications, devices, targets, and outcomes. |
| app/platform/builder/settings/page.tsx | 1: Schema-driven settings sections ready for validation, permission, localization, and future persistence adapters. |
| app/platform/organizations/page.tsx | 10: Govern tenant lifecycle, regional footprint, workspaces, applications, and membership from one operational directory. |
| app/platform/integrations/error.tsx | 2: Integration control plane unavailable<br>2: No provider action was performed. |
| app/platform/identity/page.tsx | 10: The shared, tenant-aware identity foundation for every AtlasOS application, organization, workspace, user, role, and permission. |
| app/platform/integrations/logs/page.tsx | 1: Provider Logs |
| app/platform/integrations/health/page.tsx | 1: Provider availability, latency, failures, retries, successful calls, and synchronization history. |
