# Business Launch Mode

## Architecture

Business Launch Mode is an orchestration experience at `/onboarding/business-launch`. It adds no provider, runtime, database table, migration, or parallel project store. The workspace permission engine authorizes reads and preparation, while the existing tenant-scoped Enterprise Onboarding service persists the resumable `BusinessLaunchProject` inside its structured configuration.

The project is a coordination record. Its work items link to the authoritative Brand Studio, CRM, AI Workforce, Creative Cloud, Campaign Studio, Document Studio, Image Studio, and Video Studio routes. Those modules remain responsible for their own validation, permissions, entitlements, approvals, provider execution, storage, and audit history.

## Execution flow

1. Capture the business identity, market, language, and optional website.
2. Select business type, goals, audiences, and requested deliverables.
3. Resolve existing Brand Studio and Campaign Studio evidence.
4. Calculate deterministic readiness and time estimates without AI judgement.
5. Create or update the idempotent Business Launch Project in the existing onboarding session.
6. Prepare approval-gated work items owned by existing systems.
7. Let the user enter each authoritative module to review and execute the item.

Preparation never calls a generation provider and never fabricates assets. If provider credentials are absent, the preview warns that supported studios will retain their existing `WaitingProvider` behavior.

## System orchestration

| Deliverable                                     | Authoritative system |
| ----------------------------------------------- | -------------------- |
| Brand identity                                  | Brand Studio         |
| CRM workspace                                   | CRM                  |
| AI Workforce                                    | AI Workforce         |
| Company profile, brochure, pitch deck, proposal | Document Studio      |
| Website and landing page                        | Creative Cloud       |
| Campaign, social pack, email templates          | Campaign Studio      |
| Product images                                  | Image Studio         |
| Promotional video                               | Video Studio         |

No generation logic is duplicated in the onboarding feature.

## Launch lifecycle

The launch project begins as `Prepared`. Individual items are `Ready`, `Waiting Approval`, `Blocked`, `Completed`, or `Failed`. The stored record tracks timestamps, readiness scores, estimates, warnings, errors, outputs, and approval requirements. Re-preparing a launch preserves its project ID and creation timestamp.

Founder observability can aggregate the tenant-scoped launch records into launches started, launches completed, average completion time, success rate, and failures. The present implementation exposes auditable lifecycle fields but does not fabricate cross-tenant metrics when no production event evidence exists.

## Future roadmap

- Aggregate consent-safe launch lifecycle events in the existing Platform Intelligence pipeline.
- Add module completion callbacks to advance launch items automatically.
- Extend existing workflow approvals for organization-specific launch policies.
- Add evidence-backed completion-time and conversion reporting.

Provider availability, subscriptions, permissions, and tenant boundaries continue to be enforced by their existing systems.
