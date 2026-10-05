# TreasuryFlow Phase 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deployable, Persian-first TreasuryFlow application foundation with executable financial invariants, CI and a staging-safe shell that performs no live banking action.

**Architecture:** A TypeScript modular monolith keeps financial domain rules framework-independent while Next.js provides the web/application boundary. PostgreSQL is the transactional authority; all external systems are typed adapters and live-bank submission is explicitly absent from Phase 1.

**Tech Stack:** Next.js 16, TypeScript strict, PostgreSQL, Vitest, Playwright, GitHub Actions, container-ready staging.

**Spec:** `docs/specs/PHASE_1_FOUNDATION_SPEC.md`

## Global Constraints
- Money is integer IRR; never floating-point money.
- Maker cannot approve own payment.
- Material payment edits invalidate approval.
- Ambiguous bank outcome is never automatically retried.
- Authorization is server-side at each mutation boundary.
- No live-bank credential or submission in Phase 1.
- External services are adapter-driven and deployment remains portable.

## Review Focus
- Duplicate logical payment: second submission must be rejected/idempotent, not create another transfer.
- Unknown bank outcome: no automatic transition to a new submission.
- Maker self-approval: rejected even if UI is bypassed.
- Material edit after approval: previous approval becomes unusable.
- Rial/Toman boundary: storage/domain remains integer IRR and UI labels presentation conversions.

---

### Task 1: Executable application scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/*`, test/lint config
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: a strict TypeScript Next.js application that builds, lints and tests in CI.

- [ ] Scaffold Next.js 16 with App Router and strict TypeScript.
- [ ] Add test runner and a smoke test that initially fails before the app shell exists.
- [ ] Implement the minimal RTL Persian-first shell and make the smoke test pass.
- [ ] Add CI for install, lint, typecheck, test and build.
- [ ] Verify all checks locally/CI and commit.

### Task 2: Domain primitives and Iran validators

**Files:**
- Create: `src/domain/money.ts`
- Create: `src/domain/iran/iban.ts`
- Create: `src/domain/iran/persian-normalization.ts`
- Test: corresponding `*.test.ts`

**Interfaces:**
- Produces: `RialAmount`, `validateIranianIban(value)`, `normalizePersianText(value)`.

- [ ] Write failing tests for integer IRR, valid/invalid IR IBAN checksum and Persian Yeh/Kaf/digit normalization.
- [ ] Run tests and verify failure.
- [ ] Implement minimal domain primitives/validators.
- [ ] Run tests and verify pass.
- [ ] Commit.

### Task 3: Payment state machine

**Files:**
- Create: `src/domain/payments/payment-state.ts`
- Test: `src/domain/payments/payment-state.test.ts`

**Interfaces:**
- Produces: explicit `PaymentState`, `PaymentEvent`, and `transitionPayment(state,event)`.

- [ ] Write failing tests for valid happy path and forbidden direct/unsafe transitions.
- [ ] Add the review-focus test proving `UNKNOWN` cannot trigger automatic resubmission.
- [ ] Implement the explicit transition table.
- [ ] Run tests and verify pass.
- [ ] Commit.

### Task 4: Approval/version invariants

**Files:**
- Create: `src/domain/approvals/approval-policy.ts`
- Test: `src/domain/approvals/approval-policy.test.ts`

**Interfaces:**
- Produces: `canApprove(actor,paymentVersion)`, approval version binding and material-change invalidation rules.

- [ ] Write failing maker-self-approval test.
- [ ] Write failing material-edit-invalidates-approval test.
- [ ] Implement minimal policy functions.
- [ ] Run tests and verify pass.
- [ ] Commit.

### Task 5: Idempotency contract

**Files:**
- Create: `src/domain/payments/idempotency.ts`
- Test: `src/domain/payments/idempotency.test.ts`
- Create: persistence design note/migration placeholder for uniqueness enforcement.

**Interfaces:**
- Produces: deterministic logical-payment idempotency identity and duplicate decision contract.

- [ ] Write failing deterministic-key and duplicate-rejection tests.
- [ ] Implement canonical key material without secrets/PII leakage into logs.
- [ ] Add database uniqueness requirement to persistence contract.
- [ ] Verify tests.
- [ ] Commit.

### Task 6: Coded RTL design foundation

**Files:**
- Create: `src/app/globals.css`, `src/components/*`, `src/app/(app)/dashboard/page.tsx`
- Test: component/accessibility smoke tests as supported by the scaffold.

**Interfaces:**
- Produces: reusable tokens/components and first Treasury dashboard shell.

- [ ] Define neutral enterprise tokens, typography, spacing, status semantics and focus states.
- [ ] Implement Persian RTL application frame with LTR islands for IBAN/reference identifiers.
- [ ] Implement dashboard cards for queue, daily amount, needs-review and bank health using non-production placeholder states clearly marked as demo.
- [ ] Verify keyboard/focus/contrast baseline and build.
- [ ] Commit.

### Task 7: Threat model and release safety

**Files:**
- Create: `docs/security/THREAT_MODEL.md`
- Create: `docs/PROJECT_STATE.md`

**Interfaces:**
- Produces: ranked threats, controls, unresolved risks and Phase 2 handoff.

- [ ] Document assets/trust boundaries and threats for authz, duplicate/replay, SSRF/import, secret exposure, audit tampering and bank-outcome ambiguity.
- [ ] Map each critical threat to an implemented/tested control or explicit Phase 2 blocker.
- [ ] Record verification evidence and unresolved issues in project state.
- [ ] Verify no live-bank capability/credential exists.
- [ ] Commit.

### Task 8: Staging blueprint and Phase 1 gate

**Files:**
- Create/modify deployment configuration selected by the scaffold.
- Update: `docs/PROJECT_STATE.md`

**Interfaces:**
- Produces: portable staging artifact and Phase 1 acceptance evidence.

- [ ] Build a container-ready artifact without production banking secrets.
- [ ] Configure Railway staging only after repository checks pass.
- [ ] Run deployed smoke test.
- [ ] Re-run CI/build/domain invariant tests.
- [ ] Record Phase 1 gate result and Phase 2 starting point.
