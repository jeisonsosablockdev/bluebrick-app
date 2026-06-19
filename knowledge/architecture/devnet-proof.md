---
type: Reference
title: Devnet Proof
description: Auditable devnet transaction proofs for Metaplex Core mints, Candy Machine deployments, purchase mints, AppData plugin, and authority lifecycle — real signatures, account state validation, reproducible verification scripts
tags: [architecture, devnet, proof, metaplex-core, candy-machine, purchase, appdata, authority-lifecycle, solana]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/devnet-proof.md
---

# Devnet Proof

## Scope
- Feature lineage covered by this proof: P0-06 H2 base mint flow, re-verified during H8 docs hardening.
- Objective: keep an auditable, reproducible proof that real devnet transactions and account states exist (no simulation, no mocks).

## Environment
- Verification run date: 2026-03-10 12:14:00 UTC
- Cluster: devnet
- RPC endpoint: `https://api.devnet.solana.com`
- Wallet pubkey used in original mint run: `3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd`
- Program ID: `CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d` (Metaplex Core)

## Transaction Proof
| Purpose | Signature | Slot | Block Time (UTC) | Confirmation | Error | Explorer |
| --- | --- | --- | --- | --- | --- | --- |
| Create Core collection | `31iKqrqa7cFn3z2b8Q2oVbD2tazBLUBQ1t1ahgTSeadXxHrjXVSt4zXu3QTzWvXEN77rCXEdV6dhC673SNUxhrDR` | `447194800` | `2026-03-09 03:14:41 UTC` | `finalized` | `null` | `https://explorer.solana.com/tx/31iKqrqa7cFn3z2b8Q2oVbD2tazBLUBQ1t1ahgTSeadXxHrjXVSt4zXu3QTzWvXEN77rCXEdV6dhC673SNUxhrDR?cluster=devnet` |
| Mint Core asset in collection | `2nsk2m6QaWjYipQFcZqN7ZbbnBgAbDYjMisFM4yXgqQ2911deiRZxavon457z8i8wLRHjJSjxfVVH3tDwH3CjNtD` | `447194802` | `2026-03-09 03:14:41 UTC` | `finalized` | `null` | `https://explorer.solana.com/tx/2nsk2m6QaWjYipQFcZqN7ZbbnBgAbDYjMisFM4yXgqQ2911deiRZxavon457z8i8wLRHjJSjxfVVH3tDwH3CjNtD?cluster=devnet` |

## Core Candy Machine Deploy Proof (Pinata Flow)
- Verification run date: 2026-03-18 00:46:30 UTC
- Cluster: devnet
- RPC endpoint: `https://api.devnet.solana.com`
- Wallet pubkey: `3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd`
- Collection address: `G695Q59UUEoWKGdJvBY2msh1CqDzB91ri1G18VJQGGy5`
- Candy Machine address: `96BNZVbtC4qyTp8THm3q1dpmcFqmVoDzpVrLuLTJdvU3`

