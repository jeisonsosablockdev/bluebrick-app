# NFT Spec

Last Updated: 2026-06-07

## Admin Candy Machine Deploy Logging Contract

`/admin/assets/new` must emit structured deploy logs that explain the transaction lifecycle without changing the security gate. Logs may include `deployId`, public addresses, public transaction signatures, RPC host, blockhash lifetime, transaction kind, index, serialized byte length, signer count, instruction count, confirmation status, slot, elapsed milliseconds, and recoverable error code.

Logs must not include full serialized transaction payloads, private keys, cookies, request bodies, wallet secrets, or authority decisions sourced only from the client. Client-provided `deployId` is only a correlation value for logs; snapshot verification and Create Asset gating remain server-owned and RPC-backed.

## BRI-170 Marketplace Owner-Freeze Mint Contract
- `/admin/assets/new` creates/configures collections and Candy Machines; it does not mint final user-owned NFTs.
- `/marketplace/[id]` is the canonical user mint surface for BRIDS NFT purchases.
- Every marketplace mint batch must install asset-level MPL Core `FreezeDelegate` with authority `Owner` for each `expectedAssetAddress`.
- `PermanentFreezeDelegate` on a collection is not equivalent to asset-level owner-managed `FreezeDelegate`; Stake / Unstake support requires the asset-level plugin with `Owner` authority.
- The buyer wallet must sign the mint/plugin lifecycle because `FreezeDelegate` is owner-managed.
- `/api/purchase/submit` must confirm the submitted transaction and verify each expected asset on-chain before treating the purchase as confirmed:
  - asset exists
  - asset owner equals the buyer wallet
  - asset collection equals the expected BRIDS collection
  - `freezeDelegate.authority` is `Owner`
- `purchase_attempts` stores expected/verified asset addresses plus asset-verification status as attempt evidence. This does not replace on-chain truth and does not create a staking ledger.
- `GET /api/protected/stake/assets` and stake prepare logic must reject assets that have no `FreezeDelegate` or whose `FreezeDelegate` authority is not `Owner`.
- The legacy admin Core Candy Machine mint-prepare route is blocked (`410 Gone`) to prevent incomplete or admin-owned mint paths from being used as product flow.
- Stake / Unstake profile sync must preserve the BRI-5 contract:
  - `sync_pending` is explicit user-facing lag between a confirmed on-chain action and derived profile persistence
  - `/api/protected/stake/assets` retries canonical reconciliation for signed attempts in `submitted` or `reconcile_pending` before computing the visible asset state
  - cards in `sync_pending` show per-asset processing feedback and block duplicate actions until the backend returns a resolved state
  - bounded UI polling may refresh the card state, but it does not replace canonical RPC validation or the derived profile persistence contract
  - `BLOCKHASH_EXPIRED` during Stake / Unstake submit is recoverable: the signed transaction is not mutated server-side, the attempt is marked failed, and the UI must ask the owner wallet to sign a fresh transaction while keeping the original action available

## BRI-5 Stake / Unstake Ownership Contract
- The protected profile now exposes owner-driven `Stake / Unstake` as a product alias for NFT `freeze / unfreeze`.
- Scope:
  - applies only to NFTs minted through BRIDS-tracked Candy Machines / collections already persisted in the platform database
  - applies only when the currently authenticated wallet is also the current on-chain owner
- NFT authority model for this slice:
  - stake uses the existing owner-managed freeze capability already attached to eligible BRIDS NFTs
  - no new on-chain program, PDA, or authority layer is introduced in `v1`
  - the server may prepare the transaction, but the owner wallet must sign it before submission
- Collection and inventory validation:
  - stake UI must not list arbitrary wallet NFTs
  - server filters the wallet DAS inventory against BRIDS-tracked collection/candy-machine records already persisted in DB
  - if an NFT is no longer owned by the connected wallet, it is excluded from the actionable stake list even if historical profile records still exist
- Profile-history contract:
  - Helius stake webhook data is observational only
  - canonical RPC transaction validation is required before `freeze` / `unfreeze` history is persisted to the user-profile projection
  - persisted profile history is a read model for the protected profile and does not become the source of truth for NFT ownership or freeze state

## BRI-10 Contextual hints in `/admin/assets/new`
- The admin asset creation route now extends the existing `?` guidance pattern across non-location form fields.
- The `Location` section remains intentionally excluded from this hint rollout.
- This is a UX-only guidance change:
  - no NFT authority rule changed
  - no mint/deploy payload contract changed
  - no metadata ownership or collection semantics changed
  - no save/import/mint runtime behavior changed
- Mint seed data now explains the read-only values shown before step 2, but those fields still mirror the same underlying asset-creation state.

## BRI-161 Marketplace Investment Model Handoff
- The admin asset form now captures structured investment brief data that is published alongside the NFT listing in marketplace surfaces.
- New marketplace content blocks persisted from the deploy/admin handoff:
  - `project_json`
  - `economics_json`
  - `governance_json`
