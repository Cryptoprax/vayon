# AI Customer Success & Growth Engine

## Purpose

The Founder-only engine at `/platform/founder/customer-success` unifies customer health, churn risk, retention, renewals, expansion, adoption, journey evidence, governed AI guidance, workflow preparation, and executive reporting. It reuses VAYON's customer-success repositories, billing evidence, Founder platform metrics, Workforce Runtime, Workflow Engine, realtime refresh, lazy charts, and shared report exporter.

## Access and governance

- Server authorization uses the existing `founderContext` boundary.
- Access requires `founder`, or `super_admin` with the explicit Boolean founder claim.
- Unauthorized users receive a not-found response and the navigation entry exists only in the hidden Founder Portal.
- RLS and existing platform permissions remain authoritative for every read.
- AI output is recommendation-only. The engine does not contact customers, change subscriptions, or execute workflows.

## Growth dashboard

The dashboard displays active trials, trial-to-paid conversion, active customers, renewals, expansion revenue, customer health, churn risk, NRR, GRR, LTV, ARPA, product adoption, and feature adoption. Missing metrics are explicitly unavailable rather than inferred.

## Customer health and churn

Existing customer directory and stored customer-health evidence are combined with bounded factors: login activity, AI usage, workspace and team activity, subscription plan, and support interactions. Billing, knowledge, and feature-adoption metrics are used only where authoritative records exist. Every account receives a bounded score, Healthy / Needs Attention / At Risk / Critical classification, reasons, confidence, churn probability, risk factors, and recommendation-only actions.

This is transparent rules-based operational intelligence, not a trained cancellation model. It does not claim statistical prediction where no model evidence exists.

## Renewals, expansion, and journey

The Renewal Center reads existing subscription and invoice evidence to show status, renewal date, auto-renew state, outstanding invoices, and actions. Expansion signals identify additional users, plan, AI, storage, and enterprise-onboarding opportunities; expected value remains unavailable without commercial evidence.

The journey is a read-only projection of existing activity events spanning acquisition, trial, adoption, AI, billing, support, marketing, sales, and renewal milestones.

## Copilot, workflows, and reports

The Customer Success Copilot reuses governed `executive-ai` streaming, history, provider health, token, cost, model, latency, workspace attribution, and fallback behavior. Trial onboarding, adoption nudges, renewals, check-ins, expansion, and win-back route to the existing Workflow Engine with consent, unsubscribe, and approval requirements.

Daily Customer Success, Weekly Executive, and Monthly Growth reports reuse the shared Founder PDF and PowerPoint exporter.

## Architecture

```text
Founder Customer Growth UI
  -> CustomerGrowthService
    -> existing CustomerRepository / HealthRepository
    -> CustomerGrowthRepository -> subscriptions / invoices / activity events
    -> FounderRepository -> platform metrics
  -> WorkforceRuntimeService (executive-ai)
  -> existing Workflow Engine
```

No deployment scripts, reconciliation SQL, migrations, providers, or database objects were added or changed.

## Validation

- TypeScript: PASS
- ESLint: PASS (zero errors; one unrelated pre-existing script warning)
- Founder RBAC and focused engine tests: PASS (14/14)
- Full regression suite: PASS (1,027/1,027)
- Production build: PASS (334 routes)
- Theme audit: PASS
- Responsive and accessibility readiness: PASS through the repository UX audit and focused semantic tests
- Performance audit: PASS (110 chunks, 1.89 MiB aggregate emitted JavaScript, 17 dynamic imports)
