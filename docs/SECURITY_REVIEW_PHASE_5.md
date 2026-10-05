# Security Review — Phase 5
- Secrets: runtime secret store only; `.env.production.example` contains placeholders only.
- Financial identifiers: telemetry redaction contract covers IBAN/account/card and credential keys.
- Authorization: existing maker/checker separation and emergency-stop authorization remain mandatory.
- Dispatch: stable idempotency and UNKNOWN manual-review invariant remain mandatory.
- Supply chain: lockfile-based `npm ci` is required by CI/container build.
- Container: runtime executes as non-root `node` user.
- Residual risks: no production database, KMS/HSM, SIEM, WAF, real bank certificate lifecycle or restore drill is claimed in this repository-only phase.