- NFT authority rules do not change:
  - admin SIWS authority is still required for deploy and marketplace handoff
  - collection, candy machine, and asset mint addresses remain the blockchain source-of-truth for purchasable inventory
  - the new investment-model fields are informational marketplace content and do not override on-chain mint price, authority, or collection semantics
- Marketplace detail pages may now render richer deal economics from the admin handoff, but purchase execution still relies on the existing quote/challenge/prepare/submit NFT flow.

## BRI-165 Admin Asset Upload and Hint Cleanup
- The `/admin/assets/new` tooltip and upload finalization fix does not change NFT authority, metadata ownership, royalties, or collection semantics.
- Upload finalization now tolerates storage `ETag` differences when the upload has already passed checksum, MIME, and size validation.
- The `?` hint affordance remains a presentation-only helper and does not affect minting, metadata, or on-chain NFT state.
- The updated initial asset type labels and step 1 quick import drag/drop and file acceptance are admin UX changes only; they do not modify mint authority, collection validation, or royalty logic.
- The production PDF Quick Import worker/tracing hotfix changes only server-side brief text extraction and Vercel function packaging for `pdfjs-dist`. It does not alter NFT metadata generation, Pinata metadata pinning, mint authority, collection validation, royalties, or purchase execution.

## Codex Orchestration Baseline Compatibility
- No NFT product behavior, authority rule, metadata contract, royalty rule, or devnet acceptance contract changed in this refactor.
- The protected NFT avatar route keeps the same server-side contract:
  - wallet authentication remains mandatory
  - DAS failures still surface through the route error contract
  - IPFS image normalization still resolves to the configured HTTPS gateway
- Test harness compatibility was updated so the route continues to be verified correctly under the current repo baseline (`Vitest 4` + modern Node runtime):
  - the DAS client mock now uses a class-shaped constructor mock because the route instantiates `new DasClient()`
  - NFT avatar route assertions continue to verify the same response semantics, not a different implementation contract

## BRI-152 Release Visibility Guard
- The admin mint console remains part of the development/operations toolset, but it is intentionally hidden in RC/release-like environments.
- `/admin/mint` is removed from admin navigation and returns `404` on direct access when the release visibility guard is active.
- This is a surface-area control only; the Solana devnet authority model, mint contracts, and NFT operational policies remain unchanged.
- Internal non-release environments can re-enable the console with `NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES=true`.
- Stake / Unstake is not development-only. `/protected/stake` remains visible in release-like environments, but eligible assets must still pass owner, collection, and `FreezeDelegate Owner` verification.

## BRIDS Technical Rename
- Technical project slug references were renamed from `solana-test-1` to `brids`.
- Active metadata pinning tags for Core Candy Machine and Pinata flows now emit `app: "brids"` while preserving the existing mint, authority, and devnet execution model.

## Scope
- Feature: Admin-driven batch minting on Solana devnet using Metaplex Core.
- Collection: One Core collection per mint run. Assets are minted as numbered fractions under that collection.
- Marketplace purchase (STORY-003-04): user-facing `quote -> challenge -> prepare -> submit` flow for minting NFT fractions from Candy Machine listings, with multi-quantity contract (`MULTI_ENABLED` default, server-limited), anti-bot controls and transaction-integrity/idempotency in submit.

## Marketplace Purchase Flow (STORY-003-04)
- Price source of truth:
  - Mint price is never configured at purchase time.
  - UI price comes from backend quote cache that reads Candy Guard payment guard (`tokenPayment` USDC preferred, `solPayment` as legacy fallback).
  - Guard payment mode is USDC-only by policy for new deploys (`tokenPayment` on devnet USDC mint).
- Guard cache + revalidation:
  - `POST /api/purchase/quote` serves cached guard snapshot (`paymentCurrency`, `priceLamports`, `priceUsdcAtomic`, `startDate`, `itemsRemaining`, `cacheUpdatedAt`) plus quantity contract fields (`quantityMode`, `quantity`, `totalPriceLamports`, `totalPriceUsdcAtomic`).
  - `POST /api/purchase/prepare` always revalidates against fresh on-chain guard state before building transaction.
  - If quote and fresh guard diverge, backend returns `PRICE_CHANGED`.
- Quantity contract:
  - Backend enforces `quantity` as positive integer.
  - Mode and limits are server-controlled (`PURCHASE_QUANTITY_MODE`, `PURCHASE_MAX_QUANTITY_PER_ORDER`).
  - Current default mode is `MULTI_ENABLED` with max quantity per order default `10`.
  - Invalid/out-of-policy quantity returns semantic error `INVALID_QUANTITY`.
  - If requested quantity does not fit in one transaction payload, `prepare` returns `INVALID_QUANTITY` and client must reduce quantity.
- Anti-bot transactional layer:
  - `POST /api/purchase/challenge` issues short-lived one-time challenge payload tied to wallet + property + candy machine + `quantity`.
  - Wallet signs challenge message via `signMessage()`.
  - `POST /api/purchase/prepare` verifies challenge signature server-side, enforces anti-replay, validates challenge quantity context, and applies per-window rate limits (`wallet` + `ip`).
  - No cumulative wallet cap is enforced (`mintLimit` intentionally out of scope for this story).