| Purpose | Signature | Slot | Block Time (UTC) | Confirmation | Error | Explorer | Account |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Create Core Collection | `4VGAgEzcij63XUxJ5TaU3xcH9A1jwHjNzQgxqEveTDmkDmxWDPGiPmXTLhPLJyxesPfxuE3AhUVKibDBwzNNhTim` | `449219278` | `2026-03-18 00:45:52 UTC` | `finalized` | `null` | `https://explorer.solana.com/tx/4VGAgEzcij63XUxJ5TaU3xcH9A1jwHjNzQgxqEveTDmkDmxWDPGiPmXTLhPLJyxesPfxuE3AhUVKibDBwzNNhTim?cluster=devnet` | `G695Q59U...8VJQGGy5` |
| Create Core Candy Machine + Guard | `41AXTaKr5q42uX74Uk5UnFBCSEQD31FKjFAkLLusWLGHJ1iUTdFWGj5oUzU3jhXMtkQcKdHcXbqiNwL6ke3bFf6y` | `449219291` | `2026-03-18 00:45:56 UTC` | `finalized` | `null` | `https://explorer.solana.com/tx/41AXTaKr5q42uX74Uk5UnFBCSEQD31FKjFAkLLusWLGHJ1iUTdFWGj5oUzU3jhXMtkQcKdHcXbqiNwL6ke3bFf6y?cluster=devnet` | `96BNZVbt...uLTJdvU3` |
| Load config lines 1-64 | `55haK5so2GVxy3sgBpQYMz1tj1fNSE9p2YQrNPHoijywFENqJkwAqxGCkHwxkgY4Hh3ZeEXyfQcMCpmDuZywWuHw` | `449219302` | `2026-03-18 00:46:01 UTC` | `finalized` | `null` | `https://explorer.solana.com/tx/55haK5so2GVxy3sgBpQYMz1tj1fNSE9p2YQrNPHoijywFENqJkwAqxGCkHwxkgY4Hh3ZeEXyfQcMCpmDuZywWuHw?cluster=devnet` | `96BNZVbt...uLTJdvU3` |
| Load config lines 65-128 | `3UhDAe8MFxL6kejobnpKJgPJkXQDTmjUD72j3anPUTFvCc9Lb66LpACqxDPAUS1dK9YbttWgkvniRvgRY5uTHp2B` | `449219314` | `2026-03-18 00:46:05 UTC` | `finalized` | `null` | `https://explorer.solana.com/tx/3UhDAe8MFxL6kejobnpKJgPJkXQDTmjUD72j3anPUTFvCc9Lb66LpACqxDPAUS1dK9YbttWgkvniRvgRY5uTHp2B?cluster=devnet` | `96BNZVbt...uLTJdvU3` |
| Load config lines 129-192 | `5JSAiYJDyNkNNvnRaNcFUiQcp3fWcu5n1YtwETVKK4aRX99jHQhz5FCZpwYMwMJreQsL9b5mTSy6bHCnbQG8AjAa` | `449219327` | `2026-03-18 00:46:10 UTC` | `finalized` | `null` | `https://explorer.solana.com/tx/5JSAiYJDyNkNNvnRaNcFUiQcp3fWcu5n1YtwETVKK4aRX99jHQhz5FCZpwYMwMJreQsL9b5mTSy6bHCnbQG8AjAa?cluster=devnet` | `96BNZVbt...uLTJdvU3` |
| Load config lines 193-256 | `3VDCqupkCG3xwXAUAubwTA3BAGumFpAoL7nwLGBubH1kDJN11MRPLVUT5LsHmeLJdR8hdwZ9BQtKSxXMBEZeD6bs` | `449219339` | `2026-03-18 00:46:15 UTC` | `finalized` | `null` | `https://explorer.solana.com/tx/3VDCqupkCG3xwXAUAubwTA3BAGumFpAoL7nwLGBubH1kDJN11MRPLVUT5LsHmeLJdR8hdwZ9BQtKSxXMBEZeD6bs?cluster=devnet` | `96BNZVbt...uLTJdvU3` |
| Load config lines 257-320 | `3gfQSTWyozhd789aWC3ijUuM9yC7uytX6wPU6EB8yDbZTvRoBTuH6rs9Psv26PgLs62YSKvzKnftTDT2mSWmZy9r` | `449219349` | `2026-03-18 00:46:19 UTC` | `finalized` | `null` | `https://explorer.solana.com/tx/3gfQSTWyozhd789aWC3ijUuM9yC7uytX6wPU6EB8yDbZTvRoBTuH6rs9Psv26PgLs62YSKvzKnftTDT2mSWmZy9r?cluster=devnet` | `96BNZVbt...uLTJdvU3` |
| Load config lines 321-384 | `295UBmYo2nxZ1Tx5XHJdPK776oQYA7qqeh5XGsd87kQ9zzesEdivukHgsHFf7U6QvcqyDGCn17oSf4cAqiFiPZCB` | `449219359` | `2026-03-18 00:46:22 UTC` | `finalized` | `null` | `https://explorer.solana.com/tx/295UBmYo2nxZ1Tx5XHJdPK776oQYA7qqeh5XGsd87kQ9zzesEdivukHgsHFf7U6QvcqyDGCn17oSf4cAqiFiPZCB?cluster=devnet` | `96BNZVbt...uLTJdvU3` |
| Load config lines 385-400 | `5F1sktcVcgGmYPS1qEvrYewdd8wAkV9tzutQfC1JDmu3VoP6hbVpW6knTEgahfe5BWFAyAc8NPV11RfpzMr8qM1o` | `449219369` | `2026-03-18 00:46:26 UTC` | `finalized` | `null` | `https://explorer.solana.com/tx/5F1sktcVcgGmYPS1qEvrYewdd8wAkV9tzutQfC1JDmu3VoP6hbVpW6knTEgahfe5BWFAyAc8NPV11RfpzMr8qM1o?cluster=devnet` | `96BNZVbt...uLTJdvU3` |

