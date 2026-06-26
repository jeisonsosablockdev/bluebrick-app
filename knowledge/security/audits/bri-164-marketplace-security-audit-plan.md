---
type: Audit
title: BRI-164 Marketplace Security Audit Plan
description: Comprehensive marketplace security audit with OWASP mapping, findings, and remediation plan (S44-S60)
tags: [security, audit, marketplace, bri-164, owasp, csp, xss, dependency, rate-limiting]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s44-security-audit-plan.md
---

# BRI-164 Marketplace Security Audit Plan

## Status
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s44-security-audit-plan`
- Parent branch: `feature/app-create-a-marketplace-3d-visual-bri-164-integration`
- Date: 2026-05-30
- Scope: Documentation-only security audit and remediation plan
- Runtime changes: None

## Audit Standard Applied
Follows the local `security-audit` workflow:
- Reconnaissance and attack-surface mapping
- Vulnerability scanning
- Web application testing review
- API security testing review
- Hardening review
- Reporting with risk levels and remediation slices

No external production penetration test executed (no deployed target). Local code, dependency, route, and configuration review.

## Executive Summary
The marketplace implementation has good baseline controls:
- Admin marketplace entry creation server-authorized through `getRequestRole`
- Purchase challenge, prepare, submit require authenticated wallet sessions
- Purchase challenge signing binds wallet, property, candy machine, quantity, nonce, expiry
- Purchase prepare consumes challenges and validates replay-sensitive context
- Submit validates payer ownership and prepared transaction message matching
- Marketplace SQL writes/reads use parameterized queries
- Public map pins validate latitude/longitude ranges
- Mapbox loads behind deferred client boundary with fallback

No P0 active compromise path found. Found release-blocking dependency risk and several P2 hardening gaps.

## Scope
**Audited:**
- `/marketplace`, `/marketplace/[id]`, `/properties`, `/properties/[id]`
- `/api/admin/marketplace/entries`, `/api/purchase/quote`, `/challenge`, `/prepare`, `/submit`
- `/api/checkout/cart`, `/order`
- Mapbox client shell, markers, fallback
- Google Maps card, document and blockchain links
- Marketplace persistence repositories and row mappers
- Security headers, Next.js config, package dependency audit, secret-pattern scan

**Out of Scope:**
- External infrastructure scanning
- Production WAF/bot policy verification
- Cloud IAM review
- Full Solana program Rust audit
- Real devnet transaction execution

## Evidence Collected
- `npm audit --omit=dev --json`: 33 production findings (3 high, 30 moderate)
- `npm run validate:operability`: passed (7 files, 15 tests)
- Targeted security-relevant unit/API tests: passed (7 files, 30 tests)
- Secret-pattern scan: no production secrets outside `.env.example`/test fixtures
- Security-relevant tests: marketplace, admin, purchase, security headers, map pins

## Findings Summary

### P1 - Dependency Advisories (Release-Blocking)
| ID | Finding | Evidence | Solution |
| --- | --- | --- | --- |
| P1-01 | Next.js high advisories (DoS, SSRF, cache poisoning, WebSocket SSRF, Image Optimization DoS) | `package.json:76` `next` ^16.2.4 | Upgrade `next` to patched range; full validate/build/browser proof |
| P1-02 | `xlsx` high advisories (prototype pollution, ReDoS, no audit fix) | `package.json:87` `xlsx` ^0.18.5 | Replace `xlsx` or isolate parser with strict limits |

### P2 - Application Security Gaps
| ID | Finding | Evidence | Solution |
| --- | --- | --- | --- |
| P2-01 | Public property detail exposes raw 500 messages | `app/properties/[id]/route.ts:31-32` | TDD: generic 500 + sanitized log |
| P2-02 | Purchase API unexpected errors expose raw messages | `app/api/purchase/*` | TDD: generic 500 + preserve `PurchaseFlowError` |
| P2-03 | Document URLs rendered without URL policy | Admin route + `PropertyDetailDocumentsBlockchainCards.tsx` | Shared URL policy, allowlist schemes/hosts |
| P2-04 | Google Maps persisted URL trusted as public link | `admin-collection-location-view.ts`, `PropertyDetailGoogleMapsCard.tsx` | Validate scheme/host, rebuild from place ID |
| P2-05 | CSP too permissive (`unsafe-inline`, broad `img-src`/`connect-src`) | `lib/security/headers.ts` | Report-only stricter CSP, explicit provider allowlists |
| P2-06 | Public quote/detail fan out to Solana RPC without rate limits | `quote`, `detail` endpoints | Add public IP budget for quote/detail sync |
| P2-07 | Detail page hard-fails on RPC sync failure | `getMarketplacePropertyDetailOrThrowRpc` | Degrade to persisted data with `rpc_error` banner |
| P2-08 | Admin marketplace payload lacks strict size/schema limits | `app/api/admin/marketplace/entries/route.ts` | Zod schema with explicit max lengths |
| P2-09 | Submit holds DB lock while sending network transaction | `lib/purchase-service.ts:1113-1146` | Narrow lock: claim in short TX, send, then persist |

### P3 - Hardening & Hygiene
| ID | Finding | Solution |
| --- | --- | --- |
| P3-01 | Health endpoint degraded when `SITE_URL` unset | Set `SITE_URL` in target environment |
| P3-02 | Rate-limit event table no retention policy | Add retention delete job + document window |
| P3-03 | Google Maps iframe referrer policy loose | Prefer `strict-origin-when-cross-origin` or `no-referrer` |
| P3-04 | Public marketplace reads all records before filtering | Add server-side pagination + DB filters + cap filter input |
| P3-05 | Mapbox public token correct, private tokens must remain secret | Keep private tokens out of repo, domain-restrict public token |

## OWASP Top 10 Mapping
| A01-A10 | Status |
| --- | --- |
| A01 Broken Access Control | Admin/purchase controls good; public URL policy, detail degradation need hardening |
| A02 Cryptographic Failures | No direct crypto bug; SIWS/session server-side |
| A03 Injection | No SQL injection; persisted unsafe URL injection concern |
| A04 Insecure Design | Public RPC fan-out, detail RPC hard-fail = design availability risks |
| A05 Security Misconfiguration | CSP broadness, dependency advisories |
| A06 Vulnerable Components | P1 findings in Next.js, `xlsx` |
| A07 Identification/Auth Failures | No direct auth bypass |
| A08 Software/Data Integrity | Persisted payloads need stricter schema + URL integrity |
| A09 Logging/Monitoring | Raw public errors → sanitized logs + generic responses |
| A10 SSRF | Next.js advisory + broad external providers → dependency patch + origin allowlists |

## Remediation Plan (S44-S60)
Each in dedicated branch, TDD first:

| Slice | Branch | Type | Focus |
| --- | --- | --- | --- |
| S45 | `...-s45-next-security-patch` | dependency/security | Patch Next.js advisories |
| S46 | `...-s46-xlsx-parser-risk` | dependency/security | Replace/isolate `xlsx` |
| S47 | `...-s47-public-detail-safe-errors` | security/fix | Generic 500 for public detail |
| S48 | `...-s48-purchase-safe-errors` | security/fix | Generic 500 for purchase API |
| S49 | `...-s49-marketplace-url-policy` | security/fix | Shared external URL policy |
| S50 | `...-s50-admin-document-url-validation` | security/fix | Admin doc URL validation |
| S51 | `...-s51-detail-document-safe-renderer` | security/fix | Safe document renderer |
| S52 | `...-s52-google-maps-url-hardening` | security/fix | Validate Google Maps URLs |
| S53 | `...-s53-csp-report-only-tightening` | security/hardening | Stricter CSP report-only |
| S54 | `...-s54-public-rate-limit-budget` | security/availability | Quote/detail rate limits |
| S55 | `...-s55-detail-rpc-degradation` | security/availability | Degrade on RPC failure |
| S56 | `...-s56-admin-payload-size-schema` | security/fix | Zod schema with limits |
| S57 | `...-s57-submit-lock-narrowing` | security/availability | Narrow DB lock in submit |
| S58 | `...-s58-read-pagination-filter-caps` | security/availability | DB pagination + filter caps |
| S59 | `...-s59-rate-limit-retention` | security/privacy | Retention delete job |
| S60 | `...-s60-security-verification` | security/audit | Final verification pass |

## Release Recommendation
- P1-01, P1-02: Must resolve or explicit owner waiver
- P2-01 through P2-08: Resolve before broad public traffic
- P2-09: Schedule before high-volume purchase rollout
- P3 items: Accept short-term with explicit owner/date

## Open Decisions
- Approved domains for marketplace document URLs
- Snapshot documents: internal routes or non-clickable metadata
- Google Maps links: rebuild from place ID only?
- CSP rollout mode and provider allowlist owners
- Public quote/detail rate-limit thresholds
- Rate-limit event retention window
- `xlsx` replacement vs time-boxed waiver

## Security Acceptance Criteria
- No high/critical production dependency audit findings (or approved waivers)
- Public unauthenticated APIs never return unexpected internal error messages
- Persisted public links allowlisted by scheme and host
- Detail page degrades on Solana RPC issues instead of breaking
- Quote and detail RPC sync paths have explicit public abuse budgets
- CSP staged toward least-privilege provider allowlists
- Purchase replay, payer ownership, prepared message matching, compliance gating, idempotency tests green
- `npm run validate` passes after all remediation

## Commands Run
- `git status --short --branch`
- `npm audit --omit=dev --json`
- `npm run validate:operability`
- `npm test` (targeted security-relevant tests)
- `rg` route and secret-pattern mapping
- `sed -n`/`nl -ba` over audited files