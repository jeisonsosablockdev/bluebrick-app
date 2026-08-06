import type { Metadata } from "next";
import { Suspense } from "react";
import { MainTopNavigationModal } from "@/components/main-top-navigation-modal";
import { WalletRuntimeProvider } from "@/components/wallet/wallet-runtime-provider";
import { TransparencyContent } from "@/features/transparency-portal";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Transparency & Strategy",
  description: "Transparency dashboard with verifiable public platform metrics and on-chain audit models.",
  path: "/transparency",
  section: "transparency"
});

export default function TransparencyPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <WalletRuntimeProvider>
        <Suspense fallback={null}>
          <MainTopNavigationModal />
        </Suspense>
      </WalletRuntimeProvider>
      <TransparencyContent />
    </main>
  );
}
