/**
 * @file apps/web/src/components/wallet/wallet-runtime-provider.tsx
 * @description Layer 1: Presentation - Application Wallet Context Wrapper (Passthrough).
 * Clean passthrough provider without external Solana wallet adapter dependencies.
 */

"use client";

import React from "react";

/**
 * Props for the WalletRuntimeProvider passthrough wrapper.
 */
export interface WalletRuntimeProviderProps {
  children: React.ReactNode;
}

/**
 * Passthrough context provider for application wallet state.
 *
 * @param props - Component children to wrap.
 * @returns {React.JSX.Element} Direct rendered child tree.
 */
export function WalletRuntimeProvider({ children }: WalletRuntimeProviderProps) {
  // Step 1: Render child tree directly without Solana wallet adapter overhead
  return <>{children}</>;
}
