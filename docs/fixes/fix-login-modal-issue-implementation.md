# Implementation: Login modal viewport anchoring and auth state clarity

## Status
- S01 artifact slice merged into the initiative branch.
- S02 modal viewport slice is merged into the initiative branch.
- S03 auth-state matrix slice is merged into the initiative branch.
- S04 disconnect/sign-out slice is merged into the initiative branch.
- S05 QA/review/docs slice is implemented and under final merge.
- S06 modal action layout slice is implemented after visual review.
- S07 connected-wallet disconnect visual-state slice is implemented after follow-up review.
- Linear issue key: `BRI-167`.

## Objective
Fix the login modal so it behaves as viewport-owned auth chrome and presents a clear state model across anonymous, wallet-connected, SIWS-authenticated, federated, and hybrid states.

## Scope
- `components/WalletModal.tsx`
- `tests/components/wallet-modal-header-cta.test.ts`
- `e2e/wallet-modal-auth-entry.pw.spec.ts`
- `docs/auth-flow.md`
- `docs/session-model.md`
- possibly `tests/api/auth-me-route.test.ts` or logout route coverage if investigation shows server response drift

## Non-Goals
- Do not change SIWS signature verification, nonce generation, or role derivation.
- Do not change WorkOS account creation/linking semantics.
- Do not redesign the broader login modal visual language beyond state clarity.
- Do not change wallet adapter library configuration unless disconnect investigation proves it is required.

## Linear
- Issue: `BRI-167`
- Owner: `Codex`
- Linear entry slug: `fix-login-modal-issue-bri-167`

## Artifact Pair
- Problem artifact: `docs/fixes/fix-login-modal-issue.md`
- Solution artifact: `docs/fixes/fix-login-modal-issue-implementation.md`

## Linear Initiative Branch
Proposed once issue key exists:

`fix/app-login-modal-issue-bri-167`

Initiative branch:

`fix/app-login-modal-issue-bri-167`

## Spec Slice
- Branch: `fix/app-login-modal-issue-bri-167-s01-spec`
- Status: `in-review`
- Objective: make the artifact pair decision-complete, confirm slice boundaries, and define test-plan-first gates before implementation.
- Deliverables:
  - problem artifact finalized
  - solution artifact finalized
  - slice table approved
  - open questions resolved or explicitly deferred

## Slice Plan
| Slice | Status | Branch | Objective | Technical Scope | Validation | PR |
| --- | --- | --- | --- | --- | --- | --- |
| S01 | merged | `fix/app-login-modal-issue-bri-167-s01-spec` | Finalize scope, risks, state matrix, and acceptance gates | `docs/fixes/fix-login-modal-issue.md`, `docs/fixes/fix-login-modal-issue-implementation.md` | artifact review, docs governance later in closeout | merged locally |
| S02 | merged | `fix/app-login-modal-issue-bri-167-s02-modal-viewport` | Make the modal viewport-owned and stop page scroll-on-open | `components/WalletModal.tsx`, component test coverage, Playwright modal bounding-box evidence | targeted Vitest, `/marketplace` + `/` Playwright screenshots, responsive 320/375/768/1024 | merged locally |
| S03 | merged | `fix/app-login-modal-issue-bri-167-s03-auth-state-matrix` | Separate wallet adapter connection from authenticated session UI | `WalletModal` derived state names and render branches, focused component tests | targeted Vitest for anonymous, connected-pending-auth, wallet session, federated-only states | merged locally |
| S04 | merged | `fix/app-login-modal-issue-bri-167-s04-disconnect-signout` | Verify and tighten sign-out/disconnect behavior without changing server authority | `WalletModal` disconnect flow; API tests only if route behavior is implicated | targeted Vitest, possible `tests/api/auth-me-route.test.ts` or logout tests, manual/browser proof | merged locally |
| S05 | implemented | `fix/app-login-modal-issue-bri-167-s05-qa-review-docs` | Close frontend/auth QA, docs sync, clean-code reviewer gate | docs updates, responsive evidence, full validation | Playwright, Synpress if wallet auth path is exercised, `npm run validate`, clean-code pass | local slice |
| S06 | implemented | `fix/app-login-modal-issue-bri-167-s06-modal-action-layout` | Restore visual harmony for authenticated modal actions | `WalletModal` action layout, component assertion, artifact evidence | targeted Vitest, targeted Playwright modal evidence, docs governance | local slice |
| S07 | implemented | `fix/app-login-modal-issue-bri-167-s07-disconnect-visual-state` | Fix connected-wallet pending layout and visible disconnect completion | `WalletModal` action stack, disconnect local state, component assertions, artifact evidence | targeted Vitest, typecheck, Playwright smoke, docs governance | local slice |

