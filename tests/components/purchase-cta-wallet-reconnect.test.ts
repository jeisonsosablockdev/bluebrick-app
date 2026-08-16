// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import {
  dispatchOpenWalletModal,
  WALLET_MODAL_OPEN_EVENT,
  type WalletModalOpenDetail
} from "@/lib/auth-ui-events";

describe("features/marketplace/presentation/PurchaseCta - SPEC 5 Wallet Reconnect Prompt", () => {
  it("@spec BRI-12-REQ-5 dispatches WALLET_MODAL_OPEN_EVENT when dispatchOpenWalletModal is called", () => {
    const eventHandler = vi.fn();
    window.addEventListener(WALLET_MODAL_OPEN_EVENT, eventHandler);

    dispatchOpenWalletModal({ loginMethod: "wallet" });

    expect(eventHandler).toHaveBeenCalledTimes(1);
    const event = eventHandler.mock.calls[0][0] as CustomEvent<WalletModalOpenDetail>;
    expect(event.type).toBe(WALLET_MODAL_OPEN_EVENT);
    expect(event.detail.loginMethod).toBe("wallet");

    window.removeEventListener(WALLET_MODAL_OPEN_EVENT, eventHandler);
  });
});
