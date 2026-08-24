# AI Document Studio

## Architecture

Document Studio is available at `/vayon/creative/documents`. It composes the existing Creative Studio repository projections, Sprint 121 permission engine, Creative Execution Engine, Creative Runtime request contract, Pipeline Engine document model, Brand Studio, campaigns, projects, and asset ownership model. It introduces no direct provider client or parallel execution path.

## Generation flow

The wizard collects company, industry, audience, language, brand, campaign, purpose, tone, length, and document type. A server action verifies `creative_studio.create`, resolves organization/workspace attribution server-side, and submits a `Document` job to `CreativeExecutionService`. The execution planner selects only registered runtime adapters. With no compatible adapter, the result is `WaitingProvider`; the UI explains this state and creates no document or asset.

## Pipeline

Creative Director coordinates Copywriter → Document Designer → Graphic Designer → Brand Reviewer → Publisher. Generation remains approval-gated and providers are reachable only through the existing adapter registry and execution service.

## Editing model

The typed model represents documents as editable sections and blocks, with version, comments, approval, project, campaign, brand, and workspace attribution. Revision helpers create immutable versions. Planned commands include rewrite, expand, summarize, tone changes, translation, FAQ, CTA, and testimonial generation. These commands must use the same execution path when activated.

## Storage and exports

Successful future outputs retain workspace, project, campaign, and brand references and can be projected into the existing Asset Library. Export contracts cover PDF, DOCX, PPTX, HTML, and Editable Project. No file or persistence implementation is introduced here.

## Provider integration

Future document providers register a `Document`-capable `RuntimeAdapter`. UI code never imports provider SDKs. Validation, health, estimation, retries, timeouts, fallback selection, events, and approval handoff remain owned by the Creative Execution Engine.

## Roadmap

1. Configure and certify a document adapter.
2. Bind approved outputs to the existing tenant-safe repository implementation.
3. Activate block-level AI edits through execution jobs.
4. Add governed renderers for each export contract.
