---
type: Spec
title: RBAC Model
description: Role-based access control for BRIDS — user/admin roles, SIWS session requirement, ADMIN_WALLETS allowlist, route enforcement matrix, and security notes
tags: [architecture, rbac, security, auth, siws, admin, authorization, roles]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/rbac.md
---

# RBAC Model

## Scope
- Role model: `user` and `admin`.
- Authentication prerequisite: SIWS server session is required to be considered a user.
- Admin source of truth: `ADMIN_WALLETS` environment variable.

## Role Calculation
1. Validate SIWS session on server and resolve wallet public key.
2. Parse `ADMIN_WALLETS` as comma-separated base58 addresses.
3. Compare wallet key with exact string match (base58).
4. Assign role:
   - Match -> `admin`
   - No match -> `user`

If SIWS session is not valid, request is unauthenticated and no role is assigned.

## Allowlist Format
- Environment variable: `ADMIN_WALLETS`
- Example:
  - `ADMIN_WALLETS=9h2...abc,7Xy...def`
- Parsing rules:
  - split by comma
  - trim whitespace
  - drop empty entries

## Route Enforcement
- Admin route prefix: `/admin/**`
- Proxy gate:
  - unauthenticated -> redirect `/403`
  - authenticated but non-admin -> redirect `/403`
  - authenticated admin -> allow
- Defense in depth:
  - Admin pages re-check role server-side
  - Admin API handlers under `/api/admin/*` re-check role and return `403` JSON

## Route Matrix
| Route | Requirement | Enforcement |
| --- | --- | --- |
| `/protected` | Authenticated SIWS session | Server component redirects to `/` without session |
| `/api/protected/me` | Authenticated SIWS session | Returns `401` when unauthenticated |
| `/admin/**` | `admin` role | Proxy redirect to `/403` + page-level role check |
| `/api/admin/*` | `admin` role | Handler-level role check with `403` JSON |

## Security Notes
- Client state is not trusted for authorization.
- Role is computed server-side per request.
- UI role indicators and menus are presentation only.
- Proxy is not sufficient by itself; handlers/pages must enforce role checks directly.

Last Updated: 2026-03-03 UTC
