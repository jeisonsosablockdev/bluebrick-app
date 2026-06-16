# Solana Kit Migration Recipes

Quick reference for `EPIC-005` migration work from `@solana/web3.js` to `@solana/kit`.

## Purpose
- Accelerate migration by reusing repeatable patterns.
- Keep implementation consistent across frontend, backend, services, tests, and E2E.
- Enforce the boundary rule:
  - `@solana/web3.js` is legacy.
  - New code uses `@solana/kit`.
  - Interop is allowed only in dedicated compat adapters.

## Boundary Rule
- Allowed:
  - `lib/solana-kit/*` for foundation utilities.
  - `lib/solana-kit/compat/*` for temporary interoperability.
- Not allowed:
  - Importing `@solana/web3.js` directly in domain/UI/service modules.

## Recipe 1: Normalize a Public Key Input
### Before (`@solana/web3.js`)
```ts
import { PublicKey } from "@solana/web3.js";

const normalized = new PublicKey(raw).toBase58();
```

### After (`@solana/kit` foundation)
```ts
import { normalizeAddress } from "@/lib/solana-kit/address";

const normalized = normalizeAddress(raw);
```

Notes:
- Keep validation and normalization centralized in one foundation helper.
- Return canonical base58 string form for persistence and comparisons.

## Recipe 2: Build and Sign a Transaction Pipeline
### Before (`VersionedTransaction` direct usage)
```ts
import { VersionedTransaction } from "@solana/web3.js";

const tx = VersionedTransaction.deserialize(raw);
// validate payer, signatures, and submit
```

### After (`@solana/kit` + foundation)
```ts
import {
  parseSignedTransaction,
  assertExpectedPayer,
  sendAndConfirmSignedTransaction
} from "@/lib/solana-kit/transactions";

const tx = parseSignedTransaction(raw);
assertExpectedPayer(tx, expectedPayer);
const signature = await sendAndConfirmSignedTransaction(tx);
```

Notes:
- Keep serialization/parsing/checks in foundation utilities.
- Reuse the same utility path in purchase/admin/reconcile flows.

## Recipe 3: Message Signing (SIWS/Auth)
### Before
```ts
// verify signature with nacl + bytes from web3 PublicKey
```

### After
```ts
import { normalizeAddress, toVerifyBytes } from "@/lib/solana-kit/address";

const wallet = normalizeAddress(payload.publicKey);
const walletBytes = toVerifyBytes(wallet);
// verify with nacl
```

Notes:
- Do not change SIWS message semantics in migration stories.
- Preserve nonce lifecycle and session/cookie behavior.

## Recipe 4: Compat Adapter for External Libraries
Use only when a third-party dependency still requires web3-compatible objects.

```ts
// lib/solana-kit/compat/some-external-adapter.ts
export function toExternalCompatibleType(input: FoundationType) {
  // explicit, narrow conversion here
}
```

Rules:
- Adapter must be local and explicit.
- Do not leak compatible/legacy types outside adapter boundary.
- Add TODO with the removal target story (usually `STORY-005-05`).

## Recipe 5: Migration Checklist per File
1. Replace direct import from `@solana/web3.js`.
2. Move conversion/validation logic into foundation helper if repeated.
3. Keep business behavior unchanged.
4. Update unit/integration tests for migrated path.
5. Run:
   - `npm run validate`
   - `npm test`
   - (when applicable) `npm run e2e:playwright` and `npm run e2e:synpress`

## Reference
- Epic RFC: `docs/rfcs/EPIC-005-full-migration-from-solana-web3-js-to-solana-kit/README.md`
