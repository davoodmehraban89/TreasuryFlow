# V7 foundation production HTTP fail-closed security evidence

Scope: **source-control foundation guard only**, not a final V7 release or a live-banking authorization.

## Changes
- New `src/proxy.ts` enforces HTTP 403 for operational routes in unprovisioned production, before the application can read accounts or payment data.
- Public `/login` and `/api/ready` are allowed, with explicit readiness still returning not-ready when required configuration is missing.
- Requests with `BANK_ADAPTER_MODE=live` are denied at the ingress guard independently of desktop-local configuration. It does not authorize live transfers.
- Static assets are exempted through narrowly scoped paths; lookalike operational paths do not bypass the gate.
- Unauthorized responses prevent caching, MIME sniffing and framing.
- All changes stay on `dev/v7-production-failclosed-20261021`. Public `main` is unchanged.

## Evidence
- [Initial full Linux branch regression](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/39548584517): unit, typecheck, lint, Next build, production smoke and real HTTP unauthorized operational routes **PASS**.
- [Separate functional, security and edge-case CI jobs](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/39548945412): 3 separate hosted runner jobs **PASS**. Security job rejected 39 forged identity/write attempts. Edge job covered 10 unusual path/readiness conditions.
- [Second full three-perspective regression after additional live-bank fail-closed guard](https://github.com/davoodmehraban89/TreasuryFlow/actions/runs/39549202687): functional, security and edge cases **PASS** independently.

These are three independent **CI test jobs**, not three independent AI reviewing agents. Full V7 functionality, external identity provisioning, finance data migrations, customer Mayan mapping, approved banking UAT and final release authorization are still outside these proofs. No real accounts, live transfers, secrets or production deployment were used.
