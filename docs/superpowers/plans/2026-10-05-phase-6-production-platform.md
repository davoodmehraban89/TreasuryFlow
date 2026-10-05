# Phase 6 Production Platform Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Close repository-level production platform gaps: persistence contracts, tenant isolation, authenticated server boundaries, real server-derived UI data, Persian encoding/accessibility, CI coverage, and readiness validation.

**Architecture:** Add explicit persistence and identity ports around the tested domain core, with PostgreSQL migration/RLS artifacts that remain deployable without requiring a database during repository verification. The Next.js UI consumes server-side application services rather than embedded representative data. Production infrastructure and bank-specific credentials remain Phase 7.

**Tech Stack:** TypeScript strict, Vitest, Next.js 16.3.8, PostgreSQL SQL migrations/contracts, React 19, GitHub Actions.

**Spec:** docs/REMAINING_WORK_2_PHASES.md plus Phase 1–5 gate invariants.

## Global Constraints
- Tenant isolation must be enforced at both application and PostgreSQL policy boundaries.
- Maker/checker separation and UNKNOWN no-auto-retry remain mandatory.
- No production credentials or live-bank calls.
- UI must be Persian-first RTL and must not embed fake operational numbers.
- CI must verify every phase/release branch and pull request to main.

## Review Focus
- missing tenant context / cross-tenant access;
- privilege escalation and maker self-approval;
- migration schema drift or missing unique constraints;
- fake/stale UI data represented as operational truth;
- broken Persian encoding and inaccessible emergency controls.

### Task 1: Persistence schema and RLS contracts
TDD schema verification helpers; add SQL migration for tenants/users/accounts/beneficiaries/payments/approvals/statements/audit with tenant RLS and idempotency uniqueness.

### Task 2: Identity and server authorization boundary
TDD trusted session claims, role checks and tenant-bound request context.

### Task 3: Repository/application service wiring
TDD tenant-scoped repositories and dashboard query service using persistence ports.

### Task 4: Real server-derived RTL UI
Remove representative hard-coded operational data; render server service result/empty state and repair Persian source encoding.

### Task 5: Accessibility/readiness/CI hardening
Add semantic UI regression tests, readiness endpoint/config checks, CI branch coverage and migration/secret checks.

### Task 6: Phase 6 gate
Run complete verification, record evidence, push branch and inspect GitHub status.