- User signing model:
  - Backend prepares mint transaction pre-signed by mandatory Candy Guard `thirdPartySigner`.
  - User signs with Phantom wallet client-side.
  - Backend validates payer + prepared message match before sending transaction on devnet.
  - Marketplace mint transactions also include the owner-managed `FreezeDelegate` plugin lifecycle for every expected asset in the batch.
- Error contract exposed to UI:
  - `MINT_NOT_STARTED`, `SOLD_OUT`, `PRICE_CHANGED`, `INVALID_QUANTITY`, `INSUFFICIENT_FUNDS`, `INVALID_CHALLENGE`, `RATE_LIMITED`, `TRANSACTION_FAILED`.
- Traceability persistence:
  - `purchase_attempts` stores wallet, candy machine, challenge linkage (`challenge_id`), client IP, idempotency fields (`idempotency_key`, `idempotency_expires_at`), tx signature, status, and error code/message.
  - `purchase_attempts` also stores `expected_asset_addresses`, `verified_asset_addresses`, `asset_verification_status`, `asset_verification_error`, and `asset_verification_checked_at` for post-submit asset verification evidence.
  - `purchase_flow_events` stores request timeline (`quote/challenge/prepare/submit`, `request/success/error`) correlated by `flow_id` for UI E2E debugging.
  - State machine: `created -> prepared -> submitted -> confirmed | failed`.
  - Prepare emits server-side `idempotencyKey` (UUIDv7, TTL 5 min).
  - Submit requires `attemptId + idempotencyKey`, enforces DB dedupe (`wallet_public_key + idempotency_key`) and uses row lock to prevent duplicate sends under retry/double-click races.
  - `purchase_challenges` stores challenge nonce/message/TTL and consumption/failure state.
  - `purchase_rate_limit_events` stores rolling rate-limit event evidence by endpoint + wallet + IP.
  - Submit now confirms the transaction and verifies every expected asset before returning `confirmed`; missing assets, wrong owner/collection, or missing `FreezeDelegate Owner` leave the attempt failed/recoverable.
  - Reusable implementation playbook: `docs/purchase-tracing.md`.

## Mint Authority Model
- Mint authority:
  - The authenticated admin wallet (SIWS session) is the payer and mint authority for `createCollectionV2` and `createV2`.
  - Collection/asset addresses are generated server-side as fresh signer keypairs per item.
- Validation logic:
  - `/api/admin/metaplex-core/prepare` and `/api/admin/metaplex-core/submit` require `admin` role server-side.
  - Frontend wallet must match authenticated session wallet (`payerPublicKey` check before signing).
  - Only devnet RPC is accepted (`SOLANA_RPC_URL` preferred on server; `NEXT_PUBLIC_SOLANA_RPC` fallback, both enforced by `lib/solana.ts`).
  - Core Candy Machine deploy/mint/submit routes validate all Solana public key inputs explicitly (`payerPublicKey`, `candyMachineAddress`, `collectionAddress`, `expectedAddress`) before building transactions.
  - Candy Machine deploy sets `thirdPartySigner` guard to backend signer address from `PURCHASE_THIRD_PARTY_SIGNER_SECRET_KEY`.
  - Purchase prepare enforces on-chain `thirdPartySigner` match with backend signer configuration before mint transaction assembly.
  - Core Candy Machine `collectionName` is capped at 32 chars (on-chain serialization constraint).
  - Core Candy Machine deploy requires both delegate authorities from environment:
    - `SQUADS_FREEZE_AUTHORITY` for `PermanentFreezeDelegate`.
    - `SQUADS_TRANSFER_AUTHORITY` for `PermanentTransferDelegate`.
  - Collection creation now attaches both permanent delegates on-chain (`PermanentFreezeDelegate` + `PermanentTransferDelegate`) with explicit authority address validation server-side.
- Rotation/revocation:
  - Admin wallet allowlist is managed through `ADMIN_WALLETS`.
  - Revoking admin rights is immediate once wallet is removed from allowlist.

## BRI-12 Wallet/Auth Migration Impact (NFT Scope)
- Change summary:
  - Wallet auth boundary migrated public key byte handling from `@solana/web3.js` to `@solana/kit` (`address` + `getAddressEncoder`) in SIWS verification path.
  - Wallet modal auth sync between browser contexts was hardened (`BroadcastChannel` + `storage` + `focus`/`visibilitychange` revalidation).
- NFT authority impact:
  - No change in authority model for NFT operations.
  - Admin NFT endpoints continue to derive authority only from server-side SIWS session (`ADMIN_WALLETS` allowlist), never from client wallet state.
  - `payerPublicKey` checks remain server-authoritative in prepare/submit flows.
- Metadata and collection impact:
  - No change to metadata ownership semantics.
  - No change to collection `updateAuthority` policy or delegate lifecycle requirements.
