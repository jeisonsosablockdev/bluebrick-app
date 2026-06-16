# STORY-011-08 Authorities Aggregation (`BRI-105`)

## Summary
- Extended the read-only blockchain detail payload with visible authority identities for the admin collections detail shell.
- Reused repo-native authority sources instead of introducing editable blockchain state into the collection editor.

## Scope
- Added `authorities` into `blockchain` payload from `GET /api/admin/collections/[id]`.
- Resolved `transferDelegate` and `appdataAuthority` from `authority_registry`.
- Resolved `thirdPartySigner` from snapshot payload when present, with fallback to the configured backend purchase signer.
- Resolved `freezeDelegate` from snapshot payload when present, with fallback to `SQUADS_FREEZE_AUTHORITY`.
- Rendered the new authority identities in the existing read-only blockchain panel.

## Fallback Behavior
- Missing `authority_registry` rows degrade to `null` for `transferDelegate` and `appdataAuthority`.
- Missing snapshot authority fields fall back to server configuration where applicable.
- No write path or mutation controls were introduced.

## Validation
- `npx vitest run tests/lib/admin-collection-blockchain-panel.test.ts tests/api/admin-collection-detail-route.test.ts tests/app/admin-collection-detail-page.test.ts`
- `npm run typecheck`
