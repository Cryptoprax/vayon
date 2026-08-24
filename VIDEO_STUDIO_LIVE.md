# AI Video Studio Live

## Architecture and execution

Video Studio is available at `/vayon/creative/videos`. It composes the existing Brand Studio, campaigns, projects, Asset Library, Creative Pipeline, permission engine, Creative Runtime request contract, Execution Engine, and adapter registry. The path is Creative Director → Pipeline → Creative Runtime → Creative Execution Engine → `OpenAIVideoRuntimeAdapter` → server-only provider.

The Creative Director first submits script, scene, voiceover, subtitle, CTA, and thumbnail planning through the existing document adapter. Only an approved provider output becomes rendering context. The video request then enters the same execution engine. UI components never import provider SDKs or credentials.

## Provider lifecycle and operational risk

The adapter uses the video API exposed by the repository's installed OpenAI SDK. It validates video-specific access using a read-only provider listing call, creates or edits a job, polls until a terminal state, downloads the MP4 and optional thumbnail, and stores both privately. The installed SDK marks this API deprecated with shutdown scheduled for September 24, 2026. This is a launch risk: a replacement adapter must be certified before that date. Because the runtime contract is unchanged, replacement does not require studio or engine changes.

Unavailable or unauthorized video access returns `WaitingProvider`; no video, storyboard, or completion is fabricated.

## Brand intelligence and planning

The prompt builder injects brand colours, typography, logo reference, visual identity, motion style, brand voice, campaign context, company, industry, audience, language, duration, aspect ratio, platform, tone, music, voice, and CTA. It forbids invented products, claims, people, locations, credentials, and legal facts.

## Editing and versions

Scene, voice, subtitle, music, timeline, duration, and brand changes use the same runtime edit operation. The adapter resolves the source provider reference only from a tenant-scoped existing asset. Every successful edit creates a new draft asset with `versionOf` lineage; source assets are never overwritten. Undo and redo use version history.

## Storage and exports

Videos are stored in the existing private `vayon-assets` bucket under organization/workspace paths and registered in `creative_assets` with project, campaign, brand, prompt, provider model, storyboard, thumbnail, correlation, and version metadata. Contracts cover MP4, MOV, WEBM, GIF Preview, Storyboard PDF, and Subtitle SRT.

## Streaming and observability

`POST /api/creative/videos/stream` emits Planning, Storyboarding, Rendering, Reviewing, and the terminal result as NDJSON. Results expose provider, latency, estimated cost, warnings, failures, retries, generation history, and correlation IDs without exposing secrets.
