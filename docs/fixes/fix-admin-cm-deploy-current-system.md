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

- Deploy can stop after wallet signing or while submitting signed transactions.
- Previous symptoms included backend timeout while waiting for transaction submission or confirmation.
- Retry can create a new collection/Candy Machine instead of recovering the partially completed deploy.
- Snapshot verification must remain server-side and must not be relaxed.

## Security Requirements

- Do not let client state decide that Create Asset is verified.
- Do not log private keys, wallet secrets, cookies, auth headers, request bodies, full signed transactions, or full `transactionBase64`.
- Use public signatures, public addresses, transaction kind/index, RPC host, blockhash metadata, and sanitized error summaries only.
- Any recovery path must prove on-chain account state from RPC before deciding the next action.

## Initial Plan

1. Capture the current deploy flow and log surfaces.
2. Run or observe a deploy attempt with the new `core_candy_machine.deploy.*` events.
3. Identify the first missing or failing event in the deploy lifecycle.
4. Propose the smallest safe fix after log evidence shows whether the failure is prepare, signing, submit, RPC acceptance, confirmation, config-line loading, or snapshot finalization.

## Open Questions

- Which `deployId` appears during the next failed attempt?
- Does the backend emit `tx_send_accepted` for each prepared transaction?
- Does the failure happen before Candy Machine creation, after Candy Machine creation, or during config-line loading?
- Does snapshot finalization run after all required confirmations?
