# TreasuryFlow V1 Desktop + SQL Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Ship TreasuryFlow V1.0.0 as a true Windows desktop app whose installer configures and validates the existing accounting SQL Server before first launch.

**Architecture:** Electron owns the desktop window and embedded local Next.js server. SQL bootstrap is explicit, versioned, reversible, and defaults to least privilege; accounting/Peyvast objects are discovered before any TreasuryFlow-owned migration is applied.

**Tech Stack:** Electron, Next.js/TypeScript, SQL Server (`mssql`), Vitest, Inno Setup 7.

**Spec:** User-approved V1 requirements in project conversation, 2026-10-06.

## Global Constraints
- One Windows installer EXE; no manual Node.js install on destination PC.
- No browser UI or visible localhost address in normal use.
- Existing SQL Server is configured, not bundled.
- Preflight must validate server/database/auth/schema before writes.
- TreasuryFlow-owned SQL changes must be versioned and idempotent; do not mutate Peyvast core objects without an explicit verified contract.
- Installer must not report success if SQL bootstrap fails.

## Review Focus
- SQL server unavailable or credentials invalid: fail safely with actionable diagnostics.
- Wrong accounting database selected: detect schema mismatch before writes.
- Re-running setup: migrations remain idempotent.
- SQL account has read access but insufficient migration rights: report exact missing capability.
- Desktop close/relaunch: embedded server lifecycle leaves no orphan and app reopens normally.

---

### Task 1: SQL bootstrap contract and preflight
- [ ] Add failing tests for configuration validation, connection preflight, schema discovery, and no-write behavior on mismatch.
- [ ] Implement bootstrap service and typed result model.
- [ ] Verify focused tests then full suite.

### Task 2: Versioned TreasuryFlow SQL migrations
- [ ] Add failing tests for first-run migration and idempotent rerun.
- [ ] Implement TreasuryFlow-owned migration ledger/schema objects only.
- [ ] Verify rollback/error behavior and full suite.

### Task 3: First-run desktop setup UX
- [ ] Add tests for first-run state/config persistence boundaries.
- [ ] Implement desktop setup flow for SQL Server/instance/database/auth and preflight/bootstrap invocation.
- [ ] Ensure credentials are not written to logs or source-controlled files.

### Task 4: True desktop lifecycle
- [ ] Add lifecycle/security tests where practical.
- [ ] Harden Electron single-instance, embedded server start/stop, navigation restrictions, and error UI.
- [ ] Verify no external browser opens during normal launch.

### Task 5: V1 installer and clean-machine acceptance
- [ ] Build production app and Inno Setup installer as TreasuryFlow V1.0.0.
- [ ] Silent-install into a clean test location, launch installed app, verify readiness and desktop process lifecycle.
- [ ] Verify SQL bootstrap against an available test SQL Server when credentials/database are available; otherwise mark external SQL acceptance as blocked, never simulated.
- [ ] Record SHA-256 and final artifact path.
