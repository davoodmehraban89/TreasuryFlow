# Windows VM laboratory — continued work and evidence (2026-10-16)

## Verified repository changes (feature branch, not main)

- Corrected malformed GitHub Actions artifact path expressions in both Windows workflows; retained private upload-artifact policy.
- Included the native Electron UI screenshot (`treasuryflow-installed-ui.png`) in the TreasuryFlow workflow artifacts.
- Added per-run `verification.json` with GitHub run ID, head SHA, runner OS/name, evidence results, URL and a fail-closed `NOT_VERIFIED` status when any actual run evidence is absent.
- Tightened the installed Electron CDP smoke test to click the real SQL copy button and intercept the browser clipboard API, asserting that **edited** SQL is copied exactly. This proves the application event wiring if the Windows job passes; it is NOT a physical Windows clipboard test.
- Changed the V5 build dependency check to **fail the job** when `native/MayanInterop/Program.cs` is absent, rather than skipping the desktop installer and leaving a green job.

## Observed GitHub Actions evidence (before these changes)

- Run: https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/38944906028
- Job: `treasury-windows`; conclusion: `failure`; runner name unavailable; zero executed steps; no artifacts.
- Run HEAD SHA: `514283035b66a62293309e047a84bc7a9a7d4ed4` (NOT the current branch HEAD).
- No confirmed Windows execution for the above changes. **Windows status: UNVERIFIED.**
- Private runner availability/billing eligibility is suspected but the precise provider reason is unverified; do not infer a root cause from job failure.

## V5 completeness proof

The reviewed V5 CI source ZIP from the conversation has SHA-256:
`674db7fc079b8d9a70739e9abbf25d52e1b2a8b888c41de85783f4b0c6f2d767`.
Direct ZIP inspection found **no `native/MayanInterop/Program.cs`** despite the V5 `package.json` requiring its compiled EXE in Electron `extraResources`. The build gate must fail closed.

The sanitized Mayan QA ZIP SHA-256 is:
`c71bb56a7de35d9e80b98e93ed19152d1d7969d0eeec0ab29ae02a4bcef5d862`.
It is a sanitized local test candidate; activation, real GUI functionality, authentic bank output and parity are **UNVERIFIED**.

## Independently executed offline tests

The 15-case standalone synthetic Mayan/Treasury comparison suite available in the local work folder was run on **Linux Node.js 22** with:
`node --test comparison/tests/mayan-treasury-compare.test.mjs`.
Observed result: 15 passed, 0 failed, 0 skipped. This is a local contract test, not a GitHub Actions run and not real application output parity.

## Next gate and required external actions

1. Confirm GitHub Actions Windows runner availability for the **private** TreasuryFlow repo under account/repository Actions and billing settings. No paid change should be made without user's explicit approval.
2. Recover the missing genuine native bridge source from the Windows project worktree; inspect its contents for secrets prior to uploading.
3. Once runners are available, run `windows-vm-treasury-lab.yml` for **the exact head SHA** with the sanitized complete V5 source asset and SHA-256. Require all Windows steps and `verification.json` evidence; a previous green run does not count.
4. Stage a separately authorized, secret-free Mayan QA package to execute the isolated WinForms structural probe. Real parity requires both applications producing captured outputs for the same synthetic inputs; do not equate fixture-only tests with runtime evidence.

No merge to `main`, no deployment, no live bank connection, no customer data upload or money movement performed.
