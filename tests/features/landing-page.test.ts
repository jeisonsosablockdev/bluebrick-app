import { describe, expect, it } from "vitest";
import { LANDING_HERO_STATS, LANDING_PROCESS_STEPS } from "../../apps/web/src/features/landing/domain/landing-constants";
import * as LandingExports from "../../apps/web/src/features/landing";

describe("landing-page feature slice (SPEC-27)", () => {
  it("contains structured landing constants for hero stats and process steps", () => {
    expect(LANDING_HERO_STATS).toBeDefined();
    expect(LANDING_HERO_STATS.length).toBeGreaterThan(0);
    expect(LANDING_PROCESS_STEPS).toBeDefined();
    expect(LANDING_PROCESS_STEPS.length).toBe(3);
  });

  it("exports LandingPageClient, HeroSection, FeaturedPropertiesSection and index boundary exports", () => {
    expect(LandingExports.LandingPageClient).toBeDefined();
    expect(LandingExports.HeroSection).toBeDefined();
    expect(LandingExports.FeaturedPropertiesSection).toBeDefined();
    expect(LandingExports.ProcessSection).toBeDefined();
    expect(LandingExports.FaqSection).toBeDefined();
    expect(LandingExports.FooterSection).toBeDefined();
  });
});
