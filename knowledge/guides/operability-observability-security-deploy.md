---
type: Guide
title: Operability Observability Security Deploy
description: Operability Observability Security Deploy - migrated from docs/
tags: [guides]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/guides/operability-observability-security-deploy.md
---

# Operability Baseline (Story 010-10)

## Objective
Provide a minimum production-ready baseline for observability, security hardening, performance budgets, and deployment strategy in EPIC-010.

## Scope (R17-R23)
- `R17`: Privacy-friendly analytics and admin-visible observability.
- `R18`: Technical monitoring and quality gates in CI.
- `R19`: Performance baseline with explicit budgets.
- `R20`: Security headers, gradual CSP, sanitization, and API boundary model.
- `R21`: Staging/preview/production deployment strategy.
- `R22`: Future semantic/embedding extension contract (disabled runtime).
- `R23`: Operational documentation for maintainers.

## Analytics Baseline (Privacy-Friendly)
Client events are captured without wallet/user identifiers:
- `page_view`
- `route_change`
- `scroll_depth`
- `cta_click`
- `client_error`

Ingress:
- `POST /api/analytics/events`

Admin visibility:
- `GET /api/admin/monitoring/analytics?minutes=<n>&limit=<n>`

Rules:
- No PII fields.
- Paths and labels are sanitized.
- Data is operational telemetry only.

## Health, Logging, and Monitoring
Public health endpoint:
- `GET /api/health`

Behavior:
- returns `200` when required env baseline is present;
- returns `503` with `degraded` status when required runtime config is missing.

Admin logs endpoint:
- `GET /api/admin/monitoring/logs?limit=<n>`

Log model:
- Structured in-memory logbook (`info|warn|error`) for runtime diagnostics.
- Sanitized context values.

## Performance Baseline
Canonical budgets are defined in `lib/observability/performance.ts`:
- LCP: `<= 2500ms`
- CLS: `<= 0.1`
- INP: `<= 200ms`
- Build budget: `<= 300s`

Runtime metrics exposed via `/api/health`:
- RSS
- heap used
- heap total

Caching baseline:
- Public content machine endpoints keep `s-maxage=300` and `stale-while-revalidate=600`.

## Security Baseline
Security headers are applied globally through `next.config.ts`:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restricted
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`
- CSP (`Content-Security-Policy` or `Content-Security-Policy-Report-Only`)

CSP rollout model:
- Controlled via env flags:
  - `CSP_REPORT_ONLY=true` (gradual mode)
  - `CSP_REPORT_URI=<url>` (optional)

Sanitization baseline:
- Shared sanitizer module for text/path/context (`lib/security/sanitize.ts`).
- Analytics and operability routes sanitize all incoming fields.

API boundary model:
- Public APIs: content, feeds, health, analytics ingestion.
- Internal/admin APIs: explicit auth/session checks or internal token checks.
- No trust in client-provided authority state.

## Deployment Strategy (Vercel)
### Environments
- Preview: every PR.
- Staging: `develop` integration validation.
- Production: `main` release only (through release PR from `develop`).

### Domain Strategy
- Production canonical host via `NEXT_PUBLIC_SITE_URL`.
- Preview hosts are non-canonical; canonical metadata always points to production origin.

### Required Environment Variables (baseline)
- `NEXT_PUBLIC_SITE_URL`
- `SOLANA_RPC_URL` (devnet policy in this repository)
- `ADMIN_WALLETS`
- `SIWS_DOMAIN`
- `SIWS_ORIGIN`

Optional hardening envs:
- `CSP_REPORT_ONLY`
- `CSP_REPORT_URI`
- `HELIUS_WEBHOOK_SECRET`
- `COMPLIANCE_INTERNAL_TOKEN`

## CI Gates
`npm run validate` now includes `validate:operability`:
- `tests/lib/security-headers.test.ts`
- `tests/lib/observability-store.test.ts`
- `tests/lib/semantic-extension-contract.test.ts`
- `tests/api/analytics-events-route.test.ts`
- `tests/api/health-route.test.ts`
- `tests/api/admin-monitoring-analytics-route.test.ts`
- `tests/api/admin-monitoring-logs-route.test.ts`

## Future Semantic Extension (R22)
Contract is defined but runtime is disabled:
- `lib/ai/semantic-extension.ts`
- `getSemanticExtensionStatus().enabled === false`

Activation is deferred to a future epic once provider, vector index, retriever, and indexer are approved.

## Editorial Scope Clarification
EPIC-010 remains `content-as-code` only.
No non-code editor/backoffice UI is included in this phase.
