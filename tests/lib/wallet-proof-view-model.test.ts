import { describe, expect, it } from "vitest";

import { getWalletProofViewModel } from "@/lib/wallet-proof-view-model";
import type { LocaleText } from "@/lib/i18n";

const t = (text: LocaleText) => text.en;

describe("wallet proof view model", () => {
  it("describes a mismatched connected wallet as a warning state", () => {
    const viewModel = getWalletProofViewModel({
      t,
      phase: "idle",
      hasWalletSession: true,
      hasWalletSessionAdapterMismatch: true,
      isConnected: true
    });

    expect(viewModel.eyebrow).toBe("Wallet mismatch");
    expect(viewModel.statusLabel).toBe("Mismatch");
    expect(viewModel.statusTone).toBe("warning");
    expect(viewModel.title).toBe("Reconnect the signed-in wallet");
  });

  it("prioritizes signing copy while Phantom confirmation is pending", () => {
    const viewModel = getWalletProofViewModel({
      t,
      phase: "signing",
      hasWalletSession: false,
      hasWalletSessionAdapterMismatch: false,
      isConnected: true
    });

    expect(viewModel.title).toBe("Confirm the signature in Phantom");
    expect(viewModel.statusLabel).toBe("Waiting in Phantom");
    expect(viewModel.statusTone).toBe("progress");
    expect(viewModel.steps).toEqual([
      { label: "Connect", active: false, complete: true },
      { label: "Sign", active: true, complete: false },
      { label: "Session", active: false, complete: false }
    ]);
  });

  it("marks verification as the session creation step", () => {
    const viewModel = getWalletProofViewModel({
      t,
      phase: "verifying",
      hasWalletSession: false,
      hasWalletSessionAdapterMismatch: false,
      isConnected: true
    });

    expect(viewModel.title).toBe("Verifying your wallet proof");
    expect(viewModel.statusLabel).toBe("Verifying");
    expect(viewModel.steps[2]).toEqual({ label: "Session", active: true, complete: false });
  });

  it("shows active session copy when SIWS is authenticated", () => {
    const viewModel = getWalletProofViewModel({
      t,
      phase: "idle",
      hasWalletSession: true,
      hasWalletSessionAdapterMismatch: false,
      isConnected: true
    });

    expect(viewModel.eyebrow).toBe("Wallet session");
    expect(viewModel.statusLabel).toBe("Active");
    expect(viewModel.statusTone).toBe("active");
    expect(viewModel.steps.every((step) => step.complete)).toBe(true);
  });

  it("keeps pending proof copy for a connected wallet without SIWS", () => {
    const viewModel = getWalletProofViewModel({
      t,
      phase: "idle",
      hasWalletSession: false,
      hasWalletSessionAdapterMismatch: false,
      isConnected: true
    });

    expect(viewModel.eyebrow).toBe("Wallet proof");
    expect(viewModel.title).toBe("Prove this wallet belongs to you");
    expect(viewModel.statusLabel).toBe("Pending");
    expect(viewModel.statusTone).toBe("pending");
  });
});
