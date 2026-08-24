# AI Creative Pipeline Engine & Document Generation Architecture

## Pipeline architecture

`/vayon/creative/pipelines` reuses the existing licensed Creative Studio service and centralized `creative_studio` permission. Pipelines belong to a workspace, project, campaign, and brand. Sprint 130 plans and visualizes pipelines only; it does not persist or execute them.

The fixed production sequence is Campaign Planning → Brand Resolution → Content Planning → Copywriting → Creative Direction → Image Assignment → Layout Planning → Document Assembly → Internal Review → Brand Validation → Approval → Export.

## Node model

Every node has an ID, observable status, dependency IDs, typed inputs and outputs, assigned creative department, duration estimate, retry count, and `runtimeOnly: true`. The graph resolver produces a deterministic topological order and reports unresolved nodes as blocked instead of bypassing dependencies.

Statuses cover pending, waiting, blocked, running, completed, failed, waiting approval, and cancelled. Observability includes total duration, blocked stages, retries, warnings, errors, and approvals.

## Creative Director orchestration

Creative Director owns the pipeline and coordinates Brand Designer, Graphic Designer, Copywriter, Presentation Designer, Document Designer, Layout Specialist, Illustration Specialist, Reviewer, and Publisher. No node communicates directly with a provider. Future execution must pass exclusively through the provider-independent Creative Runtime.

## Document architecture

The document contract is Document → Pages → Sections → Blocks. Blocks support text, images, tables, charts, icons, captions, footers, and headers with explicit brand references and ordering. Documents carry project, brand, version, planned state, and `generated: false`.

Copywriter contracts cover headlines, body copy, product descriptions, calls to action, feature lists, FAQs, testimonials, and legal text. Layout contracts cover A4, A5, Letter, Presentation, Square, Landscape, Portrait, and Social.

## Review architecture

Deterministic review checks brand references, completeness, missing image assets, broken references, typography, colour, and approval requirements. It never supplies AI judgment or automatic correction.

## Export contracts

PDF, PPTX, DOCX, HTML, future INDD, and Editable Project are prepared formats. Export preparation returns unavailable and cannot generate a file in Sprint 130.

## Future provider integration

1. Persist approved pipeline and document plans through repository/service boundaries.
2. Dispatch nodes through the Creative Runtime only after dependencies and permissions pass.
3. Add approval checkpoints before assembly, export, or publishing.
4. Connect provider adapters without changing pipeline or document contracts.
5. Store outputs in the Asset Library with complete workspace/project/campaign/brand lineage.

No provider was connected, no document/image/asset was generated, and authentication, Founder RBAC, permissions, subscriptions, billing, deployment, production configuration, and reconciliation remain unchanged.
