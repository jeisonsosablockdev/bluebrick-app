# STORY-014-01-draft

## Metadata

- Epic: `EPIC-014-stake-distribution-traceability`
- Story ID: `STORY-014-01-draft`
- Status: `approved` (`draft | in-review | approved | implemented | rejected`)
- Owner: `jaysosa`
- RFC owner slice: `<branch-or-slice-id>`
- Created: `2026-06-15`
- Last Updated: `2026-06-16`

## Context

- Problem: BRIDS needs a system that can answer: "How much should BRIDS send this user for the amount of time they kept eligible assets staked?" The calculation starts from available treasury earnings for a scoped project eligibility window, distributed across the investor pool according to time-weighted eligible participation. If the user kept an eligible NFT frozen during the project's eligible window, the system must determine: how much of that project window counts, what portion of the investor pool the user represented, what scope made the NFT eligible, what distribution pool applies, what fee policy applies, and what net amount the user can claim. The answer must be explainable from real `freeze / unfreeze` actions on Solana, wallet ownership, approved Candy Machine eligibility, collection context, validated profile stake history, project eligibility window, distribution snapshot, user's counted frozen time, investor pool composition, available treasury earnings, min/max project offer, KYC/compliance state, claim fee policy, user-facing projections, treasury availability, Squads approval/execution evidence, and immutable audit logs. The audit question: "Can BRIDS prove why this user was owed this amount, why this fee was applied, and which transaction paid it?"
- Why now: Four related BRIs (BRI-5 stake/unstake, BRI-6 distribution prep, BRI-7 traceability/audit, BRI-8 distribution microservice/claim) require a unified architecture before implementation. Current draft (KNOW-2026-06-004) captures working ideas but lacks RFC governance.
- Constraints:
  - Blockchain truth first, DB projection second
  - Candy Machine is sole financial scope for v1 (never collection)
  - Final Calculation uses finalized RPC evidence **from archival nodes only** (projects can exceed 12 months)
  - No floating point for money; integer math with Hamilton remainder
  - Squads controls treasury; committee reviews before dispersion; **single batched vault transaction with multiple transfer legs**
  - Metaplex Core compatibility: Stake/Unstake relies strictly on the `FreezeDelegate` plugin with `Owner` authority. Assets missing this plugin are mathematically ignored.
  - User-initiated Claim with configurable fee
  - Compliance triple-gate: KYC verified + AML clear + fully_verified; **`restricted_aml`/`suspended` users cannot reach claim; TTL 12 months for compliance hold funds with auto-clawback**
  - Early investor dilution: intentional reward mechanism; no capital injection possible; dilution expected and accepted
- Affected paths:
  - `/app/(protected)/stake`, `/app/(protected)/portfolio`, `/app/(protected)/rentas`, `/app/(protected)/history`
  - `/api/protected/stake/*`, `/api/webhooks/helius/stake`
  - `lib/db/` (stake_action_attempts, user_profile_stake_events, asset_project_origins, project_candy_machine_sources, distribution_runs, distribution_items, claim_fee_policies, distribution_claims, project_yield_offer_ranges, distribution_audit_events, treasury_snapshots, squads_payout_proposals, distribution_committee_reviews, distribution_payout_overrides, claim_or_payout_events)
  - `scripts/ci/`, `tests/`

## Proposal

- Approach summary: Consolidate the KNOW-2026-06-004 draft into an RFC with 8-layer architecture. Phase implementation across 4 phases aligned to BRI-5 through BRI-8.
- Technical design:

### 8-Layer Architecture

