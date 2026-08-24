# Enterprise Permission Enforcement Engine

## Architecture

Sprint 121 introduces a default-deny workspace authorization layer under `features/platform/permissions/runtime`. The Sprint 120 workspace role catalog remains the authoritative set of valid role identities. The runtime adds one structured matrix mapping those roles to module actions; all evaluation flows through `evaluateWorkspacePermission`.

The engine has four boundaries:

1. Pure policy evaluation for deterministic, testable decisions.
2. A server-only permission service that resolves the authenticated actor’s active workspace membership and tenant scope.
3. Page and API adapters that translate denial into HTTP 403 behavior.
4. Client presentation helpers for navigation filtering and hide/disable behavior.

Authentication, Founder RBAC, Founder Bootstrap, migrations, reconciliation, providers, deployment, and production configuration are unchanged.

## Permission matrix

Every catalog role has a profile across the modules CRM, Leads, Contacts, Companies, Deals, Calendar, Marketing, Campaigns, Creative Studio, Knowledge, Customer Success, Billing, Invoices, Reports, Analytics, AI Employees, Workflow Automation, Integrations, Team Management, and Organization Settings.

Each module supports `view`, `create`, `update`, `delete`, `approve`, `export`, `manage`, and `admin`. Missing grants deny by default.

Important constraints include:

- Sales Representative can work sales records but cannot access billing, integrations, or team administration. Owned lead/deal checks deny when a supplied resource owner differs from the actor.
- Marketing Specialist can work campaigns and creative content but has no billing or CRM administration.
- Finance Manager manages billing and invoices and can read/export reports, without CRM or marketing mutation rights.
- Analyst receives read/export access to analytics and reporting plus read-only business context.
- Viewer receives view-only permissions.
- Guest receives no general module access; a request must carry evidence that the resource was explicitly shared.
- Organization Owner receives the full workspace matrix, while Founder Platform access remains governed by the separate unchanged Founder RBAC layer.

Legacy roles retain explicit compatibility profiles rather than being silently promoted.

## Resolution flow

1. Resolve the active organization and workspace through the existing tenant context.
2. Load the authenticated user using the existing Supabase server client.
3. Query that user’s active `workspace_members` row scoped by organization, workspace, user, and status.
4. Validate the database role against the Sprint 120 catalog.
5. Evaluate the requested module and action through the centralized policy.
6. Return the tenant-scoped authorization context or throw `WorkspacePermissionError` with status 403.
7. Record denial metadata through the structured logger: actor, role, permission, module, organization, workspace, and timestamp. Secrets and record payloads are excluded.

## Server enforcement

`requireWorkspacePermission` is the shared service/action guard. The Organization service now verifies every administrative mutation before calling its existing tenant-scoped repository and RPC. This includes invitations, invitation lifecycle, role changes, suspension/reactivation, removal, team/department management, organization updates, and confirmed ownership transfer.

`enforcePagePermission` uses Next.js 16 `forbidden()` and the friendly `app/forbidden.tsx` boundary, producing a real 403 rather than hiding authorization failures as 404 pages. Primary Team, Roles, Organization Settings, Billing, and Integration pages use this guard.

`enforceApiPermission` provides the equivalent protected-handler contract and returns a sanitized JSON 403 response. It does not alter public webhooks or externally authenticated processor endpoints.

## Client enforcement

The authenticated shell resolves the workspace role server-side and passes only that role code to the sidebar. Navigation items are filtered through the same evaluator, eliminating dead links for modules the role cannot view.

`PermissionGate` supports hiding unauthorized controls or presenting them disabled. This is presentation defense only; server checks remain authoritative and client input is never trusted.

## Organization and tenant isolation

Permission resolution always includes organization ID, workspace ID, authenticated user ID, and active membership status. Permission grants cannot create membership, switch tenants, or bypass existing RLS and RPC checks. Unknown or absent roles fail closed.

## Future custom-role support

The evaluator is role-profile based. Future tenant-scoped custom roles can be added by resolving an approved custom profile into the same module/action structure after server validation. The evaluation, navigation, component, page, action, API, and audit adapters require no redesign. Custom roles remain unexposed in this sprint.
