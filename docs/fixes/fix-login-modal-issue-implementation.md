# Implementation: Login modal viewport anchoring and auth state clarity

## Status
- S01 artifact slice merged into the initiative branch.
- S02 modal viewport slice is merged into the initiative branch.
- S03 auth-state matrix slice is merged into the initiative branch.
- S04 disconnect/sign-out slice is merged into the initiative branch.
- S05 QA/review/docs slice is merged into the initiative branch.
- S06 modal action layout slice is implemented after visual review.
- S07 connected-wallet disconnect visual-state slice is implemented after follow-up review.
- S08 wallet intent gating slice is implemented after reload-flow review.
- S09 wallet-connected page sharpness slice is implemented after visual review.
- S10 wallet signing intent modal redesign slice is implemented after UX review.
- S11 wallet proof progress polish slice is implemented after visual color review.
- Initial BRI-167 implementation was merged into `develop`.
- S12 P1 logout refresh hardening is merged into the hardening branch.
- S13 P2 reduced-motion hardening is merged into the hardening branch.
- S14 P3 artifact status sync is implemented in this slice.
- S15 clean-code extraction is implemented in this slice.
- Linear issue key: `BRI-167`.

## Objective
Fix the login modal so it behaves as viewport-owned auth chrome and presents a clear state model across anonymous, wallet-connected, SIWS-authenticated, federated, and hybrid states.

## Scope
- `components/WalletModal.tsx`
- `components/motion/route-transition.tsx`
- `lib/motion.ts`
- `tests/components/wallet-modal-header-cta.test.ts`
- `tests/lib/motion.test.ts`
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
| S08 | implemented | `fix/app-login-modal-issue-bri-167-s08-wallet-intent-gating` | Avoid exposing auto-connected wallet technical state on generic sign-in after reload | `WalletModal` wallet-intent state, connected-wallet UI gating, component assertions, artifact evidence | targeted Vitest, typecheck, Playwright smoke, docs governance | local slice |
| S09 | implemented | `fix/app-login-modal-issue-bri-167-s09-wallet-connected-sharpness` | Keep marketplace content sharp after wallet sign-in refresh | navigation-origin fallback motion, motion regression assertion, artifact evidence | targeted Vitest, typecheck, docs governance, Playwright smoke if needed | local slice |
| S10 | implemented | `fix/app-login-modal-issue-bri-167-s10-wallet-signing-intent-modal` | Redesign wallet-signing modal so it communicates intent and progress | `WalletModal` wallet proof panel, Motion progress states, copy/action hierarchy, component assertions | targeted Vitest, typecheck, docs governance, Playwright smoke | local slice |
| S11 | implemented | `fix/app-login-modal-issue-bri-167-s11-wallet-progress-polish` | Align wallet proof progress indicators with the BRIDS glass palette | `WalletModal` progress/status styling, component assertions, artifact evidence | targeted Vitest, typecheck, docs governance, Playwright smoke | local slice |
| S12 | merged | `fix/app-login-modal-issue-bri-167-s12-logout-refresh-hardening` | Resolve P1 logout refresh asymmetry after wallet-only sign-out | `WalletModal` disconnect success branch, component assertion | targeted Vitest, typecheck, docs governance, whitespace check | local slice |
| S13 | merged | `fix/app-login-modal-issue-bri-167-s13-reduced-motion-hardening` | Resolve P2 reduced-motion gaps in modal progress and route fallback motion | `WalletModal`, `components/motion/route-transition.tsx`, `lib/motion.ts`, motion assertions | targeted Vitest, typecheck, docs governance, whitespace check | local slice |
| S14 | implemented | `fix/app-login-modal-issue-bri-167-s14-artifact-status-sync` | Resolve P3 artifact drift after implementation and reviewer pass | `docs/fixes/fix-login-modal-issue.md`, `docs/fixes/fix-login-modal-issue-implementation.md`, Linear note if needed | docs governance, artifact review | local slice |
| S15 | implemented | `fix/app-login-modal-issue-bri-167-s15-clean-code-wallet-proof-panel` | Extract wallet proof presentation to reduce `WalletModal` concentration without changing auth authority | `WalletModal`, `WalletProofPanel`, wallet modal constants, focused tests | targeted Vitest, typecheck, docs governance, clean-code pass | local slice |

