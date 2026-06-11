# Implementation: BRI-167 Phantom autoConnect scope

## Status
- Implemented locally across S31-S36.
- Branch: `fix/app-login-modal-issue-bri-167-s31-phantom-autoconnect-scope-spec`.
- Linear issue key: `BRI-167`.
- Problem artifact: `docs/fixes/fix-bri-167-phantom-autoconnect-scope.md`.

## Objective
Limit Phantom wallet auto-connect to `/admin/assets/new`, preserving BRI-165 admin deploy/mint signer recovery while restoring explicit wallet consent on public and account-entry routes.

## Governing Decision
`autoConnect` is not a global app default. It is a route-scoped behavior for the admin asset mint/deploy surface.

## Slice Plan
| Slice | Branch | Responsibility | Primary Scope | Tests / Evidence |
| --- | --- | --- | --- | --- |
| S31 | `fix/app-login-modal-issue-bri-167-s31-phantom-autoconnect-scope-spec` | Spec and traceability | New artifact pair, BRI-167 artifact/Linear trace | docs governance |
| S32 | `fix/app-login-modal-issue-bri-167-s32-runtime-autoconnect-scope` | Runtime provider scoping | `WalletRuntimeProvider`, route/layout usage for `/admin/assets/new` | provider tests, route composition assertions if available |
| S33 | `fix/app-login-modal-issue-bri-167-s33-wallet-selection-intent` | Phantom selection intent boundary | `WalletModal` mount effect and explicit wallet action path | modal tests for no mount selection and explicit select/connect |
| S34 | `fix/app-login-modal-issue-bri-167-s34-admin-reconnect-regression` | Preserve BRI-165 admin recovery | admin asset route/modal reconnect behavior | admin reconnect regression tests, Synpress or browser evidence if feasible |
| S35 | `fix/app-login-modal-issue-bri-167-s35-cross-context-loop-qa` | Focus/visibility/storage loop guard | auth sync/focus revalidation behavior | targeted tests or browser proof for no reconnect loop on public routes |
| S36 | `fix/app-login-modal-issue-bri-167-s36-docs-qa-review` | Docs, QA, clean-code closeout | `docs/auth-flow.md`, `docs/session-model.md`, final validation | Playwright, Synpress as applicable, `npm run validate`, clean-code review |

All delivery slices were implemented in the active branch to keep the bugfix atomic, while preserving the slice ownership boundaries above for review.

## Technical Notes
- Prefer a small prop on `WalletRuntimeProvider`, for example `autoConnect?: boolean`, with default `false`.
- The admin asset route/layout should opt in explicitly.
- Avoid broad path checks inside the provider if a route-level prop is practical.
- If explicit wallet action needs adapter access after removing mount-time selection, the action handler must select/connect in the same user-initiated flow without relying on previous mount state.
- Keep SIWS and WorkOS authority unchanged.

## Security Boundary
- No client-side role trust.
- No new auth cookie.
- No SIWS nonce or verification change.
- No WorkOS callback or logout change.
- Adapter connection remains signer availability only, not BRIDS authorization.

## Documentation Plan
After implementation, update:
- `docs/auth-flow.md`
- `docs/session-model.md`
- parent BRI-167 artifacts if slice status changes

The docs must explicitly state:
- public routes do not auto-connect Phantom
- `/admin/assets/new` is the scoped exception for signer recovery
- server-side SIWS remains required for wallet authority

## Implementation Notes
- S32: `components/wallet/wallet-runtime-provider.tsx` now defaults `autoConnect` to `false` and computes route opt-in from `autoConnectPathnames`.
- S32: `app/admin/layout.tsx` passes `autoConnectPathnames={["/admin/assets/new"]}` so the provider remains single-owner for admin chrome while the reconnect behavior is route-scoped.
- S33: `components/WalletModal.tsx` no longer selects Phantom during mount.
- S33: explicit wallet intent still selects Phantom and calls the selected Phantom adapter connect path when no adapter is selected yet.
- S34: the existing reconnect regression remains covered: active SIWS + disconnected adapter shows `Reconectar Phantom`, calls `connect()`, and does not start SIWS.
- S35: public focus/visibility/auth refresh remains auth-only; the removed mount-time select plus default-off runtime prevent those refreshes from becoming reconnect loops.

## Evidence
- `npm run test -- tests/components/wallet-runtime-provider.test.ts tests/components/wallet-modal-header-cta.test.ts` passed with 27 tests.
- `npm run typecheck` passed.
- `npm run validate:docs-governance` passed.
- `npm run e2e:playwright -- e2e/wallet-modal-auth-entry.pw.spec.ts e2e/admin-assets-new.responsive.pw.spec.ts` passed with 10 tests.
- `npm run e2e:synpress` passed with 1 Phantom extension smoke test.
- Browser/node REPL inspection on `http://localhost:3000/` showed the anonymous modal buttons as `Mail`, `Wallet`, and referral entry, with no `Connect & Sign in` action.
- `npm run validate` passed.
- Clean-code pass found no blocking findings: runtime scoping, modal intent handling, and regressions remain separated by responsibility.
- Linear BRI-167 document attachment was attempted, but the Linear connector returned `token_expired`; local artifacts are ready to attach after connector re-authentication.

## Definition of Done
- All slice-specific tests pass.
- `npm run validate` passes.
- Playwright covers the public login modal state.
- Synpress is run if a wallet-extension path is exercised as final proof.
- Clean-code reviewer pass finds no unresolved blocking issue.
- Linear BRI-167 links to this artifact pair after connector re-authentication.
