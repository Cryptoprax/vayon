# VAYON AI Marketing Director

## Overview

The AI Marketing Director is the founder-only marketing command center at `/platform/founder/marketing`. It extends the Founder Operating System and reuses VAYON's existing Marketing AI runtime, Creative Studio, workflow governance, platform metrics, Supabase repositories, themes, and layout manager.

## Access control

- The route uses the same server-enforced Founder Portal context as Sprint 100.
- Access requires the dedicated `founder` role, or `super_admin` plus the explicit Boolean founder claim.
- Unauthorized users receive a not-found response, and the entry point exists only inside the already-hidden Founder Portal.
- Existing RLS continues to govern every repository and realtime read.

## Command center

- Marketing spend, attributable revenue, ROI, ROAS, CAC, CPL, trial conversion, paid conversion, monthly growth, and daily growth.
- Measured values come from existing platform metrics. Missing evidence is displayed as unavailable.
- Lazy trend charts and fixed-size skeletons avoid layout shifts.
- Realtime changes are coalesced and refresh the server-owned snapshot without client mutations.

## Campaigns and attribution

- Existing Creative Studio campaigns are presented across Draft, Scheduled, Running, Paused, and Completed states.
- Campaign management routes back to the existing Creative Studio rather than duplicating campaign mutations.
- Attribution prepares Google Ads, Meta, LinkedIn, Organic, Direct, Referral, Email, and Affiliate views for visitors, leads, trials, paid customers, revenue, CAC, and ROAS.
- The repository selects no lead PII. Unavailable or RLS-restricted evidence remains explicit.

## AI campaign builder and assistant

- A founder goal becomes a governed Marketing AI prompt for strategy, headlines, descriptions, CTAs, audiences, budgets, keywords, and UTM parameters.
- The live assistant is the existing `marketing-ai` workforce runtime with conversation history, streaming, model, latency, token, and cost observability.
- The goal can be handed to the existing Creative Studio Campaign Wizard, where it pre-fills the objective and creative asset generation remains editable and approval governed.
- AI never publishes, spends, sends, or fabricates campaign performance.

## Automation and consent

Welcome, trial onboarding, trial reminder, renewal reminder, and win-back templates link to the existing workflow framework. Every template requires consent, unsubscribe support, and human approval. No automation is executed from the command center.

## Reporting

- Daily, weekly, and monthly report snapshots are available.
- PDF uses the browser's accessible print/PDF workflow.
- PowerPoint export produces a local Office-compatible presentation document from measured KPI values.
- Reports escape generated markup and label unavailable evidence.

## Architecture

```text
Founder Marketing UI
  -> MarketingDirectorService
    -> MarketingDirectorRepository
      -> existing platform_metrics / creative_campaigns / attribution evidence
  -> existing WorkforceRuntimeService (marketing-ai)
  -> existing Creative Studio Campaign Wizard
  -> existing Workflow framework
```

No deployment scripts, reconciliation SQL, migrations, providers, or database objects were added or changed.

## Validation

- TypeScript: PASS
- ESLint: PASS (zero errors; one unrelated pre-existing script warning)
- Regression tests: PASS (1,017/1,017)
- Production build: PASS (334 routes)
- Responsive and accessibility readiness: PASS through the repository UX audit and responsive component tests
- Performance audit: PASS (lazy charts, 108 chunks, 1.86 MiB total client JavaScript)
- Theme audit: PASS
- Founder RBAC audit: PASS through focused Sprint 101 access tests
