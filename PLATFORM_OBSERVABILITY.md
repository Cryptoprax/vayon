# Platform Observability

## Architecture

The Founder-only observability center is a read-only projection over VAYON's existing deployment health provider, platform metrics, integration health/logs/webhooks/retry queue, AI runtime outputs, workflow and learning jobs, billing events, invoices, queues, and system alerts. It does not create a parallel telemetry runtime or collect customer content.

`Existing telemetry stores → Founder-scoped repository → evidence normalization → operational dashboard and exports`

All access begins with the existing `founderContext`. Repository reads continue through Supabase RLS. The dashboard exposes aggregate operational metadata only; prompts, messages, customer documents, secrets, tokens, and webhook payloads are never selected.

## Health model

States are `Healthy`, `Degraded`, `Unavailable`, `Maintenance`, and `Unknown`. Evidence is independently labeled `Live`, `Unavailable`, or `Unknown`.

- Live means an authoritative provider or stored health measurement exists.
- Unavailable means the measurement source was queried but has no usable evidence.
- Unknown means VAYON has configuration or component metadata but no verified live measurement.

Configuration presence is never presented as live provider health. Missing Cron/API/provider evidence remains Unknown or Unavailable rather than being fabricated.

## Incident lifecycle

Existing `system_alerts` records are projected as incidents. Open and acknowledged alerts remain open; resolved alerts retain their opening and resolution timeline. Severity, source module, customer-impact description, owner, and resolution evidence are displayed when recorded. Missing owner or resolution notes remain explicit.

## Alert model

Founder alerts normalize platform severity into Critical, Warning, and Info. Alerts are read-only in this sprint. They preserve their existing source, status, and timestamps and update through the existing Founder realtime channel.

## Reports

Daily Operations, Weekly Reliability, and Monthly Platform reports reuse the Founder export component. PDF uses the browser print pipeline and PowerPoint produces an exportable measured snapshot. Unavailable metrics remain labeled unavailable.

## Future integrations

The normalized health and evidence contracts can accept future Sentry exception aggregates, PostHog performance signals, external uptime monitors, queue/worker runtimes, and incident-management providers. Adapters must supply authoritative timestamps and evidence state, avoid customer payloads, and preserve Founder-only access before they can be marked Live.
