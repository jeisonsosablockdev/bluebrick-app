/**
 * @file apps/web/src/app/providers.tsx
 * @description Layer 1: Presentation - Application Root Context Providers.
 * Bundles I18nProvider, Motion and Solana Wallet context providers for global client reactivity.
 */

"use client";

import React from "react";
import dynamic from "next/dynamic";
import { I18nProvider } from "@/features/i18n";
import { WalletRuntimeProvider } from "@/components/wallet/wallet-runtime-provider";
import { MotionProvider } from "@/components/motion/motion-provider";
import { ThemeProvider } from "@/components/theme";
import { SplashProvider } from "@/components/splash";

/**
 * Step 0: Dynamically load BrandSplashScreen on the client only ({ ssr: false }).
 * Eliminates the Motion 12 runtime and wordmark SVG geometry from the critical initial chunk.
 */
const BrandSplashScreen = dynamic(
  () =>
    import("@/components/splash/brand-splash-screen").then(
      (mod) => mod.BrandSplashScreen
    ),
  { ssr: false }
);

/**
 * Properties for the root Providers component.
 */
export interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Root context provider hierarchy wrapping client subtree.
 */
export function Providers({ children }: ProvidersProps): React.JSX.Element {
  // Step 1: Wrap app contents in ThemeProvider for light/dark mode support
  // Step 2: Wrap in I18nProvider for global multilingual localization
  // Step 3: Provide Motion animations and Solana wallet runtime
  // Step 4: Mount startup SplashProvider and BrandSplashScreen portal overlay
  return (
    <ThemeProvider defaultTheme="dark">
      <I18nProvider>
        <MotionProvider>
          <WalletRuntimeProvider>
            <SplashProvider>
              <BrandSplashScreen />
              {children}
            </SplashProvider>
          </WalletRuntimeProvider>
        </MotionProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
