---
type: Feature Spec
title: Feature App Profile Completion Reward Prompt BRI- 151
description: Feature App Profile Completion Reward Prompt BRI- 151 - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/feature-app-profile-completion-reward-prompt-bri-151.md
---

Last Updated: 2026-05-06

# Feature: App Profile Completion Reward Prompt (`BRI-151`)

## Summary
- Replace the forced redirect to profile editing immediately after wallet connection with a decision modal.
- Let the user choose between `Explorar ahora` and `Completar perfil`.
- Create a permanent wallet-bound onboarding reward record at initial registration time.
- Add a promotional CTA that explains: `Completa tu perfil y gana $10 USD`.
- Make the reward server-authoritative, one-time-use, and only consumable as a discount toward the user's tokenized fraction purchase.
- Require explicit profile completion plus verified KYC before the reward can move to `earned`.
- Persist deadline, KYC review grace, earned, reserved, consumed, and expired states so the benefit remains auditable inside the profile domain.

## Product Intent
- Reduce the feeling that the app is forcing the user into profile setup the moment they connect a wallet.
- Keep profile completion prominent by offering a visible incentive instead of a hard redirect.
- Preserve trust boundaries by making reward eligibility, award, reservation, and consumption server-authoritative.

## Core Business Rules
- First wallet-linked registration creates one onboarding reward row linked to the canonical `wallet_public_key`.
- The existing wallet-first identity model remains the base rule: one wallet maps to one profile, and the same wallet cannot create multiple reward rows for the same program.
- The reward is not cash, not withdrawable, and not transferable. It is only a checkout discount entry persisted in the backend and surfaced in the user profile.
- The reward amount must be data-configurable. The initial active campaign is `$10 USD`, but later campaigns may change value without rewriting the business rule.
- The reward entry remains visible permanently in profile history even after consumption or expiration.
- Explicit profile completion rule for this feature:
  - required: `username`, `firstName`, `lastName`, `email`, `country`, `address`, `phone`
  - conditionally required: `stateProvince` when the chosen country uses deterministic division validation in the current profile form
  - optional: `bio`, `avatarUrl`
- KYC rule for reward qualification:
  - user-controlled step: the KYC session must be submitted before the qualification deadline
  - award step: the reward only becomes `earned` after `kyc_cases.kyc_status = verified`
- Deadline rule:
  - `qualification_deadline_at = initial_registration_at + 7 days` for the initial campaign
  - if the user completes the required profile fields and submits KYC before the deadline, the reward moves to `pending_review`
  - `pending_review` has a bounded provider grace window: `kyc_review_grace_deadline_at = kyc_submitted_at + 72 hours`
  - provider verification may finish after day 7 and still promote the reward to `earned`, but only if it lands before `kyc_review_grace_deadline_at`
- Expiration rule:
  - if required profile completion did not happen before the deadline, or KYC was never submitted before the deadline, the reward moves to `expired`
  - if KYC was submitted in time but provider verification did not complete within the 72-hour grace window, the reward also moves to `expired`
- Consumption rule:
  - an `earned` reward can be reserved by exactly one order
  - if the order is paid, the reward becomes `consumed`
  - if the order fails, expires, or is canceled, the reservation is released and the reward returns to `earned`
- MVP assumption to keep the feature bounded:
  - if the reward amount is greater than the order subtotal, the applied discount is capped at the subtotal and any leftover promotional value is burned because the benefit is single-use

## Proposed UX
- After first successful wallet connection for a newly registered wallet-bound profile, show a decision modal instead of navigating directly into profile editing.
- Modal primary actions:
  - `Explorar ahora`
  - `Completar perfil`
- The modal includes a promotional button/card with subtle animation to draw attention without blocking the other choice.
- CTA copy:
  - `Completa tu perfil y gana $10 USD`
- Fine print:
  - `* Válidos para la compra de su fracción tokenizada. Debe completar el registro para poder ganarlos y tiene una semana después de su conexión inicial para reclamarlos.`
- If the user chooses `Explorar ahora`, the app should keep a persistent but non-blocking reminder in the main product surface until the reward is `earned`, `consumed`, or `expired`.
- The protected profile view should expose the reward state explicitly:
  - amount
  - current status
  - remaining time when still in qualification window
  - consumed/expired history when no longer actionable

## Proposed Data Model
- New table: `onboarding_reward_programs`
  - purpose: configure campaign amount and qualification window without hardcoding `$10`
  - minimum fields:
    - `id`
    - `code` (for example `profile_completion_bonus`)
    - `reward_amount_usd`
    - `qualification_window_days`
    - `starts_at`
    - `ends_at`
    - `is_active`
    - `created_at`
    - `updated_at`
