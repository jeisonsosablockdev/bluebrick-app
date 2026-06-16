# feature(shared): pwa installability and web push notifications (BRI-157)

## Status

- Planning artifact
- Parent issue: `BRI-157`
- RFC: `docs/rfcs/EPIC-013-pwa-installability-and-web-push-notifications/README.md`
- Integration branch: `feature/shared-pwa-web-push-bri-157-integration`
- Current slice: `feature/shared-pwa-web-push-bri-157-s08-user-push-opt-in-enrollment`

## Summary

This feature note tracks the governed execution plan for `EPIC-013`.

The initiative introduces:

- PWA installability shell for BRIDS
- capability-aware opt-in UX for installability and notifications
- secure web push subscription persistence aligned with hybrid auth
- transactional delivery pipeline with pruning and auditability
- admin campaigns only after explicit abuse controls
- QA, rollout gates, observability, and kill-switch coverage

## Current decisions

- The epic is anchored to `BRI-157` as the parent issue.
- Slice work must flow through the integration branch, not directly to `develop`.
- The current auth baseline is hybrid:
  - `workos` account session
  - `siws_session` wallet session
- Subscription ownership must be resolved server-side from the authenticated account context, and may also capture `wallet_public_key` when a wallet-authenticated session exists.
- Marketing-style broadcast remains blocked until:
  - delivery health exists
  - pruning exists
  - preview/dry-run exists
  - audience caps exist
  - audit logging exists
- `S02` ships only a minimal service worker:
  - registration is global so installability criteria can be met
  - no fetch interception or auth caching is allowed in this slice
  - no notification permission prompt is fired yet
- Installability UX is capability-aware, not authority-bearing:
  - protected profile surfaces may explain install state and platform constraints
  - subscription ownership, consent persistence, and push delivery stay deferred to later slices
- `S03` binds subscription ownership to the server-resolved SIWS wallet session:
  - `/api/notifications/subscriptions` rejects account-only sessions
  - endpoint ownership is unique and cannot be silently reassigned across accounts or wallets
  - revoke and re-register are explicit lifecycle transitions on the same endpoint
- `S04` adds a transactional-only delivery pipeline instead of a public broadcast surface:
  - `POST /api/internal/notifications/enqueue` creates idempotent delivery jobs by `dedupeKey`
  - `POST /api/internal/notifications/process` advances jobs in bounded batches and can be driven by QStash or an internal worker token
  - `410/404` delivery failures prune dead endpoints immediately; transient provider failures mark the subscription as `failing`
  - the first release remains wallet-targeted and transactional; there is still no mass marketing endpoint
- `S05` adds a guarded admin campaign surface instead of free-form broadcast:
  - `/admin/notifications` exposes preview, dry-run, and queue actions for admin notices
  - `/api/admin/notifications/campaigns/preview` resolves audience only from real fields (`country`, `platformFamily`, `appMode`)
  - `/api/admin/notifications/campaigns/send` requires a fresh `previewHash`, rate limits the actor, caps total audience, and rejects external URLs
  - every campaign is classified, audited, and fan-outs through the S04 transactional job pipeline
- `S06` closes rollout and operability gates:
  - shared rollout helpers now gate service worker installability, subscription registration, and push delivery
  - `/api/admin/notifications/health` exposes a minimal health snapshot for subscriptions, delivery attempts, and active rollout flags
  - the admin notifications console renders initial health data alongside campaign controls
  - responsive E2E evidence now covers `/admin/notifications` for admin-wallet sessions when the local wallet fixture is available
- The generated PWA icons now derive from the real `brids-mark` asset instead of the temporary typographic placeholder:
  - `/apple-icon`, `/pwa-icons/192`, and `/pwa-icons/512` stay aligned with the actual BRIDS mark after `#222`
- Installation and push consent are now treated as separate states:
  - adding BRIDS to Home Screen or installing the shell never implies notification consent by itself
  - the user still needs a direct tap to grant browser permission and persist the device subscription