1. **Stake/Unstake Event Layer** — MPL Core `UpdatePlugin` transactions (toggling `frozen` state on the `FreezeDelegate`) as source of truth. Helius webhook + canonical RPC reconciliation. Asset must possess `FreezeDelegate` with `Owner` authority. UI shows partial state; DB derived state never stronger than on-chain. Tables: `stake_action_attempts`, `user_profile_stake_events`.
2. **Mint Provenance / Project Origin Layer** — `asset_project_origins` links each eligible asset to approved Candy Machine via mint transaction evidence. `project_candy_machine_sources` maps project_id to exactly one approved CM. Collection membership is supporting context only; never financial scope. Provenance captured at mint or reconstructed from transaction history; missing = `needs_review`.
3. **User Timeline Layer** — Informational UI: frozen since, accumulated time, sync status, last tx. Does NOT calculate final payouts.
4. **Project Eligibility Window** — Defines when stake time creates beneficiary rights. `earning_start_at = max(project_start_at, freeze_confirmed_at)`, `earning_end_at = min(project_end_at, unfreeze_confirmed_at ?? project_end_at)`. Only owned-and-frozen time inside window counts.
5. **Dashboard Earning Projection Layer** — UI estimate using current freeze time + developer min/max range. Clear "projection, not guarantee" labeling. Detailed financial surface in `Rentas / Yield`, not `Stake / Unstake`.
6. **Distribution Snapshot Layer** — Evidence package for Final Calculation. Admin chooses: project_id, eligibility window, snapshot_at, scope_type=candy_machine, scope_address, collection_address, authorized_supply, minimum_sold_count, funding_threshold_met_at, unsold_inventory_policy, investment_model, token_mint, treasury_vault, available_treasury_earnings_minor, distribution_pool_amount_minor, pool_composition_basis=equal_eligible_nft_count, **RPC commitment=finalized, archival node required**, context_slot, committee review fields. Final Calculation reconstructs historical intervals from blockchain/RPC **using archival endpoints only (projects can exceed 12 months)**.
7. **Distribution Calculation Layer** — Time-weighted participation: `asset_earning_seconds = SUM(max(0, min(project_end_at, unfreeze_i_confirmed_at ?? project_end_at) - max(project_start_at, freeze_i_confirmed_at)))` across all disjoint valid intervals `i`. `wallet_time_weight = sum(asset_earning_seconds)`. `pool_time_weight = sum(all wallet_time_weight)`. **Hamilton Method (Largest-Remainder):** Pass 1: `wallet_gross_amount = floor(distribution_pool_amount_minor * wallet_time_weight / pool_time_weight)`. Pass 2: Calculate `remainder_minor = distribution_pool_amount - sum(wallet_gross_amount)`. Sort wallets by exact fractional remainder DESC, then tie-break FIFO. Add 1 minor unit to top `remainder_minor` wallets. Fee applied after gross: `net = gross - fee`. Integer math only.
8. **Squads Treasury Layer** — Deterministic claim/payout evidence from finalized items. Committee reviews dispersion package. User Claim creates request; **single batched Squads v4 vault transaction with multiple transfer legs** (Squads CLI `initiate_batch_transfer` supports `sol:<recipient>:<lamports>` and `<mint>:<recipient>:<amount>` legs in one proposal). Hot wallet payments forbidden.
9. **Claim Lifecycle Layer** — User Claim button → fee quote → claim_requested → committee_review → approved_for_dispersion → Squads batch → executed. Fee policy: versioned, per project/CM, flat or percentage with caps. Compliance re-check at claim time. **`restricted_aml` and `suspended` users blocked at claim gate (never reach claimable state). Compliance hold funds TTL: 12 months maximum; automatic clawback to treasury after TTL expiry.**
10. **Traceability / Audit Layer** — Immutable audit trail answering 11 minimum questions (NFT, wallet, CM, window, seconds, KYC, treasury, fee, claim request, tx proof, exceptions).

### Key Data Models (new)

- `asset_project_origins`: asset_address, project_id, collection_address, candy_machine_address, candy_guard_address, mint_signature, mint_slot, mint_block_time, minter_wallet, sale_evidence, provenance_source, provenance_status
- `project_candy_machine_sources`: project_id → approved_candy_machine_address
- `claim_fee_policies`: scope_type (global/project/candy_machine), scope_address, token_mint, fee_mode (flat/percentage), flat_fee_minor, percentage_bps, min/max caps, effective_from/to, version
- `distribution_claims`: run_id, distribution_item_id, beneficiary_wallet, payout_wallet, gross/fee/net_minor, claim_fee_policy_id/version, status, compliance snapshot
- `squads_payout_batches` + `squads_payout_batch_items`: project_id, run_id, token_mint, treasury_vault, squads multisig/vault/proposal/batch PDAs, instruction_index, recipient_token_account, amount_minor, transfer_signature, execution_slot, reconciliation

