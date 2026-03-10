# NFT Spec

## Scope
- Feature: Admin-driven batch minting on Solana devnet using Metaplex Core.
- Collection: One Core collection per mint run. Assets are minted as numbered fractions under that collection.

## Mint Authority Model
- Mint authority:
  - The authenticated admin wallet (SIWS session) is the payer and mint authority for `createCollectionV2` and `createV2`.
  - Collection/asset addresses are generated server-side as fresh signer keypairs per item.
- Validation logic:
  - `/api/admin/metaplex-core/prepare` and `/api/admin/metaplex-core/submit` require `admin` role server-side.
  - Frontend wallet must match authenticated session wallet (`payerPublicKey` check before signing).
  - Only devnet RPC is accepted (`NEXT_PUBLIC_SOLANA_RPC` enforced by `lib/solana.ts`).
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

## Devnet Mint Proof
| Purpose | Signature | Explorer URL | Metadata Account |
| --- | --- | --- | --- |
| Create Core collection | `31iKqrqa7cFn3z2b8Q2oVbD2tazBLUBQ1t1ahgTSeadXxHrjXVSt4zXu3QTzWvXEN77rCXEdV6dhC673SNUxhrDR` | `https://explorer.solana.com/tx/31iKqrqa7cFn3z2b8Q2oVbD2tazBLUBQ1t1ahgTSeadXxHrjXVSt4zXu3QTzWvXEN77rCXEdV6dhC673SNUxhrDR?cluster=devnet` | `6QEWjo18DHmAKFK8WaGkZL78eZE1yY9b9anmb7UVawE1` |
| Mint Core asset in collection | `2nsk2m6QaWjYipQFcZqN7ZbbnBgAbDYjMisFM4yXgqQ2911deiRZxavon457z8i8wLRHjJSjxfVVH3tDwH3CjNtD` | `https://explorer.solana.com/tx/2nsk2m6QaWjYipQFcZqN7ZbbnBgAbDYjMisFM4yXgqQ2911deiRZxavon457z8i8wLRHjJSjxfVVH3tDwH3CjNtD?cluster=devnet` | `3Z1NK5D9y5kyWdoYD3Z9SpUAVTRUobWQLvKfwcWt3py9` |

Last Updated: 2026-03-09 03:16:27 UTC
