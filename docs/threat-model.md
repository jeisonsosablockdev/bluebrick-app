# Threat Model

## Scope
- Feature: P0-06 H1 + H4 + H5 + H6 + H7 - Persistent idempotency and replay-safe mint orchestration with signing UI, webhook/DAS reconciliation, and permanent mutation authority.
- Components: admin mint job APIs, PostgreSQL idempotency schema, orchestrator in-memory store, Helius webhook route, DAS paginated read client.

## Attack Vectors
| Threat | Entry Point | Impact | Likelihood | Severity |
| --- | --- | --- | --- | --- |
| Duplicate submit after timeout | `submit-batch` retry from frontend | Double mint or inconsistent counters | High | High |
| Replay of same webhook payload | Helius webhook retries | Duplicate processing side effects | High | Medium |
| Forged webhook request | Public webhook endpoint | Unauthorized status mutation attempts | Medium | High |
| DAS pagination under-scan | Low `maxPages` / narrow query scope | Submitted assets remain unresolved | Medium | Medium |
| Non-devnet DAS source | Misconfigured DAS endpoint | Incorrect network state reconciliation | Low | High |
| Frontend tampering on batch identity | forged batch token/fingerprint | Cross-batch contamination and wrong state updates | Medium | High |
| Non-admin creation/read of jobs | `/api/admin/mint-jobs*` | Unauthorized operational control/visibility | Medium | High |
| Cross-admin mutation attempt | Manual admin mutation endpoints on someone else’s job | Unauthorized state transition on immutable job authority | Medium | High |
| Client-side request timeout during batch submission | Frontend waits for synchronous confirmation of all transactions from the backend `submit` endpoint. | Poor UX, perceived failure, encourages unsafe retries leading to duplicate submits. | High | High |
| Server restart during confirming | process crash/redeploy | Lost transient in-memory state | High | High |

## Mitigations
| Threat | Mitigation | Where Implemented | Verification |
| --- | --- | --- | --- |
| Duplicate submit after timeout | Unique constraints at job/batch/item/signature levels | `db/migrations/001_mint_job_idempotency.sql` + repository upserts | Unit/integration tests for duplicate requests |
| Replay of same webhook payload | Dedupe on (`provider`, `event_id`) and (`provider`, `event_fingerprint`) before reconcile | `recordMintWebhookEvent` in `lib/mint-orchestrator-store.ts` + webhook route | Re-send identical payload and verify no new reconciliation changes |
| Forged webhook request | Optional shared secret check before processing payload | `HELIUS_WEBHOOK_SECRET` + `app/api/webhooks/helius/mint-orchestrator/route.ts` | Missing/wrong secret returns `401` |
| DAS pagination under-scan | Explicit `page/limit/maxPages` controls with `nextPage` continuation signal | `POST /api/admin/mint-orchestrator/jobs/:jobId/reconcile/das` | Run reconciliation in bounded passes until `nextPage=null` |
| Non-devnet DAS source | Endpoint validation rejects non-devnet/local/mainnet/testnet markers | `lib/das-client.ts` | Configure invalid DAS URL and expect validation error |
| Frontend tampering on batch identity | Batch row revalidation for token/fingerprint invariants | `createOrGetMintBatch` repository guard | Submit mismatched token/fingerprint and expect rejection |
| Non-admin creation/read of jobs | Role check on every admin mint route | `app/api/admin/mint-jobs/**` | Request with non-admin session returns `403` |
| Cross-admin mutation attempt | Manual mutations require `actorPubkey === job.createdBy` | `prepareNextMintBatch`, `submitMintBatch`, `reconcileMintJobSignatures` + admin route pubkey pass-through | Different admin wallet attempt returns `403` |
| Client-side request timeout during batch submission | 1. Frontend uses `signAllTransactions` to minimize user signing time. 2. Backend `submit` endpoint sends all transactions with `sendRawTransaction` without awaiting confirmation, returning signatures immediately. 3. Client polls for confirmation status asynchronously. | `components/admin/core-candy-machine-panel.tsx` (client), `app/api/admin/core-candy-machine/submit/route.ts` (server) | The `submit` API call returns in <2s for a large batch. UI shows "Submitting..." then updates progress based on polling. |
| Server restart during confirming | Durable backend state in PostgreSQL | `mint_jobs`, `mint_job_batches`, `mint_job_items` | Restart process and continue from persisted statuses |

## Security Checks
- [x] Signer checks validated (admin SIWS role for protected endpoints)
- [ ] PDA derivations validated (not in H1; no on-chain mint yet)
- [ ] Account ownership validated (not in H1; no on-chain mint yet)
- [x] Replay protection validated (idempotency and webhook dedupe)
- [ ] CPI safety validated (not in H1; no on-chain instructions)

## Residual Risk
- Risk: Webhook dedupe store is process-local in-memory in H4. Restart loses dedupe cache until a persistent store is wired.
- Risk: DAS reconciliation can still require multiple passes when assets are spread across many pages.
- Acceptance reason: H5 intentionally exposes bounded, repeatable pagination to keep reconciliation predictable and safe.

## EPIC-006 STORY-006-03 Addendum (Economic AppData)
### Additional Attack Vectors
| Threat | Entry Point | Impact | Likelihood | Severity |
| --- | --- | --- | --- | --- |
| Schema drift via unknown JSON fields | Admin economic payload assembly | Silent interpretation mismatch in distribution service | Medium | High |
| Invalid economic mode injection | `yield_mode` user/admin input | Incorrect accrual logic execution | Medium | High |
| Unauthorized economic update attempt | AppData write path | Tampering of payout parameters | Medium | High |

### Additional Mitigations
| Threat | Mitigation | Where Implemented | Verification |
| --- | --- | --- | --- |
| Schema drift via unknown JSON fields | Reject non-whitelisted keys (`additionalProperties` behavior) | `validateAppDataEconomicV1` in `lib/core-candy-machine-admin.ts` | Unit test: unsupported key rejected |
| Invalid economic mode injection | Strict catalog (`cap`, `linear`) | `validateAppDataEconomicV1` | Unit test: invalid mode rejected |
| Unauthorized economic update attempt | Server-side admin gate + signer-based on-chain authority | `/api/admin/core-candy-machine/mint/prepare` + `writeData` with `UpdateAuthority` | Devnet evidence: only authorized signer writes accepted |

## Compliance Admin Operations Addendum (EPIC-004 STORY-005)
- New threat vectors:
  - Unauthorized admin mutations on compliance cases.
  - Missing justification on reject/override decisions.
  - Loss of incident context due to missing notes/audit linkage.
  - Financial actions executed by wallets marked as `restricted_aml` or `suspended`.
- Mitigations:
  - Admin-only guards on every `/api/admin/compliance/cases/*` mutation route.
  - Service-level validation for mandatory reasons in rejected KYC and AML override decisions.
  - Dedicated `compliance_notes` table + `compliance_audit_events` trail per mutation.
  - Runtime compliance gate in purchase flows (`challenge`, `prepare`, `submit`) for blocked statuses.

Last Updated: 2026-04-01 08:20:33 UTC
