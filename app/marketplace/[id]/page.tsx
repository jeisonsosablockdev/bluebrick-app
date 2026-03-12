import Link from "next/link";
import { notFound } from "next/navigation";

import { WalletModal } from "@/components/WalletModal";
import { getAuthenticatedPublicKeyFromCookies } from "@/lib/auth";
import { getServerLocale } from "@/lib/i18n-server";
import { localize } from "@/lib/i18n";
import { getPropertyDetailOrThrowRpc } from "@/lib/property-service";
import { getRoleForWallet } from "@/lib/rbac";
import { PropertyDetailContent } from "@/components/marketplace/PropertyDetailContent";

type MarketplaceDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MarketplaceDetailPage({ params }: MarketplaceDetailPageProps) {
  const authenticatedPublicKey = await getAuthenticatedPublicKeyFromCookies();
  const locale = await getServerLocale();
  const { id } = await params;
  const property = getPropertyDetailOrThrowRpc(id);

  if (!property) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <WalletModal
        initialAuth={{
          authenticated: Boolean(authenticatedPublicKey),
          pubkey: authenticatedPublicKey,
          role: authenticatedPublicKey ? getRoleForWallet(authenticatedPublicKey) : undefined
        }}
      />

      <div className="mb-4">
        <Link href="/marketplace" className="text-sm text-cyan-300 underline-offset-4 hover:underline">
          {localize(locale, { en: "Back to marketplace", es: "Volver al marketplace", pt: "Voltar ao marketplace" })}
        </Link>
      </div>

      <PropertyDetailContent property={property} />
    </main>
  );
}
