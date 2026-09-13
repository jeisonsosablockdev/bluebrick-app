/**
 * @file apps/web/src/components/splash/splash-provider.tsx
 * @description Layer 2: Application / Consumption - Context provider exposing splash screen
 * lifecycle status and skip controls to the application component hierarchy.
 */

"use client";

import React, { createContext, useContext } from "react";
import type {
  SplashContextValue,
  SplashProviderProps,
} from "@/lib/splash/types";
import { useSplashScreen } from "./use-splash-screen";

/**
 * React Context storing splash screen state machine values.
 */
export const SplashContext = createContext<SplashContextValue | null>(null);

/**
 * SplashProvider encapsulates the startup splash lifecycle and provides
 * state updates to descendant components.
 *
 * @param props - Children components and optional optimization configuration
 * @returns Context provider element
 */
export function SplashProvider({
  children,
  config,
}: SplashProviderProps): React.JSX.Element {
  // Step 1: Instantiate splash screen state machine
  const splashState = useSplashScreen({ config });

  // Step 2: Render context provider with state payload
  return (
    <SplashContext.Provider value={splashState}>
      {children}
    </SplashContext.Provider>
  );
}

/**
 * Hook to consume splash screen context throughout the application.
 *
 * @throws Error if used outside of a SplashProvider
 * @returns SplashContextValue with current phase and controls
 */
export function useSplashContext(): SplashContextValue {
  // Step 1: Access splash context
  const context = useContext(SplashContext);

  // Step 2: Validate context availability
  if (!context) {
    throw new Error(
      "useSplashContext must be used within a SplashProvider hierarchy."
    );
  }

  return context;
}
