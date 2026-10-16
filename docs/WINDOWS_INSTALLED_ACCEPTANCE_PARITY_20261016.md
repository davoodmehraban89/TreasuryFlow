# TreasuryFlow Windows Installed-Application Acceptance — Factor-easyPro Pattern

## Scope and authority

- Preserve TreasuryFlow **Electron + Next.js + local SQLite**. This is a test-strategy transfer from Factor-easyPro's **Tauri + WebView2** lab, not an architectural migration.
- Source comparison: `davoodmehraban89/Factor-easyPro/.github/workflows/windows-vm-native-lab.yml` on `main`, using `runs-on: windows-latest`, an actual NSIS installer, an installed app, CDP, restart/upgrade/backup scenarios and evidence artifacts.
- TreasuryFlow source: `ci/windows-dual-app-lab-20261016`; the entire Windows lab also uses `runs-on: windows-latest`.
- Production banking is forbidden during the lab: `BANK_ADAPTER_MODE=disabled`, `TREASURYFLOW_DESKTOP_LOCAL=1`, synthetic SQLite in `RUNNER_TEMP`. No production SQL, customer data, releases, or signed commercial distribution.

## Acceptance matrix (must be run-bound)

| Acceptance criterion | Implementation in this branch | Meaningful PASS |
|---|---|---|
| Unit/integration, typecheck, lint, Next build and local HTTP fail-closed | `windows-vm-treasury-lab.yml` + `scripts/smoke.mjs` | Actual commands succeed |
| Real direct unpacked Electron runtime | `scripts/windows-vm-unpacked-smoke.ps1` | Process alive + HTTP ready with bank disabled |
| Real portable EXE | `scripts/windows-vm-treasury-smoke.ps1` | Bootstrapper spawns app and local HTML serves |
| Distinct real NSIS installer | `package.json` build.nsis.artifactName | Nonempty Setup EXE; portable and installer distinct |
| Real silent NSIS installation | `scripts/windows-vm-treasury-install-smoke.ps1` | Installed EXE exists, starts and serves local content |
| Installed native window and local entry | `qa/windows/electron-native-gui-smoke.mjs` | Real CDP connection, localhost-only page and local entry link |
| Native page navigation | Same CDP smoke | All 10 declared application routes render without empty/error state |
| Native SQL clipboard flow | Same CDP smoke | Exact edited SQL delivered to intercepted navigator.clipboard; **not proof of Windows OS clipboard** |
| Synthetic financial writes | Same CDP smoke | One source bank account, whitelisted beneficiary and payment **DRAFT**, through installed UI |
| Restart and disk durability | Same CDP smoke | Same SQLite file read after native process tree is killed and application reopened; audit events visible |
| Actual silent uninstall | `scripts/windows-vm-treasury-uninstall-smoke.ps1` | NSIS uninstaller exits 0 and removes installed EXE |
| Run integrity | `verification.json` | Correct SHA, run ID, Windows runner, evidence files and no unverified pass |
| V5 source/native bridge | Not included in this repo branch | **BLOCKED** until genuine SHA-pinned source and bridge supplied |
| Cross-version in-place upgrade and rollback | Not implemented: no independently verified prior installer for TreasuryFlow | **NOT VERIFIED**; never infer from a clean reinstall |
| Authenticated login, actual bank API, physical print, customer backup | Out of scope | **NOT VERIFIED** |

## Important qualification

TreasuryFlow's current `/login` page contains a link to `/dashboard`. Testing that entry link **does not prove password authentication, RBAC or an external identity provider**. Do not mislabel it as secure-login acceptance.

A passing unit test or successful EXE build does **not** prove installed native behavior. The acceptance result remains `NOT_VERIFIED` if any required installed-runtime, GUI, disk-persistence or uninstall evidence is missing.

## Observed upstream evidence before the matrix extension

- [Run 38963333150](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/38963333150): the unpacked process and real Portable EXE runtime steps passed. NSIS builder ran but the name check failed because Setup was emitted under the portable naming pattern; this is not a successful installed-app test.
- Dedicated `build.nsis.artifactName` and portable-vs-Setup collision checks were added to the feature branch. No claim of successful NSIS install until a later run proves it.
- Follow-up runtime acceptance attempts must be judged using their own `GITHUB_SHA`, not previous commits.

