# RC1 integration status

| Integration | Code | Live evidence | Status |
| --- | --- | --- | --- |
| OpenAI | Provider and health diagnostics compile | Build observed `billing_required / credit_balance_exhausted` | BLOCKED |
| Stripe | Checkout, portal, subscriptions, invoices, webhooks | Live credentials/prices/webhook evidence unavailable | BLOCKED |
| Razorpay | Provider and signed webhook architecture | Live credentials/webhook evidence unavailable | BLOCKED |
| Supabase | Authenticated repository architecture | Read-only schema catalog verified; Version 1 schema behind | DEGRADED |
| Gmail | OAuth/provider/repository implemented | Credentials, consent, connection health unverified | DEGRADED |
| Google Calendar | OAuth/provider/repository implemented | Credentials, consent, connection health unverified | DEGRADED |
| Google Drive/Contacts | Incremental consent architecture implemented | Live connection unverified | DEGRADED |
| Microsoft 365 | Entra/provider-neutral architecture implemented | Live tenant/consent unverified | DEGRADED |
| WhatsApp | Cloud API and signed webhook implemented | Credentials and end-to-end webhook delivery unverified | DEGRADED |
| Email | Provider-neutral Resend/SendGrid/Postmark/SMTP architecture | Active provider and DNS authentication unverified | BLOCKED |
| Monitoring | Sentry/PostHog extension points | Production DSN/project evidence unavailable | BLOCKED |
