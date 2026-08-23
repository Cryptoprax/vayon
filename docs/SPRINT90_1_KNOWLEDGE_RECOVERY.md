# Sprint 90.1 Knowledge recovery report

## Root cause

Production is missing both Knowledge schema migrations. Visiting `/vayon/knowledge` calls `EnterpriseKnowledgeService.snapshot()`, which starts four repository operations with `Promise.all`. The first operation queries `public.knowledge_articles` at `features/platform/knowledge/repositories/knowledge.repository.ts:17`. Production returns PostgreSQL `42P01` (`relation does not exist`); the repository preserves and throws that error at line 23, and it escaped the pre-fix service at `features/platform/knowledge/services/knowledge.service.ts:40` into the global error boundary. After the recovery change, the corresponding `Promise.all` begins at line 42 and is contained by `loadSnapshot()`.

The read-only production catalog captured on 2026-08-23 proves that Sprint 63 and Sprint 86.3 are structurally missing. No production SQL was executed during this investigation.

## Execution dependency tree

```text
/vayon/knowledge
├─ authenticated /vayon layout and shell
│  ├─ Supabase session/cookies
│  ├─ RBAC and protected-route middleware
│  └─ organization/workspace navigation context
├─ app/vayon/knowledge/page.tsx
│  └─ EnterpriseKnowledgeService.loadSnapshot()
│     ├─ operationsContext()
│     │  ├─ OrganizationService.current()
│     │  │  ├─ auth.getUser()
│     │  │  ├─ user_organization_context
│     │  │  └─ organization_members → organizations
│     │  ├─ WorkspaceService.first()
│     │  │  ├─ auth.getUser()
│     │  │  ├─ user_organization_context
│     │  │  └─ workspace_members → workspaces
│     │  └─ createSupabaseServerClient()
│     ├─ PerformanceCacheService → MemoryCacheProvider
│     └─ KnowledgeRepository
│        ├─ knowledge_articles
│        ├─ knowledge_documents
│        ├─ enterprise_knowledge_dashboard RPC
│        └─ search_enterprise_knowledge RPC (when q is present)
├─ KnowledgeCenter (successful/empty result)
└─ KnowledgeRecovery (expected infrastructure/context failure)

/vayon/knowledge/help?q=...
└─ EnterpriseKnowledgeService.loadAnswer()
   ├─ Context Graph retrieval context (module/version/plan/permissions/feature)
   ├─ retrieve_trusted_knowledge RPC
   ├─ search_enterprise_knowledge RPC compatibility fallback
   ├─ KnowledgeEngine
   ├─ TrustedKnowledgeRetrievalProvider ranking
   ├─ DocumentationService (approved product documentation)
   └─ PerformanceCacheService
```

There is no Knowledge API route or separate provider runtime in this page path. Upload and feedback use existing server actions and the same service/repository boundary.

## Production database dependency status

| Object | Kind | Status |
| --- | --- | --- |
| `knowledge_articles` | table | ✗ MISSING |
| `knowledge_article_versions` | table | ✗ MISSING |
| `knowledge_documents` | table | ✗ MISSING |
| `knowledge_analytics` | table | ✗ MISSING |
| `knowledge_article_relations` | table | ✗ MISSING |
| `knowledge_videos` | table | ✗ MISSING |
| `knowledge_quality_feedback` | table | ✗ MISSING |
| `search_enterprise_knowledge` | RPC | ✗ MISSING |
| `enterprise_knowledge_dashboard` | RPC | ✗ MISSING |
| `retrieve_trusted_knowledge` | RPC | ✗ MISSING |
| `register_knowledge_document` | RPC | ✗ MISSING |
| `record_knowledge_feedback` | RPC | ✗ MISSING |
| `record_knowledge_quality_feedback` | RPC | ✗ MISSING |
| `can_manage_knowledge` | function | ✗ MISSING |
| `transition_knowledge_article` | function | ✗ MISSING |
| `knowledge_articles_search_idx` | search index | ✗ MISSING |
| `knowledge_articles_tags_idx` | search index | ✗ MISSING |
| `knowledge_analytics_dashboard_idx` | index | ✗ MISSING |
| `knowledge_trusted_retrieval_idx` | index | ✗ MISSING |
| `knowledge_video_transcript_idx` | search index | ✗ MISSING |
| `knowledge_quality_feedback_idx` | index | ✗ MISSING |
| seven tenant read/admin policies from Sprint 63/86.3 | RLS policies | ✗ MISSING |
| `knowledge object tenant insert/read` | storage policies | ✗ MISSING |
| `knowledge-documents` | private storage bucket | ✗ MISSING |
| future vector/RAG storage | extension point | ⚠ OPTIONAL by design |
| local approved product documentation | repository | ✓ EXISTS |
| Context Graph Knowledge bridge | service | ✓ EXISTS |
| Trusted retrieval/ranking provider | provider | ✓ EXISTS |
| in-memory tenant-attributed cache | cache | ✓ EXISTS |

## Feature, tenant, and subscription status

- No Knowledge-specific beta or environment feature flag exists. The authenticated route is enabled.
- The Context Graph supports `featureAvailable`; disabled features are excluded by trusted ranking.
- No separate Knowledge plan entitlement is currently configured. Existing authenticated-shell, RBAC, membership, and RLS controls remain authoritative.
- Missing organization/workspace context previously threw from `operationsContext`; it now produces a guided setup state on this route.
- Permission, subscription, feature, timeout, network/provider, missing-table, and missing-RPC failures are classified without exposing raw diagnostics in the UI.

## Recovery behavior

Expected infrastructure and context failures are returned as service results, logged with sanitized structured diagnostics, and rendered inside the Knowledge route. The authenticated shell and navigation remain mounted. A route-local Next.js error boundary remains as defense for unexpected rendering defects and provides Retry, Documentation, Support, and AI Assistant actions.

The permanent database repair remains deployment of the reviewed Version 1 Knowledge subset from `VERSION1_PRODUCTION_PATCH.sql`, followed by `VERSION1_POST_DEPLOY_CHECK.sql`. This sprint does not apply production SQL.
