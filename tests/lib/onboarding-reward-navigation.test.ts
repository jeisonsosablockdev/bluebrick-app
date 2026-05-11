import { describe, expect, it } from "vitest";

import {
  ONBOARDING_REWARD_COMPLETE_PROFILE_HREF,
  ONBOARDING_REWARD_EXPLORE_HREF
} from "@/lib/onboarding-reward-navigation";

describe("onboarding reward navigation", () => {
  it("sends explore users to the marketplace", () => {
    expect(ONBOARDING_REWARD_EXPLORE_HREF).toBe("/marketplace");
  });

  it("sends profile users to the protected profile editor", () => {
    expect(ONBOARDING_REWARD_COMPLETE_PROFILE_HREF).toBe("/protected/perfil");
  });
});