- New table: `user_onboarding_rewards`
  - purpose: permanent wallet-bound record for qualification, earning, reservation, and consumption
  - minimum fields:
    - `id`
    - `wallet_public_key` FK -> `user_profiles(wallet_public_key)`
    - `program_id` FK -> `onboarding_reward_programs(id)`
    - `status` (`pending_profile`, `pending_kyc`, `pending_review`, `earned`, `reserved`, `consumed`, `expired`)
    - `initial_registration_at`
    - `qualification_deadline_at`
    - `profile_completed_at`
    - `kyc_submitted_at`
    - `kyc_review_grace_deadline_at`
    - `kyc_verified_at`
    - `earned_at`
    - `reward_amount_usd_snapshot`
    - `reserved_order_id`
    - `reserved_at`
    - `consumed_order_id`
    - `consumed_at`
    - `expired_at`
    - `created_at`
    - `updated_at`
  - constraints:
    - unique active reward row per `wallet_public_key` and campaign
    - unique `reserved_order_id` / `consumed_order_id` bindings when present
- Extend `orders`
  - add `subtotal_amount_usd`
  - add `discount_amount_usd`
  - add `applied_onboarding_reward_id`
  - keep `total_amount_usd` as final payable amount after discount
- Audit/event expectations:
  - emit compliance/profile audit events when the reward changes qualification state
  - emit checkout/order audit events when the reward is reserved, released, or consumed

## Reward State Model
- `pending_profile`
  - initial row exists, but required profile fields are still incomplete
- `pending_kyc`
  - required profile fields are complete, but KYC submission is still missing
- `pending_review`
  - required profile fields are complete and KYC was submitted before deadline; waiting for provider verification inside the 72-hour grace window
- `earned`
  - reward fully qualified and available for one checkout
- `reserved`
  - reward is temporarily bound to a live order
- `consumed`
  - reward was used successfully in a paid order and cannot be used again
- `expired`
  - user did not satisfy the qualifying actions before deadline and no review freeze was established

## Checkout Integration
- The reward must be consumed through the existing checkout domain, not through a separate balance or payout flow.
- Reservation must happen inside the order transaction:
  - read the candidate reward row with `SELECT ... FOR UPDATE`
  - verify `status = earned`
  - write the order totals and reward reservation atomically
- Successful payment finalization must move the reward from `reserved` to `consumed` in the same server-authoritative order transition path.
- Failed, expired, or canceled orders must release the reward back to `earned`.
- The client must never send the discount amount as a source of truth. The server computes it from the reward row and order subtotal.

## Guardrails
- No forced profile redirect immediately after wallet connection.
- No client-only reward-award or reward-consumption logic.
- No assumption that wallet connection alone means registration is complete.
- No direct token/USDC transfer for this incentive.
- No duplicate award or duplicate consumption under concurrent requests.
- No checkout path where the reward can be spent without a persisted and locked backend record.
- No dependency on UI fine print as the enforcement mechanism.

## Slice Plan

### S01
- Branch: `feature/app-profile-completion-reward-prompt-bri-151-s01-decision-modal-ux`
- Objective: build the decision modal and replace the current forced post-connect redirect.
- Scope:
  - onboarding decision modal
  - `Explorar ahora` / `Completar perfil` action flow
  - promotional CTA copy and subtle animation
  - persistent reminder surface when the user skips immediate completion
  - initial responsive behavior

### S02
- Branch: `feature/app-profile-completion-reward-prompt-bri-151-s02-reward-state-persistence`
- Objective: persist the reward program and the wallet-bound onboarding reward ledger.
- Scope:
  - schema/migration for `onboarding_reward_programs`
  - schema/migration for `user_onboarding_rewards`
  - initial registration timestamp persistence
  - reward amount snapshot persistence
  - deadline and KYC review grace persistence
  - repository and service contracts

### S03
- Branch: `feature/app-profile-completion-reward-prompt-bri-151-s03-reward-award-logic`
- Objective: implement the server-side qualification and award engine with explicit completion and KYC rules.
- Scope:
  - explicit completion invariants tied to the current profile contract
  - 72-hour KYC review grace on timely KYC submission
  - backend decision path for `pending_*`, `earned`, and `expired`
  - row-lock / race-safe award transitions
  - tests for reward eligibility transitions and concurrency

