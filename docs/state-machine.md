# State Machine

## Scope
- Feature: P0-06 H1 - Backend mint job idempotency states.

## States
| State | Description | Entry Condition | Exit Condition |
| --- | --- | --- | --- |
| `queued` | Job accepted and persisted | First idempotent creation by `emission_id` | Batch preparation starts |
| `preparing` | Backend is assigning next lot | Next-batch operation begins | Batch rows/items prepared |
| `signing` | Frontend is signing prepared txs | Batch payload delivered to wallet | Signed payload returned |
| `submitting` | Backend sends signed txs | Signed payload accepted | RPC ack or timeout |
| `confirming` | Backend reconciles uncertain/received sends | Submit timeout or partial confirmations | All target items resolved |
| `partial` | Some items failed after retries | Confirming exits with mixed result | Retry cycle or manual recovery |
| `completed` | All items confirmed | `confirmed_items == total_items` | Terminal |
| `failed` | Terminal operational failure | Irrecoverable error | Terminal |

## Transitions
| From | Action | To | Validation |
| --- | --- | --- | --- |
| `queued` | prepare batch | `preparing` | Admin-authenticated job exists |
| `preparing` | batch ready | `signing` | Unique (`job_id`, `batch_no`) and deterministic batch token |
| `signing` | signed payload submitted | `submitting` | Batch token and fingerprint match persisted batch row |
| `submitting` | RPC timeout/unknown | `confirming` | No rollback to avoid duplicate sends |
| `submitting` | RPC accepted | `confirming` | Signatures persisted with uniqueness checks |
| `confirming` | all confirmed | `completed` | `mint_job_items.status = confirmed` for all serials |
| `confirming` | mixed outcome | `partial` | At least one failed and one confirmed item |
| `confirming` | unrecoverable | `failed` | Retries exhausted with no safe continuation |

## Illegal Transitions
- [x] Transition: `completed -> preparing`
  - Reason blocked: Completed jobs are immutable and must not mint extra serials.
  - Expected error: backend validation error.

- [x] Transition: `failed -> signing`
  - Reason blocked: Requires explicit recovery workflow, not direct signing.
  - Expected error: backend validation error.

- [x] Transition: `submitting -> preparing`
  - Reason blocked: Could duplicate batch/item state after network uncertainty.
  - Expected error: backend validation error.

## Determinism Notes
- No floating point arithmetic used: [x]
- Transition outputs are deterministic: [x]

Last Updated: 2026-03-18 01:14:38 UTC
