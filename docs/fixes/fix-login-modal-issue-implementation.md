# Implementation: Login modal viewport anchoring and auth state clarity

## Status
- Artifact-only scope review.
- Implementation is intentionally paused until this slice plan is accepted.
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

Current local draft branch:

`fix/app-login-modal-issue`

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
| S01 | in-review | `fix/app-login-modal-issue-bri-167-s01-spec` | Finalize scope, risks, state matrix, and acceptance gates | `docs/fixes/fix-login-modal-issue.md`, `docs/fixes/fix-login-modal-issue-implementation.md` | artifact review, docs governance later in closeout | TBD |
| S02 | pending | `fix/app-login-modal-issue-bri-167-s02-modal-viewport` | Make the modal viewport-owned and stop page scroll-on-open | `components/WalletModal.tsx`, component test coverage, Playwright modal bounding-box evidence | targeted Vitest, `/marketplace` + `/` Playwright screenshots, responsive 320/375/768/1024 | TBD |
| S03 | pending | `fix/app-login-modal-issue-bri-167-s03-auth-state-matrix` | Separate wallet adapter connection from authenticated session UI | `WalletModal` derived state names and render branches, focused component tests | targeted Vitest for anonymous, connected-pending-auth, wallet session, federated-only states | TBD |
| S04 | pending | `fix/app-login-modal-issue-bri-167-s04-disconnect-signout` | Verify and tighten sign-out/disconnect behavior without changing server authority | `WalletModal` disconnect flow; API tests only if route behavior is implicated | targeted Vitest, possible `tests/api/auth-me-route.test.ts` or logout tests, manual/browser proof | TBD |
| S05 | pending | `fix/app-login-modal-issue-bri-167-s05-qa-review-docs` | Close frontend/auth QA, docs sync, clean-code reviewer gate | docs updates, responsive evidence, full validation | Playwright, Synpress if wallet auth path is exercised, `npm run validate`, clean-code pass | TBD |

## Order Of Execution
1. Complete S01 and get explicit approval for the slice map.
2. Run S02 first because viewport anchoring affects all modal evidence and screenshots.
3. Run S03 after viewport behavior is stable so UI-state assertions are not polluted by layout bugs.
4. Run S04 after state labels are clear, because disconnect success/failure must be validated against the final state matrix.
5. Run S05 last as aggregation: responsive QA, auth/session docs, security check, reviewer/clean-code closeout.

## Root-Cause Analysis
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
- `Sign out & disconnect wallet` visibly removes connected/session UI after success.
- If any logout/disconnect layer fails, the modal shows an explicit error and does not claim the user is fully signed out.
- Required auth/session docs are updated after implementation.
- Responsive evidence is captured at 320, 375, 768, and 1024 widths.
- `npm run validate` passes.
- Explicit clean-code/reviewer pass has no unresolved blocking findings.

## Validation Results
- Pending implementation.
