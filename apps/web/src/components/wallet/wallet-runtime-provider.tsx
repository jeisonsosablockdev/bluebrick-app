/**
 * @file apps/web/src/components/wallet/wallet-runtime-provider.tsx
 * @description Layer 1: Presentation - Application Wallet Context Wrapper (Passthrough).
 * Clean passthrough provider without external Solana wallet adapter dependencies.
 */

"use client";

import React from "react";

export interface WalletRuntimeProviderProps {
  children: React.ReactNode;
}

export function WalletRuntimeProvider({ children }: WalletRuntimeProviderProps) {
  // Step 1: Render child tree directly without Solana wallet adapter overhead
  return <>{children}</>;
}
