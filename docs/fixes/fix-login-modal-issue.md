# Fix: Login modal viewport anchoring and auth state clarity

## Status
- Initial implementation merged into `develop`.
- Post-review P1/P2 hardening implemented in S12-S13.
- P3 artifact sync implemented in S14.
- Clean-code extraction implemented in S15.
- Reviewer clean-code follow-up implemented in S16.
- Multi-slice fix plan remains active for follow-up hardening.
- Follow-up S31-S36 implemented locally for Phantom `autoConnect` route scoping.
- Linear issue key: `BRI-167`.

## Problem
The login modal currently shows inconsistent layout and auth-state behavior across `/marketplace` and `/`:

1. Viewport anchoring failure
- the page backdrop is dimmed and blurred
- the wallet/account dialog is open
- the dialog starts near the lower edge of the viewport
- the dialog appears visually attached to the marketplace map area instead of the browser viewport
- only part of the login panel can be reached in the initial view

2. Mixed connected-vs-signed-in state
- the modal says `Connected: <wallet>` even when the account/session state is not clearly signed in
- the same panel can still show `Mail` and `Wallet` entry choices
- users read this as "already logged in, but still being asked to connect"

3. Sign out does not visibly clear the wallet state
- clicking `Sign out & disconnect wallet` can leave the modal showing the connected wallet state
- it is unclear whether the SIWS session, WorkOS session, wallet adapter connection, or all three were cleared

4. Signed-in state exposes a confusing primary CTA
- after using the wallet sign-in path, the modal can show a colorful disabled-looking `Signed in` button
- that button competes with the real account actions and looks like something the user should click

## Why It Matters
Login is a browser-critical auth entry point. The current behavior makes users unsure whether they are connected, signed in, partially signed in, or signed out. That ambiguity is especially risky in BRIDS because wallet adapter connection is not the same thing as SIWS wallet authentication.

## Current Gaps
- `components/WalletModal.tsx` renders its `position: fixed` overlay inline where each page mounts `WalletModal`.
- Inline fixed overlays are fragile when any ancestor creates a containing block through transforms, filters, perspective, containment, or route-motion styles.
- The modal overlay uses centered flex alignment but does not own viewport-level overflow, so a taller or mis-anchored panel can appear clipped.
- Opening the modal focuses the close button. If the modal layer is page-local instead of viewport-owned, that focus can contribute to page scroll toward the modal's DOM/visual area.
- BRI-165 intentionally changed wallet recovery behavior for admin deploy:
  - `WalletRuntimeProvider` enables wallet-adapter `autoConnect`
  - `WalletModal` exposes a `Reconnect wallet` path for active SIWS sessions with disconnected Phantom
  - reconnect calls the wallet adapter `connect` path without rerunning SIWS
  - reconnect validates the recovered public key against the active session public key
- That BRI-165 behavior solved the admin case where SIWS remained valid but the live signer disappeared. It also makes the inverse public case more visible: Phantom can reconnect or remain connected while the SIWS/auth state is anonymous, expired, or still refreshing.
- S31-S36 scopes that recovery behavior to `/admin/assets/new` only. Public/login surfaces detect Phantom without selecting or reconnecting it until the user explicitly chooses Wallet.
- The UI currently mixes these states inside one panel:
  - wallet adapter connected
  - wallet SIWS session active
  - federated account session active
  - anonymous user with a selected/connected wallet
- `shouldShowDirectAuthEntryActions` is derived from session state only; it does not account for an already-connected wallet adapter.
- The primary wallet action can render `Signed in` as a prominent gradient button even when it is not an action the user should take.
- Existing component coverage checks content, but not the full state matrix for adapter connection, SIWS session, federated session, and disconnect.

## Post-Review Hardening Findings
The reviewer pass after the first implementation found three follow-up issues and one clean-code improvement area:

1. P1 logout refresh asymmetry
- Wallet login success refreshes the route after creating the SIWS session.
- Wallet-only logout clears local state and broadcasts logout, but does not refresh the route in the same branch.
- Risk: server-rendered protected or session-sensitive content can remain visible until the next navigation or manual refresh.
- Status: corrected in S12.

2. P2 reduced-motion coverage
- The new wallet proof progress states use Motion animation for progress and status feedback.
- Route-transition fallback/page variants can still animate even when `prefers-reduced-motion` is enabled.
- Risk: users who request reduced motion still receive repeated or page-level animation.
- Status: corrected in S13.

3. P3 artifact drift
- The problem and implementation artifacts still contain some pre-implementation status language.
- Risk: future slices and Linear updates can inherit stale assumptions about approval state or delivery status.
- Status: corrected in S14.

4. Clean-code extraction opportunity
- `components/WalletModal.tsx` now owns the portal, auth-state matrix, wallet proof panel, copy, disconnect, and motion presentation.
- Risk: the component remains correct but too concentrated, making future auth-state regressions easier to introduce.
- Status: corrected in S15 by extracting wallet proof presentation into `WalletProofPanel`.