## Order Of Execution
1. Complete S01 and get explicit approval for the slice map.
2. Run S02 first because viewport anchoring affects all modal evidence and screenshots.
3. Run S03 after viewport behavior is stable so UI-state assertions are not polluted by layout bugs.
4. Run S04 after state labels are clear, because disconnect success/failure must be validated against the final state matrix.
5. Run S05 last as aggregation: responsive QA, auth/session docs, security check, reviewer/clean-code closeout.

## Root-Cause Analysis
### BRI-165 reconnect precedent
BRI-165 slice 16 documented a real admin deploy regression:
- the UI could show `Connected wallet: Not connected`
- the admin session/header still showed an authenticated wallet
- deploy still needed a live wallet adapter signer to submit transactions

The BRI-165 fix intentionally kept two concepts separate:
- authenticated SIWS/admin session used for server authorization
- live wallet-adapter connection used for browser transaction signing

The documented implementation enabled wallet-adapter `autoConnect` in `WalletRuntimeProvider` and changed `WalletModal` so an active SIWS wallet session with a disconnected adapter could show `Reconnect wallet`. That reconnect path calls the adapter `connect` flow without rerunning SIWS, then validates that the recovered public key matches the active session public key.

This was correct for the admin deploy case. The likely BRI-167 side effect is that the inverse state became common and visible on public pages:
- Phantom can be connected or auto-reconnected
- `/api/auth/me` can still be anonymous, expired, or pending refresh
- `WalletModal` can therefore show adapter state (`Connected: <wallet>`) alongside anonymous auth entry (`Mail` / `Wallet`)

BRI-167 should preserve the BRI-165 security invariant: reconnecting an adapter must never bypass SIWS authorization and must reject mismatched wallet addresses. The fix should instead make the UI state matrix explicit so adapter connection is not presented as logged-in account state.

### A. Modal sticks to page content or map
`WalletModal` currently renders the modal overlay inline in every page that mounts it. The overlay uses `fixed inset-0`, but CSS fixed positioning is only viewport-fixed until an ancestor creates a fixed-position containing block. Common triggers include `transform`, `filter`, `perspective`, `contain`, and motion-generated transform styles.

Because BRIDS has Motion 12 route/page surfaces and glass effects, the login modal should not depend on the page subtree for its viewport coordinate system. The screenshot behavior is consistent with the overlay being centered inside an ancestor/page box instead of the browser viewport: the backdrop still covers/dims the current view, but the dialog itself is vertically displaced and partially unreachable.

Opening the modal also focuses the close button. If that close button lives in a page-local or transformed modal subtree, browser focus can scroll the underlying document toward that subtree. This explains the "se esta pegando al mapa" symptom: the modal appears connected to the marketplace map state instead of behaving like viewport chrome.

Likely S02 fix:
- portal the modal layer to `document.body`
- focus the close button with `preventScroll`
- give the overlay its own `overflow-y-auto` and safe-area-aware vertical padding
- constrain the panel with `100svh`

### B. Connected wallet is being mistaken for authenticated login
The component currently derives:
- `isConnected` from the wallet adapter
- `hasWalletSession` from `authState.walletAuthenticated ?? authState.authenticated`
- `hasFederatedSession` from `authState.federatedAuthenticated`
- `shouldShowDirectAuthEntryActions` from federated availability plus absence of wallet/federated session

