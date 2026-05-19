"use client";

import { useCallback, useMemo, type ReactNode } from "react";
import type { WalletError } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";

import { getSolanaRpcUrl } from "@/lib/solana";

import "@solana/wallet-adapter-react-ui/styles.css";

type WalletRuntimeProviderProps = {
  children: ReactNode;
};

function isUserRejectedWalletError(error: WalletError): boolean {
  const message = error.message.toLowerCase();
  return message.includes("user rejected") || message.includes("rejected the request");
}

export function WalletRuntimeProvider({ children }: WalletRuntimeProviderProps) {
  const endpoint = useMemo(() => getSolanaRpcUrl(), []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  const handleWalletError = useCallback((error: WalletError) => {
    if (isUserRejectedWalletError(error)) {
      return;
    }
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false} onError={handleWalletError}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
