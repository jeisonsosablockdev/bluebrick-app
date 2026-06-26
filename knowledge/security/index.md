---
type: Security Index
title: Security
description: Security audits, threat models, vulnerability reports, and compliance documentation
tags: [security, audit, threat-model, vulnerability, compliance, owasp]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/knowledge/security
---

# Security

Security audits, threat models, vulnerability reports, and compliance documentation.

## Threat Models

* [Mint Orchestrator Threat Model](threat-models/mint-orchestrator.md) — P0-06 mint orchestration attack vectors and mitigations
* [Marketplace Threat Model](threat-models/marketplace.md) — BRI-164 marketplace threat model and OWASP mapping

## Audits

* [BRI-164 Marketplace Security Audit Plan](audits/bri-164-marketplace-security-audit-plan.md) — Comprehensive marketplace security audit with OWASP mapping and remediation plan
* [Security Quality Policy](../governance/security-quality-policy.md) — Mandatory security audit pack, test gates, and pre-mainnet checklist

## Vulnerability Reports

* [SIWS Login Inconsistency](vulnerabilities/siws-login-inconsistency.md) — BRI-66 sign-in race condition fix
* [Stake Unstake Release Visibility](vulnerabilities/stake-unstake-release-visibility.md) — BRI-170 stake visibility fix
* [Marketplace Release Placeholder Graphs](vulnerabilities/marketplace-placeholder-graphs.md) — BRI-153 development-only module hiding
* [Shared PR Policy Noise](vulnerabilities/shared-pr-policy-noise.md) — PR governance noise reduction

## Compliance

* [Security Quality Policy](../governance/security-quality-policy.md) — Security audit pack, test gates, database schema gate, pre-mainnet checklist
* [PCI Compliance Notes](compliance/pci-compliance.md) — Payment card industry compliance notes
* [Data Handling and Privacy](compliance/data-handling-privacy.md) — GDPR/privacy compliance
* [Smart Contract Security Best Practices](compliance/smart-contract-security.md) — Solana program security patterns

## Security Testing

* [Security Headers Test](tests/lib/security-headers.test.ts) — CSP, COOP, CORP, frame-ancestors, nosniff validation
* [Purchase API Security Tests](tests/api/purchase-*.test.ts) — Challenge, prepare, submit security validation
* [Admin Marketplace Entry Tests](tests/api/admin-marketplace-entries-route.test.ts) — Admin authorization validation

## Security Configuration

* [Security Headers](../lib/security/headers.ts) — CSP, COOP, CORP, Permissions-Policy, referrer policy
* [SIWS Implementation](../lib/siws.ts) — Nonce, signature verification, session management
* [Purchase Anti-Bot](../lib/purchase-anti-bot.ts) — Challenge, rate limiting, replay protection
* [Purchase Rate Limit](../lib/purchase-rate-limit-repository.ts) — IP/wallet rate limiting