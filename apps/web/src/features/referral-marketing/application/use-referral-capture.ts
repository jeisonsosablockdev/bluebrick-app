"use client";

/**
 * features/referral-marketing/application/use-referral-capture.ts
 *
 * Hook de captura de referrals.
 * Extraído de main-top-navigation-modal.tsx (L562-644, L1116-1135).
 * Layer 2 — Application: encapsula efectos de side-effect de referrals.
 */

import { useEffect, useRef, useState } from "react";

import {
  buildStoredReferralHint,
  buildReferralAuthMetadata,
  clearStoredReferralHint,
  deriveReferralAttributionSource,
  normalizeReferralCodeInput,
  readStoredReferralHint,
  writeStoredReferralHint,
  type ReferralHintOrigin
} from "@/features/referral-marketing/application/client-state";
import { persistReferralIntent } from "@/lib/auth-client";
import type { AuthMeResponse } from "@/lib/auth-client";

export type { ReferralHintOrigin };

export type UseReferralCaptureParams = {
  authState: AuthMeResponse;
  queryReferralCode: string;
  cleanCurrentLandingPath: string;
};

export type UseReferralCaptureResult = {
  referralCode: string;
  referralOrigin: ReferralHintOrigin;
  isReferralFieldVisible: boolean;
  setIsReferralFieldVisible: React.Dispatch<React.SetStateAction<boolean>>;
  handleReferralCodeChange: (nextValue: string) => void;
};

export function useReferralCapture(params: UseReferralCaptureParams): UseReferralCaptureResult {
  const { authState, queryReferralCode, cleanCurrentLandingPath } = params;

  const [referralCode, setReferralCode] = useState("");
  const [referralOrigin, setReferralOrigin] = useState<ReferralHintOrigin>("auto");
  const [isReferralFieldVisible, setIsReferralFieldVisible] = useState(false);
  const persistedReferralIntentSignatureRef = useRef<string | null>(null);

  // --- Effect 1: init from query param or localStorage (L562-586) ---
  useEffect(() => {
    if (queryReferralCode) {
      const hint = buildStoredReferralHint({
        referralCode: queryReferralCode,
        origin: "auto",
        landingPath: cleanCurrentLandingPath
      });

      if (hint) {
        writeStoredReferralHint(hint);
        setReferralCode(hint.referralCode);
        setReferralOrigin("auto");
      }

      return;
    }

    const storedHint = readStoredReferralHint();
    if (!storedHint) {
      return;
    }

    setReferralCode(storedHint.referralCode);
    setReferralOrigin(storedHint.origin);
  }, [cleanCurrentLandingPath, queryReferralCode]);

  // --- Effect 2: auto-show referral field (L588-592) ---
  useEffect(() => {
    if (referralCode) {
      setIsReferralFieldVisible(true);
    }
  }, [referralCode]);

  // --- Effect 3: persist referral intent for federated sessions (L594-644) ---
  useEffect(() => {
    if (!authState.federatedAuthenticated || authState.walletAuthenticated || !authState.accountId) {
      return;
    }

    const storedHint = readStoredReferralHint();
    if (!storedHint) {
      return;
    }

    const normalizedReferralCode = normalizeReferralCodeInput(storedHint.referralCode);
    if (!normalizedReferralCode) {
      clearStoredReferralHint();
      return;
    }

    const attributionSource = deriveReferralAttributionSource({
      origin: storedHint.origin,
      isMobileWalletFlow: false
    });
    const signature = [
      authState.accountId,
      normalizedReferralCode,
      storedHint.capturedAt,
      storedHint.origin,
      storedHint.landingPath ?? ""
    ].join(":");

    if (persistedReferralIntentSignatureRef.current === signature) {
      return;
    }

    persistedReferralIntentSignatureRef.current = signature;

    void persistReferralIntent({
      referralCode: normalizedReferralCode,
      attributionSource,
      capturedAt: storedHint.capturedAt,
      metadata: buildReferralAuthMetadata({
        landingPath: storedHint.landingPath,
        origin: storedHint.origin,
        source: attributionSource
      })
    })
      .then(() => {
        clearStoredReferralHint();
      })
      .catch(() => {
        persistedReferralIntentSignatureRef.current = null;
      });
  }, [authState.accountId, authState.federatedAuthenticated, authState.walletAuthenticated]);

  function handleReferralCodeChange(nextValue: string): void {
    const normalizedReferralCode = normalizeReferralCodeInput(nextValue);
    setReferralCode(normalizedReferralCode);
    setReferralOrigin("manual");

    if (!normalizedReferralCode) {
      clearStoredReferralHint();
      return;
    }

    const hint = buildStoredReferralHint({
      referralCode: normalizedReferralCode,
      origin: "manual",
      landingPath: cleanCurrentLandingPath
    });

    if (hint) {
      writeStoredReferralHint(hint);
    }
  }

  return {
    referralCode,
    referralOrigin,
    isReferralFieldVisible,
    setIsReferralFieldVisible,
    handleReferralCodeChange
  };
}
