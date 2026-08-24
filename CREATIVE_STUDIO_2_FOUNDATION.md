# Creative Studio 2.0 Foundation

## Architecture

`/vayon/creative` is a new experience layer over the existing tenant-scoped Creative Studio repository and service. It deliberately reuses `CreativeStudioService.production()` for authentication context, workspace isolation, subscription licensing, campaigns, assets, and brand kits. The original `/vayon/creative-studio` Marketing Studio routes remain unchanged.

The foundation contains no new provider, database table, migration, external API, or generated media. Capabilities without an authoritative implementation are labelled `foundation`; provider-backed generation remains disabled.

## Project model

Every creative is organized around a project. During this foundation sprint, existing governed campaigns are projected as projects and related assets are grouped by campaign identity. The product contract prepares autosave, versions, duplicate, archive, restore, share, and export lifecycle capabilities without pretending those mutations exist.

## Asset model

The Asset Library reuses the existing `creative_assets` repository projection and is prepared for folders, collections, tags, search, favorites, brand assets, uploaded assets, and AI-generated assets. Tenant and workspace filters remain enforced in the existing repository.

## Brand Kit

Existing brand kits provide logos, primary and secondary colors, typography, icons, brand voice, tone, and company details. The home experience renders only authoritative stored brand information and provides a clear empty state otherwise.

## Future AI architecture

The persistent Creative Assistant is a UX foundation for conversation history, project memory, suggestions, and prompt improvement. Natural-language briefs require no technical settings. No prompt is sent to a provider in Sprint 125, and the UI states that generation is not connected.

Future rendering adapters can implement PNG, JPG, SVG, PDF, PPTX, DOCX, HTML, and MP4 through existing provider boundaries while project services retain governance and persistence control.

## Roadmap

1. Add additive, evidence-backed project and asset lifecycle persistence.
2. Connect governed generation adapters without changing business services.
3. Add version history, autosave, recovery, collaboration, and approval-backed sharing.
4. Implement export renderers by format with audit and entitlement enforcement.
5. Add marketplace publishing and installation governance.

## Security and compatibility

- Existing Creative Studio and Marketing Studio are preserved.
- Access continues through existing subscription licensing and internal-role checks.
- Navigation uses the centralized `creative_studio.view` permission mapping.
- Founder navigation points to the new home without changing Founder RBAC.
- No authentication, billing, entitlement, provider, production configuration, migration, deployment, or reconciliation logic is changed.
