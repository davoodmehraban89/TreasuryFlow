# ADR-0001 — Application Foundation

- Status: Accepted for Phase 1
- Date: 2026-10-05

## Decision
Use a TypeScript-first modular monolith for the initial TreasuryFlow product, with Next.js 16 App Router for the web/application boundary and PostgreSQL as the transactional system of record. Keep financial domain rules in server-only modules independent of UI components. External banks, accounting sources, messaging and other providers are accessed only through typed adapter interfaces.

## Rationale
TreasuryFlow needs strong transactional consistency, explicit authorization and auditable domain behavior more than it needs early microservice distribution. A modular monolith minimizes distributed failure modes while preserving clear boundaries that can be extracted later if scale or regulation requires it.

Current Next.js 16 security guidance requires authorization to be re-verified in Server Actions/Route Handlers and recommends server-only data-access boundaries. TreasuryFlow adopts that rule as a minimum; UI visibility never grants authority.

## Initial technical baseline
- Next.js 16 App Router
- TypeScript strict mode
- PostgreSQL
- Schema/migration layer selected during the executable scaffold task; it must support versioned migrations, transactions and constraints.
- Vitest for fast domain/unit tests unless scaffold verification identifies an incompatibility.
- Playwright for critical E2E flows once the shell exists.
- Container-ready deployment; Railway is staging-first, not a production lock-in.

## Boundaries
- `domain`: financial invariants and state transitions; no framework imports.
- `application`: use cases, authorization orchestration and transaction boundaries.
- `infrastructure`: persistence, queues, bank/accounting adapters and telemetry.
- `web`: RTL Persian-first presentation and HTTP/Server Action boundaries.

## Security consequences
Every mutation is treated as an independent entry point and must authenticate, authorize and validate the target resource on the server. Maker-checker and payment-state rules live below the UI boundary.

## Deferred
Authentication provider, ORM/query builder, queue implementation and final production hosting are deliberately not locked until the Phase 1 scaffold spike proves compatibility and portability.