## Final Clean-Code Audit
The final `code-refactoring-refactor-clean` audit found no blocking issues after S15.

Accepted residual debt:
- `WalletProofPanel` still receives a broad prop set; a future cleanup can group props into `session`, `actions`, `referral`, and `walletStatus`.
- Referral field copy is duplicated between the anonymous auth entry and wallet proof path; a future cleanup can extract a shared `ReferralCodeSection`.
- The wallet auth-state matrix in `WalletModal` is still dense but localized and covered by component tests.

The follow-up reviewer pass found one blocking boundary issue and one reduced-motion gap:
- A connected Phantom adapter could differ from the active SIWS session wallet while the modal still presented the session as active.
- The shell of the modal still used panel motion and a spinning status indicator when reduced motion was requested.

S16 corrected both issues. The modal now treats SIWS pubkey / adapter pubkey mismatch as an explicit mismatch state, hides copy/primary wallet actions in that state, and keeps disconnect available as the recovery action. The modal shell also gates overlay, panel, and status indicator motion for `prefers-reduced-motion`.

## Technical Debt Audit
The strict technical-debt audit after S16 found no behavior blockers, but identified four cleanup items that should be remediated before final closeout:

1. Large modal orchestrator
- `components/WalletModal.tsx` remains a high-change hotspot because it owns navigation chrome, modal shell, auth derivation, wallet adapter effects, referrals, WorkOS entry, onboarding, and auth sync.
- Risk: future auth/UI fixes can trigger shotgun changes in one large file.
- Slice: S17.

2. Broad wallet proof panel API
- `WalletProofPanel` receives many scalar props from `WalletModal`.
- Risk: prop drift and accidental coupling between parent state names and presentational UI.
- Slice: S18.

3. Duplicated referral field presentation
- Anonymous auth entry and wallet proof path repeat `ReferralCodeField` labels, placeholder, help text, value, and handlers.
- Risk: future copy/behavior changes can diverge across auth paths.
- Slice: S19.

4. Brittle test mock typing
- `tests/components/wallet-modal-header-cta.test.ts` uses `as never` for referral mock implementations.
- Risk: mocks can hide contract drift in referral hint shape.
- Slice: S20.

Resolution:
- S17 extracted the viewport modal shell into `components/wallet-modal/wallet-modal-shell.tsx`.
- S18 grouped `WalletProofPanel` props into `session`, `connection`, `referral`, and `actions`.
- S19 introduced `components/wallet-modal/referral-code-section.tsx` as the shared referral presentation owner.
- S20 typed the wallet modal test mocks and removed the brittle `as never` casts.

### Clean Code Audit After S21
The Clean Code audit after the private-route logout fix found no new blockers, but identified follow-up debt that should be resolved through TDD-first slices:

1. Oversized wallet modal orchestrator
- `components/WalletModal.tsx` still owns too many reasons to change: navigation chrome, auth derivation, wallet adapter effects, referrals, WorkOS entry, SIWS, onboarding reward, auth sync, mobile Phantom fallback, and render composition.
- Risk: a small auth or routing fix can unintentionally affect unrelated wallet, referral, or modal behavior.
- Slices: S23-S30 reduce this by extracting tested helpers one responsibility at a time.

2. `handleWalletPrimaryAction` mixes abstraction levels
- One function currently performs Phantom connection, SIWS signing, referral attribution, local auth mutation, profile fetch, onboarding decision, and navigation.
- Risk: future wallet sign-in changes are difficult to reason about and hard to test without full component setup.
- Slices: S26-S28 extract referral payload, wallet signing preparation, and post-auth decision handling behind focused tests.

3. Private route knowledge is hardcoded in the modal
- `WalletModal` knows private route prefixes directly.
- Risk: private route changes can drift from logout redirect behavior.
- Slice: S23 moves private-route detection to a shared tested helper.

4. Auth-state equality is noisy and duplicated
- `refreshAuthState` repeats the `federatedAvailable` comparison and keeps a long inline equality check inside the component.
- Risk: auth payload additions can be missed or duplicated in an inline conditional.
- Slice: S24 extracts an equality helper with tests.

5. Wallet modal tests are becoming a second hotspot
- `tests/components/wallet-modal-header-cta.test.ts` repeats large Phantom and auth fixtures.
- Risk: adding regressions requires copying setup, making test intent harder to read.
- Slice: S25 introduces focused test factories/helpers and migrates the duplicated setup incrementally.

6. `WalletProofPanel` still derives copy inside JSX
- The panel is presentational, but still computes titles, descriptions, status labels, and step state inline.
- Risk: visual copy/state changes require scanning nested ternaries in markup.
- Slice: S29 extracts a tested wallet proof view model.

