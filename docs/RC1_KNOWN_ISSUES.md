# VAYON RC1 known issues

| ID | Severity | Issue | Release action |
| --- | --- | --- | --- |
| RC1-001 | Critical | Full Paddle sandbox lifecycle has no execution evidence | Complete all scenarios before beta |
| RC1-002 | Critical | End-to-end authenticated customer journey has no isolated-environment evidence | Run with a dedicated RC tenant and inbox |
| RC1-003 | Critical | Production database/provider blockers remain documented | Close `DATABASE_STATUS.md` and `INTEGRATION_STATUS.md` blockers |
| RC1-004 | High | No browser/visual regression harness or baseline | Capture supported viewport/theme/browser matrix |
| RC1-005 | High | Live tenant isolation, RBAC, session, and recovery checks are pending | Execute two-tenant security matrix |
| RC1-006 | High | OpenAI health failed during build-time diagnostics | Restore provider health and execute evidence-safety cases |
| RC1-007 | High | Anonymous Paddle portal POST returns 500 rather than controlled 4xx | Correct and regression-test before beta |
| RC1-008 | Medium | Core Web Vitals and interaction latency are unmeasured | Record browser/lab and staging telemetry |
| RC1-009 | Medium | Screen-reader and full keyboard traversal are pending | Complete manual accessibility checklist |
| RC1-010 | Medium | Bare `/verify-email` redirects to login | Verify intended token/expired-token UX in staging |

No known issue is waived by this document. Critical and High issues require explicit closure and release-owner sign-off.