- Security invariants (unchanged):
  - No client-side authority validation is accepted as final decision.
  - No mocked signatures/RPC are valid acceptance evidence.
  - Devnet-only execution policy remains mandatory for NFT proof flows.

## Metadata Ownership
- Metadata PDA seeds:
  - Metaplex Core stores metadata in the same Core asset account (no separate Metaplex Token Metadata PDA in this flow).
- Metadata owner validation:
  - Admin-created operational mint helpers may set owner to the admin payer, but they are not the canonical user marketplace mint flow.
  - Marketplace purchase mint sets owner to the buyer wallet and must attach `FreezeDelegate` with `Owner` authority for Stake / Unstake eligibility.
- Update authority validation:
  - Collection is created with `updateAuthority = admin wallet`.
  - Assets minted into a collection do not set per-asset `updateAuthority` (Core rejects setting both collection + update authority).
  - Current operational decision (pending final governance decision):
    - The deploy signer wallet keeps `updateAuthority` on the collection so metadata/economic fields remain editable during the decision window.
    - Metadata updates are therefore performed by the wallet that executed deploy when it is also the current `updateAuthority`.
    - This authority does not grant custody rights over third-party assets or SOL balances by itself.

## Economic AppData (EPIC-006 STORY-006-03)
- Objective:
  - Persist auditable economic parameters per NFT directly on-chain via Core `AppData`.
- Adapter model:
  - External adapter type: `AppData`.
  - Schema: `ExternalPluginAdapterSchema.Json`.
  - Data authority: `UpdateAuthority`.
- `AppData v1` contract:
  - Required:
    - `revenue_share_bps` (`0..10000`)
    - `yield_bps` (`0..10000`)
    - `yield_mode` (`cap | linear`)
    - `distribution_enabled` (`boolean`)
    - `economic_version` (`^v[0-9]+$`, currently `v1`)
    - `last_updated_at` (`unix seconds`)
    - `updated_by` (`string`, min practical length enforced)
  - Optional:
    - `locked_at`
    - `eligible_from`
    - `earning_start_ts`
- Mint pipeline behavior:
  1. Mint asset.
  2. Attach `AppData` adapter.
  3. Write initial payload `v1`.
  4. Permit controlled subsequent writes under same authority model.
- Validation behavior:
  - Rejects unsupported keys to avoid schema drift.
  - Rejects unsupported `yield_mode`.
  - Rejects unsupported `economic_version` values.
  - Enforces audit fields in every write.

## Delegate Authority Lifecycle (EPIC-006 STORY-006-04)
- Scope:
  - Add backend-admin lifecycle for critical collection authorities on devnet.
  - Applies to `transfer_delegate` (`PermanentTransferDelegate`) and `appdata_authority` (collection `updateAuthority` used by AppData writes).
- Admin endpoints:
  - `POST /api/admin/core-candy-machine/authorities/prepare`
  - `POST /api/admin/core-candy-machine/authorities/submit`
- Supported operations:
  - `rotate(role, new_authority)`
  - `revoke(role)` (moves to sentinel `11111111111111111111111111111111`)
  - `emergency_rotate(role, new_authority)`
- Security and trust-chain enforcement (server-side):
  - Mandatory multisig evidence in request (`proposalId`, `proposer`, `executor`, `approverSigners`).
  - Regular threshold: `SQUADS_MULTISIG_THRESHOLD` (default `2`).
  - Emergency threshold: `SQUADS_EMERGENCY_MULTISIG_THRESHOLD` (default `max(regular+1, 3)`).
  - Optional allowlists:
    - `SQUADS_PROPOSER_ALLOWLIST`
    - `SQUADS_APPROVER_ALLOWLIST`
    - `SQUADS_EXECUTOR_ALLOWLIST`
  - Cooldown for non-emergency ops:
    - `AUTHORITY_ROTATION_COOLDOWN_SECONDS` (default `21600`).
  - No null-authority window on rotation:
    - Rotate executes as a direct authority swap in one on-chain transaction.
- Audit + versioning:
  - `authority_version` is monotonic (`+1` per accepted operation).
  - Audit trail persists operation intent and outcome:
    - status (`prepared` -> `submitted`)
    - proposal/executor/approvers
    - previous/new authority + previous/new version
    - confirmed on-chain signature.
  - Persistence tables:
    - `authority_registry`
    - `authority_audit_events`

## Royalty Model
- Seller fee basis points:
  - Not configured in H2 (Metaplex Core default, no royalty plugin attached yet).
- Creator shares:
  - Not configured in H2.
- Validation constraints:
  - H2 enforces URI/name validation and authority checks; royalty plugins are planned for a later phase.

## Collection Validation
- Collection authority check:
  - Collection creation instruction signs with admin wallet authority.
  - On-chain account owner is validated in devnet proof (`CoREENx...` program owner).
- Verified creators field check:
  - Not applicable to this Core flow (no Token Metadata creators array in H2).
