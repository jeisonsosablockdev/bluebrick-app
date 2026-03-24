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

## Notes
- `createV2` in collection flow must not set per-asset `updateAuthority` (Core rejects `collection + updateAuthority` together).
- This proof validates the on-chain mint baseline used by later orchestration stories (H3-H7). Those stories add server-side state controls and reconciliation logic on top of the same devnet mint primitives.

Last Updated: 2026-03-20 16:49:21 UTC
