import { describe, expect, it } from "vitest";

import { resolvePostAuthDecision } from "@/lib/post-auth-decision";

const COMPLETE_PROFILE = {
  firstName: "Ada",
  email: "ada@example.com",
  phone: "+15555550123",
  onboardingReward: null
};

describe("post auth decision", () => {
  it("does not show a decision for complete profiles without reward reminders", () => {
    expect(resolvePostAuthDecision({ status: "ok", profile: COMPLETE_PROFILE })).toEqual({ kind: "none" });
  });

  it("shows the reward decision when the reward asks for a reminder", () => {
    const reward = {
      status: "pending_profile" as const,
      rewardAmountUsdSnapshot: 10,
      qualificationDeadlineAt: "2026-05-17T00:00:00.000Z",
      shouldShowReminder: true,
      isProfileComplete: false
    };

    expect(resolvePostAuthDecision({
      status: "ok",
      profile: {
        ...COMPLETE_PROFILE,
        onboardingReward: reward
      }
    })).toEqual({ kind: "show", reward });
  });

  it("shows a decision when required profile fields are missing", () => {
    expect(resolvePostAuthDecision({
      status: "ok",
      profile: {
        ...COMPLETE_PROFILE,
        phone: null
      }
    })).toEqual({ kind: "show", reward: null });
  });

  it("uses a fallback reward for missing profiles", () => {
    expect(resolvePostAuthDecision({
      status: "not_found",
      now: new Date("2026-05-10T00:00:00.000Z")
    })).toEqual({
      kind: "show",
      reward: {
        status: "pending_profile",
        rewardAmountUsdSnapshot: 10,
        qualificationDeadlineAt: "2026-05-17T00:00:00.000Z",
        shouldShowReminder: true,
        isProfileComplete: false
      }
    });
  });

  it("does not show a decision on profile fetch failures", () => {
    expect(resolvePostAuthDecision({ status: "error" })).toEqual({ kind: "none" });
  });
});
