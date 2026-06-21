# Fix: BRI-167 Phantom autoConnect scope

## Status
- Implemented locally across S31-S36.
- Branch: `fix/app-login-modal-issue-bri-167-s31-phantom-autoconnect-scope-spec`.
- Linear issue key: `BRI-167`.
- Parent artifact: `knowledge/fixes/fix-login-modal-issue.md`.

## Problem
BRI-165 intentionally enabled wallet-adapter `autoConnect` so `/admin/assets/new` could recover a live Phantom signer after navigation or refresh while the admin SIWS session remained valid. That solved the deploy/mint signer recovery bug.

The behavior is currently shared by every route that mounts `WalletRuntimeProvider`. Public and account-entry routes can therefore see Phantom installed or previously authorized, select the Phantom adapter, and re-enter a wallet connection path even when the user wants to browse, choose Mail, or decline wallet connection.

The user-facing symptom is:
- the site discovers Phantom
- the user is repeatedly pushed toward connecting the wallet
- there is no clear opt-out path to keep browsing or use non-wallet auth
- the modal can keep surfacing wallet-specific actions even though wallet connection should be explicit

## Why It Matters
Wallet connection is a consent-sensitive browser action. Detecting that Phantom exists is not equivalent to the user choosing to connect it.

BRIDS still needs signer recovery for admin deploy/mint, but that need is route-specific. Applying the same reconnect behavior to public entry points weakens the UX contract and makes wallet auth feel mandatory.

## Root Cause Candidates
1. `WalletRuntimeProvider` enables wallet-adapter `autoConnect` globally.
2. `WalletModal` selects `PhantomWalletName` during mount when no wallet is selected.
3. In `@solana/wallet-adapter-react`, `select()` persists the selected wallet name, and `autoConnect` uses the selected adapter to call `adapter.autoConnect()` or `adapter.connect()`.
4. BRI-167 gated the generic modal UI with `hasWalletAuthIntent`, but it did not scope adapter auto-connect to the route that actually needs signer recovery.

## Decision
Use option B:

`autoConnect` must be scoped to `/admin/assets/new`, the route where mint/deploy signer recovery is required.

Default behavior everywhere else:
- Phantom may be detected as installed.
- Phantom must not be auto-selected only because the component mounted.
- Phantom must not auto-connect on public/account routes.
- Wallet connection starts only after explicit user intent.

Admin behavior on `/admin/assets/new`:
- Keep signer recovery for active SIWS/admin sessions.
- Keep the `Reconnect Phantom` path.
- Keep mismatch protection: recovered wallet public key must match `authState.pubkey`.
- Do not rerun SIWS for simple signer recovery.

## Scope
In scope:
- Make wallet runtime auto-connect configurable and default-off.
- Enable auto-connect only for `/admin/assets/new`.
- Audit or remove mount-time Phantom selection from public auth surfaces.
- Preserve explicit wallet sign-in/linking behavior.
- Add tests proving public routes do not auto-connect while `/admin/assets/new` does.
- Update auth/session docs after implementation.

## Expected Outcome
- On `/`, `/marketplace`, `/checkout`, and other public/account routes, a user with Phantom installed can choose not to connect.
- Opening the generic login modal shows `Mail` and `Wallet` choices without wallet prompt pressure.
- Clicking `Wallet` remains the explicit path that can select/connect Phantom and start SIWS.
- `/admin/assets/new` can still recover a previously authorized Phantom signer for deploy/mint.
- Auth/session authority remains server-resolved.

## Implementation Summary
- `WalletRuntimeProvider` now defaults wallet-adapter `autoConnect` to `false`.
- `WalletRuntimeProvider` accepts scoped route opt-ins through `autoConnectPathnames`.
- `app/admin/layout.tsx` opts in only for `/admin/assets/new`.
- `WalletModal` no longer calls `select(PhantomWalletName)` on mount.
- The explicit Wallet action still selects Phantom and connects the adapter during the user-initiated flow.

## Acceptance Criteria
- Public runtime default does not pass wallet-adapter `autoConnect`.
- `/admin/assets/new` runtime does pass wallet-adapter `autoConnect`.
- Public modal mount does not select Phantom before explicit wallet intent.
- Explicit `Wallet` action still selects/connects Phantom.
- Authenticated admin session with disconnected adapter still gets a working reconnect path on `/admin/assets/new`.
- Mismatched recovered wallet remains blocked.
- Focus/visibility/auth-sync revalidation does not trigger wallet connect loops.
