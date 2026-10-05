# Phase 2 Treasury Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Deliver an end-to-end simulated treasury workflow without a live bank: users/roles, bank accounts, beneficiaries, manual/file payment intake, validation, maker-checker, limits, whitelist, audit, and operational queues.

**Architecture:** Keep the core as pure TypeScript domain services with explicit tenant boundaries and immutable audit events. Add a simulation service that composes intake, validation, approval, queueing and settlement without external banking side effects. UI remains a thin Persian-first RTL shell over the same domain contracts.

**Tech Stack:** TypeScript strict, Vitest, Next.js 16.3.8, React 19, ESLint 9, GitHub Actions.

**Spec:** docs/ROADMAP.md Phase 2 plus docs/specs/PHASE_1_FOUNDATION_SPEC.md invariants.

## Global Constraints
- IRR amounts are non-negative safe integers.
- Maker cannot approve own payment.
- Approval is bound to payment version.
- UNKNOWN must never be automatically resubmitted.
- Tenant boundaries apply to all core records and decisions.
- No live-bank calls in Phase 2.

## Review Focus
- Cross-tenant references must be rejected.
- Duplicate beneficiaries/accounts/payment imports must not create ambiguous records.
- File intake must reject malformed rows atomically before queueing.
- Limits and whitelist checks must run before approval/queueing.
- Audit events must be append-only representations of every material state/action.

---

### Task 1: Treasury master data
Create tenant-scoped users/roles, bank accounts and beneficiaries with Iranian account validation and duplicate protection. TDD then commit.

### Task 2: Intake and validation
Create manual and CSV/file intake contracts, normalized parsing, row validation, deterministic references and atomic batch result. TDD then commit.

### Task 3: Policy engine
Create whitelist and configurable transaction/daily limits; enforce tenant scope and policy before approval. TDD then commit.

### Task 4: Maker-checker workflow and operational queues
Compose payment versioning, approval invalidation, SoD, queue categories and simulated settlement. TDD then commit.

### Task 5: Immutable audit ledger
Create hash-chained append-only audit event model and verification routine for tamper evidence. TDD then commit.

### Task 6: Persian RTL Treasury Core UI
Create dashboard/core workflow views with semantic RTL navigation, queues, payment intake and approval summaries. Build/lint/typecheck.

### Task 7: CI and Phase 2 gate
Add GitHub Actions for install/typecheck/test/lint/build; record acceptance evidence; push branch and verify GitHub status.
