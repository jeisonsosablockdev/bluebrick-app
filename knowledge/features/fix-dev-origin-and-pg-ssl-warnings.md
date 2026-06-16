---
type: Feature Spec
title: Fix Dev Origin And Pg Ssl Warnings
description: Fix Dev Origin And Pg Ssl Warnings - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/fix-dev-origin-and-pg-ssl-warnings.md
---

# Fix Dev Origin And PG SSL Warnings

## Scope
- Silence the upcoming `pg` SSL semantics warning without weakening transport guarantees.
- Allow local LAN development hosts to fetch Next.js dev resources without manual `allowedDevOrigins` edits on each machine/IP change.

## What Changed
- Normalized `DATABASE_URL` before creating the shared app pool so legacy `sslmode=prefer|require|verify-ca` aliases are rewritten to `sslmode=verify-full` unless `uselibpqcompat=true` is explicitly set.
- Added development-only origin discovery support through `allowedDevOrigins`, including:
  - `localhost`
  - `127.0.0.1`
  - `[::1]`
  - current machine external IPv4 interfaces
  - optional comma-separated `NEXT_DEV_ALLOWED_ORIGINS`

## Behavioral Notes
- This does not downgrade SSL. It keeps the current stronger behavior explicit ahead of `pg v9`.
- Teams using LAN devices or network-host access no longer need to hardcode a transient IP in `next.config.ts`.

## Verification
- Added focused tests for connection-string normalization and dev-origin discovery.
- `npm run validate`
