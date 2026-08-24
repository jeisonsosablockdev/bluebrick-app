---
type: ADR
title: Session Management Model
description: Session tokens, cookie security attributes, role verification, and expiration lifecycle.
tags: [auth, session, security]
timestamp: 2026-08-23T00:00:00Z
resource: local
---

# Session Management Model

## Scope
- Session token storage, lifecycle states, expiration rules, and invalidation mechanisms.

## Session Invariants
- Cookies must specify `httpOnly: true`, `secure: true`, and `sameSite: "lax"`.
- Role verification must occur server-side with zero reliance on client-provided claims.
