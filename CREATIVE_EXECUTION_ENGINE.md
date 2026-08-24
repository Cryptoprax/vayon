# Creative Execution Engine & Provider Runtime

## Execution lifecycle

Jobs move through Queued, Planning, WaitingProvider, Executing, WaitingApproval, Completed, Failed, or Cancelled. Priority ordering, bounded retries, timeout, cancellation requests, tenant attribution, and correlation IDs are first-class contracts. With no registered adapter, jobs stop at WaitingProvider and return no outputs.

## Planner

The planner resolves the requested capability against the adapter registry, validates requests through candidate adapters, checks adapter health, constructs a deterministic primary/fallback chain, validates dependency identifiers, and returns an explainable plan. It never selects a provider by hard-coded name.

## Queue

The in-process queue is an execution contract for this infrastructure sprint. It orders critical, high, normal, and low priorities; enforces retry and timeout configuration; supports cancellation and bounded retry; and emits tenant-scoped Queued, Retry, and Cancelled events. Durable persistence is intentionally not implemented.

## Execution service

`CreativeExecutionService` validates organization/workspace attribution and request completeness, queues the job, requests a plan, resolves only a registered adapter, applies timeout cancellation, collects outputs and metadata, emits Started/Failed/ApprovalRequested events, and returns a typed result. Successful adapter output always pauses at WaitingApproval.

## Adapter registry and contracts

The empty registry accepts future Document, Image, Video, Voice, Presentation, Website, and Translation adapters. `RuntimeAdapter` defines generate, edit, translate, export, validate, health, and estimate. No adapter or provider implementation is included.

## Repository contracts

`TenantSafeDocumentRepository` requires organization/workspace attribution and supports Draft, Save, Load, Version, Archive, Restore, Delete, and Search. It is an interface only; no persistence or database change is introduced.

## Future provider integration

1. Implement a provider adapter against `RuntimeAdapter`.
2. Register it only after credentials and health checks succeed.
3. Add a durable tenant-scoped execution queue repository.
4. Add a document repository implementation through approved schema work.
5. Preserve approval gates before Asset Library persistence or export.

No provider is connected, no AI generation occurs, and authentication, Founder RBAC, permissions, subscriptions, billing, deployment, production configuration, database reconciliation, Creative Runtime, and Pipeline Engine remain unchanged.
