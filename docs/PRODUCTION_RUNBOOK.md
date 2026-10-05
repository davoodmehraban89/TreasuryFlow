# Production Runbook

## Release
1. Require Phase 5 gate PASS and zero unresolved critical defects.
2. Inject secrets only from the runtime secret store; keep BANK_LIVE_MODE=false unless separately authorized.
3. Create and verify a restore point before deployment.
4. Deploy an immutable build artifact and verify application health before traffic cutover.

## Rollback and recovery
Rollback to the last known-good immutable artifact. Data restoration may use only the latest verified restore point strictly before the incident. Never restore an unverified backup.

## Recovery objectives
Target RPO: 15 minutes after persistent storage exists. Target RTO: 60 minutes. These are readiness targets, not measured production guarantees until real infrastructure is deployed and tested.

## Live banking prohibition
Live bank credentials, endpoints, certificates and real-transfer activation are outside this release gate and require explicit authorization plus bank-specific security review.
