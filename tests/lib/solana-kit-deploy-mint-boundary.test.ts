import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const REPO_ROOT = process.cwd();

const DEPLOY_MINT_FILES = [
  "lib/core-candy-machine-admin.ts",
  "lib/metaplex-core-admin.ts",
  "lib/candy-guard-payment-config.ts",
  "lib/purchase-third-party-signer.ts",
  "components/admin/core-candy-machine-panel.tsx",
  "components/admin/metaplex-core-mint-panel.tsx"
];

const MARKETPLACE_PURCHASE_FILES = [
  "lib/purchase-service.ts",
  "components/marketplace/PurchaseCta.tsx"
];

function readRepoFile(relativePath: string): string {
  return readFileSync(join(REPO_ROOT, relativePath), "utf8");
}

describe("Solana Kit deploy/mint boundary", () => {
  it("keeps direct web3 and umi-web3 transaction interop out of deploy/mint surfaces", () => {
    for (const relativePath of DEPLOY_MINT_FILES) {
      const source = readRepoFile(relativePath);

      expect(source, `${relativePath} must not import @solana/web3.js directly`).not.toContain("@solana/web3.js");
      expect(source, `${relativePath} must not import umi-web3js-adapters directly`).not.toContain("umi-web3js-adapters");
      expect(source, `${relativePath} must not construct legacy web3 connections directly`).not.toContain("new Connection(");
      expect(source, `${relativePath} must not call legacy sendRawTransaction directly`).not.toContain(".sendRawTransaction(");
    }
  });

  it("keeps marketplace purchase submit and confirmation on the Kit RPC boundary", () => {
    for (const relativePath of MARKETPLACE_PURCHASE_FILES) {
      const source = readRepoFile(relativePath);

      expect(source, `${relativePath} must not import @solana/web3.js directly`).not.toContain("@solana/web3.js");
      expect(source, `${relativePath} must not construct legacy web3 connections directly`).not.toContain("createLegacyConnection");
      expect(source, `${relativePath} must not submit through legacy web3 RPC`).not.toContain("sendLegacyVersionedTransaction");
      expect(source, `${relativePath} must not confirm through legacy web3 RPC`).not.toContain("getLegacySignatureStatus");
    }
  });

  it("documents the single compat adapter that may hold legacy transaction interop", () => {
    const adapter = readRepoFile("lib/solana-kit/compat/web3-transactions.ts");

    expect(adapter).toContain("@solana/kit");
    expect(adapter).toContain("@solana/web3.js");
    expect(adapter).toContain("umi-web3js-adapters");
  });
});
