import Link from "next/link";
import { notFound } from "next/navigation";

import { getPropertyDetailOrThrowRpc } from "@/lib/property-service";
import { PropertyDetailContent } from "@/components/marketplace/PropertyDetailContent";

type MarketplaceDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MarketplaceDetailPage({ params }: MarketplaceDetailPageProps) {
  const { id } = await params;
  const property = getPropertyDetailOrThrowRpc(id);

  if (!property) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-4">
        <Link href="/marketplace" className="text-sm text-cyan-300 underline-offset-4 hover:underline">
          Volver al marketplace
        </Link>
      </div>

      <PropertyDetailContent property={property} />
    </main>
  );
}
