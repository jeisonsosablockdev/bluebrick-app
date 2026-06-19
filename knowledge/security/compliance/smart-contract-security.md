---
type: Compliance
title: Smart Contract Security Best Practices
description: Solana program security patterns for BRIDS — Metaplex Core, Candy Machine, authority management, PDA validation
tags: [compliance, solana, smart-contract, security, metaplex, candy-machine, pda, authority, cpi]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/programs
---

# Smart Contract Security Best Practices

## Overview
BRIDS uses Metaplex Core and Core Candy Machine programs on Solana devnet. No custom programs deployed yet — all on-chain logic via Metaplex SDK (UMI).

## Security Principles

### 1. Authority Validation (Mandatory)
| Check | Where | Implementation |
| --- | --- | --- |
| Mint authority | Collection creation | Admin wallet signs `createCollectionV2` |
| Update authority | Metadata updates | `updateAuthority = admin wallet` (delegated) |
| Collection authority | Plugin management | Verified on `addExternalPluginAdapter` |
| Freeze delegate | Stake/Unstake | `FreezeDelegate` with `Owner` authority |
| Transfer delegate | Transfer restrictions | `PermanentTransferDelegate` with Squads authority |

### 2. PDA Validation
```typescript
// Always derive PDAs explicitly, never trust client-provided addresses
const [collectionPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("collection"), adminPubkey.toBuffer()],
  METAPLEX_CORE_PROGRAM_ID
);
```

### 3. CPI Safety
- No custom CPIs (using Metaplex Core via UMI)
- All instructions built server-side via UMI
- Client only signs pre-built transactions

### 4. Account Ownership Validation
```typescript
// Always verify on-chain
const account = await connection.getAccountInfo(address);
assert(account.owner.equals(EXPECTED_PROGRAM_ID));
```

## Metaplex Core Patterns

### Collection Creation
```typescript
// Fresh signer keypair per collection
const collectionKeypair = Keypair.generate();

// Admin wallet = payer + authority
createCollectionV2(umi, {
  collection: collectionKeypair,
  name: "...",
  uri: "...",
  updateAuthority: adminWallet.publicKey,
});
```

### Asset Minting
```typescript
// Fresh signer per asset
const assetKeypair = Keypair.generate();

createV2(umi, {
  asset: assetKeypair,
  collection: collectionPda,
  name: `Asset #${serial}`,
  uri: metadataUri,
});
```

### Plugin Attachment
```typescript
// AppData for economic data
addExternalPluginAdapter(umi, {
  asset: assetPda,
  plugin: ExternalPluginAdapter {
    type: ExternalPluginAdapterSchema.Json,
    dataAuthority: UpdateAuthority, // admin wallet
  },
});
```

### Authority Management (EPIC-006 STORY-006-04)
```typescript
// Rotation via Squads multisig
rotateAuthority(umi, {
  collection: collectionPda,
  role: "appdata_authority",
  newAuthority: newWalletPubkey,
  multisig: { proposer, executor, approvers, threshold },
});
```

## Candy Machine Security

### Guard Configuration
```typescript
// Mandatory guards for public mint
guards: [
  startDate: { date: ISO8601 },           // Time-gated
  tokenPayment: {                         // USDC payment
    amount: atomicAmount,
    mint: USDC_MINT,
    destinationAta: treasuryAta,
  },
  thirdPartySigner: {                     // Backend co-sign
    signer: backendSignerPubkey,
  },
];
```

### Config Lines
- Chunked loading (adaptive sizing)
- Each chunk signed + submitted
- Verification: `itemsLoaded` === expected quantity

## Devnet-Only Enforcement
- **All blockchain acceptance on devnet only**
- Real signatures required (no mocks)
- On-chain state verified via RPC/DAS before persistence
- Devnet transaction proof mandatory for acceptance

## Security Checklist (Per Deployment)
- [ ] Collection PDA derived correctly
- [ ] Candy Machine PDA derived correctly
- [ ] Update authority = admin wallet (or multisig)
- [ ] Freeze delegate = Owner (for stake eligibility)
- [ ] Transfer delegate = Squads authority
- [ ] Third-party signer = backend signer
- [ ] Start date = current or future
- [ ] Token payment = USDC, correct amount
- [ ] Config lines loaded = expected quantity
- [ ] DAS reconciliation matches expected
- [ ] Snapshot verification = verified
- [ ] Explorer links recorded for all signatures

## Prohibited Patterns
| Pattern | Why | Alternative |
| --- | --- | --- |
| Hardcode metadata | Immutable, no updates | Pinata/IPFS URI |
| Skip PDA validation | Client can forge addresses | Derive server-side |
| Trust client-provided mint | Can mint to attacker wallet | Derive fresh keypair server-side |
| Assume update authority | May be rotated | Check on-chain |
| Float point math | Precision loss | Integer arithmetic (lamports/atomic) |
| Unchecked signer | Can drain funds | Verify all signers match |
| No idempotency | Duplicate submits | UUIDv7 keys + DB unique constraints |

## Testing Requirements
- Unit: PDA derivation, guard config, authority checks
- Integration: Full deploy → mint → verify on devnet
- Fuzz: Proptest for instruction serialization
- Security: `cargo audit`, `cargo deny` in CI

## Related
- [NFT Spec](../architecture/nft-spec.md)
- [Authority Model](../architecture/authority-model.md)
- [Rotation Spec](../architecture/rotation-spec.md)
- [Mint Job Model](../database/models/mint-job.md)
- [Devnet Proof](../architecture/devnet-proof.md)