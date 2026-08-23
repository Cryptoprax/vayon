# VAYON Founder Operating System

## Purpose

The Founder Operating System is VAYON's founder-only company control center at `/platform/founder`. It composes authoritative platform measurements, activity, commercial signals, AI usage, security, and health without creating another analytics or administration architecture.

## Access and governance

- Access is evaluated on the server from verified Supabase Auth claims.
- A user must have the dedicated `founder` platform role, or the existing `super_admin` role plus the explicit Boolean `founder` claim.
- Unauthorized requests resolve as not found, and the Founder Portal navigation item is omitted for every non-founder.
- Browser realtime receives only data permitted by existing RLS. It refreshes the server snapshot and never writes data.
- Quick actions navigate to existing governed workflows. They do not bypass approvals or execute broadcasts.
- Founder AI insights are labeled recommendation-only. The existing Executive AI remains the governed generation surface.

## Architecture

```text
Founder Portal UI
  -> FounderService
    -> FounderRepository
      -> existing Supabase platform tables and RLS
  -> existing Executive AI route
  -> existing platform navigation and design system
```

The repository reads platform metrics and authorized aggregate counts. Optional or unavailable sources resolve to explicit unavailable states; the dashboard never substitutes demo or fabricated production values.

## Dashboard surfaces

- Sixteen top-level KPIs covering revenue, organizations, subscriptions, conversion, churn, AI usage, support, and notifications.
- Realtime activity across organizations, workspaces, subscriptions, billing, AI, CRM, properties, campaigns, creative assets, knowledge, and support.
- Lazy-loaded revenue, subscription, growth, traffic, usage, retention, churn, ARR, MRR, DAU, and MAU trend charts.
- Provider-ready marketing channel overview for Google Ads, Meta, LinkedIn, YouTube, organic, referral, affiliate, email, and direct.
- Sales pipeline, deals, win rate, average deal, forecast, demo request, and enterprise lead signals.
- Founder AI brief, forecast, risk, and growth recommendations.
- Database, realtime, storage, functions, queues, workers, cron, API, latency, errors, and build health.
- Failed login, suspicious activity, audit, and API error indicators.
- Governed shortcuts to existing organization, customer, communications, marketing, growth, creative, and AI Workforce experiences.

## Experience and performance

- Responsive grids support mobile, tablet, desktop, and wide executive displays.
- Semantic VAYON tokens preserve dark, light, and system themes.
- Charts are client-lazy-loaded behind fixed-size skeletons.
- Realtime events are coalesced before refreshing to avoid request storms.
- Tables retain accessible captions, headings, focus states, and horizontal overflow on compact displays.

## Operational notes

- Missing platform measurements are shown as unavailable.
- Currency metrics currently use the platform reporting currency contract; no visitor geolocation is used inside the authenticated product.
- Provider connector rows remain unavailable until authoritative provider metrics are recorded in `platform_metrics`.
- No migration, database reconciliation, deployment package, or production configuration change is required.

## Validation

- TypeScript: PASS
- ESLint: PASS (zero errors; one unrelated pre-existing warning)
- Founder RBAC and architecture tests: PASS (4/4)
- Full regression suite: PASS (1012/1012)
- Production build: PASS; `/platform/founder` is a dynamic server route
- Theme audit: PASS
- UX, responsive, and accessibility readiness audit: PASS
- Performance audit: PASS; charts add one intentional dynamic import
- Production-readiness audit: PASS
