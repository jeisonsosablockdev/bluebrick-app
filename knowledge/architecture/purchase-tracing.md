---
type: Reference
title: Purchase Tracing Infrastructure
description: Reusable tracing pattern for UI-driven purchase flows — flow_id correlation, x-flow-id headers, purchase_flow_events persistence, operator CLI, and E2E verification playbook
tags: [architecture, purchase, tracing, flow-id, observability, e2e, cli, devnet]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/purchase-tracing.md
---

# Purchase Tracing Infrastructure

## Purpose
- Provide a reusable tracing pattern for UI-driven purchase flows.
- Correlate frontend actions with backend steps and DB evidence using a single `flow_id`.
- Make E2E diagnostics deterministic without re-implementing ad-hoc logs each story.

## Scope
- Flow covered today: `quote -> challenge -> prepare -> submit`.
- Correlation channel:
  - Request header: `x-flow-id`
  - Response header: `x-flow-id` (echoed by server)
  - Persistence table: `purchase_flow_events`

## Runtime Flags
- `PURCHASE_TRACE_ENABLED`
  - Default: `true`
  - `false` disables server-side trace recording and `x-flow-id` response header.
- `PURCHASE_TRACE_ERRORS_ONLY`
  - Default: `false`
  - `true` records only `phase=error` events.
- `NEXT_PUBLIC_PURCHASE_TRACE_UI`
  - Default: `true`
  - `false` hides flow id in UI and stops sending `x-flow-id` from client purchase requests.

## Building Blocks
- UI correlation:
  - `components/marketplace/PurchaseCta.tsx`
  - Generates one `flowId` per purchase attempt and reuses it across all API calls.
  - Sends selected `quantity` for `quote/challenge/prepare` in multi-quantity flow.
  - Displays the trace ID in UI so operators can share it for backend investigation.
- Route instrumentation:
  - `app/api/purchase/{quote,challenge,prepare,submit}/route.ts`
  - Each route records:
    - `request` event before business logic.
    - `success` event on 2xx response.
    - `error` event on controlled/uncontrolled failures.
- Trace helper library:
  - `lib/purchase-flow-trace.ts`
  - `getFlowId()`: normalizes incoming flow id (or generates fallback).
  - `recordPurchaseFlowEvent()`: best-effort persistence to DB (or in-memory fallback without DB).
  - `withFlowIdHeader()`: echoes `x-flow-id` in response.
- Data model:
  - `db/migrations/010_purchase_flow_events.sql`
  - Stores endpoint/phase/status/error + correlation fields:
    - `flow_id`, `wallet_public_key`, `property_id`, `attempt_id`, `idempotency_key`.
  - Quantity contract signals are persisted in metadata (`quantity`, `quantityMode`) for `quote/challenge/prepare`.
- Operator CLI:
  - `scripts/purchase-trace.js`
  - NPM alias: `npm run purchase:trace -- --flow-id <FLOW_ID> [--json]`

## Event Contract
- `endpoint`: identifies the step (`quote`, `challenge`, `prepare`, `submit`).
- `phase`:
  - `request`
  - `success`
  - `error`
- `status_code`: HTTP status observed by route.
- `error_code`: business/system error code when applicable.
- `metadata`: bounded JSON payload for lightweight diagnostics.
  - Includes contextual fields such as `quantity`, `quotedPriceLamports`, `challengeId`, and `txSignature` per phase.

## Standard Integration Pattern (Reuse This)
1. Generate a `flowId` at UI action start.
2. Send `x-flow-id` in every related API call.
3. In each route:
   - Resolve `flowId` from request header.
   - Record `request` before service call.
   - Record `success` with key outputs.
   - Record `error` with code/status/message.
   - Return response with `x-flow-id` header.
4. Persist only minimal diagnostic metadata:
   - Keep payloads bounded and sanitized.
   - Avoid storing secrets/private keys/raw sensitive blobs.
5. Add one script/query path to inspect the full timeline by `flow_id`.

## E2E Verification Playbook
1. Run migrations:
   - `npm run db:migrate`
2. Execute purchase from UI.
3. Copy `Flow ID de trazado` from purchase card.
4. Inspect trace:
   - `npm run purchase:trace -- --flow-id <FLOW_ID>`
5. Validate expected sequence:
   - `quote/request`
   - `quote/success`
   - `challenge/request`
   - `challenge/success`
   - `prepare/request`
   - `prepare/success`
   - `submit/request`
   - `submit/success` (or `submit/error`)
6. Cross-check with operational tables (`purchase_attempts`) when needed.

## Validated Example (2026-03-20)
- Flow ID: `76943968-9cc5-4a53-b929-e9b2af3b2ed5`
- Attempt ID: `7bd07291-8ad4-4dc7-b96d-b978bf97f20b`
- Idempotency key: `019d0c8c-e205-741a-91a4-308022cb9555`
- Expected timeline found:
  - `challenge/request -> challenge/success`
  - `prepare/request -> prepare/success`
  - `submit/request -> submit/success`
  - additional `submit/request -> submit/success` replays using the same `attemptId + idempotencyKey`
- Expected replay behavior confirmed:
  - all replay `submit` calls returned `200`.
  - all replay calls returned the same `txSignature`:
    `faUDFFUa1tDWwGaV3QP4Ee4ttwh6jMi74QwXbCeBJ5zu5X5FhRpE4RD1xEHLck9r7U6MZuYptVkmiDYHVtZjLz4`.
- On-chain verification:
  - `getSignatureStatus(signature, { searchTransactionHistory: true })` returned `confirmationStatus=finalized` and `err=null`.
- DB verification (`purchase_attempts`):
  - `status=submitted`, `error_code=null`, `error_message=null`.
  - `confirmed_at` remains webhook-driven (`STORY-003-05` scope).

## SQL Quick Checks
```sql
SELECT
  flow_id,
  endpoint,
  phase,
  status_code,
  error_code,
  attempt_id,
  idempotency_key,
  created_at
FROM purchase_flow_events
WHERE flow_id = '<FLOW_ID>'
ORDER BY created_at ASC;
```

```sql
SELECT
  flow_id,
  COUNT(*) AS events_count,
  MIN(created_at) AS started_at,
  MAX(created_at) AS ended_at
FROM purchase_flow_events
GROUP BY flow_id
ORDER BY ended_at DESC
LIMIT 20;
```

## Future Extensions
- Add webhook lifecycle events (`submitted -> confirmed|failed`) under same `flow_id` strategy where correlation is available.
- Add admin UI trace viewer for support operators.
- Add retention/archival policy for high-volume environments.

## Production Recommendation
- Keep a minimal observability baseline instead of full shutdown:
  - `PURCHASE_TRACE_ENABLED=true`
  - `PURCHASE_TRACE_ERRORS_ONLY=true`
  - `NEXT_PUBLIC_PURCHASE_TRACE_UI=false`

Last Updated: 2026-03-20 19:25:00 UTC
