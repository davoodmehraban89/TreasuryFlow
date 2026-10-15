# SQL Server Read-Only Integration — Stage 1 (2026-10-15)

- Added /integrations with Persian RTL UI, editable sample query and copy-current-text button.
- Suggested schema contract only: **not** inferred from customer's accounting SQL schema.
- SELECT-only lexical guard and at-most-100-row SQL template. No query execution API yet.
- No secrets, connection strings or database rows are stored/transmitted by this UI.
- No modification to Mayan, Peyvast, production SQL tables or bank submission.
- Branch is based on phase-7-production-infrastructure-bank-golive because main contains only README.md.
- This GitHub branch does not include the newer local Windows V5/1.0.1 worktree; merge pending.

Security: SQL lexical validation is not a database permission boundary. Real preview requires a protected server-only endpoint, verified desktop-local identity, a dedicated SQL login genuinely limited to SELECT on approved views, server-enforced row/timeout limits and non-production integration tests.

Next: Recover C:\TreasuryFlow-P1\.worktrees\batch-payment-import-v1.0.1, map real schema without secrets, implement authenticated local test-connection/schema inspection, then build and smoke-test Setup EXE. No live bank traffic is authorized.
