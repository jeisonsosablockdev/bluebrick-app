# fix: admin assets snapshot finalize wait

## Context

`/admin/assets/new` deploys a Core Collection, Core Candy Machine, and config lines from Phantom-signed transactions. The create-asset gate must stay blocked until the backend can finalize a verified mint snapshot.

This issue follows the previous snapshot gate work:

- BRI-165: `Create Asset` is blocked unless snapshot finalization returns `canCreateAsset: true`, and marketplace entries must receive a non-null `snapshotId`.
- BRI-170 S08: snapshot finalization already waits for short Candy Machine state propagation instead of failing on the first stale `itemsLoaded` read.

The observed failure is now a longer propagation/RPC pressure case. The deploy transactions can exist on-chain, but `/api/admin/core-candy-machine/snapshot/finalize` may fail before RPC reads stabilize, especially when the provider returns `429 Too Many Requests` or signature/account state is temporarily unavailable.

Recent observed deploy evidence:

- Collection: `Dm1V4oTo8DdsUoAqhCRTKRNSM7SVCDUakXqoQgon9ZoE`
- Candy Machine: `6x3ED6pzmsSUaV7xzbFDp6vweDuBfG2kTqjJ8T2SESdN`
- Create Core Collection signature: `54jLAqe6m5AcwHizWpzkK5uZ6XJuZMTgyzYqjaCmV6ePc5x6McBdNTWyad7rQoUnkS1rMPn9gQYUEgHQfBxbV65E`
- Create Core Candy Machine + Guard signature: `67VksiBVa3DCJK5zp29SewK9zz46z1xCoC8xYHZwfUUw5SS3rd6BdVWdEDCApHHZpGnHtnkxwbcZGdsLKvNdcqn1`
- Load config lines signatures:
  - `3AX57BgYUYiJX1JnzzMWgkFZLf941w2LDEGoWAci2jbi15fp7dAVmX2y72auYofvGass8o6i1TwjGiNbqoM5Zsfa`
  - `rRghyzuUGyL9M6BvjgZwtDtqeNXgF1VqgLffqsZscJVtSzigy4FrYNyXwvAd3afH9BHnYv7zNWa5HGZhb1q7TzC`
  - `2R9DE7T1EgeV5N3UjJTiLdEshXyHJTzutPvkpDgRd94rUETCwTgwhnxnKWp343Lxy85DZfYukSgx9CD1fAan5sb4`

## Problem

The current snapshot finalization path can fail too early for a valid deploy. When that happens, the operator sees:

```text
Mint snapshot could not be verified. Create Asset remains blocked until the snapshot is finalized.
```

The security gate is correct, but the recovery window is too short and the UI does not clearly explain that the backend is still waiting for on-chain/RPC verification after the transactions were already signed and submitted.

## Why It Matters

The admin should not be forced to redeploy a Candy Machine when the chain already accepted the deploy transactions. Redeploying creates confusion, increases RPC pressure, and can leave multiple on-chain assets to reconcile.

At the same time, the fix cannot relax the gate. A malicious or stale client must not be able to inject a `snapshotId`, override `canCreateAsset`, spoof a Candy Machine address, or use webhook-only observations to unlock marketplace entry creation.

## Expected Outcome

Snapshot finalization waits up to 2 minutes for recoverable RPC/on-chain propagation before returning a failure.

During that wait, `/admin/assets/new` shows a clear blocking waiting state similar to the freeze/unfreeze flow, so the operator understands that deploy transactions were submitted and the system is verifying the snapshot.

`Create Asset` remains blocked unless the backend returns a verified snapshot with:

- `canCreateAsset: true`
- non-null `snapshotId`
- confirmed or finalized deploy signatures
- Candy Machine state matching the expected collection and quantity

## Security Invariants

- Never trust client-provided `canCreateAsset`, `snapshotId`, or status text.
- Never trust Helius webhook events as the final gate.
- Never unlock on `processed`, `submitted`, `null`, failed, or webhook-only signature state.
- Verify deploy signatures server-side through RPC.
- Verify Candy Machine state server-side through RPC/on-chain reads.
- Preserve collection and quantity validation before snapshot persistence.
- Preserve idempotency: retrying snapshot verification must not redeploy, re-sign, or create new on-chain addresses.
- Preserve marketplace invariant: no marketplace entry from `/admin/assets/new` without verified `snapshotId`.

## Current Gaps

- Snapshot finalization does not wait long enough for this class of RPC 429 / slow-read propagation.
- The UI lists steps but does not enter a strong waiting surface while the backend is finalizing the snapshot.
- The operator cannot distinguish "transactions are still being verified" from "deploy is permanently broken".
- Existing recovery risks are easy to overcorrect by adding a retry that trusts the browser. This fix must keep retry server-authoritative.

## Open Questions

- Exact branch/Linear issue id for this follow-up is still pending. The artifact is linked to BRI-165 and BRI-170 context until a new Linear issue is created or assigned.
- Final E2E will depend on the available devnet RPC quota and Phantom/Synpress environment.
