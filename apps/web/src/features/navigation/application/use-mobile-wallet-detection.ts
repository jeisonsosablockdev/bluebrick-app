"use client";

/**
 * features/navigation/application/use-mobile-wallet-detection.ts
 *
 * Hook de detección de contexto móvil y Phantom.
 * Extraído de main-top-navigation-modal.tsx (L1164-1239).
 * Layer 2 — Application: encapsula side-effects de detección de UA/viewport.
 */

import { useEffect, useRef, useState } from "react";

import { buildPhantomBrowseDeepLink } from "@/features/referral-marketing/application/client-state";
import {
  MOBILE_MEDIA_QUERY,
  MOBILE_USER_AGENT_PATTERN,
  PHANTOM_USER_AGENT_PATTERN
} from "@/features/navigation/domain/nav-modal-constants";

export type UseMobileWalletDetectionResult = {
  isSmallViewport: boolean;
  isMobileUserAgent: boolean;
  isInPhantomApp: boolean;
  showPhantomFallback: boolean;
  setShowPhantomFallback: (v: boolean) => void;
  shouldShowPhantomOpenPill: boolean;
  handleOpenInPhantom: () => void;
};

export function useMobileWalletDetection(): UseMobileWalletDetectionResult {
  const [isSmallViewport, setIsSmallViewport] = useState(false);
  const [isMobileUserAgent, setIsMobileUserAgent] = useState(false);
  const [isInPhantomApp, setIsInPhantomApp] = useState(false);
  const [showPhantomFallback, setShowPhantomFallback] = useState(false);
  const phantomFallbackTimerRef = useRef<number | null>(null);

  const shouldShowPhantomOpenPill = isSmallViewport && isMobileUserAgent && !isInPhantomApp;

  // --- Effect 1: isSmallViewport, isMobileUserAgent, isInPhantomApp (L1164-1188) ---
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateMobileSignals = (): void => {
      const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
      const userAgent = window.navigator.userAgent ?? "";
      const phantomWindow = window as Window & {
        phantom?: { solana?: { isPhantom?: boolean } };
      };
      const providerSaysPhantom = Boolean(phantomWindow.phantom?.solana?.isPhantom);

      setIsSmallViewport(mediaQuery.matches);
      setIsMobileUserAgent(MOBILE_USER_AGENT_PATTERN.test(userAgent));
      setIsInPhantomApp(providerSaysPhantom || PHANTOM_USER_AGENT_PATTERN.test(userAgent));
    };

    updateMobileSignals();
    window.addEventListener("resize", updateMobileSignals);

    return () => {
      window.removeEventListener("resize", updateMobileSignals);
    };
  }, []);

  // --- Effect 2: phantomFallbackTimer cleanup (L1190-1197) ---
  useEffect(() => {
    return () => {
      if (phantomFallbackTimerRef.current !== null) {
        window.clearTimeout(phantomFallbackTimerRef.current);
        phantomFallbackTimerRef.current = null;
      }
    };
  }, []);

  function handleOpenInPhantom(): void {
    if (!shouldShowPhantomOpenPill || typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    setShowPhantomFallback(false);

    if (phantomFallbackTimerRef.current !== null) {
      window.clearTimeout(phantomFallbackTimerRef.current);
      phantomFallbackTimerRef.current = null;
    }

    const deeplink = buildPhantomBrowseDeepLink(window.location.href);
    let phantomOpened = false;

    const onVisibilityChange = (): void => {
      if (document.hidden) {
        phantomOpened = true;
        document.removeEventListener("visibilitychange", onVisibilityChange);

        if (phantomFallbackTimerRef.current !== null) {
          window.clearTimeout(phantomFallbackTimerRef.current);
          phantomFallbackTimerRef.current = null;
        }
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    phantomFallbackTimerRef.current = window.setTimeout(() => {
      document.removeEventListener("visibilitychange", onVisibilityChange);

      if (!phantomOpened && !document.hidden) {
        setShowPhantomFallback(true);
      }

      phantomFallbackTimerRef.current = null;
    }, 1800);

    window.location.assign(deeplink);
  }

  return {
    isSmallViewport,
    isMobileUserAgent,
    isInPhantomApp,
    showPhantomFallback,
    setShowPhantomFallback,
    shouldShowPhantomOpenPill,
    handleOpenInPhantom
  };
}
