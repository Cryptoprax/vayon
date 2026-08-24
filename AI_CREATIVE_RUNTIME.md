# AI Asset Generation Engine & Multi-Provider Creative Runtime

## Architecture

Creative Director, Image Studio, Campaign Studio, Brand Studio, and future Video/Document studios submit typed requests to the Creative Runtime. The runtime queries a capability matrix, asks the deterministic router for a decision, resolves an adapter from the adapter registry, and—only when a future provider is available—can create a governed job. Creative modules never branch on provider names.

The Founder-only `/vayon/creative/runtime` route reuses `founderContext()` and exposes registry metadata, capability health, routing status, and job observability without customer data.

## Provider Registry

Descriptors contain identity, types, status, capabilities, quality/speed/cost tiers, resolution and aspect-ratio constraints, and detailed generation/editing features. OpenAI, Adobe, Google, and Stability are represented only as unavailable future descriptors. No adapter is registered and no provider is connected.

## Routing and fallback

Routing filters available descriptors by required capability, aspect ratio, output constraints, brand requirements, style, quality, and priority. Candidates are sorted deterministically. The resulting fallback chain is Primary → Secondary → Tertiary → Unavailable. When there is no eligible provider, routing fails closed before creating a job or asset and supplies explainable reasons.

## Capability matrix

Modules ask `CanGenerateImages`, `CanEditImages`, `CanGenerateVideo`, `CanCreateLogos`, `CanUpscale`, or `CanRemoveBackground`. Each resolves to a provider-independent capability key. The current matrix is entirely unavailable.

## Job lifecycle

Jobs support Queued, Running, Completed, Failed, Cancelled, and WaitingApproval. Observability contracts include provider identity, latency, retry count, cost estimate, resolution, aspect ratio, failure reason, and correlation ID. No job persistence or execution is introduced in Sprint 129.

## Adapter contracts

`CreativeProviderAdapter` defines `generate`, `edit`, `upscale`, `removeBackground`, `replaceBackground`, `createVariations`, `inpaint`, `outpaint`, `createLogo`, and `createMockup`. The adapter registry is empty. Generated-output contracts require workspace, project, campaign, brand, Creative Director task, and Asset Library relationships.

## Quality review

The deterministic review checks brand consistency, asset completeness, prompt quality, metadata completeness, and whether a provider responded. It exposes reasons and explicitly declares `automatedJudgement: false`.

## Future provider integration

1. Implement an adapter without changing studio or router contracts.
2. Register its descriptor only after credential and health verification.
3. Enforce permissions, entitlements, approvals, quotas, and tenant scope before queuing.
4. Persist jobs and observability through existing repository/service boundaries.
5. Store approved outputs in the existing Asset Library with full lineage.

No external API was called, no provider was connected, no asset was generated, and authentication, Founder RBAC, permissions, subscriptions, billing, deployment, production configuration, and reconciliation remain unchanged.