- Duplicate mint prevention:
  - H2 creates fresh signer keypairs for collection/assets and unique numbered names per serial.
  - Full idempotency constraints (`job/batch/item/signature/webhook`) are handled in H1/H3.

## Mint Snapshot Persistence + Create Asset Gate (STORY-002-06)
- BRI-176 adds the `/admin/assets/new` snapshot-only auto re-check path for confirmed Candy Machine deploys whose first snapshot finalization is not ready.
- Final snapshot endpoint:
  - `POST /api/admin/core-candy-machine/snapshot/finalize`
- Persisted datasets:
  - `asset_mint_snapshots`: form snapshot, blockchain snapshot, verification result, handoff status.
  - `asset_mint_onchain_proofs`: deploy/mint signatures with confirmation status, slot, and error.
- Collection editor bootstrap contract (EPIC-011 STORY-011-03):
  - `form_snapshot.uploadRefs` is the primary ordering source for gallery/property/document bootstrap into marketplace editable fields.
  - Finalized uploads from `asset_uploaded_files` joined with `asset_upload_contracts.category` are matched by `fileRefId`; raw snapshot URLs are fallback-only when the referenced finalized upload is missing.
  - Corrupt snapshot shapes must not invent collection editor data. Malformed arrays, unresolved upload refs without fallback URLs, or invalid reduced Maps payloads are routed to manual review instead of silent persistence.
  - The approved bootstrap runner is versioned (`2026-04-23-v1`) and exposed through `npm run collection:bootstrap:dry-run -- [--actor-pubkey <pubkey>] [--entry-id <id>] [--output-file <path>]`.
  - Dry-run output is a manifest with explicit `successes`, `manualReviewRequired`, and `failures` buckets so operations can audit bootstrap readiness before any write slice lands.
  - Collection-editor uploads can now carry an optional `editSessionId` in `asset_upload_contracts` so temporary edit media is distinguishable from promoted marketplace media.
  - Promotion on save is modeled server-side (`promoted_at` / `promoted_by`); orphan cleanup only purges session-linked uploads that were never promoted, and it attempts blob deletion before removing DB rows.
- Verification policy:
  - Primary method: DAS `getAssetsByGroup` by `collectionAddress`.
  - Fallback method: candy machine counters (`itemsLoaded/itemsAvailable`) marked as `degraded`.
  - `Create Asset` is enabled only when `verificationStatus=verified` and job status is `completed`.
  - `/admin/assets/new` must call `POST /api/admin/core-candy-machine/snapshot/finalize` after confirmed Core Candy Machine deploy transactions and before emitting deploy completion to the asset creation form.
  - Deploy completion for marketplace handoff requires `canCreateAsset=true`; failed, degraded, or missing snapshot responses keep `Create Asset` blocked.
  - If deploy signatures are confirmed but the snapshot response is not ready, `/admin/assets/new` may run a snapshot-only re-check automatically after 15 seconds.
  - A manual `Re-check snapshot` fallback may be shown only after the automatic re-check still cannot verify the snapshot.
  - Snapshot re-check must reuse the same deploy evidence: draft/form snapshot, quantity, collection address, Candy Machine address, and deploy signatures.
  - Snapshot re-check must not call deploy prepare, wallet signing, deploy submit, collection creation, Candy Machine creation, or config-line loading.
  - Snapshot re-check does not grant client-side authority; Create Asset remains blocked until the server returns `canCreateAsset=true` from RPC-backed verification.
- Business safety:
  - `partial` mint state is treated as non-eligible for `Create Asset`.
  - Marketplace handoff remains `ready` only for fully verified snapshots.
  - Marketplace entries created from the admin deploy handoff must carry the verified `snapshotId`; publishing with `snapshotId=null` is not an accepted `/admin/assets/new` completion state.

## Metadata URI Provider (Core Candy Machine)
- Metadata URI generation endpoint:
  - `POST /api/admin/core-candy-machine/metadata`
- Provider strategy:
  - If `PINATA_JWT` is configured:
    - If `image` arrives as `http(s)`, server downloads it and pins it via Pinata (`pinFileToIPFS`), then uses the resulting `ipfs://` URI in metadata.
    - Uploaded Pinata image filename uses `internalCode` when available (fallback: `<assetNamePrefix>-image`).
    - Collection + asset metadata JSON are pinned via Pinata (`pinJSONToIPFS`) and returned as `ipfs://` URIs.
  - If `image` already arrives as `ipfs://...`, it is reused directly (no re-upload) and metadata JSON is pinned on top.
  - If `PINATA_JWT` is not configured, flow falls back to local server metadata records (`/api/admin/core-candy-machine/metadata/{id}.json`) to preserve existing mint workflow and keep JSON URI format explicit.
  - Local metadata retrieval normalizes IDs with optional `.json` suffix to avoid 404 mismatches in JSON-only URI flows.
