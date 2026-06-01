import { describe, expect, it } from "vitest";

import { resolveWalletSigningPreparation } from "@/lib/wallet-signing-prep";

describe("wallet signing preparation", () => {
  it("blocks mismatched wallet sessions", () => {
    expect(resolveWalletSigningPreparation({
      activePublicKey: "WalletA",
      authenticatedPublicKey: "WalletB",
      hasWalletSession: true,
      hasWalletSessionAdapterMismatch: true,
      isConnected: true
    })).toEqual({ status: "mismatch" });
  });

  it("stops when the signed-in wallet session is already connected", () => {
    expect(resolveWalletSigningPreparation({
      activePublicKey: "WalletA",
      authenticatedPublicKey: "WalletA",
      hasWalletSession: true,
      hasWalletSessionAdapterMismatch: false,
      isConnected: true
    })).toEqual({ status: "already_authenticated" });
  });

  it("requests adapter connection when no active public key is available", () => {
    expect(resolveWalletSigningPreparation({
      activePublicKey: null,
      authenticatedPublicKey: null,
      hasWalletSession: false,
      hasWalletSessionAdapterMismatch: false,
      isConnected: false
    })).toEqual({ status: "needs_connection" });
  });

  it("requests reconnection for an existing wallet session with a disconnected adapter", () => {
    expect(resolveWalletSigningPreparation({
      activePublicKey: "WalletA",
      authenticatedPublicKey: "WalletA",
      hasWalletSession: true,
      hasWalletSessionAdapterMismatch: false,
      isConnected: false
    })).toEqual({ status: "needs_connection" });
  });

  it("returns the active public key when signing can proceed", () => {
    expect(resolveWalletSigningPreparation({
      activePublicKey: "WalletA",
      authenticatedPublicKey: null,
      hasWalletSession: false,
      hasWalletSessionAdapterMismatch: false,
      isConnected: true
    })).toEqual({ status: "ready", activePublicKey: "WalletA" });
  });
});
