# Workspace Role Catalog Migration

## Scope

Sprint 120A adds the enterprise workspace roles through one forward-only migration. It changes no authentication, Founder authorization, bootstrap behavior, provider, production configuration, or deployment logic.

## Legacy compatibility

The existing role codes remain present and assignable:

- `organization_admin`
- `manager`
- `sales`
- `marketing`
- `operations`
- `finance`
- `support`
- `read_only`

The migration ensures these legacy rows exist and uses `ON CONFLICT (code) DO NOTHING`; consequently it never changes an existing role ID, name, scope, member assignment, or invitation. Existing invitation rows continue referencing the same immutable role IDs.

## Expanded catalog

The migration ensures the following built-ins exist: Organization Owner, Organization Admin, Operations Manager, Sales Manager, Sales Representative, Marketing Manager, Marketing Specialist, Customer Success Manager, Support Agent, Finance Manager, HR Manager, Knowledge Manager, Product Manager, AI Manager, Analyst, Standard Member, Viewer, and Guest.

`organization_owner` remains governed by the existing confirmation-based ownership-transfer function. It is catalogued but intentionally cannot be assigned through a normal invitation or ordinary role change. This prevents a workspace administrator from bypassing ownership-transfer confirmation or creating multiple owners.

Founder and `super_admin` are not workspace roles and are absent from both RPC allowlists.

## RPC changes

The existing signatures are unchanged:

- `invite_organization_member(uuid, text, text, text) returns uuid`
- `change_organization_member_role(uuid, uuid, text) returns void`

Both functions retain `SECURITY DEFINER`, an explicit `search_path`, the existing organization context authorization, tenant-scoped lookups and writes, audit events, ownership protection, grants, and error behavior. Their assignable-role allowlists now include every legacy role and every new non-owner workspace/member role.

## Migration safety

- Transactional execution with local lock and statement timeouts
- Additive role inserts only
- No role deletions or renames
- No updates to existing role rows
- No assignment or invitation rewrites
- No table, column, policy, trigger, or data removal
- Stable RPC names, arguments, return types, and grants
- Idempotent role insertion and function replacement

## Rollback

The safe rollback is functional, not destructive: restore the previous two RPC bodies if new role assignment must be paused. Do not delete newly added role records, because invitations or memberships may reference their IDs after rollout. Existing assignments and invitations require no rollback.

No migration down-script is supplied because deleting role rows would violate backward compatibility and could break foreign keys.
