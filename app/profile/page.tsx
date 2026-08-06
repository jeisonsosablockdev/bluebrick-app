import type { Metadata } from "next";
import { Suspense } from "react";
import { MainTopNavigationModal } from "@/components/main-top-navigation-modal";
import { WalletRuntimeProvider } from "@/components/wallet/wallet-runtime-provider";
import { getUserProfileQuery, ProfilePageTemplate } from "@/features/profile";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Investor Profile",
  description: "Manage your investor account settings, KYC status, and security preferences.",
  path: "/profile",
  section: "profile"
});

export default async function ProfilePage() {
  const profile = await getUserProfileQuery('SQDS426qUB5hZahVkWgwySsLqyZaKnpBxZBP5tWYW45');

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <WalletRuntimeProvider>
        <Suspense fallback={null}>
          <MainTopNavigationModal />
        </Suspense>
      </WalletRuntimeProvider>
      <ProfilePageTemplate profile={profile} />
    </main>
  );
}
