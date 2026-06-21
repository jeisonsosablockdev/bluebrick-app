# S25 Plan: Marketplace Read Failure Logging

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s25-read-failure-logging`.
- Runtime scope when implemented: `lib/property-marketplace-server.ts` or the extracted repository module if S27 is already complete.
- Tests: `tests/lib/property-marketplace-server.test.ts` or the matching repository test.

## Problem
When marketplace persisted reads fail, operators need enough context to debug the failing source without exposing details to users.

## Solution
Add structured server-side logging for persisted marketplace read failures using the repo's existing observability convention.

## TDD Contract
1. Add a failing test that simulates persisted read failure.
2. Assert a structured log event or observability call is emitted.
3. Assert the user-facing return remains safe.
4. Implement only logging/observability for read failure.

## Out Of Scope
- Page degraded rendering.
- Admin API error responses.
- Repository extraction.

## Acceptance Criteria
- Failed persisted reads are observable.
- Logs contain source/context but not sensitive data.
- No user-facing behavior changes beyond previously approved degraded-state behavior.

## Implementation Evidence
- Added failing coverage for the persisted read failure operability log.
- Recorded `marketplace.persisted_read_failed` with source, fallback source, and stable error code.
- Verified the raw thrown error message is not stored in the log entry.
- Targeted test command: `npm run test -- tests/lib/property-marketplace-server.test.ts`.
- Targeted result: `4` tests passed.
