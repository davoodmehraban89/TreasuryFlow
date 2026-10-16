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

## Additional manual-dispatch prerequisite

Official GitHub Actions documentation requires a `workflow_dispatch` workflow file to exist on the repository **default branch** for manual runs (https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow). TreasuryFlow's `main` currently contains only `README.md`, while both test workflows are confined to the feature branch. **This prevents reliable direct manual dispatch of these feature-only workflows.**

Safe resolution: after user approval, introduce a tightly scoped, read-only-permission manual CI entry point on `main` with exact branch/commit selection; do not merge the application's development tree or expose the private repository. Do not change the default branch or settings without approval. A branch-specific opt-in push trigger is another option but may schedule billable runner minutes and cannot substitute for authorized provisioning.

The latest feature branch changes remain UNVERIFIED on Windows until both dispatcher configuration and hosted runner availability are confirmed.


## Desktop localhost-readiness safety fix — follow-up in this chat

- Feature branch commits: `91648b640d41bbea4050b0716149e635857d3717` (readiness parser), `9364cc9ef5b41ddf7f794169b1ad2840403ca410` (5 negative/positive regression cases), `63a06ccc5038d98390201ea22d34419be33f21a3` (Electron startup guard), `8f1119e8f3622173a3c8acf3121a254bb0321114` (Windows workflow regression gate).
- Defect: the prior Electron startup routine accepted any HTTP status below 500 on the fixed port 3210, including unrelated applications and 404 responses; it could claim startup readiness without proving TreasuryFlow was listening.
- Fix: require HTTP 200 plus exact `status=ready` and `bankAdapter=disabled` JSON, reject oversized/malformed content, and fail when the launched server process exits before readiness.
- Standalone local validation: `node --test qa/windows/electron-readiness.node.mjs` equivalent helper/test content on **Linux Node.js 22.16.0**: 5 PASS, 0 FAIL, 0 SKIP. Additionally JS syntax parse of updated `electron/main.cjs` and `electron/ready-check.cjs` succeeded before commit. This is **not** an Electron or Windows runtime test.
- Windows workflow now runs these five regression cases as an explicit gate after Mayan semantics regressions; no Windows runner has executed this new commit as of this documentation update.
- At assessment time the newest recorded GitHub Actions run was [38944906028](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/38944906028) at old SHA `514283035b66a62293309e047a84bc7a9a7d4ed4`; its job had no executed steps and no artifacts. A failed check-run annotation existed but its body could not be retrieved via the currently available connector; exact platform-side failure cause remains **UNVERIFIED**, not automatically attributed to billing.
- `main` at SHA `5dbea663ac33f4e535ad8bca0d59b073c5aa9317` contains `README.md` only. Official `workflow_dispatch` requires the workflow to exist on default branch; both current labs are feature-only and are not manually dispatchable by the normal workflow entry point. Do not change `main` or create billable infrastructure without explicit approval.
- Source V5/1.0.1 and original Mayan native bridge remain missing from this GitHub source snapshot; no Windows EXE, NSIS installer, live finance output or Mayan/Treasury runtime parity is newly verified.
- Status: `LOCAL_REGRESSION_VERIFIED` for readiness parser; `WINDOWS_VM_UNVERIFIED`, `RUNNER_ROOT_CAUSE_UNVERIFIED`, `V5_NATIVE_BRIDGE_BLOCKED`, `MANUAL_DISPATCH_BLOCKED_DEFAULT_BRANCH`. No LIVE banking, production data, main merge or public release performed.

## Continued CI hardening and default-branch bootstrap PR #1

- The independent Windows installed-GUI smoke now waits for the SQL editor and copy button to both be rendered, rather than treating URL navigation alone as successful hydration. Files committed on the feature branch: `qa/windows/gui-readiness.mjs`, `qa/windows/gui-readiness.node.mjs`, `qa/windows/electron-native-gui-smoke.mjs`, `.github/workflows/windows-vm-treasury-lab.yml`. Last application/CI commit before this documentation update: `e0a3ded93e1d65f79a987662949a95fcfe0e6a9c`.
- Exact Git blob SHAs for the new GUI readiness parser and tests: `1472bd43fe6a4311687bf98619491c46f351201d` and `ac3f6e9214e49754ca07420368edbbbdb3d448b5`; both match locally exercised content.
- Standalone independent Linux Node.js 22.16.0 tests: `node --test qa/windows/*.node.mjs` — **9 passed / 0 failed / 0 skipped** (5 server-readiness tests plus 4 hydrated-GUI readiness tests). These are pure contract checks. The actual Windows CDP automation has **NOT** been executed on a Windows runner for the new code.
- To prepare manual workflow discovery without touching `main`, a separate draft pull request was opened: **[#1 — register safe manual Windows lab entrypoints](https://github.com/davoodmehraban89/TreasuryFlow/pull/1)** from branch `ci/windows-dispatch-bootstrap-20261016`, SHA `793714640fe891038d8de28e7a2aecc7b164acbd`, base `main` SHA `5dbea663ac33f4e535ad8bca0d59b073c5aa9317`. Independent compare confirmed exactly **two new workflow YAML files** and no application code. Default-branch placeholders have read-only permissions and `if: ${{ false }}`, so the default branch alone does not execute the financial application or consume a hosted runner for these placeholders.
- **PR #1 is DRAFT/OPEN, UNMERGED.** Explicit user approval is required before merging it to `main`. Workflow-dispatch registration and Windows runner eligibility are still NOT VERIFIED.
- Last checked Actions list still contains no run for the new feature HEAD; earlier Run `38944906028` at SHA `514283035b66a62293309e047a84bc7a9a7d4ed4` has job `117121453676` with `runner_id=0`, zero executed steps, no run artifacts. Specific failure annotation not accessible via current read connector; root cause is UNKNOWN.
- Missing complete genuine V5 source/native bridge and approved sanitized Mayan test asset remain independent blockers. No bank LIVE connection, real transfer, production data mutation, public release, purchase, workflow run, or merge to `main` was performed.
- Next safe step requiring the user: review and explicitly authorize merge of draft PR #1; separately check private Windows hosted runner availability/billing before initiating a potentially billable workflow run. This is not a request to approve banking LIVE or production deployment.
