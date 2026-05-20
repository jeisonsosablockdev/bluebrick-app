# BRI-160 - Clean-code refactor for WalletModal auth entry orchestration

## Status
- Documentation slice
- Parent issue: `BRI-160`
- Integration branch: `refactor/shared-wallet-modal-clean-code-bri-160-integration`
- Current slice: `refactor/shared-wallet-modal-clean-code-bri-160-s01-documentation-slice`

## Summary
- Refactor `components/WalletModal.tsx` to reduce responsibility concentration and improve readability without changing current auth behavior.
- Keep the current auth modal UI contract intact, including the `Mail` / `Wallet` method switcher, referral input, and primary CTA behavior.
- Create cleaner boundaries for auth-entry UI composition, wallet-auth orchestration, and auxiliary status/referral concerns.

## Why
- `WalletModal` currently mixes too many responsibilities in one component:
  - modal shell and navigation chrome
  - wallet connection/auth flow
  - federated entry switching
  - referral code capture and persistence
  - auth-link feedback
  - mobile/Phantom-specific behavior
  - post-auth reward handoff
- That concentration increases review cost, makes changes harder to localize, and weakens the `clean-code` standard now required explicitly by workflow governance.

## Confirmed Scope
- The UI shown in the login screenshot is part of `components/WalletModal.tsx`.
- Confirmed surface includes:
  - `Accede a tu cuenta`
  - `Ingresa a tu cuenta BRIDS`
  - `Mail` / `Wallet` method switcher
  - referral input section
  - primary auth CTA

## Goals
1. Split `WalletModal` into smaller, intention-revealing units.
2. Reduce mixed levels of abstraction inside the main component.
3. Preserve behavior, copy, and route/auth contracts.
4. Make future auth-entry changes easier to test and review.

## Non-Goals
- No trust-boundary or session policy changes.
- No product redesign of the auth modal.
- No change to wallet/federated linking semantics.
- No unrelated governance or workflow changes in this initiative.

## Likely Extraction Targets
- Auth entry card presentation
- Login method switcher
- Referral input section
- Primary wallet action cluster
- Status/feedback surface
- Local state derivation helpers where the current component mixes presentation and orchestration

## Validation
- `npx vitest run` on any WalletModal-focused or affected UI tests
- `npm run typecheck`
- `npm run validate`

## Notes
- This is a `refactor/*` initiative and therefore uses `docs/features/*` artifacts.
- The refactor should preserve the existing screenshot-level UI unless a small cleanup clearly improves readability without changing product intent.