## Purchase Mint Proof (Third-Party Signer Guard)
- Verification run date: 2026-03-20 16:49:21 UTC
- Cluster: devnet
- RPC endpoint host: `devnet.helius-rpc.com` (API key redacted)
- Wallet pubkey: `3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd`
- Third-party signer pubkey: `HBeC2nF5KAWyBbon2Rxd2kVBLUNQtUgSHyABwYC1msut`
- Marketplace entry id: `torre-marina-premium`
- Candy Machine address: `ECPhPjUhjKpt2vSBSqasnRGT76KG5EW9cP1CQW8RTbg9`
- Collection address: `5vTFKv5xFagfTN7nqdBA6XYQDGdSxArZFS6P2j3orfP9`
- Purchase attempt id (DB): `d7fea17a-e917-4f6b-b541-465243992547`

| Purpose | Signature | Slot | Block Time (UTC) | Confirmation | Error | Explorer |
| --- | --- | --- | --- | --- | --- | --- |
| Public purchase mint (`/api/purchase/prepare` + `/api/purchase/submit`) | `41sSb8Gxbh2ZXW1XFVKmuaBBViaFiKECaQMzXtpmMh1qjYFiYh9zd7XTkF9rXYfYzNmbSJ8Umb45j67QZfXsjv8F` | `449827222` | `2026-03-20 16:45:06 UTC` | `finalized` | `null` | `https://explorer.solana.com/tx/41sSb8Gxbh2ZXW1XFVKmuaBBViaFiKECaQMzXtpmMh1qjYFiYh9zd7XTkF9rXYfYzNmbSJ8Umb45j67QZfXsjv8F?cluster=devnet` |

## Account State Validation
| Account | Exists | Owner | Executable | Data Length | Lamports | Match |
| --- | --- | --- | --- | --- | --- | --- |
| Collection `6QEWjo18DHmAKFK8WaGkZL78eZE1yY9b9anmb7UVawE1` | `true` | `CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d` | `false` | `103` | `1607760` | Yes |
| Asset `3Z1NK5D9y5kyWdoYD3Z9SpUAVTRUobWQLvKfwcWt3py9` | `true` | `CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d` | `false` | `122` | `3240000` | Yes |
| Collection `G695Q59UUEoWKGdJvBY2msh1CqDzB91ri1G18VJQGGy5` | `true` | `CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d` | `false` | `195` | `2248080` | Yes |
| Candy Machine `96BNZVbtC4qyTp8THm3q1dpmcFqmVoDzpVrLuLTJdvU3` | `true` | `CMACYFENjoBMHzapRXyo1JZkVS6EtaDDzkjMrmQLvr4J` | `false` | `3515` | `25355280` | Yes |
| Asset `Gh1hSA4gk9XjYXqEWdTHHGu1GjpR7uurR3w4uyff8xsH` | `true` | `CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d` | `false` | `151` | `3441840` | Yes |
| Collection `5vTFKv5xFagfTN7nqdBA6XYQDGdSxArZFS6P2j3orfP9` | `true` | `CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d` | `false` | `195` | `2248080` | Yes |
| Candy Machine `ECPhPjUhjKpt2vSBSqasnRGT76KG5EW9cP1CQW8RTbg9` | `true` | `CMACYFENjoBMHzapRXyo1JZkVS6EtaDDzkjMrmQLvr4J` | `false` | `3515` | `25355280` | Yes |

### Counter Validation (Purchase CM)
- `itemsLoaded`: `400`
- `itemsAvailable`: `400`
- `itemsRedeemed`: `1`
- `itemsRemaining`: `0`
- Result: Candy Machine is fully loaded and has at least one successful redemption on-chain.

## Reproducible Verification
- Re-verify transaction finality and account ownership with real RPC calls:

