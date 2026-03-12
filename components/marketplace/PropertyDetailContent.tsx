import Image from "next/image";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { H2, Lead } from "@/components/ui/typography";
import type { PropertyDetail } from "@/lib/property-service";
import { listingStatusClasses, listingStatusLabel } from "@/components/marketplace/status-utils";

type PropertyDetailContentProps = {
  property: PropertyDetail;
  imageClassName?: string;
};

function formatDate(dateValue: string | null): string {
  if (!dateValue) {
    return "No disponible";
  }

  const parsed = new Date(dateValue);

  if (Number.isNaN(parsed.valueOf())) {
    return "No disponible";
  }

  return parsed.toLocaleString("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function PropertyDetailContent({ property, imageClassName = "h-64 md:h-80" }: PropertyDetailContentProps) {
  return (
    <>
      <section className="rounded-2xl border border-white/10 bg-panel p-5 md:p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Image src={property.image} alt={property.title} width={900} height={600} className={`w-full rounded-xl object-cover ${imageClassName}`} />
          <div className="space-y-4">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${listingStatusClasses(property.listingStatus)}`}>
              {listingStatusLabel(property.listingStatus)}
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-white">{property.title}</h1>
            <Lead>{property.locationLabel}</Lead>
            <p className="text-sm text-slate-300">{property.shortDescription}</p>
            <Button className="min-h-11">Comprar NFTs</Button>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="space-y-3">
          <H2 className="text-2xl text-white">Resumen de inversion fraccional</H2>
          <p className="text-sm text-slate-300">Supply total NFTs: {property.investment.supplyTotal.toLocaleString("en-US")}</p>
          <p className="text-sm text-slate-300">NFTs emitidos/vendidos: {property.investment.mintedOrSold.toLocaleString("en-US")}</p>
          <p className="text-sm text-slate-300">Precio por NFT: ${property.investment.nftPriceUsd.toFixed(2)}</p>
          <p className="text-sm text-slate-300">ROI anual estimado: {property.investment.annualRoiPct.toFixed(1)}%</p>
          <p className="text-sm text-slate-300">Disponibilidad: {property.investment.availabilityLabel}</p>
        </Card>

        <Card className="space-y-3">
          <H2 className="text-2xl text-white">Informacion de la propiedad</H2>
          <p className="text-sm text-slate-300">{property.investmentNotes}</p>
          <p className="text-sm text-slate-300">Ubicacion detallada: {property.detailedLocation}</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
            {property.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="space-y-3">
          <H2 className="text-2xl text-white">Documentos</H2>
          <ul className="space-y-2">
            {property.documents.map((document) => (
              <li key={document.id}>
                <a
                  href={document.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-cyan-300 underline-offset-4 hover:underline"
                >
                  {document.label}
                </a>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-3">
          <H2 className="text-2xl text-white">Blockchain info</H2>
          <p className="text-sm text-slate-300">Network: {property.blockchain.network}</p>
          <p className="break-all text-sm text-slate-300">Collection: {property.blockchain.collectionAddress}</p>
          <p className="break-all text-sm text-slate-300">Mint: {property.blockchain.assetMintAddress}</p>
          <a href={property.blockchain.explorerUrl} target="_blank" rel="noreferrer" className="text-sm text-cyan-300 hover:underline">
            Ver en explorer
          </a>
          <p className="text-sm text-slate-300">Ultima actualizacion on-chain: {formatDate(property.blockchain.lastOnchainUpdate)}</p>
          {property.blockchain.syncStatus === "unavailable" ? (
            <p className="rounded-md bg-amber-500/15 p-2 text-xs text-amber-100">
              Datos blockchain no disponibles todavia para este activo.
            </p>
          ) : null}
        </Card>
      </section>
    </>
  );
}
