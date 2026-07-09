import nextVitals from "eslint-config-next/core-web-vitals";

const legacyWeb3ImportAllowlist = [
  "app/api/admin/mint-orchestrator/jobs/*/reconcile/route.ts",
  "components/admin/core-candy-machine-panel.tsx",
  "components/admin/metaplex-core-mint-panel.tsx",
  "components/marketplace/PurchaseCta.tsx",
  "e2e/helpers/siws-local-wallet.ts",
  "scripts/devnet-authority-lifecycle-proof.ts",
  "scripts/validation/epic-001-validation.mjs",
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
  {
    ignores: [
      ".next/**",
      ".vercel/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      ".blob-report/**",
      ".cache-synpress/**"
    ]
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    rules: {
      "no-restricted-imports": noWeb3ImportsRule
    }
  },
  {
    files: legacyWeb3ImportAllowlist,
    rules: {
      "no-restricted-imports": "off"
    }
  },
  {
    files: ["lib/software/**/*.{ts,tsx}"],
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
    files: ["lib/knowledge/**/*.{ts,tsx}"],
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
    files: ["lib/regulatory/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@software/*", "@knowledge/*"]
        }
      ]
    }
  },
  ...nextVitals,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off"
    }
  }
];

export default config;
