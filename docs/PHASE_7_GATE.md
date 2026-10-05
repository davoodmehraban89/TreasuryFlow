# Phase 7 — Production Infrastructure & Bank Go-Live

## Repository-controlled completion
- [x] Production evidence model is fail-closed.
- [x] Identity policy requires verified provider, MFA and bounded sessions.
- [x] Recovery evidence requires successful restore and RPO/RTO thresholds.
- [x] Security operations evidence requires WAF, SIEM and alert delivery.
- [x] Bank lifecycle is DISABLED -> SANDBOX -> CERTIFIED -> LIVE.
- [x] LIVE requires explicit authorization, verified production credentials and verified certificate.
- [x] UNKNOWN transfer behavior from earlier phases remains manual-review/no-auto-retry.
- [x] Production PostgreSQL migration/RLS contracts exist from Phase 6.
- [x] Portable container and production runbook exist from Phase 5.

## External production evidence — BLOCKED_EXTERNAL until actually supplied
- [ ] Provisioned production PostgreSQL instance and executed RLS integration proof.
- [ ] Configured external identity provider and MFA proof.
- [ ] Configured KMS/secret store proof.
- [ ] Configured WAF/SIEM/alert-delivery proof.
- [ ] Executed production backup/restore drill proving RPO <= 15m and RTO <= 60m.
- [ ] Bank-specific sandbox credentials/protocol implementation and certification evidence.
- [ ] Production bank certificate/credentials and explicit LIVE authorization.
- [ ] Controlled canary/live transfer and production rollback rehearsal.

These items cannot be truthfully completed from repository access alone. No infrastructure purchase/provisioning, credential mutation, bank certification, or real-money transfer is performed without the required external access and explicit authorization.
