import { describe, expect, it } from "vitest";

import {
  formatOnboardingRewardDeadlineLabel,
  formatOnboardingRewardRemainingWindow,
  formatUsdByLocale,
  ONBOARDING_REWARD_STATUS_LABELS
} from "@/lib/onboarding-reward-copy";

describe("lib/onboarding-reward-copy", () => {
  it("returns localized reward status labels", () => {
    expect(ONBOARDING_REWARD_STATUS_LABELS.pending_profile.es).toBe("Completar perfil");
    expect(ONBOARDING_REWARD_STATUS_LABELS.pending_review.en).toBe("Under review");
    expect(ONBOARDING_REWARD_STATUS_LABELS.earned.pt).toBe("Ganho");
  });

  it("formats onboarding deadline labels by locale", () => {
    const iso = "2026-05-13T00:00:00.000Z";

    expect(formatOnboardingRewardDeadlineLabel(iso, "en")).toContain("2026");
    expect(formatOnboardingRewardDeadlineLabel(iso, "es")).toContain("2026");
    expect(formatOnboardingRewardDeadlineLabel(iso, "pt")).toContain("2026");
  });

  it("formats remaining window labels", () => {
    expect(formatOnboardingRewardRemainingWindow(2 * 86_400 + 3 * 3_600, "es")).toBe("2d 3h");
    expect(formatOnboardingRewardRemainingWindow(2 * 3_600 + 5 * 60, "en")).toBe("2h 5m");
    expect(formatOnboardingRewardRemainingWindow(null, "pt")).toBeNull();
  });

  it("formats usd values with locale-sensitive separators", () => {
    expect(formatUsdByLocale(10, "en")).toBe("$10.00");
    expect(formatUsdByLocale(10, "es")).toContain("US");
    expect(formatUsdByLocale(10, "pt")).toContain("US$");
  });
});
