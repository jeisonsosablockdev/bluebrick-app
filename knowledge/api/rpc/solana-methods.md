---
type: API Reference
title: Solana RPC Methods
description: Core Solana RPC methods used by BRIDS — devnet-only, real signatures required
tags: [api, rpc, solana, devnet, umi, kit]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/lib/solana
---

# Solana RPC Methods

## Configuration
- **Cluster**: devnet only (`https://api.devnet.solana.com` or Helius)
- **Client**: `@solana/kit` (preferred) or `@solana/web3.js` (compat)
- **Commitment**: `confirmed` for reads, `finalized` for verification

## Core Methods

### Account & State
| Method | Purpose | BRIDS Usage |
| --- | --- | --- |
| `getAccountInfo` | Fetch account data/owner | Verify Core/CM ownership |
| `getMultipleAccounts` | Batch fetch | DAS reconciliation |
| `getProgramAccounts` | Filter by program | Find collections/CM accounts |

### Transactions
| Method | Purpose | BRIDS Usage |
| --- | --- | --- |
| `getTransaction` / `getParsedTransaction` | Full tx details | Verify mint/deploy signatures |
| `getSignatureStatuses` | Confirmation status | Poll for finalized |
| `simulateTransaction` | Dry-run | Pre-flight validation (not acceptance) |

### Blocks & Slots
| Method | Purpose |
| --- | --- |
| `getSlot` | Current slot |
| `getBlockTime` | Slot → timestamp |
| `getBlocks` | Range for indexing |

### Tokens & NFTs (DAS)
| Method | Purpose |
| --- | --- |
| `getAssetsByGroup` | All assets in collection |
| `getAsset` | Single asset with plugins |
| `searchAssets` | Filter by traits/plugins |

## BRIDS-Specific Patterns

### Devnet Verification (Mandatory)
```typescript
// Every blockchain change must verify:
const tx = await sendAndConfirm(...);
const status = await connection.getSignatureStatus(tx.signature, { searchTransactionHistory: true });
assert(status.value?.confirmationStatus === 'finalized');
assert(status.value?.err === null);
```

### DAS Reconciliation
```typescript
// Paginated collection scan
for await (const page of das.getAssetsByGroup({ collectionAddress, page: 1, limit: 1000 })) {
  for (const asset of page.items) {
    if (submittedItems.has(asset.id)) markConfirmed(asset.id);
  }
  if (!page.nextPage) break;
}
```

### Idempotency Keys
- Purchase: UUIDv7 `idempotencyKey` (5 min TTL)
- Mint batch: `jobId + idempotency_key` (DB unique)
- Webhook: `(provider, eventId)` + `(provider, eventFingerprint)`

## RPC Endpoints Used

| Service | URL | Purpose |
| --- | --- | --- |
| Solana Devnet | `https://api.devnet.solana.com` | Primary RPC |
| Helius Devnet | `https://devnet.helius-rpc.com/?api-key=...` | Enhanced tx, DAS |
| Alchemy Devnet | `https://solana-devnet.g.alchemy.com/v2/...` | Backup, DAS |

## Rate Limits
| Provider | Limit |
| --- | --- |
| Solana public | 100 req/s per IP |
| Helius | Plan-dependent |
| Alchemy | Plan-dependent |

## Error Handling
| Error | Handling |
| --- | --- |
| `BlockhashNotFound` / `BLOCKHASH_EXPIRED` | Retry with fresh blockhash (409 recoverable) |
| `TransactionExpired` | Re-prepare, re-sign, re-submit |
| `InsufficientFunds` | Fail fast, show user |
| `Custom program error` | Parse logs, map to business error |

## Related
- [Metaplex Core RPC](../rpc/metaplex-core.md) — Core/CM instructions
- [Devnet Proof](../architecture/devnet-proof.md) — real signature evidence
- [Purchase Flow API](../endpoints/purchase-flow.md) — RPC usage in flow