## Safety and operations

- All data creation occurs on a disposable GitHub-hosted Windows VM with a CI-specific SQLite file in `RUNNER_TEMP`.
- Never upload SQLite, secrets, credential-bearing content or real account data. Evidence is structured JSON and screenshots of non-sensitive synthetic UI.
- The default branch is not modified by this implementation; no public release is authorized. Temporary branch-scoped push triggers must be removed after use.
- Installed tests are allowed to fail safely and record incomplete evidence. Do not manufacture a pass or silently downgrade gates.


## Successful pinned Windows installed-native acceptance — run 38977925277

**Observed official GitHub Actions result:** [Run 38977925277](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/38977925277) completed with `conclusion=success`, on actual hosted Windows Runner `1000009745`. Harness/test commit was `7f5283bd0f8041679dadd3a9b261ed2d94cc2261`. The unchanged pinned `TreasuryFlow 0.1.0` NSIS installer came from build Run `38965182060`, source commit `0b8e85fb3765fce84e407e0e9c59f70ad901fd8a`. Source artifact ZIP SHA-256: `70fc35413677ee7a6eaa8698ddd3dfe7f828ce2a5af90a4a24a1364467d2401b` (without prefix), installer SHA-256 `F4EE8F43D1CBF1181B94B525770A8101E6073486676E7AA54D075AB8CBCC2606`.

**Independently downloaded and read actual report JSON** from public-branch GitHub Actions Artifact ID `12079817255`, `treasuryflow-installed-native-acceptance-evidence`, ZIP digest `sha256:40f89fea5aa4bf155fb4f04c4c8f2a871af046a329fdd88cd4a6f1be13a101`; artifact expires 2026-10-23 22:50 UTC.

- `source-provenance.json`: **PINNED_SOURCE_PASS**, exact build Run/commit, artifact and installer checksum.
- `installed-runtime.json`: **NSIS_INSTALL_AND_INSTALLED_RUNTIME_PASS**; real silent install took 72.6 seconds; executable launched and served HTTP with `bankAdapter=disabled`, local port was confirmed free after cleanup.
- `treasuryflow-native-gui.json`: **REAL_INSTALLED_ELECTRON_GUI_PASS**; genuine installed Electron window / CDP connection, local entry link, all ten app routes, SQL clipboard API interception, synthetic account + whitelisted beneficiary + draft payment; the Electron app was shut down and restarted, then persisted records and audit entries were verified on four installed-local Next.js HTTP pages (account, beneficiary, payment, audit); no Windows clipboard claim.
- `uninstall-runtime.json`: **NSIS_REAL_UNINSTALL_PASS**; genuine NSIS uninstaller exited 0; installed EXE was physically absent after 3.0 seconds.
- `native-acceptance-verification.json`: `windowsAcceptance=PASS` and all four checks `PASS`, tied to the same test run and source SHA.

**Acceptance limits:** This validates only the **repo branch build of TreasuryFlow v0.1.0** and the installed Windows x64 flow. It does NOT validate the missing genuine V5 native bridge, Mayan executable parity, password-authenticated login (the current /login is a local entry link), actual Windows OS clipboard, production finance/bank LIVE calls, private customer data, in-place upgrades across versions or a public production release. Do not derive such claims from this green CI run.

**Reliability corrections validated by the final run:** clean orphaned Electron processes and free localhost port before CDP, verify 26-character checksum-valid synthetic Iranian IBANs, perform actual CDP text entry rather than mutating React inputs, retain synthetic data in a dedicated SQLite file across native restart, and poll for actual NSIS uninstaller removal. The workflow uses a manually selected feature branch after the temporary one-shot trigger was reverted. No merge to `main`, bank LIVE setting, private V5 upload or public release was performed.

**Next release gate:** obtain a verified complete V5 source/native bridge, define and pin a prior compatible installer for version-upgrade evidence, implement actual authentication only after separate requirements approval, and run a fresh Windows VM acceptance on those specific versioned artifacts. Current `0.1.0` acceptance is reproducible via `.github/workflows/windows-vm-installed-acceptance.yml` while pinned Artifact ID `12075720690` remains available; it must not be represented as a V5 release.
