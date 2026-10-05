# TreasuryFlow Product UI Reconstruction — Design Specification

Date: 2026-10-05
Status: Approved design direction; implementation pending written-spec review
Visual source of truth: the previously approved nine-screen TreasuryFlow reference image in the project conversation.
Cost constraint: development and runtime must not require paid tools, paid plugins, paid UI kits, or paid SaaS subscriptions.

## 1. Goal
Replace the current non-functional dashboard shell with a cohesive, RTL-first treasury operations application whose visual language and information architecture visibly match the approved nine-screen reference and whose primary controls execute real application flows rather than hash-link placeholders.

## 2. Product acceptance criteria
A release is not complete merely because it builds or returns HTTP 200. It is complete only when:
1. The application visibly matches the approved reference in composition, density, hierarchy, RTL behavior, navigation, tables, forms, status badges, cards, and operational tone.
2. Every primary navigation item opens a real route/view with meaningful content.
3. Primary user actions change application state through validated application/domain services; no fake success actions.
4. Empty, loading, validation, success, failure, permission-denied, and bank-unknown states are represented deliberately.
5. Core flows are keyboard accessible and responsive at supported desktop widths.
6. Automated tests cover navigation and critical workflows, not only server reachability.
7. Desktop packaging opens the same complete product experience.

## 3. Approved screen map
The first implementation target follows the nine-screen reference:
- Login / secure entry
- Operations dashboard
- Payments / transfers list
- New transfer creation
- Bank accounts
- Reconciliation
- Bank submission queue
- Transfer result/detail
- Reports

Supporting routes required by the existing product shell:
- Audit events
- Beneficiaries/master data where needed by transfer creation
- Settings/status surfaces only where backed by real configuration

## 4. Information architecture
Persistent RTL application shell:
- Right-side navigation rail/sidebar
- Product identity and environment indicator
- Main navigation grouped by operations, controls, and reporting
- Top utility/header area for page title, contextual actions, search/filter where applicable, user/role context, and system status
- Main content canvas with constrained readable width on forms and full-width operational tables

Navigation must use real Next.js routes, never fragment-only links for primary screens.

## 5. Visual system
The approved reference is authoritative. The implementation will derive a local design-token layer rather than importing a paid kit.

Token families:
- Neutral application background, elevated surfaces, borders, primary text, secondary text
- Treasury accent and semantic success/warning/danger/info colors
- Consistent radii, shadows, spacing scale, control heights, table density
- Persian/RTL typography using locally available/free fonts only; system-safe fallback required
- Iconography from a free/open-source icon set or simple CSS/SVG assets already allowed by the repository

Reusable components:
- AppShell, Sidebar, Header/PageHeader
- StatCard, StatusBadge, EmptyState, AlertBanner
- DataTable, FilterBar, Pagination
- Button variants, Input, Select, Date/amount fields, Checkbox
- FormSection, ReviewPanel, ConfirmationDialog
- Timeline/stepper for transfer lifecycle
- AccountCard and health/status indicator

## 6. Functional behavior by screen
### Login
Production continues to rely on trusted external identity; local desktop mode may provide an explicit local-development entry surface without pretending to be production authentication.

### Dashboard
Show actionable treasury summary: payment queue counts/amounts, items needing review, reconciliation status, bank/channel health where evidence exists, and recent operational activity. Cards navigate to filtered operational views.

### Payments
Searchable/filterable table with reference, beneficiary, source account, amount, date, state, and available actions based on authorization. Row selection opens detail.

### New transfer
Validated multi-section form using Iranian normalization/IBAN and money rules already present in domain code. Submission creates a real local application record/state; maker/checker constraints remain enforced.

### Bank accounts
List/account cards backed by master data with status and identity fields. No fabricated live balances unless a real adapter supplies them.

### Reconciliation
Statement/reconciliation results use existing reconciliation domain logic. Unknown/unmatched states are first-class and manually reviewable.

### Submission queue
Only eligible/approved payments appear. Bank adapter remains disabled unless certified external configuration exists. Disabled/live-unavailable state must be explicit rather than simulated.

### Transfer detail/result
Lifecycle timeline, immutable references, approval state, bank state, reconciliation state, and audit context. UNKNOWN bank outcome never becomes synthetic success.

### Reports
Operational reports use real repository/domain data and support useful filtering. Export is implemented only when generated from actual visible/report data.

### Audit
Read-only audit explorer with filters and actor/action/time/context fields; no mutation actions.

## 7. Application/data architecture
Keep existing domain modules as the source of business rules. Add an application layer for UI use cases rather than moving business rules into React components.

For desktop-local mode, introduce a durable local repository appropriate to the application (free/open-source, no external paid dependency) so actions persist across restarts. Production keeps the PostgreSQL adapter and tenant isolation contract.

UI -> application service/use case -> domain rules -> repository/adapter.

No screen may directly bypass authorization or domain transition rules.

## 8. Safety and financial controls
- Maker/checker separation remains mandatory where policy requires it.
- Idempotency remains enforced for submission-sensitive actions.
- Bank LIVE stays disabled without explicit external certification/configuration.
- Unknown bank outcome remains UNKNOWN/manual review.
- Audit-relevant actions emit audit events.
- Tenant context remains server-side and fail-closed in production.
- No secrets embedded in browser bundles or desktop package.

## 9. Free-only tooling constraint
Allowed implementation path must remain usable without payment:
- Existing Next.js/React stack
- Repository-local CSS/design tokens
- Free/open-source packages only when needed
- Figma Free only as an optional design workspace; the repository and approved reference remain sufficient sources of truth
- No paid Figma libraries, premium icon packs, commercial UI templates, paid component kits, or paid deployment dependency

If any tool reaches a paywall, it is replaced rather than purchased.

## 10. Testing strategy
Required gates:
- Unit tests for application use cases and domain integration
- Navigation tests proving every primary menu target renders the intended view
- Form validation tests for transfer creation
- State-transition/authorization tests for maker/checker actions
- Persistence tests for desktop-local repository
- Reconciliation and UNKNOWN-state regression tests
- Accessibility checks for labels, focus, keyboard paths, and RTL semantics
- Production build/typecheck/lint/audit
- Desktop clean-install smoke test that exercises navigation and at least one safe local workflow, not only /api/ready

## 11. Delivery sequence
1. Design tokens + reusable shell/components
2. Real routing + dashboard
3. Payments list/detail + new transfer
4. Accounts + beneficiaries/master data dependencies
5. Reconciliation + submission queue
6. Reports + audit
7. Local persistence integration
8. Full interaction/accessibility regression
9. Desktop package rebuild and clean-install acceptance test

## 12. Explicit non-goals for the UI reconstruction
- Fabricating bank connectivity, balances, certifications, or production credentials
- Enabling LIVE bank submission without external approval/evidence
- Replacing the existing tested domain rules with UI-only logic
- Introducing paid dependencies
- Calling a static mockup a finished product

## 13. Definition of done
TreasuryFlow is accepted only when the approved reference and the running application can be compared side-by-side and the application is recognizably the same product family, while every primary screen and safe local workflow is operational and verified. Remaining external-bank/production provisioning items must be explicitly labeled external, not hidden behind fake UI success.
