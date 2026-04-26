# Fix: initial npm deprecation cleanup via wallet bundle prune

## Context

The application initializes only `PhantomWalletAdapter` in `/app/providers.tsx` and does not import or instantiate the aggregated `@solana/wallet-adapter-wallets` package anywhere in product code.

Keeping the aggregated wallet bundle in `package.json` pulled in a broad set of unused wallet adapters and transitive packages, including deprecated packages such as `uuidv4` and multiple non-Solana wallet ecosystems that are outside this project's runtime scope.

## Change

- Removed `@solana/wallet-adapter-wallets` from `package.json`.
- Regenerated `package-lock.json` after uninstalling the unused dependency.
- Upgraded `next` and `eslint-config-next` to `16.2.4`.
- Upgraded `vitest` and `@vitest/coverage-v8` to `4.1.5`.
- Upgraded `@playwright/test` to `1.59.1`.
- Added `scripts/patch-synpress-phantom-peer.js` and wired it into `postinstall` so the published `@synthetixio/synpress-phantom@0.0.14` peer pin does not block the newer Playwright line required by `Next`.

## Why

- Reduces dependency surface area for the frontend wallet layer.
- Removes unused transitive ecosystems from the install graph.
- Lowers `npm` deprecation noise coming from adapters that this app does not support or render.
- Keeps the runtime aligned with the actual product contract: Phantom-only wallet initialization.

## Validation

- `npm run validate`
- `npm run typecheck` after clearing volatile `.next/dev` output

## Typecheck Stability

- `typecheck` now runs `next typegen && tsc --noEmit -p tsconfig.typecheck.json`.
- `tsconfig.typecheck.json` narrows TypeScript input to `.next/types/**/*.ts` and explicitly excludes `.next/dev/types/**/*.ts`.
- `tsconfig.json` is left compatible with Next.js auto-maintenance, while deterministic checking is isolated in the dedicated typecheck config.

## Follow-up

This does not close the broader npm warning cleanup effort. Remaining warnings still need separate follow-up for:

- `@synthetixio/synpress` transitive deprecations
- deterministic validation strategy when a local `next dev` process is already running and repopulating `.next/dev/types`
- upstream removal of the strict `@playwright/test: 1.48.2` peer pin in `@synthetixio/synpress-phantom`
