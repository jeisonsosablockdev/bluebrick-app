# NFT Spec

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
- Error contract exposed to UI:
  - `MINT_NOT_STARTED`, `SOLD_OUT`, `PRICE_CHANGED`, `INVALID_QUANTITY`, `INSUFFICIENT_FUNDS`, `INVALID_CHALLENGE`, `RATE_LIMITED`, `TRANSACTION_FAILED`.
- Traceability persistence:
  - `purchase_attempts` stores wallet, candy machine, challenge linkage (`challenge_id`), client IP, idempotency fields (`idempotency_key`, `idempotency_expires_at`), tx signature, status, and error code/message.
  - `purchase_flow_events` stores request timeline (`quote/challenge/prepare/submit`, `request/success/error`) correlated by `flow_id` for UI E2E debugging.
  - State machine: `created -> prepared -> submitted -> confirmed | failed`.
  - Prepare emits server-side `idempotencyKey` (UUIDv7, TTL 5 min).
  - Submit requires `attemptId + idempotencyKey`, enforces DB dedupe (`wallet_public_key + idempotency_key`) and uses row lock to prevent duplicate sends under retry/double-click races.
  - `purchase_challenges` stores challenge nonce/message/TTL and consumption/failure state.
  - `purchase_rate_limit_events` stores rolling rate-limit event evidence by endpoint + wallet + IP.
  - Submit returns initial `submitted` state; final confirmation/reconciliation is handled server-side in later EPIC stories.
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
- Rotation/revocation:
  - Admin wallet allowlist is managed through `ADMIN_WALLETS`.
  - Revoking admin rights is immediate once wallet is removed from allowlist.

## Metadata Ownership
- Metadata PDA seeds:
  - Metaplex Core stores metadata in the same Core asset account (no separate Metaplex Token Metadata PDA in this flow).
- Metadata owner validation:
  - Owner is set to the admin wallet at mint time (`owner: payerPublicKey` in `createV2`).
- Update authority validation:
  - Collection is created with `updateAuthority = admin wallet`.
  - Assets minted into a collection do not set per-asset `updateAuthority` (Core rejects setting both collection + update authority).

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
- Final snapshot endpoint:
  - `POST /api/admin/core-candy-machine/snapshot/finalize`
- Persisted datasets:
  - `asset_mint_snapshots`: form snapshot, blockchain snapshot, verification result, handoff status.
  - `asset_mint_onchain_proofs`: deploy/mint signatures with confirmation status, slot, and error.
- Verification policy:
  - Primary method: DAS `getAssetsByGroup` by `collectionAddress`.
  - Fallback method: candy machine counters (`itemsLoaded/itemsAvailable`) marked as `degraded`.
  - `Create Asset` is enabled only when `verificationStatus=verified` and job status is `completed`.
- Business safety:
  - `partial` mint state is treated as non-eligible for `Create Asset`.
  - Marketplace handoff remains `ready` only for fully verified snapshots.

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

Last Updated: 2026-03-20 19:27:57 UTC

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