## Order Of Execution
1. Complete S01 and get explicit approval for the slice map.
2. Run S02 first because viewport anchoring affects all modal evidence and screenshots.
3. Run S03 after viewport behavior is stable so UI-state assertions are not polluted by layout bugs.
4. Run S04 after state labels are clear, because disconnect success/failure must be validated against the final state matrix.
5. Run S05 as aggregation: responsive QA, auth/session docs, security check, reviewer/clean-code closeout.
6. Run follow-up slices S06-S11 only for visual/regression issues found in browser review, keeping each slice scoped to one observable defect.
7. Run S12-S15 as post-review hardening after the first merge to `develop`: P1 behavioral fix, P2 accessibility/motion fix, P3 artifact sync, then clean-code extraction.

## Post-Reviewer Hardening Plan
### S12 - P1 Logout Refresh Hardening
Problem:
- wallet login success calls `router.refresh()` after SIWS session creation
- wallet-only logout clears local state and broadcasts auth sync, but the non-federated success branch does not refresh the route

Implementation:
- add route refresh after successful wallet-only logout/disconnect
- keep server auth authority unchanged
- add a component regression assertion for the logout refresh branch

Acceptance:
- successful wallet-only logout clears local UI state and requests a route refresh
- federated sign-out behavior remains unchanged

Status:
- Implemented in S12 by refreshing the route after successful wallet-only logout.
- Component regression coverage confirms `router.refresh()` is called in that branch.

### S13 - P2 Prefers Reduced Motion Hardening
Problem:
- the wallet proof panel can animate status/progress even when the user requests reduced motion
- route transition fallback/page variants still animate in reduced-motion mode

Implementation:
- gate repeated wallet proof animations with `useReducedMotion`
- add reduced-motion route variants that avoid transform/filter motion
- preserve the normal BRIDS Motion 12 experience for users without reduced-motion preference

Acceptance:
- reduced-motion users do not receive repeated progress sweeps or page transform/filter transitions
- existing visual states remain legible without animation

Status:
- Implemented in S13 by gating wallet proof repeated animations with `useReducedMotion`.
- Route transitions now use reduced-motion variants without transform/filter movement when the preference is active.

### S14 - P3 Artifact Status Sync
Problem:
- artifacts still carried stale pre-implementation wording after the initial merge

Implementation:
- update problem and implementation artifacts to reflect merged implementation plus reopened hardening slices
- keep Linear issue key and artifact pair traceability explicit

Acceptance:
- docs governance passes
- artifacts describe current branch intent and remaining slices without contradicting implementation state

Status:
- Implemented in S14.
- S15 remains as the clean-code closeout slice before final validation.

### S15 - Clean-Code Wallet Proof Refactor
Problem:
- `WalletModal` has become a large orchestration component that also owns detailed wallet proof presentation

Implementation:
- extract wallet proof presentation into a focused child component or narrow helpers
- keep auth decisions, fetch/logout, SIWS signing, and router refresh in the parent
- preserve copy, state names, and tests unless the extraction reveals a safer naming improvement

Acceptance:
- no auth behavior change
- component tests still pass
- clean-code review has no blocking findings

Status:
- Implemented in S15 by extracting the wallet proof presentation into `components/wallet-modal/wallet-proof-panel.tsx`.
- The parent modal still owns auth decisions, SIWS signing, disconnect/logout, and route refresh.
- Phantom install URL now lives in `components/wallet-modal/constants.ts` to avoid duplicate presentation constants.

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