- Metadata URI constraints:
  - Deploy validation still enforces JSON metadata URIs only (`https://...json` or `ipfs://...`).
  - Image URLs are rejected as `collectionUri`/`assetUri`.
  - If deploy is triggered with missing or image-like URIs and an uploaded image is available in prefill, the panel attempts automatic URI generation before validation.
  - `collectionName` and `assetNamePrefix` are now treated as server-authoritative derived values (normalized/truncated by byte-length rules before deploy prepare).
  - Deploy panel keeps these critical naming fields read-only to avoid user-side drift from server constraints.
  - Deploy input enforces strict URI byte windows for Candy Machine config lines (`<= 200` UTF-8 bytes effective window).
  - Pinata upload object names are technical and normalized before pinning (user-provided filenames are not used as final object names).
  - `addConfigLines` tx preparation uses adaptive chunking with aggressive-first sizing and automatic fallback (`chunk/2`) to reduce deploy tx count while avoiding serialization overflow (`encoding overruns Uint8Array`).
  - Item insertion follows prefix-based strategy for names (`prefixName = "<assetNamePrefix> #"` + numeric suffix in config lines), aligned with Core Candy Machine insert-items guidance.
- Operational note:
  - This integration changes metadata URI storage/provider selection and can migrate image hosting to Pinata/IPFS transparently when a public `http(s)` image is provided.
  - Submit path uses resilient RPC handling (retry on transient send errors + explicit signature status polling with timeout + final on-chain double-check), returns recoverable `BLOCKHASH_EXPIRED` or `CONFIRMATION_TIMEOUT` metadata (`409`) when submission/confirmation is stale, and confirms structural txs first (`create-collection`, `create-candy-machine`) before batching confirmation of remaining txs.
  - Admin panel signs deploy txs in batch (`signAllTransactions` when available, sequential fallback otherwise) and submits them in a single backend call to reduce end-to-end latency and stale-blockhash risk.

## Devnet Mint Proof
| Purpose | Signature | Explorer URL | Metadata Account |
| --- | --- | --- | --- |
| Create Core collection | `31iKqrqa7cFn3z2b8Q2oVbD2tazBLUBQ1t1ahgTSeadXxHrjXVSt4zXu3QTzWvXEN77rCXEdV6dhC673SNUxhrDR` | `https://explorer.solana.com/tx/31iKqrqa7cFn3z2b8Q2oVbD2tazBLUBQ1t1ahgTSeadXxHrjXVSt4zXu3QTzWvXEN77rCXEdV6dhC673SNUxhrDR?cluster=devnet` | `6QEWjo18DHmAKFK8WaGkZL78eZE1yY9b9anmb7UVawE1` |
| Mint Core asset in collection | `2nsk2m6QaWjYipQFcZqN7ZbbnBgAbDYjMisFM4yXgqQ2911deiRZxavon457z8i8wLRHjJSjxfVVH3tDwH3CjNtD` | `https://explorer.solana.com/tx/2nsk2m6QaWjYipQFcZqN7ZbbnBgAbDYjMisFM4yXgqQ2911deiRZxavon457z8i8wLRHjJSjxfVVH3tDwH3CjNtD?cluster=devnet` | `3Z1NK5D9y5kyWdoYD3Z9SpUAVTRUobWQLvKfwcWt3py9` |

