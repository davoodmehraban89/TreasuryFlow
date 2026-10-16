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

## PR #1 approved and merged — workflow discovery on default branch

- Explicit user approval received to mark draft PR #1 ready and merge **only** the two default-branch workflow entrypoint YAML files. No request to run billable jobs, enable LIVE banking, deploy, or change access permissions was given.
- Re-read GitHub PR diff and current base before merging: exactly 2 added paths (`.github/workflows/windows-vm-mayan-sandbox.yml`, `.github/workflows/windows-vm-treasury-lab.yml`), 44 additions, 0 deletions, no application code modifications. PR head was `793714640fe891038d8de28e7a2aecc7b164acbd`; base `main` was `5dbea663ac33f4e535ad8bca0d59b073c5aa9317`.
- PR #1 was marked ready for review and merged successfully using expected-head-SHA validation. Merge SHA: `958d44b7f313186369bb535f7e6be93f3834c604`; URL: https://github.com/davoodmehraban89/TreasuryFlow/pull/1 ; confirmed GitHub PR `state=closed`, `merged=true`.
- Independently re-fetched `main` after the merge and verified SHA `958d44b7f313186369bb535f7e6be93f3834c604`, plus both new YAML paths on the default branch.
- Both default-branch placeholders intentionally have `if: ${{ false }}` and read-only repository permissions. The full runtime workflows still live on the feature branch and must be explicitly selected for future manual runs.
- No new Actions run was present at the post-merge query. **Workflow visibility/dispatch validation is still UNVERIFIED** until GitHub shows registration and a deliberately authorized run. Windows runner capacity and the specific no-runner failure cause remain UNKNOWN; no hosted minutes were deliberately consumed in this task.
- Next safe step: inspect the GitHub Actions UI for both workflow entries and runner availability; request separate authorization before initiating any potentially billable Windows run. Independently restore the missing authentic V5 native bridge and sanitized Mayan QA assets prior to claiming V5/Mayan acceptance.


## Explicitly authorized Windows VM diagnostic — run 38955438425

- User explicitly authorized investigation and execution of the Windows VM. No permission was granted for real banking, production deployment, secrets access, or sending third-party data.
- Main branch workflow registration was already merged and verified. The GitHub connector in this chat has authenticated read/write Git operations but no `workflow_dispatch` action, so a **one-shot, branch/path-scoped push trigger** was temporarily added only to `.github/workflows/windows-vm-treasury-lab.yml` on `ci/windows-dual-app-lab-20261016`.
- Exact attempted run: https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/38955438425 ; `event=push`, `head_sha=df0573681956f3755f96c3c412e058016efef58c`, `status=completed`, `conclusion=failure`; created `2026-10-16T19:30:36Z`, completed approximately four seconds later.
- Actual job `117157009678`: `runner_id=0`, `runner_name=""`, `steps=[]`, failure about three seconds after job creation; no artifacts. The Actions timing API returned `billable.WINDOWS.total_ms=0`, `jobs=1`, `duration_ms=0` and `run_duration_ms=4000`. **No Windows VM was allocated and no application code/test/installer step was executed.**
- One check-run annotation exists but the official connected fetch tool does not expose its body. Do not claim a confirmed billing, quota, permissions or YAML root cause from the no-runner observation alone. Account Actions/billing/runner configuration or exact annotation remains required to establish the root cause.
- After the failed run, the temporary push trigger was removed in commit `910889b708f361d71523f874f28d9b04d06fbd07`; the Windows workflow contents match the previous manual-only workflow blob SHA `0ea460f2b50366ce21f139b8e978c57797b35668`, preventing accidental further push-triggered VM attempts.
- **Next external evidence**: in GitHub Actions open job https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/38955438425/job/117157009678 and capture the one-line check/job error Annotation; also check account Actions billing allowance / hosted-runner availability. Do not increase billing/spending limits without a new explicit decision.
- Once runner access is proven, manually select the feature-branch head SHA and use the existing default-branch dispatch entrypoints. The repository feature branch is not the complete V5 native source, and Mayan runtime parity requires separately authorized sanitized assets.
- Final state of this specific user-approved execution: `RUN_SUBMITTED`, `WINDOWS_RUNNER_NOT_ALLOCATED`, `BILLABLE_WINDOWS_MS=0`, `APPLICATION_TESTS_NOT_EXECUTED`, `MANUAL_DISPATCH_AVAILABLE_IN_REPO`, `BLOCKED_PENDING_PLATFORM_ERROR_EVIDENCE`. No merge, no public release, no banking LIVE, no customer/production data.


## GitHub job annotation supplied by repository owner — billing gate confirmed

- For failed Windows run [38955438425](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/38955438425), job [117157009678](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/38955438425/job/117157009678), the repository owner provided a screenshot showing **Annotations: 1 error** with exact message:
  > The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings
