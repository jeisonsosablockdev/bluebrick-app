"use client";

/**
 * features/shared/auth/application/use-post-auth-decision.ts
 *
 * Hook de la capa Application para la decisión post-autenticación (federated flow).
 * Extraído de main-top-navigation-modal.tsx (líneas ~646-690, 1137-1145).
 *
 * Responsabilidades:
 * - Cuando se detecta un postAuthDecision pendiente (param de URL), fetchar el perfil
 *   del usuario para obtener el onboardingReward y mostrarlo en el modal de decisión.
 * - Exponer handleExploreAfterAuth y handleCompleteProfileAfterAuth para la navegación
 *   post-decisión.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createPostAuthFallbackReward, type PostAuthOnboardingReward } from "@/lib/post-auth-decision";
import {
  ONBOARDING_REWARD_COMPLETE_PROFILE_HREF,
  ONBOARDING_REWARD_EXPLORE_HREF,
} from "@/lib/onboarding-reward-navigation";
import type { ProtectedProfileResponse } from "@/features/navigation/domain/nav-modal-types";

type UsePostAuthDecisionParams = {
  shouldPromptPostAuthDecision: boolean;
  hasFederatedSession: boolean;
  hasWalletSession: boolean;
  postAuthDecisionReward: PostAuthOnboardingReward | null;
  cleanCurrentLandingPath: string;
  setPostAuthDecisionReward: (reward: PostAuthOnboardingReward | null) => void;
};

type UsePostAuthDecisionResult = {
  handleExploreAfterAuth: () => void;
  handleCompleteProfileAfterAuth: () => void;
};

export function usePostAuthDecision(params: UsePostAuthDecisionParams): UsePostAuthDecisionResult {
  const {
    shouldPromptPostAuthDecision,
    hasFederatedSession,
    hasWalletSession,
    postAuthDecisionReward,
    cleanCurrentLandingPath,
    setPostAuthDecisionReward,
  } = params;

  const router = useRouter();

  useEffect(() => {
    if (!shouldPromptPostAuthDecision || !hasFederatedSession || hasWalletSession || postAuthDecisionReward) {
      return;
    }

    let cancelled = false;

    const fallbackReward = createPostAuthFallbackReward();

    const openDecisionModal = async (): Promise<void> => {
      try {
        const profileRes = await fetch("/api/protected/profile");
        if (cancelled) {
          return;
        }

        if (profileRes.ok) {
          const profileData = (await profileRes.json()) as ProtectedProfileResponse;
          setPostAuthDecisionReward(profileData.data?.onboardingReward ?? fallbackReward);
        } else {
          setPostAuthDecisionReward(fallbackReward);
        }
      } catch {
        if (!cancelled) {
          setPostAuthDecisionReward(fallbackReward);
        }
      } finally {
        if (!cancelled && typeof window !== "undefined") {
          window.history.replaceState(null, "", cleanCurrentLandingPath);
        }
      }
    };

    void openDecisionModal();

    return () => {
      cancelled = true;
    };
  }, [
    cleanCurrentLandingPath,
    hasFederatedSession,
    hasWalletSession,
    postAuthDecisionReward,
    setPostAuthDecisionReward,
    shouldPromptPostAuthDecision,
  ]);

  function handleExploreAfterAuth(): void {
    setPostAuthDecisionReward(null);
    router.push(ONBOARDING_REWARD_EXPLORE_HREF);
  }

  function handleCompleteProfileAfterAuth(): void {
    setPostAuthDecisionReward(null);
    router.push(ONBOARDING_REWARD_COMPLETE_PROFILE_HREF);
  }

  return {
    handleExploreAfterAuth,
    handleCompleteProfileAfterAuth,
  };
}