That leaves a mixed state: wallet adapter connected, but no SIWS wallet session. In that state the modal can show both:
- `Connected: <wallet>`
- default direct entry choices: `Mail` and `Wallet`

This is technically possible but confusing. Adapter connection is not login. S03 should introduce a dedicated "wallet connected, sign-in pending" state.

BRI-165 makes this distinction especially important because `autoConnect` can restore the adapter without restoring or extending `siws_session`. The modal must therefore treat these as separate axes:
- adapter signer availability
- server-authenticated SIWS wallet session
- federated WorkOS account session

### C. Sign out may not visibly clear all local state
`handleDisconnect` has to coordinate:
- Solana wallet adapter disconnect
- BRIDS SIWS session logout through `/api/auth/logout`
- WorkOS sign-out through `/sign-out` when federated auth exists
- local `authState`
- cross-tab auth sync
- router refresh

S04 should verify which layer is failing before changing behavior.

### D. `Signed in` should not be a primary action
When `hasWalletSession && isConnected`, the primary wallet button can render `Signed in` with the primary gradient styling. That reads as an action button and competes with real actions like sign out, link email, and copy address.

Likely S03 fix:
- remove the `Signed in` primary CTA from the active session view
- render signed-in state as a neutral status row
- keep destructive/secondary actions visually separate

## Test Plan First
S02 viewport anchoring:
- RED: open the modal and assert the dialog is rendered outside the page render container.
- RED: opening the modal does not change the page scroll position.
- Browser: `/marketplace` and `/` dialog top/bottom are inside the viewport.

S03 auth state matrix:
- Anonymous, no adapter, no session: show `Mail` and `Wallet`.
- Adapter connected, no SIWS/federated session: do not show default anonymous chooser; show connected-wallet pending-auth action plus disconnect.
- SIWS session active and adapter connected: no primary `Signed in` button; show neutral status plus secondary actions.
- SIWS session active and adapter disconnected: show reconnect/sign out path.
- Federated-only session: preserve current link-wallet/sign-out semantics.

S04 disconnect/sign-out:
- Clicking sign out calls wallet adapter `disconnect` when an adapter is connected or has a public key.
- Clicking sign out posts to `/api/auth/logout`.
- Successful logout clears local session state, broadcasts auth sync, and refreshes route/auth state.
- Failure shows an explicit error and does not claim the user is signed out.

S05 evidence:
- Playwright evidence for `/marketplace` and `/`.
- Responsive modal evidence at 320, 375, 768, and 1024 widths.
- Synpress if wallet extension-dependent sign-in/sign-out is exercised as final proof.

## Implementation By Slice
### S02 - Modal Viewport
1. Add a small `WalletModalPortal` helper in `components/WalletModal.tsx`.
2. Render the `AnimatePresence` modal layer through the portal.
3. Focus the initial close button with `preventScroll`.
4. Update overlay layout classes to own modal-state overflow:
   - `overflow-y-auto`
   - safe-area-aware vertical padding
   - `max-h` based on `100svh`

### S03 - Auth State Matrix
1. Introduce explicit derived state names:
   - `hasConnectedWalletAdapter`
   - `hasAuthenticatedWalletSession`
   - `hasAuthenticatedAccountSession`
   - `shouldShowAnonymousAuthEntry`
   - `shouldShowConnectedWalletPendingAuth`
   - `shouldShowAuthenticatedWalletActions`
2. Replace the mixed anonymous/connected rendering with a state matrix:
   - anonymous + adapter disconnected: direct `Mail`/`Wallet`
   - anonymous + adapter connected: connected-wallet sign-in prompt
   - wallet session active + adapter connected: neutral signed-in status/actions
   - wallet session active + adapter disconnected: reconnect/sign out
   - federated-only session: link wallet/sign out according to current semantics

