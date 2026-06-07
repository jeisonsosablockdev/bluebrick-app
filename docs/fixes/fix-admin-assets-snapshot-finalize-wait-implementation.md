# implementation(fix): admin assets snapshot finalize wait

## Scope

Implement the smallest safe recovery for `/admin/assets/new` snapshot finalization:

1. Extend `snapshot/finalize` server-side waiting to a 2 minute bounded retry window.
2. Add a visible UI waiting state while snapshot finalization is in progress.
3. Keep the existing `Create Asset` snapshot gate strict.

No Solana program code is in scope.

## Source Guidance

Solana MCP guidance for this slice:

- verify server-side through RPC instead of trusting frontend confirmations
- require `confirmed` or `finalized` before fulfillment-style actions
- use retry/backoff for transient RPC errors such as `429 Too Many Requests`
- do not treat missing/transport-failed reads as proof that an account or transaction is absent

## Slice Map

### S01 - Artifact and decision contract

Branch:

`codex/fix-admin-assets-snapshot-finalize-wait-s01-artifact`

Responsibilities:

- create the governing fix artifact pair
- record the 2 minute retry decision
- record UI waiting-state requirements
- record security invariants and definitive failure conditions
- do not touch product code

Gates:

- `git diff --check`
- docs governance sanity check when available

### S02 - Server snapshot finalize retry

Branch:

`codex/fix-admin-assets-snapshot-finalize-wait-s02-server-retry`

Responsibilities:

- update the snapshot finalization service behind `/api/admin/core-candy-machine/snapshot/finalize`
- retry recoverable verification states until either success or a 120 second deadline
- use elapsed-time deadline, not a tiny fixed attempt count
- poll at a controlled cadence, approximately one immediate attempt plus a 5 second wait between attempts
- cap the flow at `120_000ms`
- configure the deadline with `CORE_CM_SNAPSHOT_FINALIZE_MAX_WAIT_MS`
- configure the poll interval with `CORE_CM_SNAPSHOT_FINALIZE_RETRY_MS`
- preserve existing transaction submission behavior
- preserve all hard gate checks before returning `canCreateAsset: true`

Recoverable states:

- RPC transport timeout
- RPC `429 Too Many Requests`
- temporary RPC unavailable / fetch failure
- signature status `null` before the deadline
- account read missing before the deadline when the corresponding deploy signature is not failed
- `itemsLoaded < expectedQuantity` before the deadline

Definitive failures:

- invalid request shape or invalid public key input
- any deploy signature has `err`
- any deploy signature is only `processed`, `submitted`, or webhook-observed at the final deadline
- Candy Machine collection does not match the expected collection
- `itemsAvailable !== expectedQuantity`
- `itemsLoaded > expectedQuantity`
- snapshot persistence fails in a non-idempotent way
- the 120 second deadline expires without full verification

Expected failure behavior:

- return the existing blocked gate semantics
- include enough diagnostic context for operators and tests: attempts, elapsed wait, last recoverable reason, and final failure reason
- never return a client-controllable success flag

Tests first:

- service test: first reads hit RPC `429`, later read verifies and returns `canCreateAsset: true`
- service test: `itemsLoaded < expectedQuantity` recovers before 120 seconds
- service test: signature `err` fails immediately without retrying the full window
- service test: collection mismatch fails immediately
- service test: deadline expires and Create Asset remains blocked

Target commands:

- `npx vitest run tests/lib/core-candy-machine-snapshot-service.test.ts`
- `npm run validate`

Implementation evidence:

- `finalizeCoreCandyMachineSnapshot` now re-reads deploy proofs and Candy Machine state through a bounded server-side retry loop.
- Default retry deadline is `120_000ms`; default retry cadence is `5_000ms`.
- Definitive signature, collection, and quantity failures still fail closed without waiting for the full retry window.
- Service coverage verifies late proof status, transient Candy Machine RPC `429`, immediate signature failure, stale config-line reads, and deadline failure behavior.

### S03 - UI wait state and recoverable snapshot retry affordance

Branch:

`codex/fix-admin-assets-snapshot-finalize-wait-s03-ui-wait`

Responsibilities:

- update `components/admin/core-candy-machine-panel.tsx`
- add a dedicated waiting state while `finalizeSnapshot` is running
- make the waiting state visually consistent with the freeze/unfreeze waiting screen pattern
- keep the deploy transaction evidence visible while waiting
- disable deploy and Create Asset controls while the server is verifying the snapshot
- communicate that the user should wait and should not redeploy
- after a recoverable 120 second failure, expose only a snapshot verification retry, not a redeploy shortcut

