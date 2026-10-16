# Windows GitHub Actions dual-application lab — 2026-10-16

## Implemented
- Disposable GitHub-hosted Windows x64 TreasuryFlow build pipeline: install locked dependencies, typecheck, unit tests, lint, Next build, HTTP smoke, Electron portable build, launch executable and probe real local HTTP/UI, plus NSIS Setup compilation.
- Separate manual-dispatch sanitized Mayan WinForms probe: require an exact **private GitHub Release** ZIP plus SHA-256, reject common sensitive files, verify CLR prerequisite, block outbound network access for the Mayan PE before launching it, capture structural/process evidence only.
- Node.js runtime-result comparison guard and 14 regression scenarios for sample status semantics, integer IRR amounts, independent payment/deposit identifiers and disallowing API acceptance from being treated as final settlement.
- Bank LIVE mode is disabled. No customer records, original Mayan license, passwords or private SQL connection strings are uploaded to this branch.

## Observed GitHub Actions blocker
After pushing the TreasuryFlow Windows workflow, runs **38943515006** and **38943575755** failed within seconds with no assigned runner and **no executed steps**. The exact GitHub billing/runner configuration cause is not confirmed. This private repository may require an available billing allowance or a suitable Windows runner; a successful public repository Windows run is not evidence that this private repository has available hosted minutes.

**Never claim Windows tests passed until an actual job runs and its evidence is checked.**

## Source-version blocker
The base GitHub branch is NOT the latest local V5 (1.0.1). The user-uploaded V5 source ZIP omits `native/MayanInterop/Program.cs` although its Electron `extraResources` require the generated bridge. A full V5 package remains BLOCKED_MISSING_NATIVE_BRIDGE until genuine source is restored.

## Optional assets (private releases only)
Use manual workflow inputs to fetch ZIP assets already uploaded by repository owner to a PRIVATE release:
- `TreasuryFlow-V5-CI-Source.zip` and its pinned SHA-256: the reviewed, sanitized V5 source archive. A missing native bridge must remain visible.
- `Mayan-Sanitized-QA.zip` and its pinned SHA-256: latest original Mayan executable plus DLL dependencies only, without license/config/XLSX or credentials. This package is intentionally unable to perform real banking and may fail at activation. Third-party DLLs must not be publicly redistributed.

Neither workflow publishes source or binaries as a public release. Actions artifacts retain for 7 days.

## Mayan/Treasury semantic comparison
The original Mayan archived dataset documents status 4 + errorCode 200 + issueId as **API acceptance**, not settlement; statuses 1 and 3 do not show final settlement. The comparison implementation fails closed on missing runtime provenance, mismatched IRR, identifiers, duplicate test cases and any incorrect promotion to SETTLED. Synthetic test pass is NOT application parity. Actual parity needs two isolated runtime captures for identical synthetic cases.

## Next external prerequisites
1. Confirm Windows hosted runner minutes/settings for private TreasuryFlow repository, or authorize a trusted self-hosted ephemeral Windows VM alternative.
2. Restore native/MayanInterop Program.cs and any required files from the user's original worktree, without secrets.
3. Supply only sanitized private-release assets, select SHA-256 and manually dispatch workflows.
4. Review Windows job logs, EXE and Setup evidence; run clean installer installation/upgrade and GUI interaction separately before final acceptance.
5. Obtain authorized sandbox activation and synthetic database for Mayan; then capture both products' actual outputs and execute the comparison gate.

No deployment, real bank transfer or production data mutation is authorized by these laboratory workflows.
