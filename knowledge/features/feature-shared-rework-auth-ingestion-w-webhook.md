# Problem Spec: Rework Ingestion with Google Drive Webhooks & Resilient Pipeline (BBC-021)

## 1. What Problem Exists

A forensic critique by the Adversarial Systems Auditor identified 10 critical and medium vulnerabilities in the baseline Google Drive Webhook Ingestion proposal (BBC-021), demonstrating that naive serverless webhook patterns risk data corruption, catastrophic database table wiping, and silent synchronization drops:

1. **In-Memory Cooldown Bypassed Across Multi-Container Serverless Instances**:
   Using an in-process volatile variable (`lastSyncTimestamp = 0`) fails in serverless environments (Vercel / AWS Lambda). Incoming webhooks arriving at distinct microVMs or warm containers all read initial zero timestamps, launching concurrent heavy ingestion pipelines that exhaust Neon database connections and saturate Vercel execution quotas.
2. **Trailing-Edge Void (Dropped Deferred Sync)**:
   Returning `{ status: 'cooldown' }` during the 30-minute accumulation window terminates the serverless function immediately without scheduling a deferred background execution. When an operator finishes editing an Excel file at minute 15, subsequent edits are dropped because no serverless timer survives after HTTP completion, leaving the database stale until the next day.
3. **Catastrophic Production Database Table Wiping**:
   `DELETE FROM dashboard_projects WHERE id_inversion != ALL(...)` followed by `DELETE FROM ...` cascades destructively (`ON DELETE CASCADE`) to all foreign key dependencies (`dashboard_investments`, `dashboard_project_phases`, `dashboard_investor_summaries`). If an Excel workbook is corrupted, tab renamed (e.g. `Proyectos ` with trailing space), or the spreadsheet parser encounters an unexpected format returning `[]`, the entire production database is erased in a single transaction.
4. **Heavy Network I/O Inside Open PostgreSQL Transaction Blocks**:
   Google Drive binary image downloads and Vercel Blob uploads are executed inside an active database transaction (`BEGIN ... COMMIT`). External network latency and file transfers hold open PostgreSQL connection pool slots, table locks, and row locks for 30–60+ seconds, risking pool starvation for production user traffic, connection drops, and serverless gateway timeouts.
5. **Phantom Batching (159+ Sequential Single-Row Round Trips)**:
   Despite claiming query batching, existing ingestion executes iterative `for (const item of items) { await client.query('INSERT ...'); }` across 7 sheets. With 98 phases, 50 investments, and 30 investors, over 260 individual SQL queries are executed sequentially across the internet, ballooning execution latency to 15–35 seconds.
6. **Concurrent Sync Deadlocks & Missing Distributed Locking**:
   If an administrator triggers an on-demand sync with `{ force: true }` while an automated webhook or cron job is running, both transactions attempt concurrent bulk updates and orphan deletions across the same 7 tables, precipitating PostgreSQL transaction deadlocks (`deadlock detected`) and non-deterministic state overwrites.
7. **Truncated/Mid-Upload File Corruption & HTTP 429 Misclassification**:
   Google Drive dispatches push notifications while files are being uploaded or finalized by desktop sync clients. Parsing a truncated binary stream leads to unhandled ZIP container decompression failures. Furthermore, Google Drive HTTP 429 (Rate Limit Exceeded) responses are misclassified as permanent 500 fatal errors rather than ephemeral, retryable rate limits.
8. **Swallowed Failures in `after()` with No Dead-Letter Audit Trail**:
   Errors thrown within Next.js `after()` or unhandled background promises are caught and logged only to volatile `console.error` logs. The HTTP webhook caller receives `200 OK`, while the database update quietly fails, leaving no persistent audit record, dead-letter queue entry, or operator alerting mechanism.
9. **Google Apps Script Trigger vs Binary `.xlsx` Incompatibility & 7-Day Watch Expiration**:
   Google Apps Script spreadsheet triggers (`onEdit`, `onChange`) operate exclusively on native Google Sheets and do NOT fire when a raw binary `.xlsx` workbook is modified in Google Drive. Conversely, Google Drive API v3 watch channels expire after a maximum of 7 days (604,800s), requiring proactive channel renewal to prevent silent pipeline expiration.
10. **Secret Length Timing Attack Leak & Replay Vulnerability**:
    Naive constant-time comparison implementations that check `if (a.length !== b.length) return false` leak the secret length through CPU cycle timing discrepancies. Furthermore, absence of cryptographic nonces or HMAC headers leaves plain webhook tokens susceptible to replay attacks.

---

## 2. Why It Matters

- **Financial & Portfolio Data Integrity**: BlueBrick manages real-estate investment portfolios and investor capital. A catastrophic table wipe or truncated sync renders investor dashboards empty or inaccurate, destroying investor trust.
- **High Availability & Resource Guarding**: Holding database transactions open during multi-megabyte external network transfers starves the serverless connection pool, degrading the main web application for all users.
- **Operational Reliability & SOC2 Traceability**: Every ingestion attempt must leave an immutable audit trail in PostgreSQL (`dashboard_sync_logs`). Administrators require instant visibility into sync states, circuit-breaker trips, and dead-letter alarms.
- **Deterministic Serverless Behavior**: Debounce, locking, and rate limiting must reside in persistent storage (Neon PostgreSQL) rather than transient container memory, ensuring identical behavior across 1 or 1,000 serverless workers.

