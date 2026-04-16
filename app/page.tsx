import type { Metadata } from "next";

import { WalletModal } from "@/components/WalletModal";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { AppOverviewSection } from "@/components/sections/app-overview";
import { FaqSection } from "@/components/sections/faq";
import { FeaturesSection } from "@/components/sections/features";
import { FirstInvestmentSection } from "@/components/sections/first-investment";
import { FooterSection } from "@/components/sections/footer";
import { HeroSection } from "@/components/sections/hero";
import { ProcessSection } from "@/components/sections/process";
import { PromoBannerSection } from "@/components/sections/promo-banner";
import { PropertiesSection } from "@/components/sections/properties";
import { TokenizationProcessSection } from "@/components/sections/tokenization-process";
import { WelcomeSection } from "@/components/sections/welcome";
import { getAuthenticatedPublicKeyFromCookies } from "@/lib/auth";
import { listMarketplaceProperties } from "@/lib/property-marketplace-server";
import { getRoleForWallet } from "@/lib/rbac";
import { createPageMetadata } from "@/lib/seo";
import { createOrganizationSchema, createWebPageSchema, createWebSiteSchema } from "@/lib/schema";

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
  const authenticatedPublicKey = await getAuthenticatedPublicKeyFromCookies();
  const featuredProperties = await listMarketplaceProperties({})
    .then((properties) => properties.slice(0, 3))
    .catch(() => []);
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
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <JsonLdScript id="jsonld-home" schemas={homeSchemas} />
      <WalletModal
        initialAuth={{
          authenticated: Boolean(authenticatedPublicKey),
          pubkey: authenticatedPublicKey,
          role: authenticatedPublicKey ? getRoleForWallet(authenticatedPublicKey) : undefined
        }}
      />
      <HeroSection />
      <WelcomeSection />
      <FeaturesSection />
      <TokenizationProcessSection />
      <AppOverviewSection />
      <PromoBannerSection />
      <PropertiesSection properties={featuredProperties} />
      <FirstInvestmentSection />
      <ProcessSection />
      <FaqSection />
      <FooterSection />
    </main>
  );
}
