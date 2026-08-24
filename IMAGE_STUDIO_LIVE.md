# AI Image Studio Live

## Runtime flow

Image Studio authorizes with the centralized permission engine and submits every generation or edit to the existing Creative Execution Engine. Its unchanged planner resolves the registered `OpenAIImageRuntimeAdapter`, which delegates to the existing server-only OpenAI image provider. The enforced route is Creative Director → Pipeline → Creative Runtime request → Creative Execution Engine → Provider Adapter → OpenAI.

No UI imports a provider or SDK. An unavailable provider returns `WaitingProvider` and produces no image.

## Brand and campaign context

The image prompt builder resolves workspace, selected project, campaign, brand colours, logo reference, typography guidance, brand tone, visual identity, image type, and style. It explicitly prohibits invented logos, products, claims, people, and locations.

## Generation and editing

Generation covers product, hero, lifestyle, architecture, interior, team, office, mockup, background, and marketing imagery. Editing uses the same adapter for background removal/replacement, expansion, cropping, resizing, upscaling, inpainting, outpainting, colour replacement, object removal/addition, and variations. Source assets are retrieved only from the current tenant and workspace.

## Storage and lifecycle

Provider bytes are written to the existing private `vayon-assets` bucket under organization/workspace paths. Successful results create draft `creative_assets` records carrying workspace, project, campaign, brand context, provider model, prompt, storage path, metadata, and version. Edited outputs create new versions and never overwrite their source.

## Streaming and observability

`POST /api/creative/images/stream` emits Planning, Generating, Reviewing, and terminal lifecycle events. Execution results expose provider, latency, estimated cost, correlation IDs, history, warnings, failures, and retry state. Exports are PNG, JPG, WEBP, TIFF, and PDF; SVG remains future capability.

## Security

Provider credentials remain server-only. Tenant identifiers are resolved from authenticated context rather than client input. Storage lookup and asset insertion are organization/workspace scoped, and `creative_studio.create` or `creative_studio.update` is required.
