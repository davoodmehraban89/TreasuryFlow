# TreasuryFlow UI Reconstruction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current non-functional shell with the approved nine-screen, RTL-first TreasuryFlow product experience and make every primary navigation/action operate through real application/domain services.

**Architecture:** Keep the tested domain modules as the source of business rules. Build a reusable UI system and route-level application surfaces on top of explicit application services and repositories; desktop-local mode uses a durable free local repository while production preserves PostgreSQL and tenant isolation. Primary screens never use fragment-only navigation or synthetic success.

**Tech Stack:** Next.js 16.3.8, React 19.2, TypeScript 5.9 strict, Vitest 3.2, repository-local CSS, PostgreSQL adapter for production, free/open-source dependencies only.

**Spec:** `docs/superpowers/specs/2026-10-05-treasuryflow-ui-reconstruction-design.md`

## Global Constraints
- Approved nine-screen TreasuryFlow reference image is the visual source of truth.
- No paid tools, paid plugins, paid UI kits, paid SaaS subscriptions, or commercial assets.
- Real Next.js routes for all primary navigation.
- UI actions must use application/domain services; no fake success.
- Maker/checker, idempotency, UNKNOWN manual-review, tenant isolation, and bank-LIVE safety invariants remain mandatory.
- Desktop-local mode must persist safe local state across restart.
- Production authentication and PostgreSQL remain fail-closed.
- Bank LIVE remains disabled without external certification/configuration.

## Review Focus
- Persian/RTL text corruption or mojibake must fail tests and never ship.
- Navigation must not silently fall back to the dashboard or hash fragments.
- Transfer submission must reject invalid IBAN/money and maker self-approval.
- Restarting desktop-local mode must retain created safe-local records.
- UNKNOWN or disabled bank outcomes must remain explicit and never render as success.

---

### Task 1: Design tokens, RTL shell, and route contract
**Files:** create `src/app/ui/tokens.css`, `src/app/ui/AppShell.tsx`, `src/app/ui/navigation.ts`; modify `src/app/globals.css`, `src/app/layout.tsx`; tests `src/app/navigation.test.ts`, `src/app/shell.test.ts`.
**Interfaces:** produces `PRIMARY_NAV: readonly NavItem[]` and `AppShell({children,title,actions})`; nav item = `{labelFa:string;href:string;group:'operations'|'controls'|'reports'}`.
- [ ] Write failing tests for unique absolute non-fragment routes and Persian labels without replacement corruption.
- [ ] Run targeted tests and verify FAIL.
- [ ] Implement tokens, sidebar/header shell, active route, RTL landmarks, responsive layout, free/system font fallback.
- [ ] Run targeted tests and verify PASS.
- [ ] Commit `feat: add TreasuryFlow RTL application shell`.

### Task 2: Local durable repository and application façade
**Files:** create `src/platform/local/local-store.ts`, tests, `src/platform/application/treasury-service.ts`, tests, and `src/platform/application/types.ts`.
**Interfaces:** `TreasuryService` exposes list/get/create/submit/approve payments, accounts, beneficiaries, audit, and dashboard. Local store persists versioned JSON atomically.
- [ ] Write failing persistence tests for create/reload, schema version, recovery, tenant scoping.
- [ ] Write failing service tests for validation, maker/checker, audit emission, no synthetic bank success.
- [ ] Implement local repository and application façade using existing domain rules.
- [ ] Run targeted tests and verify PASS.
- [ ] Commit `feat: add durable desktop-local treasury service`.
### Task 3: Dashboard and real route navigation
**Files:** create `src/app/dashboard/page.tsx`, `dashboard-view.tsx`, tests; modify `src/app/page.tsx`, `src/app/ui/AppShell.tsx`.
**Interfaces:** consumes `TreasuryService.getDashboard()`; cards link to filtered operational routes.
- [ ] Write failing tests for queue, review, reconciliation, account health, activity, and card destinations.
- [ ] Implement root entry behavior and dashboard composition matching approved reference hierarchy.
- [ ] Verify every dashboard action routes to a meaningful destination.
- [ ] Run tests and verify PASS.
- [ ] Commit `feat: rebuild operational dashboard`.

### Task 4: Payments list, detail, and new transfer workflow
**Files:** create `src/app/payments/page.tsx`, `src/app/payments/new/page.tsx`, `src/app/payments/[id]/page.tsx`, shared components/actions, and `payments-flow.test.tsx`.
**Interfaces:** consumes `TreasuryService.listPayments/createPayment/submitPayment/getPayment`; transfer input includes source account, beneficiary, amount IRR, payment date, reference, description.
- [ ] Write failing tests for search/filter/table navigation and detail rendering.
- [ ] Write failing form tests for invalid IBAN dependency, unsafe/negative amount, missing beneficiary/account, duplicate reference/idempotency, valid draft.
- [ ] Implement payments table, badges, filters, lifecycle detail, and transfer form.
- [ ] Ensure submit changes state only through service/domain workflow.
- [ ] Run tests and verify PASS.
- [ ] Commit `feat: add functional payments and transfer workflow`.

