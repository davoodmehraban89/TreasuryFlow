# TreasuryFlow — Local SQLite backup and safe recovery (nonfinal)

This is an **offline, operator-controlled procedure** for the local SQLite store. It does **not** certify V7 upgrade/rollback, production database disaster recovery, bank reconciliation or RPO/RTO. Keep all bank adapters disabled during recovery.

## Preconditions
- Node.js 22 and the checked-out matching TreasuryFlow source are required.
- Stop the desktop application **before restoring** and keep a separately protected backup outside the active database directory.
- Treat every SQLite backup as **sensitive financial data**, not an export for public GitHub/CI.
- Perform this only on an authorized device with encrypted/private storage. The utility does not encrypt its output.

## Offline commands

```sh
node --experimental-strip-types scripts/treasury-sqlite-recovery.mjs backup /path/to/current.sqlite /secure/new-backup.sqlite
node --experimental-strip-types scripts/treasury-sqlite-recovery.mjs verify /secure/new-backup.sqlite
node --experimental-strip-types scripts/treasury-sqlite-recovery.mjs restore-new /secure/new-backup.sqlite /path/to/new-recovery.sqlite
```

The backup uses SQLite `VACUUM INTO` for a consistent committed snapshot, even when the source has WAL activity. It validates `PRAGMA integrity_check`, required schema tables and exact schema version. The destination is created exclusively: **an existing file, including a zero-byte file, is never overwritten**. Restore works **only to a new filename** and does not modify the active database.

## Operational handover / rollback
1. Capture and verify a protected backup; record its SHA-256 in private release records.
2. Run recovery into a **new** path and compare account, beneficiary, payment and audit counts.
3. Have a finance checker independently reconcile balances, payment identifiers and critical audit sequences against authorized records. Counts alone are not reconciliation.
4. Transactions in `UNKNOWN` and `DISPATCHING` must remain blocked from automatic bank resubmission after restore. Confirm their status externally with the bank through approved channels and maker/checker review.
5. Point a **separate test deployment** at the recovered database for smoke verification. Production path switching is a separately authorized deployment action; this utility never performs it.

## Security boundaries
- Never upload a real customer SQLite file, backup or restored copy to public CI artifacts, public repositories or support logs.
- This is not an automatic scheduled backup service and does not guarantee any production RPO/RTO.
- A valid file alone does not prove finance correctness or permission to replay bank transactions.
- Corrupt, unsupported-schema and existing-target cases fail closed, with no operational file replacement.

## Test acceptance
See `src/platform/local/verified-sqlite-backup.test.ts` and `scripts/treasury-sqlite-recovery.test.ts` for normal, WAL, corruption, version, no-overwrite and operator command regressions. Verified in real three-job independent hosted CI [run 39945850403](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/39945850403), all **PASS**: full finance suite, strict typecheck, lint, Next build, smoke, production-only dependency audit 0, local WAL backup/restore and CLI normal/edge/failure tests. The preceding [run 39945245100](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/39945245100) uncovered a TypeScript error in the `fs` exclusive-copy constant; it was repaired and all three jobs were rerun. These are three separate CI processes, **not** three autonomous AI review agents.

This proves the local test contract only. It does not prove a Windows V7 installer, real Mayan database integration, authorized bank UAT or production recovery RPO/RTO.