### S04 - Disconnect And Sign-Out
1. Verify adapter disconnect and server logout behavior independently.
2. Disconnect adapter when connected or when an adapter public key is present.
3. Call `/api/auth/logout` for SIWS cleanup.
4. Call `/sign-out` only for WorkOS/federated session cleanup.
5. Clear local state only after successful server logout, or show a clear error if logout fails.
6. Refresh auth state and router state after completion.

### S05 - QA, Docs, Review
1. Update `docs/auth-flow.md` and `docs/session-model.md` only with final implemented behavior.
2. Run targeted tests and browser evidence.
3. Run `npm run validate`.
4. Complete explicit `code-refactoring-refactor-clean` pass.
5. Final reviewer gate confirms no unresolved blocking findings.

## Risks
- Portal changes can affect focus, Escape close, click-outside close, and React context assumptions.
- State-matrix changes can accidentally alter wallet linking or federated-only behavior.
- Disconnect behavior involves both browser adapter state and server cookies; false positives are possible without browser evidence.
- Changing auth routes would expand scope and require security/docs review.
- Regressing the BRI-165 admin deploy recovery path would strand admins with a valid SIWS session but no live signer after refresh/navigation.
- Removing or weakening wallet-adapter `autoConnect` globally could fix the public confusion while reintroducing the original admin deploy bug.

## Security Boundary
No auth authority changes are allowed by default:
- no new cookies
- no new session state
- no client-side role decision
- no change to SIWS nonce or verification
- no change to WorkOS redirect semantics

Any implementation that changes `/api/auth/me`, `/api/auth/logout`, `/sign-out`, SIWS cookies, or WorkOS cookies must be reviewed as an auth/session change and update `docs/auth-flow.md` plus `docs/session-model.md`.

## Completion Gate
- S01 approved before delivery starts.
- All slice PRs target the initiative branch.
- The final initiative PR targets `develop`.
- Opening the login modal does not scroll the underlying page.
- The modal is visually centered/reachable on `/marketplace` and `/`.
- A connected wallet without SIWS auth does not show the same UI as an anonymous disconnected user.
- Active SIWS wallet sessions do not show a colorful `Signed in` primary CTA.
- BRI-165 admin reconnect behavior is preserved: active SIWS session plus disconnected adapter can reconnect Phantom without rerunning SIWS, and mismatched wallet recovery is rejected.
- `Sign out & disconnect wallet` visibly removes connected/session UI after success.
- If any logout/disconnect layer fails, the modal shows an explicit error and does not claim the user is fully signed out.
- Required auth/session docs are updated after implementation.
- Responsive evidence is captured at 320, 375, 768, and 1024 widths.
- `npm run validate` passes.
- Explicit clean-code/reviewer pass has no unresolved blocking findings.

