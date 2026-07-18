import type { Metadata } from "next";
import { Suspense } from "react";

import { MainTopNavigationModal } from "@/components/main-top-navigation-modal";
import { TransparencyContent } from "@/app/transparencia/client";
import { WalletRuntimeProvider } from "@/components/wallet/wallet-runtime-provider";
import { createPageMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = createPageMetadata({
  title: "Transparencia",
  description: "Transparency dashboard with verifiable public platform metrics.",
  path: "/transparencia",
  section: "transparency"
});

export default function TransparencyPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <WalletRuntimeProvider>
        <Suspense fallback={null}>
          <MainTopNavigationModal />
        </Suspense>
      </WalletRuntimeProvider>
      <TransparencyContent />
    </main>
  );
}
