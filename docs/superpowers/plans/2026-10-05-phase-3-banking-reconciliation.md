# Phase 3 Banking & Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Deliver bank-adapter contracts, safe dispatch semantics, statement ingestion, deterministic reconciliation, exception handling and treasury bank operations without claiming a live bank connection.

**Architecture:** Pure TypeScript banking ports isolate external bank side effects from the treasury domain. Dispatch is idempotent and UNKNOWN-safe; statement ingestion normalizes immutable bank transactions; reconciliation uses deterministic exact matching first and explicit review queues for ambiguity.

**Tech Stack:** TypeScript strict, Vitest, Next.js 16.3.8, React 19, GitHub Actions.

**Spec:** docs/ROADMAP.md Phase 3 and Phase 1 invariants.

## Global Constraints
- Never automatically retry UNKNOWN bank outcomes.
- Never claim live bank connectivity in this phase.
- Every dispatch uses a stable idempotency key.
- Reconciliation never auto-selects among ambiguous candidates.
- Tenant boundaries are mandatory for accounts, transfers and statements.
- Imported bank transactions are immutable source records.

## Review Focus
- duplicate dispatch and timeout-after-submit;
- duplicate statement imports;
- cross-tenant/cross-account matching;
- ambiguous amount/date/reference matches;
- reversal/returned transactions and unmatched exceptions.

### Task 1: Bank adapter port and dispatch safety
TDD adapter request/result contracts, idempotency, UNKNOWN semantics and duplicate-dispatch protection.

### Task 2: Bank statement ingestion
TDD normalized statement rows, atomic validation and duplicate source-record detection.

### Task 3: Deterministic reconciliation engine
TDD exact reference/amount/account matching, ambiguity detection and unmatched handling.

### Task 4: Exception and reversal workflow
TDD review queues, manual resolution contracts, reversal/return states and audit-friendly reason codes.

### Task 5: Banking & reconciliation RTL UI
Add Persian operational views for bank dispatch, statement imports, reconciliation summary and exception queue.

### Task 6: Phase 3 verification gate
Run typecheck/tests/lint/build, update gate evidence, push branch and inspect GitHub status.