```bash
node - <<'NODE'
const { Connection, PublicKey } = require('@solana/web3.js');
const rpc = 'https://api.devnet.solana.com';
const connection = new Connection(rpc, 'confirmed');

const signatures = [
  '31iKqrqa7cFn3z2b8Q2oVbD2tazBLUBQ1t1ahgTSeadXxHrjXVSt4zXu3QTzWvXEN77rCXEdV6dhC673SNUxhrDR',
  '2nsk2m6QaWjYipQFcZqN7ZbbnBgAbDYjMisFM4yXgqQ2911deiRZxavon457z8i8wLRHjJSjxfVVH3tDwH3CjNtD',
  '41sSb8Gxbh2ZXW1XFVKmuaBBViaFiKECaQMzXtpmMh1qjYFiYh9zd7XTkF9rXYfYzNmbSJ8Umb45j67QZfXsjv8F'
];

const accounts = [
  '6QEWjo18DHmAKFK8WaGkZL78eZE1yY9b9anmb7UVawE1',
  '3Z1NK5D9y5kyWdoYD3Z9SpUAVTRUobWQLvKfwcWt3py9',
  'Gh1hSA4gk9XjYXqEWdTHHGu1GjpR7uurR3w4uyff8xsH',
  'ECPhPjUhjKpt2vSBSqasnRGT76KG5EW9cP1CQW8RTbg9'
];

(async () => {
  for (const signature of signatures) {
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed'
    });
    const status = await connection.getSignatureStatus(signature, {
      searchTransactionHistory: true
    });
    console.log('tx', signature, tx?.slot, tx?.meta?.err, status?.value?.confirmationStatus);
  }

  for (const account of accounts) {
    const info = await connection.getAccountInfo(new PublicKey(account), 'confirmed');
    console.log('account', account, !!info, info?.owner?.toBase58(), info?.data?.length);
  }
})();
NODE
```

## Hardening Assertions
- [x] Every listed signature resolves on devnet with `confirmationStatus=finalized`.
- [x] Every listed transaction has `meta.err = null`.
- [x] Collection and asset accounts exist and are owned by Metaplex Core program.
- [x] Candy Machine deploy account exists and is owned by Core Candy Machine program (`CMACYFEN...`).
- [x] Purchase mint tx includes both `MintV1` and `MintAsset` log stages with `thirdPartySigner` account present.
- [x] Evidence is obtained through real RPC calls against devnet (`https://api.devnet.solana.com`).
- [x] No simulated transactions and no mocked RPC data are used in this proof.

## EPIC-006 STORY-006-03 Proof (Economic AppData Plugin)
- Verification run date: 2026-04-01 08:13:30 UTC
- Cluster: devnet
- RPC endpoint: `https://api.devnet.solana.com`
- Wallet: `3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd`
- Collection: `2vPD7d2ojHbMTa4CubV5MwzhQKRNrc1DFbTpBBTBszHi`
- Asset: `D5HnpX9tXFi5gxaD1mds6EmtPvVSyeuWvHpu4Z7X7YqK`

| Purpose | Signature | Slot | Block Time (UTC) | Confirmation | Error | Explorer |
| --- | --- | --- | --- | --- | --- | --- |
| Create Core collection (`CreateCollectionV2`) | `3UJFwJDhmU56FRhbxURZGkYN2Vc7QtxkDhnd6stKgJE2mudcepzQxHcvs7bYDMNegnTeN6dEkUobToHPBmPg3h9N` | `452479862` | `2026-04-01 08:12:30 UTC` | `finalized` | `null` | `https://explorer.solana.com/tx/3UJFwJDhmU56FRhbxURZGkYN2Vc7QtxkDhnd6stKgJE2mudcepzQxHcvs7bYDMNegnTeN6dEkUobToHPBmPg3h9N?cluster=devnet` |
| Mint Core asset (`CreateV2`) | `39mG3FSESWfASb74cDdkYbX9LGxDQXKc9Eiy8vt3CNF2R1jFDjn9Z5wgmBWiFGmBQquyyDDAb1mfvT7uxs9sS4ek` | `452479864` | `2026-04-01 08:12:30 UTC` | `finalized` | `null` | `https://explorer.solana.com/tx/39mG3FSESWfASb74cDdkYbX9LGxDQXKc9Eiy8vt3CNF2R1jFDjn9Z5wgmBWiFGmBQquyyDDAb1mfvT7uxs9sS4ek?cluster=devnet` |
| Add `AppData` adapter (`AddExternalPluginAdapter`) | `2FshFpvXW6543eNE5Vot9k4po4Cr8PTSUga66tCg517H1GFKaCHTfKHe6ZSfZxeJkpx8inuYEYMNr5DuFhD4tnY3` | `452479898` | `2026-04-01 08:12:44 UTC` | `finalized` | `null` | `https://explorer.solana.com/tx/2FshFpvXW6543eNE5Vot9k4po4Cr8PTSUga66tCg517H1GFKaCHTfKHe6ZSfZxeJkpx8inuYEYMNr5DuFhD4tnY3?cluster=devnet` |
| Write initial economic payload (`WriteExternalPluginAdapterDataV1`) | `3pvRzuw6LvrrY61zpRGCHSjcbgfTd5MY2Tm5b84Q1Nw5wiyFTCr1iD9hiRgmNkJPktzxcdYk1UoujfYxpCXvuYFC` | `452479932` | `2026-04-01 08:12:57 UTC` | `finalized` | `null` | `https://explorer.solana.com/tx/3pvRzuw6LvrrY61zpRGCHSjcbgfTd5MY2Tm5b84Q1Nw5wiyFTCr1iD9hiRgmNkJPktzxcdYk1UoujfYxpCXvuYFC?cluster=devnet` |
| Update economic payload (`WriteExternalPluginAdapterDataV1`) | `rrPY2Fp1hVHYojhLwhuzbCAid1796FzGaSbiw21PfBEAoTMZCTZJRPbnazBp45RhTtMPRRHqVhvPAri9oVbKdcX` | `452479966` | `2026-04-01 08:13:10 UTC` | `finalized` | `null` | `https://explorer.solana.com/tx/rrPY2Fp1hVHYojhLwhuzbCAid1796FzGaSbiw21PfBEAoTMZCTZJRPbnazBp45RhTtMPRRHqVhvPAri9oVbKdcX?cluster=devnet` |