## Validation Results
- S02 RED component proof: `npm test -- tests/components/wallet-modal-header-cta.test.ts` failed before implementation because the open dialog still rendered inside the page render container.
- S02 targeted component validation: `npm test -- tests/components/wallet-modal-header-cta.test.ts` passed with 13 tests.
- S02 targeted browser validation: `npx playwright test e2e/wallet-modal-auth-entry.pw.spec.ts --project=playwright-smoke` passed with 9 tests across `/` and `/marketplace` at 320, 375, 768, and 1024 px widths.
- S02 type validation: `npm run typecheck` passed.
- S02 docs governance validation: `npm run validate:docs-governance` passed.
- S02 whitespace validation: `git diff --check` passed.
- S02 observed non-blocking marketplace warnings: existing chart containers can report `width(-1)` / `height(-1)` during the smoke run; the modal viewport assertions and screenshots still passed.
- S03 RED component proof: `npm test -- tests/components/wallet-modal-header-cta.test.ts` failed before implementation because a connected wallet adapter without SIWS still showed the anonymous `Mail` / `Wallet` chooser, and an authenticated wallet session still exposed the colorful `Sesion iniciada` action.
- S03 targeted component validation: `npm test -- tests/components/wallet-modal-header-cta.test.ts` passed with 15 tests.
- S03 targeted browser validation: `npx playwright test e2e/wallet-modal-auth-entry.pw.spec.ts --project=playwright-smoke` passed with 9 tests after the state-matrix change.
- S03 type validation: `npm run typecheck` passed.
- S03 docs governance validation: `npm run validate:docs-governance` passed.
- S03 whitespace validation: `git diff --check` passed.
- S04 RED component proof: `npm test -- tests/components/wallet-modal-header-cta.test.ts` failed before implementation because `Sign out & disconnect wallet` did not call wallet-adapter `disconnect()` when the adapter still exposed a public key but `connected` was false.
- S04 targeted component validation: `npm test -- tests/components/wallet-modal-header-cta.test.ts` passed with 16 tests.
- S04 targeted browser validation: `npx playwright test e2e/wallet-modal-auth-entry.pw.spec.ts --project=playwright-smoke` passed with 9 tests after the disconnect tightening.
- S04 type validation: `npm run typecheck` passed.
- S04 docs governance validation: `npm run validate:docs-governance` passed.
- S04 whitespace validation: `git diff --check` passed.
- S05 clean-code pass: `code-refactoring-refactor-clean` review found one lint/performance cleanup in `WalletModalPortal`; the portal now avoids effect-driven state and reads `document.body` directly on the client.
- S05 targeted component validation after cleanup: `npm test -- tests/components/wallet-modal-header-cta.test.ts` passed with 16 tests.
- S05 full validation: `npm run validate` passed.
- S05 final browser validation: `npx playwright test e2e/wallet-modal-auth-entry.pw.spec.ts --project=playwright-smoke` passed with 9 tests.
- S05 Synpress validation: `npm run e2e:synpress` passed with 1 test (`phantom cache boots and the app shell loads`).
- S05 observed non-blocking warnings: Playwright marketplace smoke still reports existing chart container width/height warnings and the database validator reports the existing pg SSL mode warning; neither blocked validation.
- S06 visual review note: authenticated wallet sessions can show only `Sign out & disconnect wallet` in the action group; that single action must occupy the full row rather than inheriting the split two-column layout used when primary and secondary actions are both visible.
- S06 implementation: the wallet action group now uses `sm:grid-cols-2` only when both primary wallet action and disconnect action are visible; single-action states use `grid-cols-1`, and action labels use `whitespace-nowrap` to preserve button rhythm.
- S06 targeted component validation: `npm test -- tests/components/wallet-modal-header-cta.test.ts` passed with 16 tests, including a regression assertion that the authenticated-wallet sign-out action is full-row and not split into two columns.
- S06 type validation: `npm run typecheck` passed.
- S06 docs governance validation: `npm run validate:docs-governance` passed.
- S06 whitespace validation: `git diff --check` passed.
- S06 browser validation: `npx playwright test e2e/wallet-modal-auth-entry.pw.spec.ts --project=playwright-smoke` passed with 9 tests on rerun. One previous run had a non-reproduced `/marketplace` 768 px click miss where the modal never opened despite the header `Sign in` button remaining visible; rerun passed without code changes.
- S07 visual review note: the connected-wallet pending state still used the split action grid, so Spanish `Cerrar sesion y desconectar wallet` crowded the right column and could look unclickable/unfinished.
- S07 implementation: wallet modal actions now stack full-width for wallet states instead of splitting `Iniciar sesion` and disconnect into two columns.
- S07 disconnect behavior: after a successful adapter disconnect/logout, the modal suppresses the just-disconnected adapter public key locally so stale wallet-adapter state does not continue rendering `Conectada`; the anonymous state preserves `federatedAvailable` so the modal returns to the normal `Mail` / `Wallet` chooser.
- S07 targeted component validation: `npm test -- tests/components/wallet-modal-header-cta.test.ts` passed with 17 tests, including the connected-wallet pending disconnect regression.
- S07 type validation: `npm run typecheck` passed.
- S07 docs governance validation: `npm run validate:docs-governance` passed.
- S07 whitespace validation: `git diff --check` passed.
- S07 browser validation: `npx playwright test e2e/wallet-modal-auth-entry.pw.spec.ts --project=playwright-smoke` passed with 9 tests.
