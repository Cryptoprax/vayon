# AI Image Studio & Professional Editing Suite

## Architecture

`/vayon/creative/images` is a provider-neutral experience over the existing licensed Creative Studio asset repository and Brand Studio service. Access continues through the centralized `creative_studio` permission mapping and existing workspace isolation. No repository, database object, provider configuration, or authentication path is duplicated.

## Editing model

The editing contract models ordered layers, visibility, locking, opacity, command history, undo/redo cursor state, versions, actors, approvals, and draft autosave readiness. Manual tools include crop, resize, rotate, flip, layers, history, undo, redo, duplicate, and versioning.

AI-edit request types cover background/object work, canvas expansion, inpainting, outpainting, upscaling, relighting, colour and shadow adjustment, reflection/text replacement, smart erase, and magic selection. These controls remain disabled while no provider is configured.

## Provider abstraction

`ImageStudioProvider` defines stable generation and editing boundaries. OpenAI, Adobe, Google, and future engines can implement it without changing Image Studio business logic. The only current implementation is `UnavailableImageStudioProvider`, which fails explicitly and never fabricates an image.

## Asset lifecycle

Existing governed creative assets supply recent and AI image projections. The UX prepares projects, brand/uploaded/shared assets, folders, collections, tags, search, favorites, templates, variations, archive/restore, comments, approvals, assignments, and activity history. Unsupported mutations remain visibly preparatory.

Inspector metadata includes prompt, brand, project, creator, time, resolution, aspect ratio, palette, and usage. Missing authoritative technical metadata is shown as unavailable.

## Brand mode

Image creation automatically consumes the active Brand Studio identity for colours, typography, tone, logo placement, and spacing. No separate brand configuration is introduced.

## Export foundation

PNG, JPG, SVG, WEBP, TIFF, PSD, and PDF are typed future formats. Rendering remains unavailable until a provider is connected through the abstraction.

## Future roadmap

1. Add approved asset/project persistence and editing command storage.
2. Connect provider adapters behind entitlement, permission, audit, and approval gates.
3. Add non-destructive canvas rendering, layers, history, and autosave.
4. Add governed variations, comparison, collaboration, and lifecycle actions.
5. Add audited render/export workers without changing the studio contract.

No images were generated, no external API was connected, and authentication, Founder RBAC, permissions, subscriptions, billing, deployment, production configuration, and reconciliation remain unchanged.
