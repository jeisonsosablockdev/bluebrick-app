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

## Account State Validation
| Account | Exists | Owner | Executable | Data Length | Lamports | Match |
| --- | --- | --- | --- | --- | --- | --- |
| Collection `6QEWjo18DHmAKFK8WaGkZL78eZE1yY9b9anmb7UVawE1` | `true` | `CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d` | `false` | `103` | `1607760` | Yes |
| Asset `3Z1NK5D9y5kyWdoYD3Z9SpUAVTRUobWQLvKfwcWt3py9` | `true` | `CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d` | `false` | `122` | `3240000` | Yes |

## Reproducible Verification
- Re-verify transaction finality and account ownership with real RPC calls:

```bash
node - <<'NODE'
const { Connection, PublicKey } = require('@solana/web3.js');
const rpc = 'https://api.devnet.solana.com';
const connection = new Connection(rpc, 'confirmed');

const signatures = [
  '31iKqrqa7cFn3z2b8Q2oVbD2tazBLUBQ1t1ahgTSeadXxHrjXVSt4zXu3QTzWvXEN77rCXEdV6dhC673SNUxhrDR',
  '2nsk2m6QaWjYipQFcZqN7ZbbnBgAbDYjMisFM4yXgqQ2911deiRZxavon457z8i8wLRHjJSjxfVVH3tDwH3CjNtD'
];

const accounts = [
  '6QEWjo18DHmAKFK8WaGkZL78eZE1yY9b9anmb7UVawE1',
  '3Z1NK5D9y5kyWdoYD3Z9SpUAVTRUobWQLvKfwcWt3py9'
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
- [x] Evidence is obtained through real RPC calls against devnet (`https://api.devnet.solana.com`).
- [x] No simulated transactions and no mocked RPC data are used in this proof.

## Notes
- `createV2` in collection flow must not set per-asset `updateAuthority` (Core rejects `collection + updateAuthority` together).
- This proof validates the on-chain mint baseline used by later orchestration stories (H3-H7). Those stories add server-side state controls and reconciliation logic on top of the same devnet mint primitives.

Last Updated: 2026-03-10 12:14:00 UTC
