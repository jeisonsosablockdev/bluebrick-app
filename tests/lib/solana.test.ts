import { afterEach, describe, expect, it } from "vitest";
import { clusterApiUrl } from "@solana/web3.js";

import { getSolanaRpcUrl, getWalletModalAutoClose } from "@/lib/solana";

const originalRpc = process.env.NEXT_PUBLIC_SOLANA_RPC;
const originalAutoClose = process.env.NEXT_PUBLIC_WALLET_MODAL_AUTO_CLOSE;

afterEach(() => {
  if (originalRpc === undefined) {
    delete process.env.NEXT_PUBLIC_SOLANA_RPC;
  } else {
    process.env.NEXT_PUBLIC_SOLANA_RPC = originalRpc;
  }

  if (originalAutoClose === undefined) {
    delete process.env.NEXT_PUBLIC_WALLET_MODAL_AUTO_CLOSE;
  } else {
    process.env.NEXT_PUBLIC_WALLET_MODAL_AUTO_CLOSE = originalAutoClose;
  }
});

describe("lib/solana", () => {
  it("uses Solana devnet RPC by default", () => {
    delete process.env.NEXT_PUBLIC_SOLANA_RPC;

    expect(getSolanaRpcUrl()).toBe(clusterApiUrl("devnet"));
  });

  it("accepts a configured devnet RPC URL", () => {
    process.env.NEXT_PUBLIC_SOLANA_RPC = "https://devnet.helius-rpc.com/?api-key=test";

    expect(getSolanaRpcUrl()).toBe("https://devnet.helius-rpc.com/?api-key=test");
  });

  it("rejects non-devnet RPC URLs", () => {
    process.env.NEXT_PUBLIC_SOLANA_RPC = "https://api.mainnet-beta.solana.com";

    expect(() => getSolanaRpcUrl()).toThrow("NEXT_PUBLIC_SOLANA_RPC must target devnet.");
  });

  it("reads wallet modal auto-close flag", () => {
    process.env.NEXT_PUBLIC_WALLET_MODAL_AUTO_CLOSE = "true";
    expect(getWalletModalAutoClose()).toBe(true);

    process.env.NEXT_PUBLIC_WALLET_MODAL_AUTO_CLOSE = "false";
    expect(getWalletModalAutoClose()).toBe(false);
  });
});
