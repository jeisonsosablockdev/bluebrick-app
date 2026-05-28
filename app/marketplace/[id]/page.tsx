import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { WalletModal } from "@/components/WalletModal";
import { DEFAULT_LOCALE, localize } from "@/lib/i18n";
import { getMarketplacePropertyDetailOrThrowRpc } from "@/lib/property-marketplace-server";
import { createPageMetadata } from "@/lib/seo";
import { PropertyDetailContent } from "@/components/marketplace/PropertyDetailContent";
import { WalletRuntimeProvider } from "@/components/wallet/wallet-runtime-provider";

type MarketplaceDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  return createPageMetadata({
    title: `Property ${id}`,
    description: "Tokenized property detail with yield, supply, and legal summary data.",
    path: `/marketplace/${id}`,
    section: "marketplace"
  });
}

export default async function MarketplaceDetailPage({ params }: MarketplaceDetailPageProps) {
  const { id } = await params;
  const property = await getMarketplacePropertyDetailOrThrowRpc(id);

  if (!property) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <WalletRuntimeProvider>
        <Suspense fallback={null}>
          <WalletModal />
        </Suspense>

        <div className="mb-4">
          <Link href="/marketplace" className="text-sm text-cyan-300 underline-offset-4 hover:underline">
            {localize(DEFAULT_LOCALE, { en: "Back to marketplace", es: "Volver al marketplace", pt: "Voltar ao marketplace" })}
          </Link>
        </div>

        <PropertyDetailContent property={property} layoutId={`marketplace-property-${id}`} />
      </WalletRuntimeProvider>
    </main>
  );
}
