---
type: Fix Spec
title: Fix Admin Cm Deploy Current System Implementation
description: Fix Admin Cm Deploy Current System Implementation - migrated from docs/
tags: [fixes]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-admin-cm-deploy-current-system-implementation.md
---

# Implementation: Admin Candy Machine deploy current system

## Resolution

Pending. This branch begins with observation and baseline capture before implementation.

Current observed state: deploy is complete on-chain, but Create Asset remains blocked by snapshot/handoff state.

## Design Contract

- Keep Create Asset gated by server-verified snapshot.
- Keep client-provided `deployId` as correlation only.
- Do not change deploy transaction construction, signing, submit, confirmation, or config-line loading in this branch unless new evidence contradicts the current observation.
- Add only snapshot/handoff recovery behavior.
- Prefer reusing the existing `/snapshot/finalize` server verification over introducing a new endpoint.
- Preserve the branch-level Candy Machine deploy iteration artifact.

## Non-Goals

- Do not relax `canCreateAsset`.
- Do not create a marketplace entry with `snapshotId = null`.
- Do not allow the client to mark a snapshot as verified.
- Do not create a new collection when recovering a snapshot.
- Do not create a new Candy Machine when recovering a snapshot.
- Do not ask Phantom to sign during snapshot recovery.
- Do not reload config lines during snapshot recovery.
- Do not change Metaplex Core plugin assembly.

## Protected Modules

These modules are confirmed working for the observed devnet attempt and are out of scope:

- `prepareCoreCandyMachineDeploy`
- `submitCoreCandyMachineSignedTransactions`
- `sendRawTransactionWithRetry`
- `waitForConfirmedSignature`
- `/api/admin/core-candy-machine/deploy/prepare`
- `/api/admin/core-candy-machine/submit`
- config-line chunk construction
- Core Collection creation
- Core Candy Machine + Guard creation
- marketplace Create Asset gate semantics

## Target Modules

Primary target:

- `components/admin/core-candy-machine-panel.tsx`
  - Preserve failed snapshot finalization context.
  - Add snapshot-only recovery UI.
  - Automatically re-run `/api/admin/core-candy-machine/snapshot/finalize` after 15 seconds with the same deploy data.

Possible secondary targets:

- `lib/core-candy-machine-snapshot-service.ts`
  - Only if tests show it cannot idempotently re-verify a ready Candy Machine.
- `app/api/admin/core-candy-machine/snapshot/finalize/route.ts`
  - Only if the route needs clearer recoverable error semantics.

## Current Observability

Linear:

- Issue: `BRI-176`
- PR: `#295`

Server logs:

- `lib/core-candy-machine-admin.ts`
- Emits `core_candy_machine.deploy.*` JSON lines through `console.warn` and `console.error`.
- Also records sanitized events in `recordOperabilityLog`.

Client logs:

- `components/admin/core-candy-machine-panel.tsx`
- Emits `core_candy_machine.deploy.client.*` JSON lines through `console.info`.

Admin operability logs:

- `GET /api/admin/monitoring/logs?limit=200`
- Backed by the in-memory `lib/observability/store.ts` buffer.

Branch memory:

- `docs/knowledge/inbox/2026-06/KNOW-2026-06-003-candy-machine-deploy-iteration-current-system-branch.md`

## Slices

1. Baseline capture
   - Create the fix artifact pair.
   - Create a new branch-level Candy Machine deploy iteration.
   - Record current log surfaces and expected event sequence.

2. Evidence collection
   - Observe a real deploy attempt.
   - Record deploy id, signatures, addresses, final UI message, and first failing event.
   - Confirmed on 2026-06-07 that one real deploy has all seven signatures finalized and `itemsLoaded=200`.

3. Snapshot-only recovery UI
   - Status: implemented.
   - Add a recoverable state after deploy confirmation and failed snapshot finalization.
   - Keep collection address, Candy Machine address, quantity, form snapshot, and signatures.
   - Run automatic snapshot re-check after 15 seconds.
   - Keep `Re-check snapshot` as fallback if automatic recovery still reports blocked.
   - Ensure the action does not call deploy prepare, Phantom signing, submit, or config-line load.

4. Server verification reuse
   - Status: implemented without route changes.
   - Reuse `/api/admin/core-candy-machine/snapshot/finalize`.
   - Keep verification based on confirmed proofs, collection match, quantity match, and `itemsLoaded === quantity`.
   - Return Create Asset enabled only from server `canCreateAsset: true`.

5. Validation and gitflow
   - Status: automated validation passed; Human Acceptance approved on 2026-06-07.
   - Add component coverage for recoverable snapshot state.
   - Add regression coverage that snapshot re-check does not redeploy.
   - Run targeted tests.
   - Run `npm run validate`.
   - Update the iteration with PR/final state before merge.

## Implemented Changes

Date: 2026-06-07

- Added a `snapshotRecoveryContext` to preserve the confirmed deploy context when snapshot finalization returns blocked.
- Refactored snapshot finalization to accept an explicit immutable input instead of reading mutable form state at retry time.
- Stored resolved `draftId` and `formSnapshot` in the recovery context so re-check reuses the same snapshot identity.
- Added an automatic 15-second snapshot re-check that calls only `/api/admin/core-candy-machine/snapshot/finalize`.
- Kept `Re-check snapshot` as a fallback if the automatic re-check does not verify the snapshot.
- Kept `/deploy/prepare`, wallet signing, `/submit`, and config-line loading untouched.
- Added regression coverage proving that the automatic re-check path does not prepare or submit another deploy.

## Acceptance Gates

- `npm run validate:knowledge`: passed.
- Targeted Candy Machine tests for changed behavior: passed.
- `npm run validate`: passed.
- Clean-code pass: completed with no unresolved blockers.
- Human Acceptance before merge to `develop`: approved on 2026-06-07.
