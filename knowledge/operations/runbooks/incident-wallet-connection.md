---
type: Runbook
title: Incident Response - Wallet Connection Issues
description: Runbook for diagnosing and resolving Phantom wallet connection problems
tags: [operations, runbook, incident, wallet, phantom, siws, auth]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/app/api/auth
---

# Incident Response: Wallet Connection Issues

## Trigger
- User reports "Cannot connect wallet"
- SIWS verification fails repeatedly
- Wallet modal shows errors
- `GET /api/auth/me` returns unauthenticated

## Triage Steps

### 1. Check User Context
- Browser: Chrome/Firefox/Safari? Mobile/Desktop?
- Phantom installed? Version?
- Multiple tabs open?

### 2. Verify SIWS Flow
| Step | Expected | Debug |
|------|----------|-------|
| `GET /api/auth/nonce` | 200 + nonce cookie | Check `siws_nonce` cookie set |
| Wallet signs message | Phantom popup opens | Check console for `signMessage` |
| `POST /api/auth/verify` | 200 + `siws_session` cookie | Check response + cookies |

### 3. Common Issues
| Symptom | Cause | Fix |
|---------|-------|-----|
| "Nonce expired" | >5 min between nonce/verify | User must retry |
| "Signature invalid" | Wrong message format | Check SIWS message building |
| "Wallet already connected" | Phantom state stale | Disconnect in Phantom, retry |
| `403` on `/admin/**` | Wallet not in `ADMIN_WALLETS` | Add to env var |

### 4. Phantom-Specific
- **AutoConnect**: Only enabled for `/admin/assets/new`
- **Mobile deep link**: Must preserve `?ref=` param
- **Disconnect**: Clears `siws_session` via `POST /api/auth/logout`

### 5. Server-Side Checks
```bash
# Verify nonce store (in-memory)
curl -H "Cookie: siws_nonce=..." /api/auth/nonce

# Check session validation
curl -H "Cookie: siws_session=..." /api/auth/me
```

## Resolution
1. Clear cookies (`siws_nonce`, `siws_session`, `workos_session`)
2. Disconnect in Phantom extension
3. Hard refresh (Cmd+Shift+R)
4. Retry connection flow

## Escalation
- **5 min**: Single user → Guide through steps
- **15 min**: Multiple users → Check for SIWS code deploy
- **30 min**: Widespread → Rollback auth changes

## Related
- [Auth Flow](../architecture/auth-flow.md)
- [Session Model](../architecture/session-model.md)
- [SIWS Implementation](../lib/siws.ts)