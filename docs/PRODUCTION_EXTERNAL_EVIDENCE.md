# Production External Evidence Checklist

Every item below must reference evidence from the real production environment before `LIVE` is permitted.

| Control | Required evidence |
|---|---|
| Database | provisioned endpoint identifier, migration version, RLS cross-tenant integration result |
| Identity | provider identifier, MFA enforcement result, session-policy result |
| Secrets/KMS | secret-store/KMS identifier and rotation/access-policy verification; never secret values |
| WAF/SIEM | enabled policy identifiers and test-event delivery evidence |
| Alerts | successful delivery test to approved operational channel |
| Recovery | timestamped restore drill, measured RPO/RTO, integrity verification |
| Bank sandbox | bank/provider, protocol version, sandbox credential verification, E2E result |
| Certification | bank-issued certification/reference evidence |
| Bank production | certificate metadata/fingerprint and credential verification; never private key/secret |
| Live authorization | explicit change approval tied to release/version |
| Canary | controlled transaction evidence and reconciliation result |
| Rollback | rehearsal evidence and recovery result |
