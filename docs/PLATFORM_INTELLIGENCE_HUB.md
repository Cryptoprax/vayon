# Platform Intelligence Hub

## Purpose

The Founder-only Hub at `/platform/founder/intelligence` connects existing VAYON executive, marketing, sales, customer success, billing, product, workforce, health, notification, timeline, search, collaboration, observability, and reporting surfaces. It is a read-oriented intelligence composition layer, not a replacement module or autonomous orchestrator.

## Security and governance

- Server authorization uses `founderContext`; unauthorized access returns not-found.
- The route is linked only inside the hidden Founder Portal.
- Existing RLS, RBAC, workspace attribution, audit, notification RPCs, workforce governance, and provider diagnostics remain authoritative.
- Search and timeline are bounded and read-only. Per-source failures produce empty groups rather than leaking internal errors.
- AI task links enter existing governed runtimes. The Hub does not execute cross-agent actions itself.

## Command center and business intelligence

Eight live intelligence widgets link Marketing, Sales, Customer Success, Billing, Product, AI Workforce, Platform Health, and Executive Insights. Existing Founder AI KPIs and lazy trends cover MRR, ARR, cashflow/revenue evidence, growth, pipeline, churn, retention, forecast, adoption, feature usage, and subscriptions. Missing evidence is explicit.

## Unified executive search

One natural-language entry point searches existing organizations, users, properties, projects, leads, deals, campaigns, invoices, payments, subscriptions, knowledge, documents, tasks, AI conversations/employees, creative assets, support, meetings, site visits, messages, and reports. Input is sanitized and bounded. Results are grouped by category and retain links to their authoritative modules.

## Notifications and timeline

The Hub reads centralized notification evidence with category, priority, severity, read/unread, and archive status. State-changing actions route to the existing Notification Center and its governed `mutate_notification` RPC.

The executive timeline projects existing activity events with optional organization, workspace, user, date, and module filters. It includes every recorded Marketing, Sales, Customer Success, Billing, AI, Support, Knowledge, Creative, Security, Platform, and Founder event without synthesizing activity.

## Cross-module analytics and AI coordination

Cross-module cards reuse Founder AI correlations and always label them evidence-backed observations with no causation claimed. Agent cards coordinate Founder, Marketing, Sales, Customer Success, Creative, Knowledge, and Workforce intelligence by routing tasks, progress inspection, evidence, and results to existing governed runtimes.

## Reports and observability

Daily Business, Weekly Executive, Monthly Board, Quarterly Investor, and Annual Company reports reuse the shared Founder PDF and PowerPoint exporter. System observability reuses platform health for API latency, realtime, database, queues, cron, workers, storage, errors, and AI provider diagnostics.

## Architecture

```text
Platform Intelligence Hub
  -> IntelligenceHubService
    -> FounderAIService -> existing Director services
    -> IntelligenceHubRepository -> bounded search / notifications / activity events
  -> existing Notification Center mutations
  -> existing AI collaboration and workforce routes
  -> shared realtime / charts / reports
```

No deployment scripts, reconciliation SQL, migrations, providers, or database objects were added or changed.

## Validation

- TypeScript: PASS
- ESLint: PASS (zero errors; one unrelated pre-existing script warning)
- Founder RBAC and focused Hub tests: PASS (17/17)
- Full regression suite: PASS (1,040/1,040)
- Production build: PASS (334 routes)
- Theme audit: PASS
- Responsive and accessibility readiness: PASS through the repository UX audit and focused semantic tests
- Performance audit: PASS (110 chunks, 1.89 MiB aggregate emitted JavaScript, 17 dynamic imports)
