# UX Foundation — TreasuryFlow
- Persian-first RTL application shell (`lang=fa`, `dir=rtl`).
- Operational states are text labels, never color-only signals.
- Monetary values are IRR integers with tabular numerals and explicit currency label.
- Primary navigation: Dashboard, Payments, Approvals, Bank Accounts, Reconciliation, Reports, Audit, Administration.
- Maker and Checker actions must be visually separated; destructive/emergency actions require explicit confirmation.
- UNKNOWN and NEEDS_REVIEW are high-salience operational states and must never present a retry-as-default action.
- Accessibility baseline: semantic landmarks, keyboard operability, visible focus, form labels, WCAG-oriented contrast.
