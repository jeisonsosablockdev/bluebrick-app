// @vitest-environment jsdom
/**
 * TDD — RED → GREEN
 * Tests for usePostAuthDecision hook.
 * @spec BRI-154 § 7 — Post-Auth Decision Modal & Routing
 */

import { expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { usePostAuthDecision } from "../../apps/web/src/features/shared/auth/application/use-post-auth-decision";
import {
  ONBOARDING_REWARD_COMPLETE_PROFILE_HREF,
  ONBOARDING_REWARD_EXPLORE_HREF,
} from "../../apps/web/src/lib/onboarding-reward-navigation";

const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock("../../apps/web/src/lib/post-auth-decision", () => ({
  createPostAuthFallbackReward: () => ({
    status: "pending_profile",
    rewardAmountUsdSnapshot: 10,
    qualificationDeadlineAt: null,
    shouldShowReminder: true,
    isProfileComplete: false,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
});

it("given_shouldPrompt_true_with_federated_session_then_fetches_profile", async () => {
  const mockSetReward = vi.fn();
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      data: {
        firstName: "Test",
        onboardingReward: {
          status: "pending_profile",
          rewardAmountUsdSnapshot: 25,
          qualificationDeadlineAt: "2026-12-31",
          shouldShowReminder: true,
          isProfileComplete: false,
        },
      },
    }),
  });

  renderHook(() =>
    usePostAuthDecision({
      shouldPromptPostAuthDecision: true,
      hasFederatedSession: true,
      hasWalletSession: false,
      postAuthDecisionReward: null,
      cleanCurrentLandingPath: "/",
      setPostAuthDecisionReward: mockSetReward,
    })
  );

  await act(async () => {
    await new Promise((r) => setTimeout(r, 10));
  });

  expect(global.fetch).toHaveBeenCalledWith("/api/protected/profile");
  expect(mockSetReward).toHaveBeenCalledWith(
    expect.objectContaining({ rewardAmountUsdSnapshot: 25 })
  );
});

it("given_profile_fetch_fails_then_sets_fallback_reward", async () => {
  const mockSetReward = vi.fn();
  (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));

  renderHook(() =>
    usePostAuthDecision({
      shouldPromptPostAuthDecision: true,
      hasFederatedSession: true,
      hasWalletSession: false,
      postAuthDecisionReward: null,
      cleanCurrentLandingPath: "/",
      setPostAuthDecisionReward: mockSetReward,
    })
  );

  await act(async () => {
    await new Promise((r) => setTimeout(r, 10));
  });

  expect(mockSetReward).toHaveBeenCalledWith(
    expect.objectContaining({ rewardAmountUsdSnapshot: 10 })
  );
});

it("given_handleExploreAfterAuth_called_then_navigates_to_explore_href", () => {
  const mockSetReward = vi.fn();
  const { result } = renderHook(() =>
    usePostAuthDecision({
      shouldPromptPostAuthDecision: false,
      hasFederatedSession: false,
      hasWalletSession: false,
      postAuthDecisionReward: null,
      cleanCurrentLandingPath: "/",
      setPostAuthDecisionReward: mockSetReward,
    })
  );

  act(() => {
    result.current.handleExploreAfterAuth();
  });

  expect(mockSetReward).toHaveBeenCalledWith(null);
  expect(mockRouterPush).toHaveBeenCalledWith(ONBOARDING_REWARD_EXPLORE_HREF);
});

it("given_handleCompleteProfileAfterAuth_called_then_navigates_to_complete_profile_href", () => {
  const mockSetReward = vi.fn();
  const { result } = renderHook(() =>
    usePostAuthDecision({
      shouldPromptPostAuthDecision: false,
      hasFederatedSession: false,
      hasWalletSession: false,
      postAuthDecisionReward: null,
      cleanCurrentLandingPath: "/",
      setPostAuthDecisionReward: mockSetReward,
    })
  );

  act(() => {
    result.current.handleCompleteProfileAfterAuth();
  });

  expect(mockSetReward).toHaveBeenCalledWith(null);
  expect(mockRouterPush).toHaveBeenCalledWith(ONBOARDING_REWARD_COMPLETE_PROFILE_HREF);
});
