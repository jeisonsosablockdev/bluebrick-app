"use client";

import { SplashScreenOverlay } from "../../splash-screen/presentation/splash-screen-overlay";
import { PathRouteTransition } from "../../shared/ui/motion/path-route-transition";
import { HeroSection } from "./hero-section";
import { FeaturedPropertiesSection } from "./featured-properties-section";
import { ProcessSection } from "./process-section";
import { FeaturesSection } from "./features-section";
import { TransparencySection } from "./transparency-section";
import { FaqSection } from "./faq-section";
import { FooterSection } from "./footer-section";

type LandingPageClientProps = {
  marketplaceTotal?: number;
};

export function LandingPageClient({ marketplaceTotal = 0 }: LandingPageClientProps) {
  return (
    <>
      <SplashScreenOverlay />
      <PathRouteTransition>
        <div className="flex flex-col min-h-screen bg-slate-950">
          <HeroSection marketplaceTotal={marketplaceTotal} />
          <FeaturedPropertiesSection />
          <ProcessSection />
          <FeaturesSection />
          <TransparencySection />
          <FaqSection />
          <FooterSection />
        </div>
      </PathRouteTransition>
    </>
  );
}
