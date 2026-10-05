# Phase 7 Design — Production Infrastructure & Bank Go-Live

## Objective
Complete every repository-controlled production and go-live safeguard while keeping real external systems fail-closed until verified evidence exists.

## Architecture
Provider-neutral evidence gates surround PostgreSQL, identity/MFA, KMS/secrets, WAF/SIEM/alerts, recovery drills and bank connectivity. Bank activation progresses only DISABLED -> SANDBOX -> CERTIFIED -> LIVE. LIVE requires explicit authorization plus verified production credentials and certificate.

## Non-negotiable invariants
- Tenant isolation is enforced in application context and PostgreSQL RLS, including write checks and tenant-bound foreign keys.
- Maker/checker separation and UNKNOWN no-auto-retry remain in force.
- Readiness fails closed when production dependencies are absent.
- Secrets/private keys are never committed or emitted in telemetry.
- External evidence is never inferred from repository tests.

## Completion definition
Repository-controlled code, tests, migrations, CI, deployment contracts and runbooks pass. Any item requiring real external infrastructure, credentials, certification, money movement or access mutation is explicitly BLOCKED_EXTERNAL until actually performed under authorization.
