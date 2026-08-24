---
type: ADR
title: State Machine Architecture
description: Formal state machine definitions, lifecycle states, allowed transitions, illegal transitions, and determinism constraints.
tags: [architecture, state-machine, workflow, lifecycle]
timestamp: 2026-08-23T00:00:00Z
resource: local
---

# State Machine Architecture

## Scope
- Domain entity / pipeline lifecycle states and transition invariants.

## States
| State | Description | Entry Condition | Exit Condition |
| --- | --- | --- | --- |
| `idle` | Initialized, waiting for user trigger | Component mounted / initialized | User initiates action |
| `preparing` | Assembling transaction parameters and payload | User trigger received | Payload validation succeeds |
| `signing` | Awaiting cryptographic wallet signature | Payload prepared | Wallet returns signature |
| `submitting` | Broadcasting transaction to Solana Devnet RPC | Signature accepted | RPC returns signature / ack |
| `confirming` | Polling on-chain transaction confirmation | Transaction broadcasted | Reaches commitment level (`confirmed`) |
| `completed` | Terminal success state | On-chain confirmation confirmed | Terminal |
| `failed` | Terminal failure state | Error encountered / transaction rejected | Terminal |

## Allowed Transitions
| From | Action | To | Validation |
| --- | --- | --- | --- |
| `idle` | `prepare` | `preparing` | Valid request parameters |
| `preparing` | `sign` | `signing` | Schema validation passed |
| `signing` | `submit` | `submitting` | Valid Ed25519 signature |
| `submitting` | `poll` | `confirming` | RPC transaction hash returned |
| `confirming` | `finalize` | `completed` | Status == confirmed / finalized |
| `*` | `catchError` | `failed` | Error caught at any stage |

## Illegal Transitions
- [x] Transition: `completed -> preparing`
  - Reason blocked: Completed transactions are terminal and immutable.
  - Expected error: `InvalidTransitionError: Terminal state cannot be re-executed.`
- [x] Transition: `failed -> submitting`
  - Reason blocked: Failed workflows must re-enter from `idle` or `preparing`.
  - Expected error: `InvalidTransitionError: Direct submission from failed state is prohibited.`

## State Diagram

```mermaid
stateDiagram-v2
  [*] --> idle
  idle --> preparing: prepare()
  preparing --> signing: sign()
  signing --> submitting: submit()
  submitting --> confirming: poll()
  confirming --> completed: finalized
  confirming --> failed: timeout / rejected
  preparing --> failed: validation error
  signing --> failed: user rejected
  submitting --> failed: rpc error
  completed --> [*]
  failed --> [*]
```

## Determinism & Invariants
- No floating-point arithmetic used for accounting or balance math.
- State transitions are deterministic and pure.
