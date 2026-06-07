# Fix: Admin Candy Machine deploy current system

## Problem

The current failure is a post-deploy snapshot false negative in `/admin/assets/new`.

The deploy completed on-chain, but the app did not enable Create Asset because the mint snapshot stayed in a failed/not-ready UI state.

This is not currently a transaction-construction, wallet-signing, RPC-submit, Candy Machine creation, or config-line loading failure.

## Current Baseline

- Base branch: `develop`
- Base merge commit: `bdb8ba3`
- Linear issue: `BRI-176`
- Current deploy diagnostics PR: `#294`
- Current module snapshot: `docs/knowledge/inbox/2026-06/KNOW-2026-06-003-candy-machine-deploy-iteration-current-system-branch.md`

## Known Symptoms Under Investigation

- This observed deploy completed on-chain but still failed the app snapshot gate.
- The UI reported: `Mint snapshot could not be verified. Create Asset remains blocked until the snapshot is finalized.`
- The UI also reported: `Deploy confirmed, but mint snapshot is not ready.`
- Snapshot verification must remain server-side and must not be relaxed.

## Current Evidence

- Collection `57U9nhAghgjmcChZhCqoCRbuNnX6AwgrRAkXE9RAXMdn` exists and decodes as a Metaplex Core collection.
- Core Candy Machine `HftFBr7NZwH5iitTgBdh5iejEHqwe2T4PXAzhUGmZY4b` exists and decodes successfully.
- The Candy Machine points to the expected collection.
- `itemsAvailable` is `200`.
- `itemsLoaded` is `200`.
- `itemsRedeemed` is `0`.
- Candy Guard is present.
- All seven deploy signatures are finalized with no transaction error.

## Current Conclusion

The deploy path is working for this observed attempt. The failing area is the snapshot/handoff path after deploy confirmation.

The smallest safe fix should focus on allowing the server to re-finalize or recover the snapshot for the same already-created Candy Machine after RPC proves:

- collection matches,
- quantity matches,
- `itemsLoaded === quantity`,
- deploy signatures are confirmed,
- Create Asset remains server-gated.

## Failure Boundary

Working boundary:

```text
prepare deploy -> Phantom sign -> submit txs -> RPC finalized -> Candy Machine itemsLoaded=quantity
```

Broken boundary:

```text
snapshot/finalize false negative -> UI remains blocked -> no safe re-finalize affordance
```

The fix should operate only after deploy has already confirmed. It should not create a new collection, create a new Candy Machine, reload config lines, or ask Phantom for signatures.

## Protected Modules

Do not touch these unless new evidence proves they are failing:

- `prepareCoreCandyMachineDeploy` in `lib/core-candy-machine-admin.ts`
  - Reason: current evidence proves transaction assembly produced a valid Core Collection, Core Candy Machine, Guard, and config-line sequence.
- `submitCoreCandyMachineSignedTransactions`, `sendRawTransactionWithRetry`, and `waitForConfirmedSignature` in `lib/core-candy-machine-admin.ts`
  - Reason: all seven deploy signatures finalized without error for the observed attempt.
- `app/api/admin/core-candy-machine/deploy/prepare/route.ts`
  - Reason: prepare returned addresses and transactions that succeeded on-chain.
- `app/api/admin/core-candy-machine/submit/route.ts`
  - Reason: submit accepted signed transactions and the transactions landed.
- Config-line chunking logic
  - Reason: `itemsLoaded=200` for expected quantity `200`.
- Metaplex Core plugin assembly and guard creation
  - Reason: Core Collection, Core Candy Machine, and Candy Guard all exist and decode.
- Create Asset server gate
  - Reason: the gate is the security boundary and must remain blocked until server snapshot verification returns `canCreateAsset: true`.
- Snapshot verification invariants
  - Reason: the fix must not bypass collection match, quantity match, signature proof confirmation, or `itemsLoaded === quantity`.

