# TreasuryFlow Delivery Roadmap

## Phase 1 — Foundation & Blueprint
Architecture, domain model, payment state machine, Iran rules pack, security/SoD model, coded RTL design foundation, repository rules, CI/test strategy and staging shell.

**Gate:** deployable non-banking shell; executable invariant tests; threat model reviewed; Phase 2 handoff ready.

## Phase 2 — Treasury Core
Users/roles, bank accounts, beneficiaries, manual/file payment intake, validation, maker-checker, limits, whitelist, audit and operational queues.

**Gate:** end-to-end simulated treasury flow without a live bank.

## Phase 3 — Banking & Reconciliation
Bank Adapter framework, Paya/batch workflows, idempotent submission, status polling, ambiguous-outcome handling, reconciliation and accounting-source adapter.

**Gate:** at least one adapter proven in a non-production environment with contract tests and reconciliation evidence.

## Phase 4 — Operations & Enterprise UX
Operational dashboard, reports, exports, health center, emergency stop, audit explorer, alerts and hardened Persian-first enterprise UX.

**Gate:** operational UAT completed against representative workflows and volumes.

## Phase 5 — Hardening & Release
Security review, E2E/performance testing, backup/restore, disaster recovery, observability, production runbooks, release gates and portable deployment package.

**Gate:** production-readiness evidence complete; live-bank activation remains a separately authorized release action.

## Global rule
A phase is complete only when its deliverables exist, acceptance evidence is recorded, important unresolved defects are disclosed, and the next-phase handoff is versioned in the repository.
