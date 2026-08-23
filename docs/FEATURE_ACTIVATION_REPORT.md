# VAYON Version 1.0 Feature Activation Report

Date: 2026-08-23  
Scope: Sprint 88 production activation  
Policy: completed capabilities are discoverable; unfinished or autonomous capabilities remain unavailable.

## Production ready and activated

| Capability | Entry point | Governance |
| --- | --- | --- |
| Marketing / AI Creative Studio | `/vayon/creative-studio` | Workspace membership, RBAC, subscription entitlement, approvals |
| AI Growth Studio and campaign packs | `/vayon/creative-studio/growth` | Same Marketing Studio entitlement; recommendation-only outputs |
| Campaign assistant, wizard, templates, brand kits, assets, calendar and analytics | Marketing Studio navigation | Authoritative workspace context and approval workflow |
| Flyer, brochure, social, copy, designer and storyboard generation | Marketing Studio workflow | Draft generation; video rendering remains Preview |
| Landing page and sales-kit generators | AI Growth Studio generator catalog | Editable governed drafts; no live publishing |
| VAYON Intelligence | Global authenticated shell and `/vayon/intelligence` | Tenant context, RBAC, knowledge-first retrieval, recommendation-only actions |
| Enterprise Knowledge Platform | `/vayon/knowledge` | Tenant-scoped repository and RLS |
| Product Intelligence and continuous learning insights | `/vayon/settings/product-intelligence` | Administrative RBAC, anonymized diagnostics, recommendations only |
| Executive AI briefings | `/vayon/workforce` | Workforce runtime governance and approvals |

Marketing Studio remains controlled by plan licensing rather than a beta flag. VAYON Intelligence is enabled unless an operator explicitly sets `FEATURE_VAYON_INTELLIGENCE=false`, preserving an emergency disable path.

## Internal only

- Provider, runtime, cognitive, brain, system, and architecture diagnostics remain inside the collapsed Developer navigation.
- Deployment and certification tooling remains operational rather than customer-facing.

## Incomplete or future — not activated

- Referral and affiliate programs
- Live or future social publishing
- Autonomous AI execution
- Experimental integrations
- Video rendering (the storyboard generator is available; rendering remains clearly marked Preview)
- Provider capabilities that lack credentials or plan entitlement

## Route and navigation verification

`npm run audit:activation` verifies that every primary authenticated navigation link resolves to an App Router page, production-ready entry points are visible exactly once, incomplete capabilities are not exposed, and Intelligence remains enabled by default. The production build remains the authoritative complete route compilation check.

## Demo experience

The isolated Aurora demo exposes Marketing, Growth, Landing Pages, and the AI Assistant using deterministic demo projections. It does not require production integrations, persist edits, or share data with authenticated tenants.
