# Production Runbook

## Release
1. Require the Phase 5 release gate to be READY.
2. Inject secrets from the target platform secret store; do not copy secrets into files or logs.
3. Keep `BANK_ADAPTER_MODE=disabled` unless live-bank activation has separate explicit authorization.
4. Deploy the immutable release artifact and verify application health before routing traffic.

## Rollback
Rollback only to a previously verified immutable release. If a data restore is required, select the latest verified restore point before the incident, preserve incident evidence, restore in an isolated environment first, then verify integrity before cutover.

## Backup / DR objectives
Target policy for production planning: RPO <= 15 minutes and RTO <= 60 minutes. These are readiness objectives, not evidence that a production database currently exists or has been restored. A real deployment must prove them with scheduled restore drills.

## Incident handling
Emergency Stop blocks new dispatch. UNKNOWN transfer outcomes go to manual review and are never automatically retried. Preserve audit history and avoid logging raw IBAN/account/card values or credentials.

## Live-bank prohibition
This release package does not authorize or claim a live bank connection, production bank credentials, or real transfer execution. Activation is a separate controlled change.