### Account State Validation (Story-006-03)
| Account | Exists | Owner | Executable | Data Length | Lamports | Match |
| --- | --- | --- | --- | --- | --- | --- |
| Collection `2vPD7d2ojHbMTa4CubV5MwzhQKRNrc1DFbTpBBTBszHi` | `true` | `CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d` | `false` | `138` | `1851360` | Yes |
| Asset `D5HnpX9tXFi5gxaD1mds6EmtPvVSyeuWvHpu4Z7X7YqK` | `true` | `CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d` | `false` | `466` | `5634240` | Yes |

### Final AppData Payload (on-chain)
```json
{
  "revenue_share_bps": 2500,
  "yield_bps": 1300,
  "yield_mode": "linear",
  "locked_at": 1775031177,
  "eligible_from": 1775031177,
  "earning_start_ts": 1775031177,
  "distribution_enabled": false,
  "economic_version": "v1",
  "last_updated_at": 1775031297,
  "updated_by": "story-006-03-admin-update"
}
```

## EPIC-006 STORY-006-04 Proof (On-chain Authority Lifecycle)
- Verification run date: 2026-04-01 16:04:33 UTC
- Cluster: devnet
- RPC endpoint: `https://solana-devnet.g.alchemy.com/v2/0yIenKKNLWTTAWxKRcUvB`
- Payer/admin wallet: `3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd`
- Temporary authority wallet: `C3BPpco9S6DWgTVMtCn3DufqQGG79pNcysffQkczEy8R`
- Collection (proof-only): `DZ7sRMPFCPm5SFeEAc7JN8LQPRtcfi1JFor4QuWRvR1F`