## Allowed Touch Scope

Touch these only as needed:

- `components/admin/core-candy-machine-panel.tsx`
  - Add a recoverable snapshot-only state after deploy is confirmed but snapshot finalization returns `canCreateAsset: false`.
  - Automatically re-check/re-finalize after 15 seconds using the same collection, Candy Machine, quantity, form snapshot, and deploy signatures.
  - Keep a manual `Re-check snapshot` fallback only if the automatic re-check still cannot verify the snapshot.
- `app/api/admin/core-candy-machine/snapshot/finalize/route.ts`
  - Only if the existing route needs safer error shape or traceability for re-finalization.
- `lib/core-candy-machine-snapshot-service.ts`
  - Only if tests prove the current service cannot idempotently re-finalize a now-ready Candy Machine.
- Tests around the snapshot gate and re-finalize UI.
- This branch iteration document.

## Proposed Fix

Add a snapshot-only recovery path.

When deploy transactions are confirmed but snapshot finalization fails with `canCreateAsset: false`, the UI should keep the deploy result in a recoverable state, wait 15 seconds, and automatically re-run snapshot finalization.

That automatic recovery should:

- not prepare new deploy transactions,
- not ask Phantom to sign,
- not submit transactions,
- not create a new collection,
- not create a new Candy Machine,
- not reload config lines,
- POST the same snapshot finalize payload to `/api/admin/core-candy-machine/snapshot/finalize`,
- rely on the server to re-read RPC and decide `canCreateAsset`,
- enable Create Asset only if the server returns `canCreateAsset: true` and a snapshot id.
- expose a manual `Re-check snapshot` fallback only after the automatic re-check has run and the server still reports a blocked snapshot.

This preserves the security model because the client only asks the server to verify again; the client never decides that verification succeeded.

## Security Requirements

- Do not let client state decide that Create Asset is verified.
- Do not log private keys, wallet secrets, cookies, auth headers, request bodies, full signed transactions, or full `transactionBase64`.
- Use public signatures, public addresses, transaction kind/index, RPC host, blockhash metadata, and sanitized error summaries only.
- Any recovery path must prove on-chain account state from RPC before deciding the next action.

## Slice Plan

1. Documentation and guardrails
   - Record the observed on-chain state.
   - Mark deploy/submit/config-line modules as protected.
   - Define the only allowed fix boundary: snapshot/handoff.

2. Snapshot recovery UI
   - Status: implemented.
   - Preserve the successful deploy payload and signatures after snapshot failure.
   - Show a snapshot-only recovery state.
   - Automatically run snapshot re-check after 15 seconds without triggering deploy, signing, submit, or config-line load.
   - Keep manual `Re-check snapshot` only as post-auto fallback.

3. Server verification reuse
   - Status: implemented without server changes.
   - Reuse the existing snapshot finalize route if it is already idempotent.
   - Add only minimal response/error traceability if tests prove it is needed.
   - Keep all verification server-side.

4. Tests
   - Status: completed.
   - Add coverage that snapshot recovery calls `/snapshot/finalize` again with the same Candy Machine.
   - Add coverage that retry does not call `/deploy/prepare` or `/submit`.
   - Add coverage that the default recovery happens automatically after 15 seconds.
   - Add coverage that Create Asset remains disabled until `canCreateAsset: true`.

5. Validation and acceptance
   - Status: automated validation passed; Human Acceptance approved on 2026-06-07.
   - Run targeted component/API tests.
   - Run `npm run validate`.
   - Update this iteration with final PR and Human Acceptance.

## Open Questions

- Did snapshot finalization run too early and persist a failed snapshot?
- Did the finalize request send stale or incomplete payload data?
- Can the current snapshot finalize service already re-finalize successfully if called again with the same payload after `itemsLoaded=200`?
- Does the UI currently discard enough state after snapshot failure that it cannot retry finalize without another deploy?
