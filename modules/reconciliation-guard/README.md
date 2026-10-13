# TreasuryFlow reconciliation guard (isolated module)

**Status:** Standalone tested development module, NOT merged into the operating TreasuryFlow application.

Use this when a transfer attempt has already been recorded but bank outcome is uncertain. This package neither sends money nor connects to a bank or modifies a database.

Guarantees:
- UNKNOWN is never eligible for automatic retransmission.
- Bank acceptance is not final settlement.
- A definitive bank rejection must be distinguished from network errors.
- Evidence must match payment ID, amount as *string minor units*, and currency.
- Each bank evidence ID is idempotent; inconsistent replays and terminal conflicts fail closed.
- No automatic conversion between Iranian rials and tomans.

Tests: Node >=20, run `npm test` and `npm run check` in this folder (16 tests).

Important integration requirements:
1. Run only server-side. `verifiedBy` is asserted by a trusted banking adapter, not cryptographic verification by this module; NEVER accept it from client payload.
2. Save returned snapshot atomically using the current row version (compare-and-swap/SQLite transactional write).
3. Deduplicate external bank references across transfers at persistence level.
4. Inspect existing `TreasuryService.dispatchPayment` and adapt actual types before integrating.
5. Status flags from legacy Mayan do not alone establish confirmed settlement.
6. Require explicit authorized/manual workflow before retrying payment; this module provides no such permission.
7. Test against official bank sandbox and approved contract before enabling any real transfer.

The actual project source was previously reported at:
`C:\TreasuryFlow-P1\.worktrees\batch-payment-import-v1.0.1`

The GitHub TreasuryFlow repository main branch currently contains only README.md, therefore this isolated module is deliberately kept in a feature branch and is NOT an application release.
