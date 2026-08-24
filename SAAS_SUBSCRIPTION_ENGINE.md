# SaaS Subscription & Entitlement Engine

## Architecture

The entitlement engine is the application authority for commercial access. The existing tenant-scoped subscription record remains authoritative for the active plan; the typed catalog defines plan capabilities and quotas; the policy evaluator returns a serializable decision; and the server service enforces that decision. Existing workspace permissions remain a separate, mandatory authorization layer.

`Subscription → Entitlement catalog → Feature/quota decision → UI or server enforcement`

Founder exemption is derived only from the existing trusted `app_metadata.role` Founder check. It does not alter Founder RBAC, grant access, or bypass workspace isolation. Non-Founder decisions always use the current organization and workspace subscription.

## Plan matrix

| Capability | Starter | Professional | Business | Enterprise |
| --- | --- | --- | --- | --- |
| Users | 3 | 10 | 50 | Unlimited |
| Workspaces | 1 | 3 | 10 | Unlimited |
| Core | CRM, Calendar, Basic AI, Knowledge, Email | Starter plus department AI, Creative Studio, workflows, Google, Microsoft, WhatsApp | Professional plus advanced AI/analytics, approvals, API and priority support | All capabilities, white label, SSO, custom domain/roles, audit and advanced security |
| Integrations | None | 5 | 25 | Unlimited |
| AI requests | 1,000 | 10,000 | 50,000 | Unlimited |

The complete quota matrix is centralized in `features/vayon/billing/config/entitlements.ts`; feature consumers must not compare plan names directly.

## Entitlement flow

1. Resolve the authenticated organization/workspace through the existing operations context.
2. Load its non-deleted subscription and joined plan code.
3. Validate the plan code against the catalog (unknown codes fail closed).
4. Evaluate feature inclusion, trial/expiration, or quota usage.
5. Return `enabled`, `disabled`, `limited`, `quota`, `expiration`, or `trial` with a reason and recommended plan.
6. Server mutations call `requireFeature`/`requireQuota`; UI uses the same decision in `EntitlementGate`.

## Quota model

Finite quotas return `limited` until `usage + increment` exceeds the limit, then return `quota`. `null` means unlimited. Zero explicitly disables consumption. Expired entitlements fail closed. The existing database RPC remains the atomic authority when recording metered billing usage.

## Upgrade experience

Locked controls may be hidden, disabled, or replaced by an accessible upgrade dialog. The dialog explains the denial, shows current and recommended plans, and links to the existing subscription comparison page.

## Future billing integration

Stripe/Razorpay lifecycle events continue updating subscription state through existing providers. Future billing work can synchronize catalog definitions into `subscription_plans` without changing feature consumers. Custom Enterprise overrides can be layered into the repository response while preserving the same policy and decision contract.
