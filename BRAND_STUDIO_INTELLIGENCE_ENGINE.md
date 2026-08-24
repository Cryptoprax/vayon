# Brand Studio & Brand Intelligence Engine

## Architecture

`/vayon/creative/brand` uses the existing `CreativeStudioService.production()` boundary, preserving its authenticated workspace context, subscription licensing, and tenant-scoped Brand Kit repository. No parallel repository, provider, table, migration, or authentication flow is introduced.

The seven-step wizard produces an explicit draft identity in the browser. Existing Brand Kit persistence remains authoritative until a future additive persistence contract supports the expanded intelligence model.

## Brand model

The typed model covers company profile, market, business type, audiences, personality, colour strategy, logo and photography preferences, values, mission, vision, voice, writing, typography, icons, illustration, motion, CTA conventions, legal disclaimers, keywords, and do/don't guidance.

Organizations can view and switch among existing brands. Default, duplicate, archive, and restore controls are prepared without claiming unsupported mutations. The portfolio supports active, default, and archived lifecycle states.

## Consistency engine

The deterministic engine evaluates presence of primary/secondary logos, colour coverage, typography, icons, email signatures, and version readiness. It returns an explainable score, missing assets, outdated assets, and recommendations. It never changes brand data automatically.

## Shared creative defaults

`resolveCreativeBrandDefaults()` is the central typed resolver for Marketing, Presentation, Video, Website, and Image Studio defaults. It exposes colours, typography, voice, visual styles, CTA conventions, and legal disclaimers from the selected brand.

## Future AI integration

“Let AI Recommend” is a prepared wizard choice only. No AI or image provider is called. Future AI integrations must consume the central brand-default contract, return recommendations rather than silent mutations, and preserve approval, audit, entitlement, and tenant boundaries.

## Roadmap

1. Add an approved additive persistence contract for the expanded brand profile and lifecycle.
2. Add audited default switching, duplication, archive, and restore actions.
3. Connect recommendation-only Brand Intelligence through the existing AI runtime.
4. Add governed Brand Guidelines PDF, ZIP package, logo pack, colour-token, and typography-sheet exporters.
5. Apply consistency validation to every Creative Studio output before approval.

## Safety

Existing Creative Studio projects and Brand Kits are unchanged. Authentication, Founder RBAC, permissions, subscriptions, billing, providers, production configuration, deployment, reconciliation, and migrations are untouched. No AI assets are generated.
