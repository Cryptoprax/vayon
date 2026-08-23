# Version 1 final deployment checklist

## Database blockers

- [ ] Resolve and prove the intended target of all five `inventory_projects` foreign keys.
- [ ] Regenerate the package from the approved source and rerun the static dependency audit.
- [ ] Canonicalize policy comparison so identical policies are never recreated.
- [ ] Compare trigger enabled state (`tgenabled`) as well as trigger definition.
- [ ] Validate index `indisvalid` and `indisready`; document invalid-index recovery.
- [ ] Compare existing bucket visibility, size limit, MIME types, and storage policies.
- [ ] Add expected-object and expected-definition assertions to pre/post validation.
- [ ] Prove existing same-name tables have correct columns, types, defaults, nullability, PKs, FKs, CHECK constraints, and generated expressions.

## Clone rehearsal

- [ ] Restore the latest production database and storage backup into an isolated clone.
- [ ] Record restore duration and integrity checks.
- [ ] Run pre-deploy validation and retain output.
- [ ] Execute each stage separately in documented order.
- [ ] Execute the complete staged package a second time to prove idempotency.
- [ ] Simulate failure during each transactional stage and confirm rollback.
- [ ] Simulate concurrent-index failure and rehearse approved recovery.
- [ ] Run post-deploy validation.
- [ ] Run cross-tenant RLS tests for SELECT/INSERT/UPDATE/DELETE.
- [ ] Run every RPC signature and trigger-path smoke test.
- [ ] Record duration, locks, blocking PIDs, CPU, I/O, temporary space, and replication lag.

## Application validation

- [x] TypeScript passes.
- [x] ESLint exits successfully; one unrelated pre-existing warning remains.
- [x] Full regression suite passes: 1,008/1,008.
- [x] Production build passes.
- [x] Static package audit passes.
- [ ] Sprint 92 dependency audit passes; currently fails on five references.
- [ ] Database-backed module smoke tests pass against the clone.

## Provider blockers

- [ ] OpenAI billing/credit balance restored and configured model verified.
- [ ] Stripe live secret and webhook secret configured and verified.
- [ ] Razorpay live key, secret, and webhook secret configured and verified.
- [ ] Supabase production URL, anon key, service role, and expected DB version verified.
- [ ] Google Workspace client credentials and consent configuration verified.
- [ ] SMTP/email provider and sender authentication verified.
- [ ] Google OAuth callbacks and scopes verified.
- [ ] Microsoft OAuth application and callbacks verified.
- [ ] WhatsApp app secret, verify token, Graph version, and webhook delivery verified.
- [ ] Monitoring, alerts, DNS, TLS, backup schedules, and support escalation verified.

## Authorization

- [ ] Two-person database approval.
- [ ] Security approval for RLS changes.
- [ ] Backup/rollback owner sign-off.
- [ ] Maintenance window approved.
- [ ] Artifact hashes frozen.
- [ ] No migration-history initialization, `db push`, or historical replay.

Current checklist result: **BLOCKED**.