## Expected Outcome
- The wallet/login modal is anchored to the browser viewport, not visually attached to the marketplace map or any page-local section.
- Opening the modal does not scroll the underlying page.
- Wallet adapter connection and authenticated session state are visually distinct.
- If a wallet adapter is connected but SIWS is not authenticated, the modal should ask the user to sign in with the connected wallet or disconnect it; it should not also present the default anonymous `Mail`/`Wallet` chooser as if nothing is connected.
- If SIWS wallet auth is active, the modal should show account status and secondary actions, not a colorful `Signed in` CTA.
- `Sign out & disconnect wallet` should visibly clear the active wallet/session UI or show an actionable error if the wallet adapter refuses to disconnect.
- Backend auth/session authority remains server-resolved and unchanged unless implementation review proves a route bug.

## Scope
Touched surfaces:
- `components/WalletModal.tsx`
- `tests/components/wallet-modal-header-cta.test.ts`
- `e2e/wallet-modal-auth-entry.pw.spec.ts`
- `docs/auth-flow.md`
- `docs/session-model.md`
- possibly `tests/api/auth-me-route.test.ts` or logout route coverage if investigation shows server response drift

Out of scope:
- changing SIWS verification, nonce generation, or role derivation
- changing WorkOS account creation/linking semantics
- changing wallet adapter library configuration unless disconnect investigation requires it
- redesigning the broader login modal visual language beyond state clarity

## Slice Model
- S01: spec/artifact slice for scope, state matrix, and gates.
- S02: modal viewport anchoring and scroll containment.
- S03: auth state matrix and `Signed in` CTA cleanup.
- S04: sign-out/disconnect investigation and fix.
- S05: responsive QA, docs sync, security/reviewer closeout.
- S06-S11: visual, reload-flow, sharpness, signing-intent, and progress-polish follow-up slices from browser review.
- S12: P1 wallet-only logout route refresh hardening. Implemented.
- S13: P2 `prefers-reduced-motion` hardening for modal progress and route transitions. Implemented.
- S14: P3 artifact status synchronization. Implemented.
- S15: clean-code extraction/refactor of wallet proof presentation without changing auth authority. Implemented.
- S16: clean-code reviewer follow-up for SIWS/adapter mismatch and reduced-motion modal shell. Implemented.
- S17: extract modal shell presentation from `WalletModal`. Implemented.
- S18: group `WalletProofPanel` props into cohesive prop objects. Implemented.
- S19: extract shared referral code section. Implemented.
- S20: remove brittle `as never` test mock typing. Implemented.
- S21: redirect private-route logout to public main instead of refreshing into forbidden content. Implemented.
- S22: document Clean Code audit findings and TDD remediation slices. Implemented.
- S23-S30: implemented TDD-first clean-code remediation slices.

### Clean Code Closeout After S30
S23-S30 resolved the post-S21 clean-code findings without changing auth authority:
- private-route logout routing now lives in `lib/navigation/private-routes.ts`
- auth-state equality now lives in `lib/auth-state.ts`
- repeated wallet modal test setup now uses local test factories
- referral auth payload construction now lives in `lib/referrals/client-state.ts`
- wallet signing preparation now lives in `lib/wallet-signing-prep.ts`
- post-auth decision and fallback reward contracts now live in `lib/post-auth-decision.ts`
- wallet proof copy, status, and progress derivation now lives in `lib/wallet-proof-view-model.ts`

Final clean-code pass after S30 found no new blocking issues in the wallet modal module. Accepted residual debt: `WalletModal` remains a large auth/navigation orchestrator, but the high-risk decision branches identified in this audit are now extracted behind focused tests.

New delivery slices must keep the existing BRI-167 auth boundary intact and land through the initiative hardening branch before merging back to `develop`.

## Open Questions
- The deployed screenshot may include a route-transition or browser-state combination not present in local JSDOM. The fix should therefore address the structural class of bug instead of only matching one browser capture.
- Does the reported "logged in" state mean the user sees `Connected: <wallet>`, or does `/api/auth/me` return `walletAuthenticated: true` while the modal still shows anonymous entry actions?
- When sign out appears to fail, does `/api/auth/logout` return non-OK, does Phantom refuse `disconnect()`, or does local UI state refresh back to a connected adapter after logout?
- Should a connected-but-not-SIWS-authenticated wallet still offer `Mail`, or should the modal switch to a wallet-pending state with a smaller link to use email instead?
- Resolved in follow-up S31: `autoConnect` should become scoped strictly to `/admin/assets/new`, the BRI-165 mint/deploy signer recovery surface.

## Follow-Up Artifact
- `docs/fixes/fix-bri-167-phantom-autoconnect-scope.md`
- `docs/fixes/fix-bri-167-phantom-autoconnect-scope-implementation.md`
