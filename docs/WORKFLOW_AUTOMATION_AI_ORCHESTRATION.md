# Workflow Automation & AI Orchestration

## Outcome

Sprint 108 extends VAYON's existing workflow designer, runtime, governance, provider, audit, and observability layers. Founder management is available at `/platform/founder/workflows`; execution remains scoped to the active organization and workspace.

## Reused architecture

Workflow definitions and execution summaries continue through `SupabaseWorkflowRepository`. `WorkflowAutomationService` remains the service boundary. The existing planner validates acyclic graphs, the runtime executes published plans, the dispatcher invokes only registered handlers, and the approval engine stops sensitive steps. Checkpoints, retries, timeouts, variable resolution, durable execution summaries, templates, audit history, and provider-neutral ports remain authoritative.

## Workflow designer

The visual designer supports Trigger, Condition, Decision, Delay, Action, Approval, and End semantics. It retains drag positioning, connections, zoom, pan, mini-map, multi-select, undo/redo, validation, planning, versioned save, publication, and reusable template installation. The large client designer is dynamically loaded with a stable skeleton.

## Trigger catalog

Typed triggers cover organization creation and invitations; trial start/end; subscription renewal/expiration; lead creation/qualification; deal-stage changes; completed site visits; paid invoices; support tickets; published campaigns; and completed AI tasks. Existing CRM, communication, billing, organization, AI, time, manual, and webhook triggers remain compatible.

## Action catalog

Provider-neutral actions cover task creation, owner assignment, notifications, queued email/WhatsApp/SMS, AI tasks, CRM updates, meetings, reports, and configured provider calls. The runtime adapter compiles these through the existing `provider.*` dispatch boundary. Unsupported or disconnected providers fail closed; no mock success is returned.

## AI orchestration

Founder AI can coordinate Marketing AI, Sales AI, Customer Success AI, Creative AI, and Knowledge AI through existing tenant-scoped workflow and recommendation runtimes. The dashboard exposes attributed task evidence and does not claim autonomous execution.

## Approval governance

Large marketing campaigns, enterprise pricing changes, mass communications, and subscription updates are modeled as sensitive actions. Policies require approval before dispatch. Existing runtime controls preserve published-version enforcement, permission checks, independent approval, self-approval prevention, rejection, escalation, timeout, pause, resume, and cancellation.

## Tenant-scoped execution and audit

Every runtime context carries organization, workspace, actor, permissions, trigger, and correlation ID. Audit history records lifecycle state, step, attempts, duration, error code, actor, trigger, correlation ID, and timestamp. No cross-tenant execution path was added.

## Observability

The Founder dashboard reports running, waiting, failed and queued executions; success and failure rates; average execution time; retries; queue depth; last execution; sanitized errors; costs; AI participation; approvals; and full execution history.

## Release boundaries

No live provider was connected. No deployment, migration, reconciliation file, deployment script, authentication provider, or database history was modified. No commit was created.

## Validation

| Gate | Result |
| --- | --- |
| TypeScript | PASS |
| ESLint | PASS — zero errors; one pre-existing RC1 script warning |
| Sprint 108 tests | PASS — 8/8 |
| Full regression suite | PASS — 1,063/1,063 |
| Production build | PASS — 335 routes |
| Founder RBAC audit | PASS |
| Accessibility / UX audit | PASS |
| Performance / lazy-loading audit | PASS |
| Responsive / floating-layout audit | PASS |
| Theme audit | PASS |
| Production readiness audit | PASS |
