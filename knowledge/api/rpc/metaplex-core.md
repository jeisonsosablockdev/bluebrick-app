---
type: API Reference
title: Metaplex Core RPC
description: Metaplex Core program methods used by BRIDS — collections, assets, plugins, plugins, plugins, Candy Machine
tags: [api, rpc, metaplex, core, candy-machine, plugins, nft]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/lib/metaplex-core
---

# Metaplex Core RPC

## Program IDs
| Program | Address |
| --- | --- |
| Metaplex Core | `CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d` |
| Core Candy Machine | `CMACYFENjoBMHzapRXyo1JZkVS6EtaDDzkjMrmQLvr4J` |

## Core Instructions (via UMI)

### Collection
| Instruction | Purpose | Required Signers |
| --- | --- | --- |
| `createCollectionV2` | Create Core collection | payer, collection keypair |
| `updateCollection` | Update collection metadata | updateAuthority |

### Asset
| Instruction | Purpose | Required Signers |
| --- | --- | --- |
| `createV2` | Mint asset into collection | payer, asset keypair, collection |
| `updateV2` | Update asset metadata | updateAuthority |
| `transferV2` | Transfer asset | owner |

### Plugins
| Instruction | Purpose | Required Signers |
| --- | --- | --- |
| `addExternalPluginAdapter` | Attach AppData adapter | updateAuthority |
| `writeExternalPluginAdapterDataV1` | Write AppData payload | updateAuthority |

### Candy Machine
| Instruction | Purpose | Required Signers |
| --- | --- | --- |
| `createCandyMachine` | Create CM with config | payer, CM keypair, collection |
| `loadConfigLines` | Load mint config lines | payer, CM |
| `mintV1` | Mint from CM | payer, buyer, CM, collection |

### Guards
| Guard | Config | Purpose |
| --- | --- | --- |
| `startDate` | `startDate` | Mint not before date |
| `tokenPayment` | `amount`, `mint`, `destinationAta` | USDC payment |
| `solPayment` | `amount`, `destinationAta` | SOL payment (legacy) |
| `thirdPartySigner` | `signer` | Backend co-sign required |

## BRIDS Plugin Usage

### PermanentFreezeDelegate
- Attached at collection creation
- Authority: `SQUADS_FREEZE_AUTHORITY` env
- Enables admin freeze (not user stake)

### PermanentTransferDelegate
- Attached at collection creation
- Authority: `SQUADS_TRANSFER_AUTHORITY` env
- Controls transfer permissions

### FreezeDelegate (Owner)
- Attached per-asset at marketplace mint
- Authority: `Owner` (buyer wallet)
- **Required for Stake/Unstake eligibility**

### AppData (ExternalPluginAdapter)
- Schema: `ExternalPluginAdapterSchema.Json`
- Data Authority: `UpdateAuthority`
- Payload: `AppData v1` economic fields

## Account Structure

### Collection Account
- Owner: `CoREENx...` (Core program)
- Data: name, URI, plugins[], updateAuthority

### Asset Account
- Owner: `CoREENx...`
- Data: name, URI, collection, plugins[]
- No separate metadata PDA (Core stores inline)

### Candy Machine Account
- Owner: `CMACYFEN...`
- Data: config lines, itemsLoaded, itemsRedeemed, guards

## Read Methods (via DAS)
| Query | Purpose |
| --- | --- |
| `getAssetsByGroup` | All assets in collection |
| `getAsset` | Single asset with plugin state |
| `searchAssets` | Filter by plugin/attribute |

## Devnet Verification
All BRIDS deployments on devnet. Verify via:
- `getAccountInfo` → owner = Core program
- `getAssetsByGroup` → assets in collection
- `getParsedTransaction` → instruction logs show plugin attachment

## Related
- [NFT Spec](../architecture/nft-spec.md) — full specification
- [Solana RPC Methods](solana-methods.md) — base RPC
- [Admin Assets API](../endpoints/admin-assets.md) — deploy endpoints