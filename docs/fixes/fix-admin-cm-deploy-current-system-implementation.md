# Implementation: Admin Candy Machine deploy current system

## Resolution

Pending. This branch begins with observation and baseline capture before implementation.

Current observed state: deploy is complete on-chain, but Create Asset remains blocked by snapshot/handoff state.

## Design Contract

- Keep Create Asset gated by server-verified snapshot.
- Keep client-provided `deployId` as correlation only.
- Do not add recovery or retry behavior until logs prove the failure boundary.
- Prefer minimal fixes to transaction lifecycle handling over broad architecture changes.
- Preserve the branch-level Candy Machine deploy iteration artifact.

## Current Observability

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

- `docs/knowledge/inbox/2026-06/KNOW-2026-06-003-candy-machine-deploy-current-system-branch.md`

## Slices

1. Baseline capture
   - Create the fix artifact pair.
   - Create a new branch-level Candy Machine deploy iteration.
   - Record current log surfaces and expected event sequence.

2. Evidence collection
   - Observe a real deploy attempt.
   - Record deploy id, signatures, addresses, final UI message, and first failing event.
   - Confirmed on 2026-06-07 that one real deploy has all seven signatures finalized and `itemsLoaded=200`.

3. Minimal fix
   - Target the snapshot/handoff boundary now that evidence identifies deploy as complete.
   - Keep security constraints intact.

4. Validation and gitflow
   - Run targeted tests.
   - Run `npm run validate`.
   - Update the iteration with PR/final state before merge.

## Acceptance Gates

- `npm run validate:knowledge`
- Targeted Candy Machine tests for changed behavior
- `npm run validate`
- Human Acceptance before merge to `develop`