- `R01` starts the clean-code follow-up from `STORY-013-07`:
  - `lib/notifications/admin-campaigns.ts` now acts as a stable facade instead of hosting the full implementation
  - admin campaign config, domain normalization, audience lookup, persistence, and service orchestration were split into internal modules
  - route and test imports stay unchanged, so the public contract remains stable while the module boundary gets cleaner

## Slice map

| Slice | Branch | Responsibility |
| --- | --- | --- |
| `S01` | `feature/shared-pwa-web-push-bri-157-s01-kickoff-threat-model` | docs, traceability, parent feature note, execution guardrails |
| `S02` | `feature/shared-pwa-web-push-bri-157-s02-installability-opt-in-ux` | manifest, icons, standalone shell, installability UX |
| `S03` | `feature/shared-pwa-web-push-bri-157-s03-subscription-contract-persistence` | schema, repository, API contract, subscription lifecycle |
| `S04` | `feature/shared-pwa-web-push-bri-157-s04-delivery-pipeline-transactional-sends` | delivery service, pruning, transactional send pipeline |
| `S05` | `feature/shared-pwa-web-push-bri-157-s05-admin-campaigns-abuse-controls` | admin sender, preview, dry-run, safe segmentation |
| `S06` | `feature/shared-pwa-web-push-bri-157-s06-qa-rollout-kill-switch` | QA evidence, rollout controls, observability, kill-switch |
| `S08` | `feature/shared-pwa-web-push-bri-157-s08-user-push-opt-in-enrollment` | direct user opt-in, VAPID bootstrap, current-device subscribe/revoke |

## Risks

- Push can become a spam surface if admin sending is introduced before hard controls.
- Identity semantics are easy to weaken if account-only sessions and wallet-bound actions are mixed.
- A single-row-per-user subscription model would be incorrect for hybrid auth and multi-device usage.
- Request-bound fan-out would be fragile under retries, partial failure, and delivery timeouts.

## Exit criteria

- Each slice lands through PR into `feature/shared-pwa-web-push-bri-157-integration`.
- Schema work passes `validate:db`.
- Frontend work passes repo validation and responsive QA.
- The integration branch is merged to `develop` only after the guarded slice sequence is complete.

## Refactor Follow-up

- `R02` splits `lib/notifications/delivery-jobs.ts` into internal modules for domain types, storage, processing, queue wiring, and actor resolution while keeping the public facade stable for routes and tests.
- `R03` splits the `/admin/notifications` console into a thin orchestrator plus a dedicated hook, health summary, campaign form, and preview table so UI rendering no longer owns request state and payload assembly.
- `R04` consolidates notification-route schemas and JSON error helpers inside the notifications bounded context, reducing route duplication without changing status codes or payload shapes.
- `R05` centralizes notifications runtime config for database presence, rollout/env flags, QStash wiring, worker tokens, and VAPID requirements so domain modules stop reading the same environment values independently.
- Follow-up fix on `BRI-157` switches generated PWA icons and the Apple icon shell to the real brand asset:
  - `lib/pwa/icon-template.tsx` now renders `public/brand/brids-mark.svg` instead of the temporary typographic `B`
  - `/apple-icon`, `/pwa-icons/192`, and `/pwa-icons/512` therefore stay aligned with the actual BRIDS mark during install prompts and home-screen save flows
  - the lighter outer halo frame was removed so the installed icon no longer wraps the mark in a second bright card
- `S08` closes the end-user consent gap:
  - `components/pwa/pwa-capability-card.tsx` now exposes direct enable/disable controls for the current device
  - `app/api/notifications/subscriptions/bootstrap/route.ts` exposes VAPID bootstrap data plus active wallet-bound subscriptions for the signed-in wallet
  - the user must still grant permission explicitly; installation alone never auto-enrolls the device
