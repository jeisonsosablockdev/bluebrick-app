---
type: Feature Spec
title: Fix Shared Db Migration Enforcement BRI- 156
description: Fix Shared Db Migration Enforcement BRI- 156 - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/bri-156/fix-shared-db-migration-enforcement-bri-156.md
---

# Fix Shared DB Migration Enforcement (`BRI-156`)

## Summary

- Added a real DB migration gate to `npm run validate` through `validate:db`.
- Made the canonical local dev flow auto-apply tracked migrations before `npm run dev` / `npm run dev:turbo` when `DATABASE_URL` is configured.
- Added a runtime guard for DB-backed code in non-production environments so pending tracked migrations fail loudly instead of silently running against stale schema.
- Hardened PR CI to run `npm run validate` with a clean Postgres service and a real `DATABASE_URL`.

## Why

We repeatedly changed the schema or expanded DB-backed flows and then forgot to apply the migration on the active database. The old system relied on human memory and docs, so stale local schema could survive until late validation or production-like testing.

## Evidence

- New scripts:
  - `scripts/db-validate.js`
  - `scripts/db-migrate-if-configured.js`
- Updated migration runner:
  - `scripts/db-migrate.js`
- Runtime guard:
  - `lib/db/migration-guard.ts`
- Coverage:
  - `tests/lib/db-migrate-script.test.ts`
  - `tests/lib/db-migration-guard.test.ts`

## Operational Result

- If a developer has `DATABASE_URL` configured, the default dev startup applies tracked migrations before the app starts.
- If DB-backed code runs in development or CI with pending tracked migrations, it fails with an explicit `npm run db:migrate` instruction.
- PR validation now exercises migration application on clean Postgres instead of trusting that developers remembered to run it locally.
