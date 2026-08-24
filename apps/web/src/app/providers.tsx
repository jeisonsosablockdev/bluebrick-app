/**
 * @file apps/web/src/app/providers.tsx
 * @description Layer 1: Presentation - Application Root Context Providers.
 * Bundles Motion and Solana Wallet context providers.
 */

"use client";

import React from "react";
import { WalletRuntimeProvider } from "@/components/wallet/wallet-runtime-provider";
import { MotionProvider } from "@/components/motion/motion-provider";

export interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Step 1: Render layered context providers
  return (
    <MotionProvider>
      <WalletRuntimeProvider>{children}</WalletRuntimeProvider>
    </MotionProvider>
  );
}
