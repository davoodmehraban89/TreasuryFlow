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
