# Fix: Admin Candy Machine deploy current system

## Problem

The `/admin/assets/new` Core Candy Machine deploy flow still needs a functional fix after PR `#294` added diagnostics.

This branch starts from the current `develop` state and must first observe the system with the new deploy logs before changing transaction, retry, recovery, or snapshot semantics.

## Current Baseline

- Base branch: `develop`
- Base merge commit: `bdb8ba3`
- Current deploy diagnostics PR: `#294`
- Current module snapshot: `docs/knowledge/inbox/2026-06/KNOW-2026-06-003-candy-machine-deploy-current-system-branch.md`

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

## Security Requirements

- Do not let client state decide that Create Asset is verified.
- Do not log private keys, wallet secrets, cookies, auth headers, request bodies, full signed transactions, or full `transactionBase64`.
- Use public signatures, public addresses, transaction kind/index, RPC host, blockhash metadata, and sanitized error summaries only.
- Any recovery path must prove on-chain account state from RPC before deciding the next action.

## Initial Plan

1. Capture the current deploy flow and log surfaces.
2. Run or observe a deploy attempt with the new `core_candy_machine.deploy.*` events.
3. Identify why the app did not enable Create Asset even after `itemsLoaded=200`.
4. Propose the smallest safe fix in the snapshot/handoff path.

## Open Questions

- Which `deployId` appears during the next failed attempt?
- Did snapshot finalization run too early and persist a failed snapshot?
- Did the finalize request send stale or incomplete payload data?
- Does the UI have a safe path to re-run server-side snapshot finalization for the same Candy Machine?
- Should the UI show a recoverable snapshot-only state when deploy is fully confirmed on-chain?
