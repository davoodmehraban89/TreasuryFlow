# TreasuryFlow Final Desktop Release Gate

Date: 2026-10-05
Version: 0.1.0

## Verified
- TypeScript strict: PASS
- Vitest: 94/94 PASS across 39 files
- ESLint source gate: PASS
- Next.js 16.3.8 production build: PASS
- npm production audit: 0 vulnerabilities
- Clean-install portable runtime smoke: PASS
- /api/ready: HTTP 200, bank adapter disabled
- Home UI: HTTP 200

## Windows portable release
Run elease/TreasuryFlow.cmd beside elease/TreasuryFlow-runtime.zip.
The first launch extracts the self-contained Node runtime under %LOCALAPPDATA%/TreasuryFlow/0.1.0 and opens the local TreasuryFlow UI. Bank LIVE mode remains disabled.

Runtime SHA-256: 1876689ED32986AC579166894A9DA4B6E141022781D055D12B5B196BFE822073

## External production boundary
Real bank credentials/certification, production PostgreSQL, external IdP/MFA, KMS, WAF/SIEM and live canary remain external provisioning/go-live evidence and are not fabricated by this desktop package.
