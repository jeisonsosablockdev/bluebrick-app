/**
 * @file tests/unit/solana-wallet-decoupled.test.ts
 * @description Layer 1 & 2: Unit tests verifying that Solana wallet components and hooks
 * remain decoupled with zero runtime wallet adapter providers.
 */

import { describe, it, expect } from "vitest";
import { useSolanaWallet } from "../../apps/web/src/lib/hooks/use-solana-wallet";

describe("Decoupled Solana Wallet State", () => {
  it("useSolanaWallet returns a stable disconnected state without throwing provider errors", () => {
    // Step 1: Execute hook directly without WalletProvider context
    const walletState = useSolanaWallet();

    // Step 2: Assert default decoupled contracts
    expect(walletState.connected).toBe(false);
    expect(walletState.connecting).toBe(false);
    expect(walletState.publicKeyBase58).toBeNull();
    expect(walletState.formattedAddress).toBe("");
    expect(typeof walletState.disconnect).toBe("function");
  });
});