### A2. Marketplace remains blurred after wallet connection
The marketplace route uses `PathRouteTransition` with `mode="navigation-origin"` so route changes can expand from the clicked navigation control. Wallet sign-in, however, completes with an in-place `router.refresh()` rather than a route navigation with a recorded click origin.

When there is no navigation origin, the previous fallback reused full page motion variants. Those variants include `filter: blur(2px)` in the initial/exit states. If a wallet sign-in refresh lands during that page-level fallback transition, the entire marketplace shell can visually remain softened even though the modal has closed and the wallet session is valid.

S09 keeps the navigation-origin fallback visually sharp by using opacity/scale-only motion for refresh-style updates. Origin-based route changes still keep their intended clip-path animation; regular page transitions outside navigation-origin mode keep their existing behavior.

### E. Wallet signing modal reused a generic login action model
The post-S08 state model was technically correct but still reused the same generic action surface for a different job: proving wallet ownership through SIWS. In the explicit wallet path, the UI could show:
- `Conectada: <wallet>`
- a primary `Iniciar sesion` button
- `Cerrar sesion y desconectar wallet`
- `Copiar direccion`

That combination is confusing because the user already chose `Ingresar > Wallet`; the next task is not a generic login choice but an external Phantom signature confirmation. While Phantom is open, the modal must communicate:
- BRIDS is waiting on Phantom
- the signature creates the BRIDS session
- this is not a transaction
- disconnect is an escape action, not a competing primary path

S10 changes the wallet-specific surface into a wallet proof panel with Motion-powered progress states (`Conectar`, `Firmar`, `Sesion`), a selected-wallet status, and phase-aware primary copy. The generic `Iniciar sesion` label is removed from the wallet proof path; signing now shows `Esperando confirmacion en Phantom` as a disabled progress state.

### F. Wallet proof indicators overused status colors
The S10 structure clarified the wallet signing intent, but the step chips and status badge used strong cyan/emerald treatments that read like separate colored buttons. That clashed with the modal's subdued BRIDS glass language and made `Verificando` / `Activa` feel too prominent.

