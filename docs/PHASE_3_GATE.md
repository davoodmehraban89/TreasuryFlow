# Phase 3 Gate — Banking & Reconciliation

## Acceptance evidence
- [x] Bank adapter port isolates external side effects.
- [x] Stable idempotency key prevents duplicate dispatch in adapter contract.
- [x] UNKNOWN bank outcome is terminal for automatic dispatch and requires review.
- [x] Bank statement rows are tenant/account scoped and duplicate source records are rejected.
- [x] Reconciliation matches only deterministic tenant/account/reference/amount candidates.
- [x] Ambiguous candidates go to NEEDS_REVIEW; unmatched rows remain UNMATCHED.
- [x] Exception workflow records explicit reason codes and supports reversal/return handling.
- [x] Persian RTL banking/reconciliation operational UI is present.
- [x] TypeScript strict typecheck passed.
- [x] 43/43 tests passed across 17 test files.
- [x] ESLint source check passed.
- [x] Next.js 16.3.8 production build passed.

## Adapter proof scope
Phase 3 deliberately uses a non-production simulated/contract adapter. No live bank credentials, production endpoint, or real transfer is claimed or required. This satisfies the roadmap requirement for a non-production adapter proof while preserving the project rule that live-bank activation is separately authorized.

## Residual risks / Phase 4+ handoff
- Production bank-specific protocol/authentication, certificate lifecycle and real status polling remain unimplemented.
- Persistent database constraints for imported statements and dispatch idempotency must mirror the domain contracts when persistence is introduced.
- Operational monitoring/alerts, exports, health center and emergency-stop UX belong to Phase 4.

**Gate result:** PASS locally on 2026-10-05. Branch push and remote CI status are recorded separately and are not inferred from local verification.
