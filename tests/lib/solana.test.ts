import { afterEach, describe, expect, it } from "vitest";

import { getSolanaRpcUrl, getWalletModalAutoClose } from "@/lib/solana";

const originalServerRpc = process.env.SOLANA_RPC_URL;
const originalRpc = process.env.NEXT_PUBLIC_SOLANA_RPC;
const originalAutoClose = process.env.NEXT_PUBLIC_WALLET_MODAL_AUTO_CLOSE;

afterEach(() => {
  if (originalServerRpc === undefined) {
    delete process.env.SOLANA_RPC_URL;
  } else {
    process.env.SOLANA_RPC_URL = originalServerRpc;
  }

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
    delete process.env.SOLANA_RPC_URL;
    delete process.env.NEXT_PUBLIC_SOLANA_RPC;

    expect(getSolanaRpcUrl()).toBe("https://api.devnet.solana.com");
  });

  it("prioritizes SOLANA_RPC_URL over NEXT_PUBLIC_SOLANA_RPC", () => {
    process.env.SOLANA_RPC_URL = "https://devnet.helius-rpc.com/?api-key=server";
    process.env.NEXT_PUBLIC_SOLANA_RPC = "https://api.devnet.solana.com";

    expect(getSolanaRpcUrl()).toBe("https://devnet.helius-rpc.com/?api-key=server");
  });

  it("accepts a configured devnet RPC URL", () => {
    delete process.env.SOLANA_RPC_URL;
    process.env.NEXT_PUBLIC_SOLANA_RPC = "https://devnet.helius-rpc.com/?api-key=test";

    expect(getSolanaRpcUrl()).toBe("https://devnet.helius-rpc.com/?api-key=test");
  });

  it("rejects non-devnet SOLANA_RPC_URL values", () => {
    process.env.SOLANA_RPC_URL = "https://mainnet.helius-rpc.com/?api-key=test";

    expect(() => getSolanaRpcUrl()).toThrow("SOLANA_RPC_URL must target devnet.");
  });

  it("rejects non-devnet RPC URLs", () => {
    delete process.env.SOLANA_RPC_URL;
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
