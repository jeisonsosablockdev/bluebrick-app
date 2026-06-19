---
type: Procedure
title: Health Checks and Monitoring
description: Standard health checks and monitoring procedures for BRIDS platform
tags: [operations, procedure, health-checks, monitoring, observability, devnet, vercel]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/app/api/health
---

# Health Checks and Monitoring

## Endpoints

### Public Health
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/health` | GET | None | Basic liveness/readiness |
| `/api/health/db` | GET | None | Database connectivity |
| `/api/health/rpc` | GET | None | Solana RPC connectivity |

### Admin Health
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/health` | GET | admin | Full system health |
| `/api/admin/monitoring/analytics` | GET | admin | Analytics pipeline health |
| `/api/admin/monitoring/logs` | GET | admin | Log aggregation health |
| `/api/admin/notifications/health` | GET | admin | Push notification health |

## Standard Checks

### 1. Application Health (`/api/health`)
```bash
curl https://brids.app/api/health
# Expected: { "status": "ok", "timestamp": "ISO8601" }
```

### 2. Database Connectivity
```bash
curl https://brids.app/api/health/db
# Expected: { "status": "ok", "latency_ms": <N>, "pool": { "total": 10, "idle": 8 } }
```

Checks:
- Pool acquisition < 100ms
- Simple query (`SELECT 1`) succeeds
- Migration status: all applied

### 3. Solana RPC Connectivity
```bash
curl https://brids.app/api/health/rpc
# Expected: { "status": "ok", "rpc": "devnet", "slot": <N>, "latency_ms": <N> }
```

Checks:
- `getSlot` succeeds < 500ms
- Slot advancing (not stuck)
- Helius/Alchemy fallback works

### 4. Admin Health Dashboard
```bash
curl -H "Cookie: siws_session=..." https://brids.app/api/admin/health
```

Returns:
```json
{
  "status": "healthy|degraded|down",
  "checks": {
    "database": { "status": "ok", "latency_ms": 5 },
    "rpc": { "status": "ok", "latency_ms": 120 },
    "vercel": { "status": "ok", "deployment": "ready" },
    "webhooks": { "helius": "ok", "stripe": "ok" },
    "migrations": { "status": "current", "pending": 0 }
  }
}
```

## Monitoring Alerts

### Critical Alerts (Page Immediately)
| Alert | Condition | Runbook |
|-------|-----------|---------|
| App Down | `/api/health` 5xx > 1 min | [App Down](../runbooks/incident-app-down.md) |
| DB Unreachable | `/api/health/db` fails > 2 min | [DB Migration Rollback](../runbooks/db-migration-rollback.md) |
| RPC Stuck | Slot not advancing > 5 min | [Solana Deployment](../runbooks/incident-solana-deployment.md) |
| Migration Failed | CI `db:migrate` fails | [DB Migration Rollback](../runbooks/db-migration-rollback.md) |

### Warning Alerts (Notify Within 15 min)
| Alert | Condition |
|-------|-----------|
| High Latency | P99 > 2s for 5 min |
| Error Rate | 5xx > 1% for 5 min |
| Sync Degraded | `sync_status = degraded` > 1 hr |
| Webhook Failures | >5% failure rate 10 min |
| Pool Exhaustion | DB pool idle < 2 for 5 min |

### Info Alerts (Daily Digest)
- Deployment count
- Purchase volume
- Stake/unstake count
- New user registrations
- Error rate trends

## Vercel Monitoring
- **Deployments**: Vercel Dashboard → Project → Deployments
- **Functions**: Logs, duration, errors
- **Edge**: Cold starts, latency
- **Analytics**: Web Vitals (LCP, FID, CLS)

## Solana Devnet Monitoring
- **Slot Height**: Should advance ~400ms/slot
- **RPC Latency**: < 500ms for `getSlot`
- **Program Logs**: Helius enhanced API for program logs
- **DAS Indexing**: `getAssetsByGroup` latency < 2s

## Log Aggregation
- **Application**: Vercel function logs + structured JSON
- **Database**: `pg_stat_activity`, slow query log
- **Webhooks**: Ingestion success/failure rates
- **Purchase Flow**: `purchase_flow_events` per `flow_id`

## Dashboards
- **Grafana** (if configured): System metrics, business metrics
- **Vercel Analytics**: Web Vitals, function performance
- **Custom**: Admin dashboard `/admin/monitoring`

## On-Call Procedures
1. Receive alert → Acknowledge within 5 min
2. Run relevant health checks
3. Follow runbook for alert type
4. Update incident status
5. Post-incident review within 24h

## Related
- [Incident Runbooks](../runbooks/)
- [Admin Monitoring API](../api/endpoints/admin-monitoring.md)
- [Observability](../architecture/observability.md)