### Resolved Decisions (from draft)

- Freeze intervals: summed across re-freeze events (blockchain source of truth)
- NFT transfer: freeze time follows asset, not wallet
- Evidence timing: post-project-end, pre-dispersion
- Unsold inventory: excluded, 100% pool to qualified
- Fee applied: claim layer (after gross)
- Rejected state added for audit trail
- Historical fee quotes in `/protected/rentas`
- Provenance backfill: manual, 3 months post-project
- Tie-breaking: 1) largest fractional remainder, 2) earliest first_freeze_confirmed_at (FIFO), 3) lower wallet address

### RPC Finalization Protocol

- commitment: finalized
- **Archival node required**: all RPC endpoints must be archival (full ledger retention from genesis); validated via `minimumLedgerSlot` check
- Record: context_slot, RPC endpoint, timestamp, asset owner, collection, approved CM origin, project id, `FreezeDelegate` presence, `authority.type == Owner`, and `frozen` state.
- Staleness guard: max_slot_lag = 100 slots, max_age = 5000ms
- Multi-provider convergence: Helius Archive primary, Alchemy Archive secondary, self-hosted archival fallback
- Block reasons: `rpc_stale`, `provider_divergence`, `history_incomplete`, `evidence_parse_mismatch`, `non_archival_node`

### State Machines

**Distribution Run**: draft → calculating → ready_for_review → approved → executing → executed; rejected → draft (recalc)
**Claim Lifecycle**: not_claimable → claimable → claim_requested → fee_quoted → committee_review → approved_for_dispersion → submitted → executed; failed, canceled, compliance_hold → **compliance_hold_expired (TTL 12 months) → clawback_to_treasury**

### Anti-Dilution Guards

- scope_type = candy_machine (never collection)
- pool_composition_basis = equal_eligible_nft_count
- unsold_inventory_policy = exclude_unsold (time_weight = 0)
- Funding threshold: 70% of CM minted before project starts
- Project starts at funding_threshold_met_at (blockchain time)
- **Mint authority frozen at project start** — no late minting allowed after window opens
- **Early investor dilution is intentional reward mechanism** — no capital injection possible per business model; dilution expected and accepted for early participants

### UI Layer Boundaries

- Overview: portfolio summary only
- Portfolio: investment composition by project, NFTs per project, approved CM origin
- Stake/Unstake: freeze/unfreeze actions + current actionable state only
- Rentas/Yield: claimable balance, fee quote, net claim, projections, Claim button
- History: chronological ledger (stake, unstake, distributions, claims, fees, payouts)

### Implementation Phases

- Phase 1 (BRI-5, BRI-6): Core Infrastructure — Stake/Unstake events, provenance, profile history, **archival node provisioning**
- Phase 2 (BRI-7): Distribution Engine — Snapshot, Final Calculation, RPC protocol (archival enforcement)
- Phase 3 (BRI-8): Treasury & Claims — Squads v4 batch transfers, fee policy, claim lifecycle (12m TTL), audit
- Phase 4: UI & Polish

## Critique

