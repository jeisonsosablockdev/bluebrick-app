import nextVitals from "eslint-config-next/core-web-vitals";

const legacyWeb3ImportAllowlist = [
  "app/api/admin/mint-orchestrator/jobs/*/reconcile/route.ts",
  "components/admin/core-candy-machine-panel.tsx",
  "components/admin/metaplex-core-mint-panel.tsx",
  "components/marketplace/PurchaseCta.tsx",
  "tests/e2e/helpers/siws-local-wallet.ts",
  "e2e/helpers/siws-local-wallet.ts",
  "scripts/devnet-authority-lifecycle-proof.ts",
  "scripts/validation/epic-001-validation.mjs",
  "tests/e2e/wallet-setup/solana-wallet-profiles.mjs",
  "e2e/wallet-setup/solana-wallet-profiles.mjs",
  "lib/candy-guard-payment-config.ts",
  "lib/core-authority-lifecycle.ts",
  "lib/core-candy-machine-admin.ts",
  "lib/core-candy-machine-snapshot-service.ts",
  "lib/metaplex-core-admin.ts",
  "lib/property-marketplace-server.ts",
  "lib/purchase-anti-bot.ts",
  "lib/purchase-service.ts",
  "lib/purchase-third-party-signer.ts",
  "lib/solana-kit/compat/**/*.{ts,tsx}",
  "apps/web/src/lib/candy-guard-payment-config.ts",
  "apps/web/src/lib/core-authority-lifecycle.ts",
  "apps/web/src/lib/core-candy-machine-admin.ts",
  "apps/web/src/lib/core-candy-machine-snapshot-service.ts",
  "apps/web/src/lib/metaplex-core-admin.ts",
  "apps/web/src/lib/property-marketplace-server.ts",
  "apps/web/src/lib/purchase-anti-bot.ts",
  "apps/web/src/lib/purchase-service.ts",
  "apps/web/src/lib/purchase-third-party-signer.ts",
  "apps/web/src/lib/solana-kit/compat/**/*.{ts,tsx}",
  "tests/lib/purchase-anti-bot.test.ts"
];

const noWeb3ImportsRule = [
  "error",
  {
    paths: [
      {
        name: "@solana/web3.js",
        message:
          "Use @solana/kit foundation modules. If interop is unavoidable, isolate it under a compat adapter."
      }
    ]
  }
];

const config = [
  ...nextVitals,
  {
    ignores: [
      "**/.next/**",
      "**/.vercel/**",
      "**/node_modules/**",
      "playwright-report/**",
      "test-results/**",
      ".blob-report/**",
      ".cache-synpress/**"
    ]
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    rules: {
      "no-restricted-imports": noWeb3ImportsRule,
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn"
    }
  },
  {
    files: legacyWeb3ImportAllowlist,
    rules: {
      "no-restricted-imports": "off"
    }
  },
  {
    files: ["lib/software/**/*.{ts,tsx}", "apps/web/src/lib/software/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@knowledge/*", "@regulatory/*"]
        }
      ]
    }
  },
  {
    files: ["lib/knowledge/**/*.{ts,tsx}", "apps/web/src/lib/knowledge/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@software/*", "@regulatory/*"]
        }
      ]
    }
  },
  {
    files: ["lib/regulatory/**/*.{ts,tsx}", "apps/web/src/lib/regulatory/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@software/*", "@knowledge/*"]
        }
      ]
    }
  }
];

export default config;
