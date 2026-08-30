/**
 * @file apps/web/src/app/providers.tsx
 * @description Layer 1: Presentation - Application Root Context Providers.
 * Bundles I18nProvider, Motion and Solana Wallet context providers for global client reactivity.
 */

"use client";

import React from "react";
import { I18nProvider } from "@/features/i18n";
import { WalletRuntimeProvider } from "@/components/wallet/wallet-runtime-provider";
import { MotionProvider } from "@/components/motion/motion-provider";

export interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Root context provider hierarchy wrapping client subtree.
 */
export function Providers({ children }: ProvidersProps): React.JSX.Element {
  // Step 1: Wrap app contents in I18nProvider for global multilingual localization
  // Step 2: Provide Motion animations and Solana wallet runtime
  return (
    <I18nProvider>
      <MotionProvider>
        <WalletRuntimeProvider>{children}</WalletRuntimeProvider>
      </MotionProvider>
    </I18nProvider>
  );
}