### S04
- Branch: `feature/app-profile-completion-reward-prompt-bri-151-s04-checkout-credit-consumption`
- Objective: bind the earned reward atomically into checkout and one-time order consumption.
- Scope:
  - `orders` pricing extension
  - reward reservation and release logic
  - one-time consumption on successful payment
  - order/reward locking and idempotency around concurrent checkout attempts
  - checkout tests for cap, reserve, release, and consume

### S05
- Branch: `feature/app-profile-completion-reward-prompt-bri-151-s05-qa-docs`
- Objective: close responsive QA, browser evidence, and docs sync for the new onboarding and reward path.
- Scope:
  - Playwright and Synpress coverage
  - responsive QA at required widths
  - MCP browser evidence
  - updates to `knowledge/auth-flow.md` and `knowledge/session-model.md`
  - final feature note sync and reward-state documentation

## Integration Branch
- Parent branch: `feature/app-profile-completion-reward-prompt-bri-151-integration`

## Validation Targets
- S01: `npm run validate && npm run e2e:playwright`
- S02: `npm test && npm run validate`
- S03: `npm test && npm run validate`
- S04: `npm test && npm run validate`
- S05: `npm run e2e && npm run validate`

## Mandatory Tests
1. Race condition test: multiple concurrent qualification/award requests still produce one `earned` transition only.
2. Deadline boundary test: qualify at `7 days - 1 second` and reject at `7 days + 1 second` when KYC was not submitted in time.
3. KYC grace test: user submits KYC in time, provider verifies after day 7 but before `kyc_submitted_at + 72 hours`, reward still reaches `earned`.
4. KYC grace expiration test: user submits KYC in time, but provider verification arrives after the 72-hour grace window, reward expires.
5. One-time consumption test: reward can be reserved and consumed by one order only.
6. Release test: failed/expired/canceled order releases a `reserved` reward back to `earned`.
7. Program amount snapshot test: changing active campaign value later does not mutate previously created reward rows.
8. Order subtotal cap test: discount cannot exceed subtotal, and the client cannot override server-computed discount.

## Traceability
- Linear issue: `BRI-151`
- 2026-05-07: referral rewards were moved out of `Overview` into a dedicated protected dashboard tab at `/protected/referrals` so the onboarding reward flow does not compete with the referral program surface.
- 2026-05-09: the post-auth onboarding decision modal was visually reworked to match the wallet modal's crystal language more closely, reduce secondary type scale, and center the mobile presentation instead of anchoring it low in the viewport.
- Integration branch: `feature/app-profile-completion-reward-prompt-bri-151-integration`

## Implementation Status
- Status: `implemented in integration branch`
- Delivered slices in code:
  - `S01`: post-auth decision modal, animated CTA, and protected-shell reminder path
  - `S02`: reward program + reward ledger persistence, registration timestamp, deadline snapshot, and order pricing schema extension
  - `S03`: server-side reward qualification engine for profile completion, KYC submission, review grace, earned, and expired transitions
  - `S04`: checkout reservation/release/consume flow with server-computed discount and order linkage
  - `S05`: auth/session docs sync and targeted regression tests for reward registration and KYC-driven transitions
- Implemented backend surfaces:
  - reward registration on `POST /api/auth/verify`
  - reward snapshot on `GET/PUT /api/protected/profile`
  - reward recalculation on Stripe session start, Stripe webhook processing, and admin KYC decision
  - reward reservation via `POST /api/checkout/order`
- Implemented persistence:
  - `db/migrations/024_onboarding_profile_completion_rewards.sql`
  - `onboarding_reward_programs`
  - `user_onboarding_rewards`
  - `orders.subtotal_amount_usd`
  - `orders.discount_amount_usd`
  - `orders.applied_onboarding_reward_id`
- Verification implemented in repo:
  - migration test for reward schema
  - reward service tests for profile completeness and KYC grace timing
  - route-level tests for auth verify, profile route, Stripe KYC session route, Stripe webhook handling, and admin KYC decisions
- Post-implementation follow-up:
  - `ThemeToggle` now hydrates from the default server theme and resolves browser theme after mount, preventing the home-shell hydration mismatch caused by client-only theme state.
  - admin collections Playwright flow now asserts the mounted `Blockchain panel` heading so the smoke suite matches the current read-only blockchain shell copy.
  - Synpress runtime now declares `playwright-core` and `esbuild` explicitly so Phantom cache bootstrap can resolve the packages it imports before the wallet smoke suite starts.
  - `auth-client` now guards wallet/auth JSON parsing so empty or malformed auth responses surface controlled errors instead of the raw `Unexpected end of JSON input` message inside the wallet modal.
  - onboarding reward registration and lookup are now best-effort on auth/profile routes so missing reward tables do not block SIWS login or profile reads while the reward schema is being rolled out.
  - `db:migrate` now ignores untracked local migration drafts by default, preventing unrelated workspace-only referral SQL files from blocking the onboarding reward schema rollout.
  - onboarding reward UI copy is now localized across `en/es/pt` in the wallet decision modal, dashboard reminder, profile status card, checkout credit block, and localized deadline/window formatting.