S11 keeps the same information architecture but restyles those indicators as quiet glass states. Completed and active steps use white glass surfaces with a restrained cyan underline for motion; active wallet session status uses a neutral white glass badge instead of emerald. The result keeps progress legible without introducing a competing color system.

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
- S08 reload-flow review note: Phantom `autoConnect` can restore adapter signer availability after page reload even when BRIDS has no SIWS session; generic `Ingresar` should not expose `Conectada / Iniciar sesion` merely because the adapter rehydrated.
- S08 implementation: connected-wallet pending UI is now gated by explicit wallet intent. Header `Ingresar` clears wallet intent and shows the normal `Mail` / `Wallet` chooser; wallet-specific events/actions can still enter the connected-wallet signing path.
- S08 implementation detail: connected wallet status and `Copy Address` are hidden from the generic anonymous chooser unless the user has wallet intent or an authenticated wallet session.
- S08 targeted component validation: `npm test -- tests/components/wallet-modal-header-cta.test.ts` passed with 18 tests, including autoConnect-without-SIWS generic sign-in coverage and explicit wallet-intent coverage.
- S08 Playwright hardening: the header wallet CTA now has a stable `wallet-modal-open-button` test id, and the smoke helper retries the click once if route hydration delays the modal handler.
- S08 type validation: `npm run typecheck` passed.
- S08 docs governance validation: `npm run validate:docs-governance` passed.
- S08 browser validation: `npx playwright test e2e/wallet-modal-auth-entry.pw.spec.ts --project=playwright-smoke` passed with 9 tests.
- S09 visual review note: after wallet sign-in, `/marketplace` can refresh in-place without a navigation origin; the route shell should not use a page-level blur fallback for that auth refresh.
- S09 implementation: `navigation-origin` fallback motion now uses opacity/scale only, leaving origin-based route transitions intact while preventing full-page blur residue after wallet connection.
- S09 targeted validation: `npm test -- tests/lib/motion.test.ts tests/components/wallet-modal-header-cta.test.ts` passed with 24 tests, including a regression assertion that navigation fallback variants do not include `filter`.
- S09 type validation: `npm run typecheck` passed.
- S09 docs governance validation: `npm run validate:docs-governance` passed.
- S09 whitespace validation: `git diff --check` passed.
- S09 browser validation: `npx playwright test e2e/wallet-modal-auth-entry.pw.spec.ts --project=playwright-smoke` passed with 9 tests.
- S09 runtime browser check: `/marketplace` route wrapper computed `filter: none` with no wallet or onboarding overlay mounted after load.
- S10 UX review note: the wallet path needs its own intent model; after `Ingresar > Wallet`, showing `Iniciar sesion` beside disconnect reads as two competing actions while Phantom is actually waiting for a SIWS signature.
- S10 implementation: the wallet-specific modal content is now a wallet proof panel with selected-wallet status, `Conectar / Firmar / Sesion` progress chips, phase-aware Motion feedback, and copy that states the signature creates the BRIDS session without sending a transaction.
- S10 action hierarchy: the wallet proof primary action now reads `Solicitar firma en Phantom` when idle and `Esperando confirmacion en Phantom` while signing; the generic `Iniciar sesion` label is not rendered in this path. Pending disconnect copy is now `Cancelar y desconectar wallet`.
- S10 targeted component validation: `npm test -- tests/components/wallet-modal-header-cta.test.ts` passed with 19 tests, including signing-progress copy and disabled CTA coverage.
- S10 type validation: `npm run typecheck` passed.
- S10 docs governance validation: `npm run validate:docs-governance` passed.
- S10 whitespace validation: `git diff --check` passed.
- S10 browser validation: `npx playwright test e2e/wallet-modal-auth-entry.pw.spec.ts --project=playwright-smoke` passed with 9 tests.
- S11 visual review note: the S10 progress chips communicated intent, but their cyan/emerald badge palette felt disconnected from the BRIDS glass modal.
- S11 implementation: wallet proof status and progress chips now use quiet white-glass surfaces, restrained cyan underline motion, and no emerald active-session badge.
- S11 targeted component validation: `npm test -- tests/components/wallet-modal-header-cta.test.ts` passed with 19 tests, including assertions that `Pendiente` / `Activa` use glass styling and `Activa` avoids emerald styling.
- S11 type validation: `npm run typecheck` passed.
- S11 docs governance validation: `npm run validate:docs-governance` passed.
- S11 whitespace validation: `git diff --check` passed.
- S11 browser validation: `npx playwright test e2e/wallet-modal-auth-entry.pw.spec.ts --project=playwright-smoke` passed with 9 tests.

## Post-Review Hardening Validation Results
- S12 targeted component validation: `npm test -- tests/components/wallet-modal-header-cta.test.ts` passed with 19 tests.
- S12 type validation: `npm run typecheck` passed.
- S12 docs governance validation: `npm run validate:docs-governance` passed.
- S12 whitespace validation: `git diff --check` passed.
- S13 targeted motion/modal validation: `npm test -- tests/lib/motion.test.ts tests/components/wallet-modal-header-cta.test.ts` passed with 26 tests.
- S13 type validation: `npm run typecheck` passed.
- S13 docs governance validation: `npm run validate:docs-governance` passed.
- S13 whitespace validation: `git diff --check` passed.
- S15 clean-code pass: wallet proof UI was extracted from `WalletModal` into `WalletProofPanel`; auth authority remains in the parent.
- S15 targeted motion/modal validation: `npm test -- tests/components/wallet-modal-header-cta.test.ts tests/lib/motion.test.ts` passed with 26 tests.
- S15 type validation: `npm run typecheck` passed.
- S15 docs governance validation: `npm run validate:docs-governance` passed.
- S15 whitespace validation: `git diff --check` passed.
