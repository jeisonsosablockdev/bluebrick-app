import { describe, expect, it } from "vitest";

import {
  evaluateOnboardingRewardStatus,
  isOnboardingRewardProfileComplete
} from "@/lib/onboarding-reward-service";

describe("onboarding reward service", () => {
  it("requires stateProvince when the selected country uses division validation", () => {
    expect(
      isOnboardingRewardProfileComplete({
        username: "valid_user",
        firstName: "Jay",
        lastName: "Sosa",
        email: "jay@example.com",
        country: "US",
        stateProvince: null,
        address: "123 Main St",
        phone: "+573001112233"
      })
    ).toBe(false);

    expect(
      isOnboardingRewardProfileComplete({
        username: "valid_user",
        firstName: "Jay",
        lastName: "Sosa",
        email: "jay@example.com",
        country: "US",
        stateProvince: "CA",
        address: "123 Main St",
        phone: "+573001112233"
      })
    ).toBe(true);
  });

  it("marks the reward as earned when profile and verified KYC land inside the allowed windows", () => {
    expect(
      evaluateOnboardingRewardStatus({
        currentStatus: "pending_review",
        qualificationDeadlineAt: "2026-05-13T00:00:00.000Z",
        profileCompletedAt: "2026-05-07T00:00:00.000Z",
        kycSubmittedAt: "2026-05-10T00:00:00.000Z",
        kycReviewGraceDeadlineAt: "2026-05-13T00:00:00.000Z",
        kycVerifiedAt: "2026-05-12T12:00:00.000Z",
        nowIso: "2026-05-12T12:00:00.000Z"
      })
    ).toBe("earned");
  });

  it("expires the reward when provider verification arrives after the 72-hour grace window", () => {
    expect(
      evaluateOnboardingRewardStatus({
        currentStatus: "pending_review",
        qualificationDeadlineAt: "2026-05-13T00:00:00.000Z",
        profileCompletedAt: "2026-05-07T00:00:00.000Z",
        kycSubmittedAt: "2026-05-10T00:00:00.000Z",
        kycReviewGraceDeadlineAt: "2026-05-13T00:00:00.000Z",
        kycVerifiedAt: null,
        nowIso: "2026-05-13T00:00:01.000Z"
      })
    ).toBe("expired");
  });
});