## Devnet Candy Machine Deploy Proof (Pinata Flow)
| Purpose | Signature | Explorer URL | Account |
| --- | --- | --- | --- |
| Create Core Collection | `4VGAgEzcij63XUxJ5TaU3xcH9A1jwHjNzQgxqEveTDmkDmxWDPGiPmXTLhPLJyxesPfxuE3AhUVKibDBwzNNhTim` | `https://explorer.solana.com/tx/4VGAgEzcij63XUxJ5TaU3xcH9A1jwHjNzQgxqEveTDmkDmxWDPGiPmXTLhPLJyxesPfxuE3AhUVKibDBwzNNhTim?cluster=devnet` | `G695Q59UUEoWKGdJvBY2msh1CqDzB91ri1G18VJQGGy5` |
| Create Core Candy Machine + Guard | `41AXTaKr5q42uX74Uk5UnFBCSEQD31FKjFAkLLusWLGHJ1iUTdFWGj5oUzU3jhXMtkQcKdHcXbqiNwL6ke3bFf6y` | `https://explorer.solana.com/tx/41AXTaKr5q42uX74Uk5UnFBCSEQD31FKjFAkLLusWLGHJ1iUTdFWGj5oUzU3jhXMtkQcKdHcXbqiNwL6ke3bFf6y?cluster=devnet` | `96BNZVbtC4qyTp8THm3q1dpmcFqmVoDzpVrLuLTJdvU3` |
| Load config lines 1-64 | `55haK5so2GVxy3sgBpQYMz1tj1fNSE9p2YQrNPHoijywFENqJkwAqxGCkHwxkgY4Hh3ZeEXyfQcMCpmDuZywWuHw` | `https://explorer.solana.com/tx/55haK5so2GVxy3sgBpQYMz1tj1fNSE9p2YQrNPHoijywFENqJkwAqxGCkHwxkgY4Hh3ZeEXyfQcMCpmDuZywWuHw?cluster=devnet` | `96BNZVbtC4qyTp8THm3q1dpmcFqmVoDzpVrLuLTJdvU3` |
| Load config lines 65-128 | `3UhDAe8MFxL6kejobnpKJgPJkXQDTmjUD72j3anPUTFvCc9Lb66LpACqxDPAUS1dK9YbttWgkvniRvgRY5uTHp2B` | `https://explorer.solana.com/tx/3UhDAe8MFxL6kejobnpKJgPJkXQDTmjUD72j3anPUTFvCc9Lb66LpACqxDPAUS1dK9YbttWgkvniRvgRY5uTHp2B?cluster=devnet` | `96BNZVbtC4qyTp8THm3q1dpmcFqmVoDzpVrLuLTJdvU3` |
| Load config lines 129-192 | `5JSAiYJDyNkNNvnRaNcFUiQcp3fWcu5n1YtwETVKK4aRX99jHQhz5FCZpwYMwMJreQsL9b5mTSy6bHCnbQG8AjAa` | `https://explorer.solana.com/tx/5JSAiYJDyNkNNvnRaNcFUiQcp3fWcu5n1YtwETVKK4aRX99jHQhz5FCZpwYMwMJreQsL9b5mTSy6bHCnbQG8AjAa?cluster=devnet` | `96BNZVbtC4qyTp8THm3q1dpmcFqmVoDzpVrLuLTJdvU3` |
| Load config lines 193-256 | `3VDCqupkCG3xwXAUAubwTA3BAGumFpAoL7nwLGBubH1kDJN11MRPLVUT5LsHmeLJdR8hdwZ9BQtKSxXMBEZeD6bs` | `https://explorer.solana.com/tx/3VDCqupkCG3xwXAUAubwTA3BAGumFpAoL7nwLGBubH1kDJN11MRPLVUT5LsHmeLJdR8hdwZ9BQtKSxXMBEZeD6bs?cluster=devnet` | `96BNZVbtC4qyTp8THm3q1dpmcFqmVoDzpVrLuLTJdvU3` |
| Load config lines 257-320 | `3gfQSTWyozhd789aWC3ijUuM9yC7uytX6wPU6EB8yDbZTvRoBTuH6rs9Psv26PgLs62YSKvzKnftTDT2mSWmZy9r` | `https://explorer.solana.com/tx/3gfQSTWyozhd789aWC3ijUuM9yC7uytX6wPU6EB8yDbZTvRoBTuH6rs9Psv26PgLs62YSKvzKnftTDT2mSWmZy9r?cluster=devnet` | `96BNZVbtC4qyTp8THm3q1dpmcFqmVoDzpVrLuLTJdvU3` |
| Load config lines 321-384 | `295UBmYo2nxZ1Tx5XHJdPK776oQYA7qqeh5XGsd87kQ9zzesEdivukHgsHFf7U6QvcqyDGCn17oSf4cAqiFiPZCB` | `https://explorer.solana.com/tx/295UBmYo2nxZ1Tx5XHJdPK776oQYA7qqeh5XGsd87kQ9zzesEdivukHgsHFf7U6QvcqyDGCn17oSf4cAqiFiPZCB?cluster=devnet` | `96BNZVbtC4qyTp8THm3q1dpmcFqmVoDzpVrLuLTJdvU3` |
| Load config lines 385-400 | `5F1sktcVcgGmYPS1qEvrYewdd8wAkV9tzutQfC1JDmu3VoP6hbVpW6knTEgahfe5BWFAyAc8NPV11RfpzMr8qM1o` | `https://explorer.solana.com/tx/5F1sktcVcgGmYPS1qEvrYewdd8wAkV9tzutQfC1JDmu3VoP6hbVpW6knTEgahfe5BWFAyAc8NPV11RfpzMr8qM1o?cluster=devnet` | `96BNZVbtC4qyTp8THm3q1dpmcFqmVoDzpVrLuLTJdvU3` |