- Reviewer(s): Staff Engineer (2026-06-15)
- Critical findings:
  1. **Early Investor Dilution as Reward Mechanism:** La dilución de inversores iniciales es intencional y planificada como mecanismo de recompensa para early investors. No se puede inyectar más capital (el negocio no da para más). Esta dilución es totalmente esperada y aceptada. **Resolución:** Documentado explícitamente en Anti-Dilution Guards; mint authority congelada al inicio del proyecto.
  2. **Single Transfer Dispersion via Squads v4 Batch:** Squads v4 soporta batch transfers en una sola vault transaction con múltiples legs (`sol:<recipient>:<lamports>` y `<mint>:<recipient>:<amount>`). **Resolución:** Squads Treasury Layer actualizado para usar `initiate_batch_transfer` con múltiples legs en un solo proposal.
  3. **restricted_aml/suspended Users Blocked + TTL 12 Months:** Usuarios en estado `restricted_aml` o `suspended` no deben llegar al punto de claim. Si no pasan AML, no reciben transacción. TTL 12 meses para fondos en `compliance_hold` con auto-clawback a treasury. **Resolución:** Claim gate bloquea estos estados; Claim Lifecycle incluye `compliance_hold_expired` → `clawback_to_treasury` a los 12 meses.
  4. **Archival Nodes Mandatory:** Proyectos pueden durar más de 12 meses. Reconstrucción histórica requiere nodos archival con retención completa de ledger. **Resolución:** RPC Finalization Protocol requiere nodos archival; validación via `minimumLedgerSlot`; proveedores: Helius Archive, Alchemy Archive, self-hosted.
  5. **Metaplex Core Plugin Verification:** "Stake/Unstake" relies on `FreezeDelegate`. If the marketplace mint flow does not install the `FreezeDelegate` with `Owner` authority on the asset, the user cannot freeze it. The system must not assume collection-level `PermanentFreezeDelegate` equals user-level stake capability. **Resolución:** Explicitly verify `FreezeDelegate` with `Owner` authority in both the Stake/Unstake Event Layer and the Final Calculation RPC evidence.
- Blocking concerns:
  - Políticas de mint authority freeze, Squads batch transfer CU limits, compliance TTL/clawback, proveedores archival, y la instalación obligatoria del `FreezeDelegate` (Owner) durante el marketplace mint deben definirse antes de implementar APIs.

## Resolution

- Final approach after critique:
- **Archival Node mandatory**: todos los RPC endpoints para Final Calculation deben ser archival; validación via `minimumLedgerSlot`.
- **Squads v4 batch transfers**: single vault transaction con múltiples legs (`initiate_batch_transfer`); dado que Solana es atómico, si una leg falla, el batch completo se marca como `failed` y los claims vuelven a la cola para reconstruirse excluyendo la wallet infractora.
- **Mint authority congelada** al inicio del proyecto (proyecto no 100% vendido); evita dilución retroactiva.
- **Early investor dilution aceptada** como mecanismo de recompensa intencional; no inyección de capital posible.
- **Compliance hold TTL 12 meses**: `restricted_aml`/`suspended` bloqueados en claim gate; fondos en hold expiran a los 12 meses con auto-clawback a treasury.
- **Metaplex Core Plugin Enforcement**: El Final Calculation y la capa de Eventos rechazan matemáticamente los assets que no expongan el plugin `FreezeDelegate` con autoridad `Owner`.
- Changes accepted:
  - Archival node requirement
  - Squads batch transfer single transaction
  - Mint authority freeze at project start
  - Early investor dilution as reward mechanism
  - 12-month compliance hold TTL with auto-clawback
- Changes rejected (with rationale):

## Decision

- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-06-16`
- Decision owner: Staff Engineer
- Approval notes: Architectural design is solid. Math, Squads atomicity, and Metaplex Core compliance have been fully verified. Ready to build.

## Status

- Current status: `approved` (`draft | in-review | approved | implemented | rejected`)
- Next action: explain-like-socrates pass on spec slice, then open delivery slices
- Exit criteria:
  - [x] All critical critique points addressed
  - [x] Decision is `approved`
  - [ ] Implementation completed (if in scope)

## Test and Validation Plan

- Unit tests: Final Calculation integer math, remainder distribution, RPC freshness guards, fee policy application, state machine transitions
- Integration tests: Stake/Unstake → reconciliation → profile events → snapshot → calculation → Squads batch → claim reconciliation
- Devnet validation: Real MPL Core freeze/thaw, Candy Machine mint, Squads treasury execution, RPC finalized reads
- Responsive QA: Stake/Unstake action state + sync state separation; Rentas/Yield projection labeling

## Traceability

- Related issue(s): BRI-5, BRI-6, BRI-7, BRI-8 (Linear: BRI-7)
- Related PR(s): TBD
- Final commit hash(es): TBD
