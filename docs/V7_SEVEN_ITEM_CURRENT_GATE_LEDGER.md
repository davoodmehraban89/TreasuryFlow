# TreasuryFlow — Seven requested items, exact current acceptance (nonfinal)

This evidence ledger distinguishes **V6 private staging** from the **V7 public prototype branch**. It does not authorize production deployment, live bank access or claim three autonomous AI reviewer approvals.

| Requested item | Evidence and limitations | Gate |
|---|---|---|
| 1. Windows NSIS installer | V6 private integrated NSIS [run 39551928916](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/39551928916) installed / uninstalled. Separate public V7 prototype NSIS built and installed [run 40319524019](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/40319524019) but did not start; Next runtime missing from resources; corrected extraResources on feature branch, retest pending. | PARTIAL / V7 NOT VERIFIED |
| 2. Durable restricted source + EXE | Protected V6 prerelease write attempted [run 39375818902](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/39375818902); upload permission denied. No public upload of private V6 source or binary. | NOT DELIVERED |
| 3. Same-executable native UI and persistence | V6 synthetic 10-route, three finance creates, restart/audit [run 39280616429](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/39280616429) PASS. V7 installed UI acceptance not established. | V6 PASS ONLY |
| 4. Excel real native workbook import/export | V6 isolated **nonposting** preview, native picker invalid/positive XLSX and downloaded workbook exact value roundtrip [run 39551928916](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/39551928916) PASS. Production financial import and V7 integration not implemented / authorized. | NONPOSTING PREVIEW PASS ONLY |
| 5. SQL Server view-only UI | Real synthetic SQL Server 2022 view-only approved principal, UI Next page, base-table denial and remote target block [run 39551941481](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/39551941481) PASS. Actual Mayan model and V7 integrated UI not certified. | SYNTHETIC PASS ONLY |
| 7. Integrated V7 financial functionality | Public feature branch full financial test suite and HTTP fail-closed guards [run 40319335900](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/40319335900) PASS. Not a private-release V7 end-to-end acceptance. | PARTIAL |
| 8. Durable recovery and audit | V7 local SQLite WAL snapshot, restore-new-only, corrupt backup rejection and UNKNOWN/DISPATCHING replay protection on real Windows/Linux [run 39948105705](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/39948105705) PASS. Real upgrade/rollback or production RPO/RTO not proven. | LOCAL SYNTHETIC PASS ONLY |

## Security and verification
- [MSAL high severity remediation validated by CI](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/40319335900): explicit 7.1.1 transitive lockfile override, production audit zero, finance unit, strict types, lint, Next build, smoke PASS. Committed only to isolated feature branch after checks.
- [Functional/security/edge three separate hosted QA executions](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/40319832939): independent CI jobs PASS, including stricter Electron readiness unit tests. **These are not three independent AI agents**.
- No real customer/bank data, no authorization to activate bank adapter, no public proprietary staging output, no force-push, no production changes.

## Open blockers to true V7 delivery
Windows installed prototype readiness; persistent private candidate delivery and hashes; Excel and SQL Server V7 domain wiring/real authorized mapping; integrated V7 finance acceptance with data/backup/migrations/rollback; external customer Mayan UAT and three actual independent reviewer-agent reports.
