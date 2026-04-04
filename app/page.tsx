import { WalletModal } from "@/components/WalletModal";
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
import { UiStatesSection } from "@/components/sections/ui-states";
import { WelcomeSection } from "@/components/sections/welcome";
import { getAuthenticatedPublicKeyFromCookies } from "@/lib/auth";
import { getRoleForWallet } from "@/lib/rbac";

export default async function HomePage() {
  const authenticatedPublicKey = await getAuthenticatedPublicKeyFromCookies();

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
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
      <PropertiesSection />
      <FirstInvestmentSection />
      <ProcessSection />
      <FaqSection />
      <UiStatesSection />
      <FooterSection />
    </main>
  );
}
