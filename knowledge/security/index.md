---
type: ADR
title: Security Quality & Compliance Index
description: Security architecture, threat models, audit checklists, vulnerability tracking, and compliance standards.
tags: [security, compliance, threat-models, audits]
timestamp: 2026-08-23T00:00:00Z
resource: local
---

# Security & Compliance

Open Knowledge Format catalog for security governance, threat modeling, and compliance protocols.

## Core Security Invariants
- **Signer Verification**: Every privileged instruction or API route must verify authorized cryptographic signers.
- **Input Sanitization**: All external inputs must be validated with Zod/Valibot schemas before domain processing.
- **Strict Network Boundary**: Devnet only; no testnet or unverified RPC cluster routing.

## Subdirectories
- [Threat Models](./threat-models/): Systematic threat analysis and defensive mitigations.
- [Audits](./audits/): Security review logs, static analysis findings, and code hardening reports.
- [Compliance](./compliance/): Regulatory standards and operational checklists.
- [Vulnerabilities](./vulnerabilities/): Tracking and remediation of security advisories.
