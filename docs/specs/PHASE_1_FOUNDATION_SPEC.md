# TreasuryFlow — Phase 1 Foundation Specification

## Status
ACTIVE — Phase 1

## Product mission
TreasuryFlow is a Persian-first treasury and bank-transfer management system for controlled creation, approval, submission, tracking and reconciliation of financial transfers in Iran-aware operating environments.

## Non-negotiable invariants
1. A maker cannot approve their own payment.
2. An approval is bound to an immutable payment version; changing amount, payer, beneficiary, IBAN or material reference invalidates prior approval.
3. Every logical payment has an idempotency identity. Duplicate submission is prevented at the backend and database boundary.
4. An ambiguous bank outcome is `UNKNOWN`/`NEEDS_REVIEW`; it is never automatically retried.
5. `SUBMITTED`, `ACCEPTED`, `SETTLED`, `FAILED` and `REJECTED` are distinct states.
6. Sensitive actions are server-authorized; hiding UI controls is not authorization.
7. Audit evidence is append-only from the application perspective and records actor, action, entity, time, reason and before/after digests where applicable.
8. Monetary values are stored and calculated in IRR. Toman is presentation-only and must be explicitly labelled.
9. Bank credentials and secrets never live in source control or client-visible configuration.
10. External services are adapters, not architectural dependencies. Production must remain portable to an internal or Iran-accessible deployment environment.

## Iran rules pack
- IBAN: `IR` plus 24 digits, checksum validation using ISO 13616 mod-97.
- Persian normalization: Arabic/Persian Yeh and Kaf normalization, digit normalization and controlled whitespace normalization before matching/search.
- Time: persisted as an absolute instant; operational display uses `Asia/Tehran`; Persian calendar is a presentation concern.
- Transfer limits, cutoff windows and bank capabilities are effective-dated configuration, not hard-coded constants.
- Unstable connectivity must not convert uncertainty into a resend.

## Primary actors
- Maker: creates and edits drafts; cannot approve own payment.
- Checker: reviews evidence and approves/rejects within granted authority.
- Treasury Manager: manages operational rules, limits and emergency stop subject to policy.
- System Administrator: manages technical configuration and identity capabilities; administration does not imply financial approval authority.
- Auditor: read/export evidence only.

## Core domain
- PaymentRequest
- PaymentVersion
- Beneficiary
- BankAccount
- Approval
- BankSubmission
- BankReceipt
- PayaBatch
- ReconciliationItem
- AuditEvent
- IntegrationSource
- LimitProfile

## Payment lifecycle
`DRAFT -> VALIDATED -> AWAITING_APPROVAL -> APPROVED -> QUEUED -> SUBMITTED -> ACCEPTED/PENDING -> SETTLED`

Terminal/exception branches include `REJECTED`, `FAILED`, `CANCELLED` (only where legally/technically supported), `UNKNOWN`, and `NEEDS_REVIEW`.

No transition out of `UNKNOWN` may create a new submission without an explicit reviewed decision and idempotency-safe reconciliation of the previous attempt.

## Phase 1 deliverables
- Repository operating rules and five-phase roadmap.
- Architecture decision records for stack, data authority, adapters and deployment portability.
- Domain/state/security specifications.
- UI information architecture and design tokens suitable for direct coded UI.
- Engineering baseline with strict TypeScript, linting, tests and CI.
- Initial deployable shell for staging; no live-bank credentials or production money movement.
- Threat model and acceptance gate.

## Phase 1 acceptance gate
Phase 1 is complete only when:
- architecture and domain contracts are versioned in the repository;
- the application shell builds and tests successfully in CI;
- critical invariants have executable tests;
- the first RTL application shell can be deployed to staging;
- no live banking action exists;
- security/threat-model review has no unresolved critical issue;
- the repository contains an explicit handoff/state document for Phase 2.
