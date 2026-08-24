# Enterprise Role Management UI

## Architecture

The Team Management experience uses one centralized workspace role catalog at `features/platform/organization/config/workspace-role-catalog.ts`. It is the application source for role names, departments, descriptions, permission summaries, restrictions, typical users, icons, colors, and assignability. Invite validation consumes the same catalog, preventing duplicated role allowlists in the UI and validation layer.

Authentication, Founder authorization, Founder Bootstrap, providers, migrations, reconciliation, and deployment configuration were not changed by Sprint 120B.

## Role grouping

- Executive: Organization Owner, Organization Admin
- Sales: Sales Manager, Sales Representative
- Marketing: Marketing Manager, Marketing Specialist
- Operations: Operations Manager
- Customer Success: Customer Success Manager
- Supported Services: Support Agent
- Finance: Finance Manager
- Human Resources: HR Manager
- Knowledge: Knowledge Manager
- Product: Product Manager
- AI: AI Manager
- General: Analyst, Standard Member, Viewer, Guest

Organization Owner is visible for role understanding but is not offered by invite or quick role assignment. Ownership remains available only through the existing confirmation-gated transfer operation. Founder and `super_admin` have no workspace catalog entries and cannot appear in any picker.

## Permission summaries

Each role definition contains its complete capability summary and explicit restrictions. Role cards show a concise permission preview, while the details panel shows the full description, capabilities, restrictions, and representative users. Member rows resolve their badge, department, and permission summary from the same catalog.

Legacy roles remain defined as non-assignable compatibility entries. Existing members keep their current role, badge, and valid form value until an administrator intentionally moves them to an enterprise role. They are not offered for new invitations.

## UI behavior

- Invite roles can be searched by name, department, description, or permission.
- Results remain grouped by department.
- Selecting a role updates the form's governed `role` value.
- Member rows provide a grouped quick-change selector plus existing suspend, reactivate, and remove controls.
- Pending invitations show role and department context.
- The role catalog provides department-colored cards and a responsive details panel.
- The existing repository, service, server-action, and RPC flow remains authoritative for mutations and tenant isolation.

## Accessibility and responsive behavior

- Search inputs have visible labels and connect to the catalog with `aria-controls`.
- Role choices use native buttons with `aria-pressed`, preserving keyboard activation and focus behavior.
- Catalog groups use labelled sections and semantic headings.
- Member role selectors have member-specific screen-reader labels.
- Wide member data remains usable through bounded horizontal scrolling.
- Invite and catalog layouts collapse to one column on small screens and expand progressively on larger screens.
- All colors use VAYON semantic design tokens; meaning is also conveyed through text and icons.

## Future custom-role support

The catalog contract already models the metadata required by custom roles. Custom roles remain intentionally unexposed. A future Enterprise implementation can merge tenant-scoped custom definitions after server validation without changing the picker, member table, role cards, or details panel. Built-in role codes remain immutable and platform roles remain excluded.
