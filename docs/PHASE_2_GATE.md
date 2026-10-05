# Phase 2 Gate — Treasury Core

- [x] Tenant-scoped users/roles, bank accounts and beneficiaries domain model
- [x] Iranian IBAN validation inherited and enforced for bank master data
- [x] Manual/file CSV payment intake with atomic validation
- [x] Whitelist and transaction/daily limit policy
- [x] Maker-checker separation and version-bound approval
- [x] Operational queue model and simulated settlement without live bank
- [x] Tamper-evident hash-chained audit ledger
- [x] Persian-first RTL Treasury Core shell
- [x] Strict typecheck, domain tests, source lint and production build
- [x] GitHub Actions CI workflow

**Acceptance scenario:** A maker can create and submit a tenant-scoped payment to a whitelisted beneficiary within limits; the maker cannot self-approve; a distinct checker can approve; the payment can enter the operational queue and reach simulated SETTLED without any live-bank side effect. Material edit increments version and invalidates approval.

**Residual scope:** Persistence database/RLS, production identity provider and real bank adapters are intentionally not claimed in Phase 2; banking and reconciliation are Phase 3 scope.
