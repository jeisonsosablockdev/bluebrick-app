---
type: ADR
title: Authority and Access Control Model
description: System authority boundaries, multisig administration, signer roles, and revocation policies.
tags: [architecture, authority, access-control, security]
timestamp: 2026-08-23T00:00:00Z
resource: local
---

# Authority and Access Control Model

## Scope
- Administrative authorities, update permissions, signer hierarchies, and revocation protocols.

## Roles & Permissions Matrix
| Role | Permissions | Constraints |
| --- | --- | --- |
| `Admin` | Full administrative configuration | Requires authorized signer whitelist |
| `User` | Personal asset interaction & transacting | Self-custodial signer only |
| `Service` | Backend co-signing & orchestration | Restricted scope with rate-limiting |
