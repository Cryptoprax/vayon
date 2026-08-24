# Live AI Provider Integration

## Execution flow

Document Studio authorizes through the centralized permission engine, assembles tenant and brand context, and invokes the existing `CreativeExecutionService`. Its unchanged planner resolves `OpenAIDocumentAdapter`, which delegates to the existing platform OpenAI provider. The path is Creative Director → Creative Pipeline → Creative Runtime request → Creative Execution Engine → Provider Adapter → OpenAI.

No UI imports a provider, API key, or provider SDK. When provider health is unavailable, the planner returns `WaitingProvider` and no document is created.

## Prompt assembly

The unified prompt builder combines workspace, brand, campaign, audience, purpose, language, industry, document type, company, length, and tone. Brand resolution injects voice, colours, typography, mission, vision, CTA style, and legal footer from Brand Studio. Missing values are marked for clarification; business facts are never inferred.

## Streaming lifecycle

`POST /api/creative/documents/stream` emits NDJSON lifecycle events for Planning, Writing, Brand Review, Formatting, and the terminal result. It calls the same permission-protected operation, so generation remains inside the Execution Engine. The adapter also exposes provider text streaming for future granular block updates.

## Quality review

Successful output is parsed into editable titled sections and blocks. The deterministic reviewer checks required sections, brand attribution, missing-information markers, tone configuration, and formatting completeness. Review failures return an editable draft and never invent missing data.

## Security

Credentials remain in `OPENAI_API_KEY`, used only by the existing server provider. Organization and workspace IDs come from authenticated server context. Content creation requires `creative_studio.create`.

## Observability

Outputs carry provider, model, latency, token usage, estimated cost, and correlation ID. The Founder execution dashboard exposes live provider health, current and completed requests, average duration, failures, warnings, and retries. Secrets are never logged.

## Future image/video integration

Image and video providers must implement the unchanged `RuntimeAdapter` and register through the same composition root. No image or video capability is activated here.