## Critique (Staff Engineer)
- **Reviewer(s)**: `Gemini Code Assist (Staff Engineer)`
- **3 Critical Weaknesses**:
  1. **Vaguedad en la Definición de "Completar Perfil"**: El documento indica que "las invariantes de completitud de perfil deben definirse explícitamente antes de que se fusione la lógica" (en el S03). Esto es una debilidad arquitectónica crítica. Un plan de feature que otorga incentivos económicos no puede aprobarse si el mecanismo de disparo principal (qué campos exactos o si requiere KYC verificado) se difiere a la fase de implementación.
  2. **Vulnerabilidad a Ataques Sybil (Falta de Vinculación Tecnológica)**: Ofrecer un valor monetario por "completar un perfil" crea un vector de ataque inmenso para bots. Aunque el copy dice "* Válidos para la compra de su fracción tokenizada", el diseño técnico *no especifica el mecanismo para hacer cumplir esto de manera segura*. ¿Es un saldo en un ledger off-chain? ¿Un cupón de descuento en el checkout fiat/crypto? Si no se ata criptográficamente o en el backend al evento de compra final, es un riesgo inaceptable.
  3. **Falta de Control de Concurrencia (Idempotencia)**: El S03 no menciona bloqueos a nivel de fila de base de datos (`SELECT ... FOR UPDATE`) en el momento de adjudicar el premio. Sin esto, un cliente podría enviar solicitudes concurrentes de "perfil completado" y provocar que la condición de carrera otorgue el estado `earned` o beneficios asociados de manera duplicada.

- **Execution Risks**:
  - **Fraude de Recompensas y Drenaje de Valor**: Si la recompensa termina implementándose como una transferencia automática on-chain o un saldo retirable sin restricciones estrictas en el motor de checkout, los atacantes extraerán liquidez de la plataforma a un costo cero.
  - **Estados Inconsistentes por Asincronía**: Si el reloj de 7 días se verifica de forma estricta al momento de "aprobar" el perfil, una falla o encolamiento en un proveedor de KYC (ver EPIC-004) podría hacer que la recompensa expire injustamente mientras el usuario estaba en estado "Pendiente de revisión".

- **Uncovered Edge Cases**:
  - **Tiempos de Aprobación Externos (KYC)**: ¿Qué ocurre si el usuario envía sus datos el día 6, pero el administrador o el proveedor de identidad tarda 48 horas en validarlos (día 8)? El documento no define si el "envió a tiempo" congela el deadline.
  - **Cambio de Entidad / Multicuenta**: Si un usuario conecta la Wallet A, ve el modal, y luego crea una cuenta secundaria con la Wallet B compartiendo el mismo dispositivo. La persistencia no parece estar protegida por fingerprints, abriendo el camino al farmeo de cupones de $10 USD.

- **Stack Alignment**:
  - La propuesta no se alinea con la infraestructura de checkout o compras (EPIC-003). Si este premio impacta el costo final de un NFT, el contrato de precios y la interacción con los programas en Solana (o el carrito de Airwallex) deben estar explícitamente diseñados para consumir de forma atómica este estado `earned`.

- **Incorrect Assumptions**:
  - Asumir que la "letra pequeña" (Terms and Conditions en UI) protege a la plataforma de la explotación, sin definir las barreras técnicas exactas.
  - Asumir que un deadline estricto (`registeredAt + 7 days`) es calculable en tiempo real sin contemplar demoras operativas de parte de la plataforma.

- **Mandatory Tests**:
  1. **Prueba de Concurrencia (Race Condition)**: Ejecutar múltiples peticiones simultáneas de "finalización de perfil" para asegurar que la elegibilidad pase a `earned` una única vez por cuenta.
  2. **Prueba de Límite de Expiración Exacta**: Testear la adjudicación a los 7 días - 1 segundo (éxito) y 7 días + 1 segundo (rechazo).
  3. **Prueba de Ventana de Gracia KYC**: Validar que el reward siga siendo elegible si la verificación final llega dentro de las 72 horas posteriores a `submitted_at`, y que expire si llega después.

**Verdict: reject**

