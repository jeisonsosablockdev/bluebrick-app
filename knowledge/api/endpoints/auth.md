---
type: API Reference
title: Auth API
description: Authentication endpoints — WorkOS federated entry, SIWS wallet auth, session management, wallet linking
tags: [api, auth, workos, siws, session, wallet, linking, hybrid]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/app/api/auth
---

# Auth API

## Overview
Hybrid authentication: WorkOS AuthKit (account) + Phantom SIWS (wallet).

## Federated Entry (WorkOS)
| Endpoint | Method | Description |
| --- | --- | --- |
| `/sign-in` | GET | Start WorkOS AuthKit redirect |
| `/callback` | GET | Complete WorkOS callback, create/resume BRIDS account |
| `/sign-out` | GET | Clear WorkOS session |

## SIWS Wallet Auth
| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/auth/nonce` | GET | Issue nonce (5-min TTL) + signed `siws_nonce` cookie |
| `/api/auth/verify` | POST | Verify SIWS signature, set `siws_session`, clear nonce |
| `/api/auth/logout` | POST | Revoke `siws_session` |

## Session Introspection
| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/auth/me` | GET | Hybrid auth payload: account/wallet state, `authMethod`, `pubkey`, `role` |

## Wallet Linking (Federated → Wallet)
| Endpoint | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/auth/link/wallet/nonce` | GET | WorkOS | Issue wallet-link nonce + server context |
| `/api/auth/link/wallet/verify` | POST | WorkOS | Verify SIWS against link context, link wallet |

## Federated Linking (Wallet → Federated)
| Endpoint | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/auth/link/federated/start` | GET | SIWS | Create pending federated-link context |
| `/auth/link/federated/complete` | GET | WorkOS | Complete federated link |

## Referral
| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/referrals/preview` | GET | Truncated referrer preview for invitee UX |

## Cookies
| Cookie | Purpose | TTL |
| --- | --- | --- |
| `workos_session` | WorkOS AuthKit session | AuthKit default |
| `siws_nonce` | SIWS replay protection | 5 min |
| `siws_session` | BRIDS wallet session | 24 hours |

## Role Resolution
`role` = `admin` if `pubkey` in `ADMIN_WALLETS`, else `user`.

## Protected Route Access
| Route | Required |
| --- | --- |
| `/protected` | WorkOS **or** SIWS |
| `/protected/stake`, `/protected/referrals` | SIWS only |
| `/admin/**` | SIWS + `admin` role |

## Related
- [Session Model](../architecture/session-model.md) — full session lifecycle
- [Auth Flow ADR](../architecture/auth-flow.md) — complete architecture