| Purpose | Signature | Slot | Block Time (UTC) | Confirmation | Error | Explorer |
| --- | --- | --- | --- | --- | --- | --- |
| Create proof collection (`CreateCollectionV2`) | `3mHGgtnoDyzzS89fGEpaKgY6oWPEruniRffBn6VkbfADU5L6i7YyTVj3ArHbKBZBsWKp5ZPrfYiFGpCGxsBHwxxi` | `452554355` | `2026-04-01 16:04:12 UTC` | `finalized` | `null` | `https://explorer.solana.com/tx/3mHGgtnoDyzzS89fGEpaKgY6oWPEruniRffBn6VkbfADU5L6i7YyTVj3ArHbKBZBsWKp5ZPrfYiFGpCGxsBHwxxi?cluster=devnet` |
| `emergency_rotate` `appdata_authority` (payer -> temp) | `DWJkjKQeaeXUXAJdXHmWtZjmsHdqmRcTyGRSHZ5wWyA7Aa1EnNZMwq3kWMmYebfQE8BQxQzZZz2e6QbBcZWcsXg` | `452554359` | `2026-04-01 16:04:14 UTC` | `finalized` | `null` | `https://explorer.solana.com/tx/DWJkjKQeaeXUXAJdXHmWtZjmsHdqmRcTyGRSHZ5wWyA7Aa1EnNZMwq3kWMmYebfQE8BQxQzZZz2e6QbBcZWcsXg?cluster=devnet` |
| Fund temporary authority (payer -> temp) | `5gKJwVDA7Z81p95uY2fW5rQWjKx3oazoSYMzXPqkZXqDB5Y3Xwiq7Xq8QJSxw3ux9Qvw8noLutaVzYqvbuRZHDNF` | `452554364` | `2026-04-01 16:04:16 UTC` | `finalized` | `null` | `https://explorer.solana.com/tx/5gKJwVDA7Z81p95uY2fW5rQWjKx3oazoSYMzXPqkZXqDB5Y3Xwiq7Xq8QJSxw3ux9Qvw8noLutaVzYqvbuRZHDNF?cluster=devnet` |
| `rotate` `appdata_authority` (temp -> payer) | `38enfrc4UXg3s7WEBzoeAsx29tRChFmuVZhvWGGEibnbs7k6Nw1tERv8imma9iDgh4idFEe7xJcN4SznFDzsDBy` | `452554374` | `2026-04-01 16:04:19 UTC` | `finalized` | `null` | `https://explorer.solana.com/tx/38enfrc4UXg3s7WEBzoeAsx29tRChFmuVZhvWGGEibnbs7k6Nw1tERv8imma9iDgh4idFEe7xJcN4SznFDzsDBy?cluster=devnet` |

### Backend Audit Evidence (Story-006-04)
| operationId | operation | status | proposalId | approverSigners | signature | submittedAt (UTC) |
| --- | --- | --- | --- | --- | --- | --- |
| `ccedf55f-7f75-4088-8e81-7faaf2220da1` | `emergency_rotate` | `submitted` | `story-006-04-emergency-2026-04-01T16-04-12-416Z` | `3` | `DWJkjKQeaeXUXAJdXHmWtZjmsHdqmRcTyGRSHZ5wWyA7Aa1EnNZMwq3kWMmYebfQE8BQxQzZZz2e6QbBcZWcsXg` | `2026-04-01T16:04:16.487Z` |
| `817d5ef3-10a0-4c87-b1f5-21052a7232b4` | `rotate` | `submitted` | `story-006-04-rotate-back-2026-04-01T16-04-12-416Z` | `2` | `38enfrc4UXg3s7WEBzoeAsx29tRChFmuVZhvWGGEibnbs7k6Nw1tERv8imma9iDgh4idFEe7xJcN4SznFDzsDBy` | `2026-04-01T16:04:21.835Z` |

### Authority Registry Validation (Story-006-04)
| Field | Value |
| --- | --- |
| role | `appdata_authority` |
| collection_address | `DZ7sRMPFCPm5SFeEAc7JN8LQPRtcfi1JFor4QuWRvR1F` |
| authority_pubkey (final) | `3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd` |
| authority_version (final) | `3` |
| last_operation_id | `817d5ef3-10a0-4c87-b1f5-21052a7232b4` |

### Account State Validation (Story-006-04)
| Account | Exists | Owner | Executable | Data Length | Lamports | Match |
| --- | --- | --- | --- | --- | --- | --- |
| Collection `DZ7sRMPFCPm5SFeEAc7JN8LQPRtcfi1JFor4QuWRvR1F` | `true` | `CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d` | `false` | `124` | `1753920` | Yes |

## Notes
- `createV2` in collection flow must not set per-asset `updateAuthority` (Core rejects `collection + updateAuthority` together).
- This proof validates the on-chain mint baseline used by later orchestration stories (H3-H7). Those stories add server-side state controls and reconciliation logic on top of the same devnet mint primitives.
- Additional devnet verification (operator-provided flow):
  - Candy Machine: `9MxpBtK5aTSCEhJzMkiqkSZL1RWLS9gFNHykfirWaTZC`
  - Collection: `GAWSU9zhE62dx5BzGmLz1gQABgsHPnPb1WXbtich9s7x`
  - Mint tx: `4XftJVJji2TN3pdySJtDf7qt55U2dGe1T9EanFV8CCYRvkn5kQ8mW97yU7Pp46erCjx3Jku4DdskJDME7PC5XK1j`
  - Observed state: collection `updateAuthority` resolves to deploy signer wallet `3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd`.
  - Operational decision remains open: keep deploy signer as `updateAuthority` during evaluation window, then decide rotation target (for example, multisig).

Last Updated: 2026-04-01 16:05:30 UTC
