---
type: Runbook
title: Incident Response - Data Freshness Alert
description: Runbook for responding to data freshness alerts on the orders pipeline
tags: [operations, runbook, incident, data-freshness, pipeline, monitoring]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/docs/architecture
---

# Incident Response: Data Freshness Alert

## Trigger
A freshness alert fires when `orders` lags more than 30 minutes behind its expected SLA.

## Detection
- Alert source: Monitoring system (e.g., Datadog, custom cron)
- Metric: `orders_freshness_minutes` > 30
- Related table: `orders` (last `placed_at` vs `now()`)

## Triage Steps

### 1. Check Ingestion Job Dashboard
- URL: https://example.com/dash (replace with actual)
- Look for: Failed runs, backlog, error rates
- Check: `ingestion_job_status` table for recent failures

### 2. Verify Pipeline Components
| Component | Check |
|-----------|-------|
| Source API | Responding? Rate limited? |
| ETL Worker | Running? Logs show errors? |
| Database | Write latency? Locks? |
| Message Queue | Backlog? Dead letter queue? |

### 3. Check Recent Deployments
- Any schema changes to `orders` table?
- Any ETL code changes in last 24h?
- Rollback if correlated

## Resolution

### If Ingestion Job Failed
1. Check logs for error details
2. Fix root cause (data issue, API change, timeout)
3. Re-run failed batch manually
4. Verify catch-up completes

### If Source API Issues
1. Contact upstream team
2. Implement backoff/retry if not present
3. Alert on-call for upstream dependency

### If Database Performance
1. Check for long-running queries
2. Check index usage on `orders.placed_at`
3. Consider partition maintenance

## Escalation
- **15 min**: No progress → Page on-call engineer
- **30 min**: Still unresolved → Engage team lead
- **60 min**: Business impact → Notify stakeholders

## Post-Incident
- Document root cause in incident tracker
- Add preventive monitoring if missing
- Update runbook if gaps found

## Related
- [Orders Table Schema](../database/models/orders.md)
- [Ingestion Job Monitoring](../architecture/observability.md)