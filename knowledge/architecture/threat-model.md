---
type: ADR
title: Threat Model and Security Mitigations
description: Threat analysis, attack vectors, trust boundaries, and defensive mitigations.
tags: [security, threat-model, mitigations]
timestamp: 2026-08-23T00:00:00Z
resource: local
---

# Threat Model and Security Mitigations

## Threat Matrix
| Threat | Vector | Severity | Mitigation |
| --- | --- | --- | --- |
| Replay Attack | Re-submitting signed message | High | Nonce uniqueness & 120s TTL |
| Unauthorized Mutation | Tampering with client payload | High | Server-side validation with Zod/Valibot |
| RPC Exhaustion | Excessive client requests | Medium | Rate limiting & RPC connection pooling |