- Evidence distinction: this message is grounded in a **user-provided screenshot**, not a connector-fetched annotation. Independent authenticated GitHub API evidence for the same run previously confirmed `runner_id=0`, `steps=[]`, no artifacts, `billable.WINDOWS.total_ms=0`, and a failure before runner assignment.
- Diagnosis: **GitHub account billing/spending-limit gating prevented hosted Windows runner allocation**. The annotation gives **two alternate causes**, failed recent account payments **or** insufficient spending limit; the screenshot alone does NOT resolve which alternative is currently active.
- **Action requires repository owner's billing authority**: inspect GitHub account Settings → Billing & licensing / Billing & plans → payment history, unpaid invoices, and Actions budget/spending limit. Resolve failed payment or approve a higher Actions budget only after reviewing monetary impact. Do not request or store bank/card data, passwords or secrets in project repository or chat.
- After the owner reports the specific billing issue resolved, initiate a *new* manual Windows run against the exact then-current `ci/windows-dual-app-lab-20261016` SHA. The previous failed run cannot validate Windows operation or build artifacts. Verify runner assigned, step logs, evidence and SHA. No production bank adapter or public deployment is authorized.
- No account billing configuration was modified, no Windows runner was started, and no additional VM job was dispatched in response to the screenshot.


## Public Windows runner: build/runtime diagnosis and fixes

- Repository visibility has become **PUBLIC**, verified through the authenticated GitHub repository metadata. This occurred outside this documentation edit. Public repository Actions artifacts and non-draft Releases must no longer be assumed private. **Do not stage proprietary Mayan binaries, V5 source archives, customer or banking data, passwords or keys in this public repository.** Staging such material requires an appropriately authorized private location and a separate approved workflow. The currently validated runs use only repository code, synthetic examples and BANK LIVE disabled.
- Public hosted Windows runner was successfully allocated beginning with [run 38956531296](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/38956531296). The earlier runner-account billing rejection on a private repo no longer blocked Windows execution; this does not prove a past invoice or charge issue was resolved.
- [Run 38956531296](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/38956531296): typecheck/tests/lint/build succeeded, but old `scripts/smoke.mjs` expected outdated locked-down home text and failed. Updated smoke now independently verifies local UI/login/dashboard/read-only query and blocked unconfigured production while the bank adapter remains disabled.
- [Run 38957284389](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/38957284389): the corrected HTTP smoke, full unit/integration checks and portable packaging passed; launcher process exited before packaged runtime readiness was observed. Subsequent test probes the actual child process instead of assuming the portable bootstrapper remains running.
- [Run 38958394976](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/38958394976): portable output built; the portable launcher exited code 0 without a detected app process. No runtime acceptance.
- [Run 38960025414](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/38960025414): standalone `win-unpacked/TreasuryFlow.exe` also exited code 0 without readiness; evidence `unpacked-runtime.json` showed nonempty stderr but original script did not capture the text.
- [Run 38961051339](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/38961051339): a separate short direct Electron probe failed at `ELECTRON_BINARY_MISSING` (npm's Electron binary wasn't present at its assumed path). This diagnostic did **not** actually run Electron, so it cannot establish a product runtime defect.
- [Run 38961516574](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/38961516574): unpacked process stderr exposed `TreasuryFlow server exited 1`; server child stderr was suppressed by default. Introduced synthetic-VM-only, bounded redacted child error reporting without changing ordinary production stderr policy.
- [Run 38962167129](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/38962167129): child error was `Cannot find module 'next'` from `resources/standalone/server.js`. The build had omitted a required runtime module.
- [Run 38962815533](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/38962815533): `prepare-standalone.mjs` bundled lockfile-installed Next/React dependencies, but `electron-builder` still omitted the `node_modules` directory inside an `extraResources` root. Corrected `package.json` to explicitly copy `.next/standalone/node_modules` into `standalone/node_modules`, and added a packaged-file presence check prior to runtime.
- [Run 38963333150](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/38963333150): independently verified **PASS** for Next build, Node tests, SQL browser UI HTTP smoke, real unpacked Electron process and local HTTP readiness, portable EXE build and **actual portable launch + local readiness/UI**. The NSIS stage built an installer under the portable filename instead of the separate expected Setup name; `NSIS_SETUP_EXE_MISSING` failed. NSIS installation/CDP GUI were **not executed**.
- NSIS packaging now uses the target-specific `build.nsis.artifactName` in `package.json` so Setup and Portable have different names, with an additional hash comparison gate in CI. No update to production data, banking LIVE, main branch application files, or public Releases was made.
- **Active run at the time of this note**: [38965182060](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/38965182060) at source SHA `0b8e85fb3765fce84e407e0e9c59f70ad901fd8a` is the attempt to validate separate NSIS + portable artifacts, silent installation and installed Electron GUI. **No final acceptance is claimed pending actual run results.** Temporary push trigger was removed again at `4bb5833645527c27ceacd24ae9e680413ed266cf`.
- All Windows evidence refers to the **repository's 0.1.0 branch build**, not user V5/1.0.1, proprietary Mayan activation, authentic bank outputs, or financial runtime parity.
