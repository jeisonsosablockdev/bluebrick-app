import type { Metadata } from "next";
import { Suspense } from "react";

import { MainTopNavigationModal } from "@/components/main-top-navigation-modal";
import { InviteeWelcomeBanner } from "@/components/referrals/invitee-welcome-banner";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { FaqSection } from "@/components/sections/faq";
import { FeaturesSection } from "@/components/sections/features";
import { FirstInvestmentSection } from "@/components/sections/first-investment";
import { FooterSection } from "@/components/sections/footer";
import { HeroSection } from "@/components/sections/hero";
import { ProcessSection } from "@/components/sections/process";
import { FeaturedPropertiesSection } from "@/components/sections/featured-properties";
import { AppCapabilitiesSection } from "@/components/sections/app-capabilities";
import { WelcomeSection } from "@/components/sections/welcome";
import { PwaClientRuntime } from "@/components/pwa/pwa-client-runtime";
import { WalletRuntimeProvider } from "@/components/wallet/wallet-runtime-provider";
import { listMarketplaceProperties } from "@/lib/property-marketplace-server";
import { createPageMetadata } from "@/lib/seo";
import { createOrganizationSchema, createWebPageSchema, createWebSiteSchema } from "@/lib/schema";

export const revalidate = 300;

const homePageMetadata = createPageMetadata({
  title: "Home",
  description: "Discover tokenized real-estate opportunities and platform capabilities in BRIDS.",
  path: "/"
});

export const metadata: Metadata = {
  ...homePageMetadata,
  title: {
    absolute: "Home | BRIDS"
  }
};

export default async function HomePage() {
  const marketplaceProperties = await listMarketplaceProperties({})
    .catch(() => []);
  const featuredProperties = marketplaceProperties.slice(0, 3);
  const homeSchemas = [
    createOrganizationSchema(),
    createWebSiteSchema(),
    createWebPageSchema({
      name: "Home",
      description: "Discover tokenized real-estate opportunities and platform capabilities in BRIDS.",
      path: "/"
    })
  ];

  return (
    <main className="pb-6 md:pb-8 pt-0">
      <PwaClientRuntime />
      <JsonLdScript id="jsonld-home" schemas={homeSchemas} />
      <WalletRuntimeProvider>
        <Suspense fallback={null}>
          <MainTopNavigationModal />
        </Suspense>
      </WalletRuntimeProvider>
      <Suspense fallback={null}>
        <InviteeWelcomeBanner />
      </Suspense>
      
      {/* Hero section is now full-width */}
      <HeroSection marketplaceTotal={marketplaceProperties.length} />
      
      {/* First block of constrained content */}
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        <WelcomeSection />
        <FeaturesSection />
      </div>

      {/* Full-bleed Modal-style Section */}
      <AppCapabilitiesSection />

      {/* Showcase full-bleed section */}
      <FeaturedPropertiesSection properties={featuredProperties} />

      {/* Rest of the page content remains constrained */}
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">

        <FirstInvestmentSection />
        <ProcessSection />
        <FaqSection />
        <FooterSection />
      </div>
    </main>
  );
}