### Task 5: Bank accounts and beneficiaries/master data
**Files:** create `src/app/accounts/page.tsx`, `src/app/beneficiaries/page.tsx`, `src/app/master-data/actions.ts`, tests; modify treasury service.
**Interfaces:** local-safe CRUD, reusing `createBankAccount` and `createBeneficiary`.
- [ ] Write failing tests for valid/invalid creation and tenant isolation.
- [ ] Implement account cards/table and beneficiary whitelist/history-ready surfaces.
- [ ] Display connection/balance as unavailable unless backed by evidence.
- [ ] Run tests and verify PASS.
- [ ] Commit `feat: add accounts and beneficiary management`.

### Task 6: Reconciliation and bank submission queue
**Files:** create `src/app/reconciliation/page.tsx`, `src/app/queue/page.tsx`, actions and tests.
**Interfaces:** consumes existing `reconcile()` and bank adapter contracts; queue lists only eligible records.
- [ ] Write failing tests for MATCHED/AMBIGUOUS/UNMATCHED and manual review.
- [ ] Write failing tests proving disabled adapter cannot produce success and UNKNOWN never auto-retries.
- [ ] Implement reconciliation and queue views with explicit disabled/live-unavailable state.
- [ ] Run tests and verify PASS.
- [ ] Commit `feat: add reconciliation and safe submission queue`.
### Task 7: Reports and audit explorer
**Files:** create `src/app/reports/page.tsx`, `src/app/audit/page.tsx`, reports actions and tests.
**Interfaces:** consumes `report()`, `toCsv()`, `filterAudit()`; exports only filtered real data.
- [ ] Write failing tests for totals, filters, CSV, audit filters/order/read-only.
- [ ] Implement report cards/table/export and audit explorer.
- [ ] Run tests and verify PASS.
- [ ] Commit `feat: add reports and audit explorer`.

### Task 8: Login/local entry, permissions, and state surfaces
**Files:** create `src/app/login/page.tsx`, `src/app/ui/StateView.tsx`, `PermissionBoundary.tsx`, tests; modify Tasks 3–7 routes.
**Interfaces:** production stays trusted external identity; desktop-local entry is explicitly local/offline-safe.
- [ ] Write failing tests for local-entry label, permission denied, validation/success/failure/loading/empty, keyboard focus.
- [ ] Implement local entry and shared permission/state surfaces.
- [ ] Apply consistent states to all routes.
- [ ] Run tests and verify PASS.
- [ ] Commit `feat: harden entry permissions and UI states`.

### Task 9: Interaction, accessibility, visual regression, and desktop release
**Files:** create `scripts/ui-smoke.mjs`, `scripts/desktop-workflow-smoke.mjs`; modify `scripts/smoke.mjs`, `package.json`, desktop packaging; create `docs/UI_RECONSTRUCTION_GATE.md`.
**Interfaces:** `npm run ui:smoke` validates all routes/headings; desktop smoke clean-installs, creates a safe draft, navigates, restarts, and proves persistence.
- [ ] Add automated route smoke coverage for all primary pages.
- [ ] Add keyboard/RTL/accessibility assertions using free tooling only.
- [ ] Rebuild portable desktop runtime.
- [ ] Run clean-install workflow smoke with navigation, draft creation, detail, restart, retained record.
- [ ] Run full gate: `npm run typecheck && npm test -- --reporter=dot && npm run lint && npm run build && npm audit --omit=dev --audit-level=high && npm run ui:smoke && npm run desktop:workflow-smoke`.
- [ ] Compare running screens side-by-side against approved nine-screen reference and fix material deltas.
- [ ] Record evidence in `docs/UI_RECONSTRUCTION_GATE.md`.
- [ ] Commit `release: complete TreasuryFlow product UI reconstruction`.
- [ ] Push branch and inspect remote CI status without inferring success from local checks.

## Self-review
- Spec coverage: all nine approved screens plus audit/master-data dependencies are assigned.
- Free-only constraint: no paid dependency is introduced.
- Architecture: domain rules remain below application services; UI has no direct financial mutation.
- Safety: maker/checker, UNKNOWN, disabled LIVE bank, idempotency, tenant boundaries have owning tests.
- Delivery: desktop acceptance exercises real navigation and persisted workflow, not only HTTP readiness.
