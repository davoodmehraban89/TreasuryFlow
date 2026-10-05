# Remaining Work — Two-Phase Closure Plan

## Phase 6 — Production Platform Foundation (execute now)
1. Persistent PostgreSQL schema and tenant isolation/RLS contract.
2. Production identity/session and RBAC authorization boundary.
3. Server-side repository/service layer wiring core domain to persistence.
4. Replace representative UI data with authenticated server-derived data.
5. Fix Persian UI source encoding and add UI/accessibility regression tests.
6. Make CI run on all phase/release branches and add migration/security checks.
7. Add application health/readiness endpoint and deployment configuration validation.
8. Full local gate: typecheck, tests, lint, build, migration/schema verification, secret scan; push and inspect remote status.

## Phase 7 — Production Infrastructure & Bank Go-Live (requires external credentials/infra authorization)
1. Provision production PostgreSQL and prove RLS with integration tests.
2. Configure production identity provider, MFA/session policy and secret/KMS storage.
3. Configure production observability/SIEM/WAF and alert delivery.
4. Execute real backup/restore drill and prove RPO/RTO.
5. Implement a bank-specific adapter: protocol/auth/certificate lifecycle/status polling.
6. Bank sandbox/certification, E2E, performance, accessibility and security regression.
7. Controlled live-bank activation, canary, rollback rehearsal and production release approval.

Phase 7 does not authorize spending, infrastructure provisioning, credential changes, or live-bank transfers; those actions require explicit approval at execution time.
