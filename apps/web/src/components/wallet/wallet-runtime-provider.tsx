/**
 * @file apps/web/src/components/wallet/wallet-runtime-provider.tsx
 * @description Layer 1: Presentation - Solana Wallet Adapter Context Provider.
 * Configures connection and wallet modal providers for client components.
 */

"use client";

import React, { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { getSolanaRpcUrl } from "@/lib/infrastructure/solana";

import "@solana/wallet-adapter-react-ui/styles.css";

export interface WalletRuntimeProviderProps {
  children: React.ReactNode;
}

export function WalletRuntimeProvider({ children }: WalletRuntimeProviderProps) {
  // Step 1: Memoize Solana RPC Endpoint
  const endpoint = useMemo(() => getSolanaRpcUrl(), []);

  // Step 2: Initialize supported wallet adapters (Devnet)
  // Wallets supporting the Wallet Standard (like Phantom) are automatically detected and added.
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
