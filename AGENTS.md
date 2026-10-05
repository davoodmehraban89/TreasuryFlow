# TreasuryFlow Repository Operating Rules

## Product class
TreasuryFlow handles high-risk financial workflows. Correctness, traceability and safe failure take precedence over convenience.

## Source of truth
1. `docs/specs/PHASE_1_FOUNDATION_SPEC.md` for current foundation invariants.
2. `docs/ROADMAP.md` for phase boundaries.
3. ADRs under `docs/adr/` for architectural decisions.
4. Tests for executable behavior.

## Engineering rules
- TypeScript strict mode; avoid `any` at financial/domain boundaries.
- Money is integer IRR at the domain/storage boundary; never floating-point money.
- State transitions are explicit domain operations; UI may not write arbitrary status values.
- Authorization is enforced server-side for every sensitive action.
- No bank submission without an idempotency identity.
- No automatic retry after ambiguous bank outcome.
- No secret, credential, token or private banking material in Git, logs, fixtures or screenshots.
- Migrations are versioned and reviewed.
- External integrations sit behind typed adapters and contract tests.
- Iran-specific bank limits/cutoffs/capabilities are configuration with effective dates.

## Delivery rules
- Work on a feature/foundation branch; use PR review before merging to `main` once CI exists.
- Use TDD for domain rules and bug fixes.
- Every completed phase updates project state/handoff documentation.
- Do not claim production readiness from mocks or simulated bank responses.
- Live-bank activation, public production release, destructive data actions and sensitive access changes require explicit release authorization.

## Required checks before merge
- format/lint
- typecheck
- unit/integration tests
- build
- security-relevant negative tests for changed financial behavior

## Documentation language
Code identifiers and technical contracts are English. User-facing product copy is Persian-first. Architectural documents may be English or Persian but must use stable domain terms.
