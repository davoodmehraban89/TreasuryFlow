# TreasuryFlow
Treasury & Bank Transfer Management System — سامانه مدیریت خزانه‌داری و حواله‌های بانکی

## Current status
Application/repository development phases 1–7 are complete. Repository-controlled production checks are fail-closed and bank LIVE activation is blocked without verified external evidence and explicit authorization.

## Final external production dependencies
The following are not repository tasks and remain blocked until real production access/evidence exists: production PostgreSQL + RLS proof; external IdP + MFA/session proof; KMS/secret-store proof; WAF/SIEM/alert-delivery proof; real restore drill meeting RPO/RTO; bank sandbox/protocol/certification; production bank certificate/credentials; explicit live authorization; controlled canary transfer; rollback rehearsal.

Use `deploy/production-evidence.example.json` as the evidence template. Copy it to `deploy/production-evidence.json` only when real references exist, then run `npm run verify:external-evidence`. Never store passwords, tokens, private keys or secret values in the manifest.

## Verification
- `npm run typecheck`
- `npm test`
- `npm run lint`
- `npm run build`
- `npm run smoke`
- `npm run verify:external-evidence` (expected to return BLOCKED_EXTERNAL until real production evidence is supplied)