## Devnet AppData Proof (STORY-006-03)
| Purpose | Signature | Explorer URL | Account |
| --- | --- | --- | --- |
| Create Core collection (`CreateCollectionV2`) | `3UJFwJDhmU56FRhbxURZGkYN2Vc7QtxkDhnd6stKgJE2mudcepzQxHcvs7bYDMNegnTeN6dEkUobToHPBmPg3h9N` | `https://explorer.solana.com/tx/3UJFwJDhmU56FRhbxURZGkYN2Vc7QtxkDhnd6stKgJE2mudcepzQxHcvs7bYDMNegnTeN6dEkUobToHPBmPg3h9N?cluster=devnet` | `2vPD7d2ojHbMTa4CubV5MwzhQKRNrc1DFbTpBBTBszHi` |
| Mint asset (`CreateV2`) | `39mG3FSESWfASb74cDdkYbX9LGxDQXKc9Eiy8vt3CNF2R1jFDjn9Z5wgmBWiFGmBQquyyDDAb1mfvT7uxs9sS4ek` | `https://explorer.solana.com/tx/39mG3FSESWfASb74cDdkYbX9LGxDQXKc9Eiy8vt3CNF2R1jFDjn9Z5wgmBWiFGmBQquyyDDAb1mfvT7uxs9sS4ek?cluster=devnet` | `D5HnpX9tXFi5gxaD1mds6EmtPvVSyeuWvHpu4Z7X7YqK` |
| Attach AppData (`AddExternalPluginAdapter`) | `2FshFpvXW6543eNE5Vot9k4po4Cr8PTSUga66tCg517H1GFKaCHTfKHe6ZSfZxeJkpx8inuYEYMNr5DuFhD4tnY3` | `https://explorer.solana.com/tx/2FshFpvXW6543eNE5Vot9k4po4Cr8PTSUga66tCg517H1GFKaCHTfKHe6ZSfZxeJkpx8inuYEYMNr5DuFhD4tnY3?cluster=devnet` | `D5HnpX9tXFi5gxaD1mds6EmtPvVSyeuWvHpu4Z7X7YqK` |
| Write initial AppData | `3pvRzuw6LvrrY61zpRGCHSjcbgfTd5MY2Tm5b84Q1Nw5wiyFTCr1iD9hiRgmNkJPktzxcdYk1UoujfYxpCXvuYFC` | `https://explorer.solana.com/tx/3pvRzuw6LvrrY61zpRGCHSjcbgfTd5MY2Tm5b84Q1Nw5wiyFTCr1iD9hiRgmNkJPktzxcdYk1UoujfYxpCXvuYFC?cluster=devnet` | `D5HnpX9tXFi5gxaD1mds6EmtPvVSyeuWvHpu4Z7X7YqK` |
| Update AppData | `rrPY2Fp1hVHYojhLwhuzbCAid1796FzGaSbiw21PfBEAoTMZCTZJRPbnazBp45RhTtMPRRHqVhvPAri9oVbKdcX` | `https://explorer.solana.com/tx/rrPY2Fp1hVHYojhLwhuzbCAid1796FzGaSbiw21PfBEAoTMZCTZJRPbnazBp45RhTtMPRRHqVhvPAri9oVbKdcX?cluster=devnet` | `D5HnpX9tXFi5gxaD1mds6EmtPvVSyeuWvHpu4Z7X7YqK` |

Last Updated: 2026-04-12 21:07:07 UTC

## BRI-165 S20-S23 Asset Document Upload Transport Note
- `/admin/assets/new` now sends brochure, legal, financial, and media bytes directly from the browser to Vercel Blob through `@vercel/blob/client`.
- This is an off-chain storage transport change only:
  - Core Candy Machine collection/asset metadata URI rules remain unchanged.
  - Pinata/IPFS metadata pinning behavior remains unchanged.
  - Mint authority, collection authority, royalties, guards, and on-chain transaction construction are not modified.
- The existing upload contract, finalize validation, `editSessionId` lifecycle, and marketplace handoff remain the source of app-side traceability for files attached before mint/deploy.
- The document limit stays `10 MB`; oversized PDFs are rejected before upload with a compression recommendation rather than being sent through a Vercel Function that can return `413`.

## EPIC-002 Implementation Notes (Core Candy Machine Mint Module)
- Status: `in-review` (2026-03-16)
- Scope implemented in this iteration:
  - Continuous UI flow in `/admin/assets/new`: `Create Asset -> Continue to mint -> Mint Setup` in the same module.
  - Mint setup prefill wired from form state (`cover/uri`, `name`, `symbol`, `description`, `quantity`).
  - Relational snapshot persistence integrated for mint orchestrator transitions (`create`, `prepare`, `submit`, `reconcile`, `reconcile/das`) into:
    - `mint_jobs`
    - `mint_job_batches`
    - `mint_job_items`
    - `mint_item_signatures`
- Authority model:
  - Mint-orchestrator routes enforce admin session server-side before any mutation.
  - Transaction construction/submit flow remains server-mediated through backend API endpoints.
- Reconciliation:
  - DAS route (`/reconcile/das`) remains active as primary high-throughput reconciliation path.
- Pending for full EPIC close:
  - Complete migration from Core direct mint flow to Core Candy Machine flow (`create+guards+items+mint`) with `startDate + tokenPayment(USDC)` as canonical pricing guard.
  - Devnet proof update with real signatures for Candy Machine deploy was completed on 2026-03-18; mint batch signatures are still pending for this EPIC.

- Core Candy Machine implementation status:
  - New backend module: `lib/core-candy-machine-admin.ts`.
  - New API routes:
    - `/api/admin/core-candy-machine/deploy/prepare`
    - `/api/admin/core-candy-machine/mint/prepare`
    - `/api/admin/core-candy-machine/submit`
  - New client panel:
    - `components/admin/core-candy-machine-panel.tsx`
  - Enforced guards on deploy:
    - `startDate`
    - `tokenPayment = amountUsdcAtomic` (unit price derived from admin form `Costo por NFT`)
    - `thirdPartySigner` (backend signer, mandatory for public purchase flow)
