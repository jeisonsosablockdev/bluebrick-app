// @vitest-environment jsdom

import { createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";

const walletProviderProps = vi.hoisted(() => ({
  latest: null as null | Record<string, unknown>
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  ConnectionProvider: ({ children }: { children: ReactNode }) => createElement("div", null, children),
  WalletProvider: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) => {
    walletProviderProps.latest = props;
    return createElement("div", null, children);
  }
}));

vi.mock("@solana/wallet-adapter-react-ui", () => ({
  WalletModalProvider: ({ children }: { children: ReactNode }) => createElement("div", null, children)
}));

vi.mock("@solana/wallet-adapter-react-ui/styles.css", () => ({}));

vi.mock("@solana/wallet-adapter-phantom", () => ({
  PhantomWalletAdapter: class MockPhantomWalletAdapter {}
}));

vi.mock("@/lib/solana", () => ({
  getSolanaRpcUrl: () => "https://api.devnet.solana.com"
}));

import { WalletRuntimeProvider } from "@/components/wallet/wallet-runtime-provider";

describe("components/wallet/WalletRuntimeProvider", () => {
  it("enables wallet adapter auto-connect so admin deploy can recover the signer after navigation", () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    act(() => {
      root.render(createElement(WalletRuntimeProvider, null, createElement("span", null, "child")));
    });

    expect(walletProviderProps.latest?.autoConnect).toBe(true);

    act(() => {
      root.unmount();
    });
  });
});
