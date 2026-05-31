# S22 Plan: Runtime Observability and Error Boundaries

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s22-runtime-observability`.
- Runtime scope when implemented:
  - `app/marketplace/page.tsx`
  - `lib/property-marketplace-server.ts`
  - `app/api/admin/marketplace/entries/route.ts`
  - relevant tests under `tests/app`, `tests/lib`, and `tests/api`.

## Problem
Marketplace data loading currently has paths where failures are converted into empty arrays or fallback data without an explicit observable signal.

Known hotspots:
- `app/marketplace/page.tsx` has safe list functions that catch and return `[]`.
- `lib/property-marketplace-server.ts` catches persisted marketplace read failures and returns `[]`, which can trigger snapshot fallback.
- `app/api/admin/marketplace/entries/route.ts` returns `error.message` for create failures, including 500 responses.

Why this matters:
- A real DB/read failure can look the same as an empty marketplace.
- Operators lose the ability to distinguish no inventory, missing configuration, and failed reads.
- Admin API failures can expose internal details instead of a stable public error contract.

## Solution
Implement explicit degraded-state handling and safe admin error responses.

Required behavior:
- Marketplace page should distinguish successful empty inventory from degraded data loading.
- Persisted read failures should be logged with enough context to debug the failing source.
- Snapshot fallback should remain allowed only when documented as a degraded source transition.
- Admin create endpoint should return stable public error codes and generic 500 messages.
- Internal error details should be logged server-side, not returned to clients.

Suggested implementation:
- Add a small server-side result type for marketplace reads:
  - `status: "ok" | "degraded"`
  - `source: "persisted" | "snapshot" | "empty"`
  - `errorCode?: string`
- Keep the UI user-safe by showing a concise degraded-state note only if product accepts it.
- Add structured logging using the repo's existing observability pattern if available.
- For admin 500s, return `MARKETPLACE_ENTRY_CREATE_FAILED` with a generic message.

## TDD Plan
1. Add failing tests proving marketplace read failure is observable and does not silently become a normal empty state.
2. Add failing tests proving snapshot fallback records degraded source metadata.
3. Add failing API tests proving admin 500 responses do not expose raw internal error messages.
4. Implement the smallest server/page changes to pass.
5. Run targeted tests and `npm run validate`.

## Acceptance Criteria
- No catch block in the marketplace server/page turns unexpected runtime failure into an indistinguishable success.
- Admin 500 responses expose stable error codes, not raw infrastructure messages.
- Existing happy-path marketplace rendering stays unchanged.
- `npm run validate` passes.
