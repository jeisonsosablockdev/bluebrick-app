import type { OnboardingRewardStatus } from "@/lib/onboarding-reward-copy";

export type PostAuthOnboardingReward = {
  status: OnboardingRewardStatus;
  rewardAmountUsdSnapshot: number;
  qualificationDeadlineAt: string;
  shouldShowReminder: boolean;
  isProfileComplete: boolean;
};

export type PostAuthProfile = {
  firstName: string | null;
  email: string | null;
  phone: string | null;
  onboardingReward?: PostAuthOnboardingReward | null;
};

type PostAuthDecisionInput =
  | { status: "ok"; profile: PostAuthProfile | null | undefined }
  | { status: "not_found"; now?: Date }
  | { status: "error" };

type PostAuthDecision =
  | { kind: "none" }
  | { kind: "show"; reward: PostAuthOnboardingReward | null };

export function createPostAuthFallbackReward(now = new Date()): PostAuthOnboardingReward {
  return {
    status: "pending_profile",
    rewardAmountUsdSnapshot: 10,
    qualificationDeadlineAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    shouldShowReminder: true,
    isProfileComplete: false
  };
}

export function resolvePostAuthDecision(input: PostAuthDecisionInput): PostAuthDecision {
  if (input.status === "error") {
    return { kind: "none" };
  }

  if (input.status === "not_found") {
    return {
      kind: "show",
      reward: createPostAuthFallbackReward(input.now)
    };
  }

  const profile = input.profile;
  if (!profile) {
    return { kind: "none" };
  }

  const reward = profile.onboardingReward ?? null;
  const shouldShowDecision = Boolean(reward?.shouldShowReminder)
    || reward?.isProfileComplete === false
    || Boolean(!profile.firstName || !profile.email || !profile.phone);

  return shouldShowDecision
    ? { kind: "show", reward }
    : { kind: "none" };
}