---

## 3. What Outcome Is Expected

1. **Persistent Distributed Cooldown & State Management (`dashboard_sync_state`)**:
   - Centralized singleton table tracking global cooldown timestamps, sync statuses (`IDLE`, `RUNNING`, `SUCCESS`, `FAILED`, `CIRCUIT_BREAKER_TRIPPED`), and trailing-edge flags (`pending_sync`).
   - Globally shared across all serverless containers and edge runtimes.
2. **Trailing-Edge Reconciliation Mechanism (Vercel Hobby 1-Cron/Day Compliant)**:
   - Incoming webhook edits during cooldown atomically set `pending_sync = TRUE, pending_sync_requested_at = NOW()`.
   - Trailing-edge resolution strictly respects Vercel Hobby (1 cron per day limit):
     - Source-side deferred trigger in Google Apps Script: Debounces edits during the 30m cooldown and schedules a one-off trigger for 30m after editing stops (0 Vercel crons, 0 Vercel compute while waiting).
     - Lazy reconciler on dashboard traffic (`/dashboard`): When visitors access the dashboard, if `pending_sync = TRUE` and cooldown expired, runs a background sync via `after()`.
     - Single daily safety-net cron (`0 1 * * *` in `vercel.json`): Ultimate nightly reconciliation.
3. **Anti-Wipe Guard & Safety Thresholds (Circuit Breaker)**:
   - **Zero-Entity Invariant**: Aborts immediately with `CIRCUIT_BREAKER_TRIPPED` if any essential sheet (`proyectos`, `inversionistas`, `inversiones`, `fases`) returns 0 rows while current database has active records.
   - **Relative Drop Ceiling**: Aborts if incoming entity count contracts by >20% compared to current database count, preventing mass accidental deletions.
   - Preserves 100% of existing production data and logs a dead-letter event.
4. **Decoupled Pre-Transaction Media Ingestion**:
   - Drive downloads, image extraction, and Vercel Blob uploads occur *before* the database transaction opens.
   - Transaction boundary (`BEGIN ... COMMIT`) is reserved strictly for pure SQL operations, reducing transaction lock time from 30+ seconds to <200 milliseconds.
5. **True Bulk Query Batching (`UNNEST`)**:
   - All 7 operational tables refactored from iterative `for` loops to batched `UNNEST` multi-row SQL upserts, executing entire sheet updates in a single round trip.
6. **Distributed Concurrency Advisory Locks (`pg_try_advisory_lock`)**:
   - PostgreSQL 64-bit session advisory locks guarantee that at most ONE synchronization pipeline runs across all containers simultaneously.
   - Concurrent calls fail gracefully, marking `pending_sync = TRUE` without deadlocking.
7. **Magic Byte Verification & HTTP 429 Classification**:
   - Validates ZIP header magic bytes (`0x50 0x4B 0x03 0x04`) and minimum size threshold (8KB) before parsing.
   - Explicitly parses `Retry-After` headers and marks HTTP 429 / 503 as retryable.
8. **Persistent Audit Trail & Dead-Letter Queue (`dashboard_sync_logs`)**:
   - Every sync attempt records source, duration, entity counts, circuit breaker metrics, error stacks, and `is_dead_letter` status in PostgreSQL.
9. **Dual Google Integration & Watch Channel Auto-Renewal**:
   - Nightly auto-renewal of Google Drive API v3 watch channels before the 7-day expiration ceiling.
   - Documented standalone Google Apps Script / Drive API poller architecture compatible with binary `.xlsx` workbooks.
10. **Length-Independent Constant-Time Verification (`timingSafeEqualSha256`)**:
    - Secrets are digested into fixed 32-byte SHA-256 hashes prior to calling `crypto.timingSafeEqual`, eliminating length leakage.

---

## 4. What Gaps Exist Today

- In-memory `lastSyncTimestamp` in `apps/web/src/app/api/webhooks/google-drive/route.ts` is vulnerable to multi-container bypass.
- Unconstrained `DELETE FROM ... CASCADE` in `dashboard-sync-service.ts` lacks circuit-breaker drop limits.
- Media downloads and blob uploads run inside `BEGIN ... COMMIT` transaction blocks.
- Iterative single-row queries remain inside `syncProjects`, `syncInvestors`, `syncInvestments`, `syncProjectPhases`, `syncOpportunities`, `syncTransactions`, and `syncInvestorSummaries`.
- Database lacks `dashboard_sync_state` and `dashboard_sync_logs` tables.
- No automated channel renewal for Google Drive API push subscriptions.

---

## 5. What Questions Remain Open

- **Reconciliation Engine Resolution**: Aligned to Vercel Hobby's 1-cron-per-day constraint by delegating trailing-edge debouncing to Google Apps Script (`ScriptApp.newTrigger().timeBased().after(30*60*1000)`) and lazy background evaluation on `/dashboard` visits, preserving `0 1 * * *` as the sole nightly cron.
- **Admin Manual Force Override**: When the circuit breaker trips due to an intentional major portfolio overhaul (>20% drop), how does an admin bypass it? (Provide `{ forceBypassCircuitBreaker: true }` in `triggerSyncAction` restricted exclusively to `ADMIN` role).
