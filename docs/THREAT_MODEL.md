# Threat model — Phase 1
| Threat | Control | Verification |
|---|---|---|
| Maker approves own payment | server-side SoD authorization | authorization tests |
| Duplicate bank transfer | deterministic idempotency key + DB unique contract | idempotency tests + persistence contract |
| Unknown bank outcome resubmitted | UNKNOWN cannot DISPATCH; manual NEEDS_REVIEW path | payment-state tests |
| Approval survives material edit | approval bound to payment version | approval-policy tests |
| Fractional/unsafe IRR | integer safe-number value object | money tests |
| Malformed Iranian IBAN | IR format + MOD-97 checksum | IBAN tests |
| Unicode ambiguity | Arabic/Persian normalization | normalization tests |
| Audit tampering | append-only audit contract; DB enforcement required in Phase 2 | architecture gate |
| Credential leakage | secrets only via runtime environment; never repository/log payload | CI/review gate |
| CSRF/session abuse | same-site secure session and server authorization required for mutation endpoints | implementation gate Phase 2 |

Residual Phase-1 risks: no live bank integration, production auth provider, database RLS, KMS/HSM, or operational SIEM is claimed. These belong to later implementation phases and cannot be represented as deployed controls yet.