## Resolution (Post-Critique)
- Final approach after critique:
  - Convert the incentive into a wallet-bound, non-withdrawable, single-use checkout credit persisted as a permanent backend reward row.
  - Make eligibility explicit: required profile fields + timely KYC submission + later KYC verification.
  - Bind consumption atomically to checkout/order state instead of treating the reward like a free-floating balance.
- Changes accepted:
  - Explicit profile completion invariants tied to the current `PUT /api/protected/profile` contract.
  - Dedicated reward-program configuration so the `$10 USD` value can change over time without rewriting code semantics.
  - Permanent `user_onboarding_rewards` entry linked to `wallet_public_key` and surfaced in profile state.
  - Bounded KYC grace semantics: timely KYC submission opens at most a 72-hour review window instead of an indefinite freeze, matching Stripe manual-review reality.
  - Row locking (`SELECT ... FOR UPDATE`) and race-safe transitions for award, reserve, release, and consume paths.
  - Checkout-bound discount consumption with one-time reservation and final consume on successful payment.
- Changes rejected (with rationale):
  - Withdrawable reward balance or direct on-chain payout: rejected because the product intent is a purchase discount, not a cash-equivalent transfer.
  - Device fingerprinting for MVP abuse control: rejected because the repo is currently wallet-first and KYC-backed; the immediate feature uses wallet uniqueness + KYC + checkout-only consumption as the bounded anti-abuse line.
- Residual risk accepted for this feature:
  - Human-level multi-account dedupe is not guaranteed beyond the current wallet-first + KYC flow unless the KYC provider later exposes a stable identity-level dedupe key that the product explicitly decides to adopt.

## Revised Decision
- Decision: `approved for sliced implementation`
- Decision owner: `jaymusicmachine`
- Decision notes:
  - The original critique is answered only if implementation follows the revised slices, state model, and checkout-binding rules above.
  - No slice should bypass the explicit reward ledger or the checkout reservation/consumption path.

## Final Architectural Sign-off (Staff Engineer)
- **Reviewer(s)**: `Gemini Code Assist (Staff Engineer)`
- **Evaluation of Revisions**:
  - El rediseño hacia un **cupón de descuento de un solo uso** atado atómicamente al checkout elimina de raíz el riesgo de extracción de liquidez por ataques Sybil.
  - La definición de los campos de perfil exactos y la introducción de `reward_amount_usd_snapshot` blindan la lógica contra configuraciones ambiguas o mutaciones en las campañas.
  - El ciclo de vida de la reserva (`reserved` -> `consumed` | `earned`) asegura la integridad sin duplicar el gasto durante fallos de pago.

- **Minor Observations for Implementation**:
  1. **KYC Grace Window (Resolved to 72 Hours)**: La gracia operativa debe modelar explícitamente la revisión manual de Stripe Identity. El límite adoptado para esta feature es `72 hours` desde `kyc_submitted_at`; una validación posterior expira el beneficio.
  2. **Checkouts de $0 (Zero-dollar orders)**: Al aplicar el MVP assumption (si reward > subtotal, se quema la diferencia), existe la posibilidad de que el `total_amount_usd` resultante sea `$0.00`. Asegúrense de que el `checkout-service` (Epic-003) sepa puentear la llamada a Airwallex o Solana cuando el costo sea 0, moviendo la orden directamente a `confirmed`.
  3. **Unicidad Absoluta (DB Constraint)**: Aunque las notas hablan de "unique active reward row", recomiendo que a nivel de base de datos apliquen una restricción `UNIQUE(wallet_public_key, program_id)` **absoluta**. Un usuario `expired` o `consumed` jamás debería poder insertar una segunda fila para el mismo programa.

- **Verdict**: `approved`
  - La arquitectura es sólida y lista para implementación por Slices.
  - Pueden proceder con los PRs.

## Implementation Notes
- `2026-05-09`: The onboarding decision modal received a second responsive layout pass on `fix/app-onboarding-reward-modal-clean-rework`.
  - The informational card now switches to a text-left / actions-right structure from `md` upward instead of waiting for `lg`, which removes the half-empty medium breakpoint state.
  - The informational surface was darkened to match the wallet modal's crystal language and avoid the washed-out intermediate tone.
  - The reward card headline and supporting copy were reduced on mobile so the value proposition lands in the first viewport without clipping or oversized body copy.
- `2026-05-09`: The post-auth onboarding decision flow corrected the explore route on `fix/app-onboarding-explore-route`.
  - `Explore now` and modal close now route to `/marketplace` instead of re-entering `/protected`, which had been collapsing back into the profile flow.
  - `Continue with my profile` remains routed to `/protected/perfil`.