Required waiting copy intent:

- "Verifying deploy on-chain"
- "This can take up to 2 minutes while RPC catches up."
- "Do not redeploy. Create Asset will unlock only after the snapshot is verified."

Required visible phases:

- Confirming deploy transactions
- Reading Candy Machine state
- Finalizing mint snapshot
- Preparing Create Asset gate

Security constraints:

- the UI retry only re-calls the server snapshot finalization endpoint with the same deploy evidence
- the UI retry cannot set `snapshotId`
- the UI retry cannot set `canCreateAsset`
- the UI retry cannot change collection, Candy Machine, quantity, or signatures after deploy completion

Tests first:

- component test: wait screen appears while `finalizeSnapshot` is pending
- component test: deploy/Create Asset actions are disabled during snapshot verification
- component test: a 120 second recoverable failure shows snapshot retry, not redeploy
- component test: successful retry calls `onSnapshotFinalized` and unlocks only through backend response

Target commands:

- `npx vitest run tests/components/core-candy-machine-panel-snapshot-gate.test.ts`
- `npm run validate`

Implementation evidence:

- `CoreCandyMachinePanel` now shows a blocking snapshot verification wait screen while `/snapshot/finalize` is pending.
- The wait screen lists the deploy verification phases and tells the operator not to redeploy while RPC catches up.
- After a blocked snapshot result, the panel exposes `Retry snapshot verification`, which reuses the same deploy evidence and calls only the snapshot finalization endpoint.
- Component coverage verifies the wait screen, disabled deploy action during verification, and snapshot-only retry without new deploy prepare/submit calls.

### S04 - E2E, security, and clean-code closeout

Branch:

`codex/fix-admin-assets-snapshot-finalize-wait-s04-e2e-closeout`

Responsibilities:

- run complete E2E for the admin mint flow when Phantom/Synpress and devnet RPC quota are available
- capture devnet transaction proof and fetched account-state proof
- verify Helius webhook remains observer-only and cannot unlock Create Asset
- update `docs/nft-spec.md` if final implementation changes the documented mint/deploy lifecycle
- run explicit clean-code review
- aggregate evidence for PR

Target commands:

- `npx vitest run tests/lib/core-candy-machine-snapshot-service.test.ts tests/components/core-candy-machine-panel-snapshot-gate.test.ts`
- Playwright/Synpress admin mint smoke when environment is available
- `npm run validate`

Implementation evidence:

- `npm run validate` passed on `codex/fix-admin-assets-snapshot-finalize-wait-s04-e2e-closeout`.
- `npm run e2e:playwright` passed: 23/23 Playwright smoke tests.
- `npm run e2e:synpress:admin` passed: Phantom cache boots and app shell loads.
- `npm run e2e:synpress:user` passed: Phantom cache boots and app shell loads.
- Devnet read-only proof for the reported deploy showed all five deploy signatures finalized with `err: null`.
- Devnet Candy Machine state for `6x3ED6pzmsSUaV7xzbFDp6vweDuBfG2kTqjJ8T2SESdN` showed `collectionMint=Dm1V4oTo8DdsUoAqhCRTKRNSM7SVCDUakXqoQgon9ZoE`, `itemsLoaded=100`, `itemsAvailable=100`, and `itemsRedeemed=0`.
- Clean-code/security closeout found no unresolved blocking findings. The retry remains server-authoritative and Helius webhook remains observer-only.

## Acceptance Criteria

- The server waits up to 2 minutes in `snapshot/finalize` for recoverable RPC/on-chain propagation.
- A valid deploy that becomes readable within 2 minutes finalizes a snapshot and unlocks `Create Asset`.
- A bad deploy fails early when a definitive failure is detected.
- A deploy that remains unverifiable after 2 minutes fails closed.
- The UI shows a clear waiting screen during snapshot finalization.
- The UI does not invite the operator to redeploy while verification is still pending.
- A post-timeout retry verifies the existing deploy only; it cannot mutate the trusted gate state from the client.
- Marketplace entry creation still requires a non-null backend-created `snapshotId`.

## Non-Goals

- Do not modify Solana programs.
- Do not change the deploy transaction builder.
- Do not loosen signature, collection, quantity, or marketplace snapshot gates.
- Do not use Helius webhook as final authorization.
- Do not add a second RPC provider or rotate providers in this slice.
- Do not create new on-chain addresses during snapshot retry.

## Linear Sync

Pending new Linear issue or explicit attachment to BRI-165/BRI-170. Sync should include:

- problem summary
- 2 minute bounded retry decision
- UI waiting-state slice
- security invariants
- branch map
- test/evidence plan
