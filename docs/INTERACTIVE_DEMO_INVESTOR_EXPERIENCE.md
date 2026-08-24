# Interactive Demo & Investor Experience

## Outcome

Sprint 114 expands the existing `/demo` experience into a mode-aware, presentation-ready environment for prospects, sales teams, investors, founders, and enterprise buyers. It reuses the canonical Aurora Realty Group fixtures, demo repository, dashboard, CRM/property graph, Marketing currency system, tour telemetry, AI recommendations, workflow history, and VDS components. It does not duplicate application business logic.

## Isolation

The demo tenant is `aurora-demo-workspace`. Its repository returns frozen, deterministic, cross-linked fixtures and declares `readOnly: true`, `demoData: true`, and `seeded-json-fixtures` persistence. Product write links remain intercepted, create/edit actions remain disabled, resets affect browser presentation state only, and no authenticated or production tenant data is queried or modified.

## Complete sample workspace

Aurora includes organizations, employees, teams, contacts, companies, properties, projects, leads, deals, site visits, communications, campaigns, invoices, subscriptions, approved knowledge, creative assets, customer-health evidence, marketing and sales analytics, Founder dashboards, AI recommendations and conversations, workflow execution history, reports, and notifications. Monetary values remain synchronized with the shared marketing currency localization system.

## Demo modes

- Visitor Demo highlights CRM, properties, AI Workforce, and business outcomes.
- Sales Demo opens on pipeline, Sales AI, visits, and forecast evidence.
- Investor Demo foregrounds platform, growth, architecture, and scalability.
- Founder Demo emphasizes Founder AI, the Command Center, business health, and operations.
- Enterprise Demo focuses on security, integrations, governance, and automation.

Modes select a presentation profile; they never change persistence or authorization behavior.

## Guided tours and AI

Business-value walkthroughs cover CRM, Marketing AI, Sales AI, Customer Success, Founder AI, Workflow Automation, AI Command Center, Knowledge Platform, Creative Studio, and Integration Hub. Founder, Marketing, Sales, Customer Success, Knowledge, Creative, and Workflow AI surfaces use deterministic demonstration recommendations. Generated insights are labeled demo content and remain recommendation-only.

## Investor and executive story

Investor mode presents platform overview, architecture, demonstration business/growth metrics, AI capability, enterprise scalability, security, and roadmap. Released, verified, demo-content, and forward-looking states are distinguished. Executive Story moves through The Problem, The Solution, Marketing, Sales, Customer Success, AI Workforce, Founder AI, Operations, Integrations, and Growth.

## Presentation and screenshot modes

Presentation mode hides navigation chrome, uses a fullscreen-friendly layout, supports Previous/Next controls, Arrow Left/Right navigation, and Escape to exit, with reduced-motion behavior inherited from VDS. Screenshot mode marks the root capture surface while preserving theme, currency, responsive layout, and stable deterministic data for pitch decks, website imagery, marketing assets, and store listings.

## Release boundaries

No live provider was connected. No production data, authentication, deployment, database reconciliation, migration, migration history, or production configuration was modified. No deployment or commit was created.

## Validation

| Gate | Result |
| --- | --- |
| TypeScript | PASS |
| ESLint | PASS — zero errors; one pre-existing release-report warning |
| Sprint 114 tests | PASS — 8/8 |
| Full regression suite | PASS — 1,115/1,115 |
| Production build | PASS — 334 generated pages |
| Accessibility / UX audit | PASS |
| Performance audit | PASS |
| Responsive / floating-layout audit | PASS — 196 authenticated `/vayon` routes and zero unmanaged surfaces |
| Theme / production readiness | PASS |
