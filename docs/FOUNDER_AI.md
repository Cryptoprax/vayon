# Founder AI — Executive CEO Copilot

## Purpose

Founder AI is the Founder-only executive intelligence layer at `/platform/founder/ai`. It composes the existing Founder Operating System, AI Marketing Director, AI Sales Director, AI Customer Success & Growth Engine, Executive AI workforce runtime, platform health, realtime refresh, lazy charts, and shared report exports. It introduces no new provider, business datastore, or autonomous execution path.

## Access and governance

- The server route uses `founderContext` and returns not-found for unauthorized users.
- Access requires `founder`, or `super_admin` with the explicit Boolean founder claim.
- Navigation exists only inside the hidden Founder Portal.
- Existing RLS, RBAC, workspace attribution, audit logging, and provider diagnostics remain authoritative.
- Every AI response and decision item is recommendation-only. Founder AI cannot publish, spend, contact customers, mutate CRM, or execute workflows.

## Executive home and morning brief

The home supplies a time-aware greeting, executive summary, weighted business-health score, priorities, revenue, marketing, sales, customer success, product/platform health, AI insights, lazy trends, and conversational access.

The morning brief covers revenue, MRR, ARR, organizations, users, trials, renewals, churn risk, best measured campaign/channel, pipeline forecast, support demand, alerts, system health, and tasks. Missing measurements are labeled unavailable.

## Decision and health engines

Recommendations are sorted by bounded expected-impact scores and include severity, confidence, and supporting evidence. They cover churn review, enterprise prospects, inefficient marketing allocation, high-value pipeline, infrastructure, onboarding, and launch opportunities only when evidence supports them.

The business-health score normalizes available Marketing, Sales, Customer Success, Billing, Product Usage, Platform Reliability, Support, and Growth signals. Each signal has an explicit weight and explanation. Unavailable signals are excluded and the remaining weights are renormalized; the UI discloses this derivation.

## Cross-module insights

Founder AI may highlight measured relationships such as channel conversion ratios or the co-occurrence of AI adoption and customer health. Every relationship is labeled an observed correlation with confidence and supporting evidence. The system never presents correlation as causation and reports unavailable cohort evidence explicitly.

## Executive chat and reports

Streaming chat reuses `executive-ai`, including conversation history, provider health, model, latency, token usage, cost, workspace attribution, recommendation-only governance, and deterministic fallback. Prompts require supporting evidence, measured/recommended distinctions, explicit unavailable states, and no execution.

Daily CEO, Weekly Executive, Monthly Board, and Quarterly Investor reports reuse the shared Founder PDF and PowerPoint exporter.

## Architecture

```text
Founder AI UI
  -> FounderAIService
    -> FounderService
    -> MarketingDirectorService
    -> SalesDirectorService
    -> CustomerGrowthService
  -> WorkforceRuntimeService (executive-ai)
  -> shared Founder charts / realtime / report exporter
```

No deployment scripts, reconciliation SQL, migrations, providers, or database objects were added or changed.

## Validation

- TypeScript: PASS
- ESLint: PASS (zero errors; one unrelated pre-existing script warning)
- Founder RBAC and focused Founder AI tests: PASS (16/16)
- Full regression suite: PASS (1,034/1,034)
- Production build: PASS (334 routes)
- Theme audit: PASS
- Responsive and accessibility readiness: PASS through the repository UX audit and focused semantic tests
- Performance audit: PASS (110 chunks, 1.89 MiB aggregate emitted JavaScript, 17 dynamic imports)
