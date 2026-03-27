"use client";

import Image from "next/image";

import { Card } from "@/components/ui/card";
import { H2, Lead } from "@/components/ui/typography";
import { useI18n } from "@/components/i18n/locale-provider";
import { PurchaseCta } from "@/components/marketplace/PurchaseCta";
import type { AppLocale } from "@/lib/i18n";
import type { PropertyDetail } from "@/lib/property-service";
import { listingStatusClasses, listingStatusLabel } from "@/components/marketplace/status-utils";

type PropertyDetailContentProps = {
  property: PropertyDetail;
  imageClassName?: string;
};

function formatDate(dateValue: string | null, locale: AppLocale): string {
  if (!dateValue) {
    return locale === "en" ? "Unavailable" : locale === "pt" ? "Indisponivel" : "No disponible";
  }

  const parsed = new Date(dateValue);

  if (Number.isNaN(parsed.valueOf())) {
    return locale === "en" ? "Unavailable" : locale === "pt" ? "Indisponivel" : "No disponible";
  }

  const dateLocale = locale === "en" ? "en-US" : locale === "pt" ? "pt-BR" : "es-CO";

  return parsed.toLocaleString(dateLocale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function PropertyDetailContent({ property, imageClassName = "h-64 md:h-80" }: PropertyDetailContentProps) {
  const { locale, t } = useI18n();

  return (
    <>
      <section className="rounded-2xl border border-white/10 bg-panel p-5 md:p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Image src={property.image} alt={property.title} width={900} height={600} className={`w-full rounded-xl object-cover ${imageClassName}`} />
          <div className="space-y-4">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${listingStatusClasses(property.listingStatus)}`}>
              {listingStatusLabel(property.listingStatus, locale)}
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-white">{property.title}</h1>
            <Lead>{property.locationLabel}</Lead>
            <p className="text-sm text-slate-300">{property.shortDescription}</p>
            <PurchaseCta propertyId={property.id} nftPriceUsd={property.investment.nftPriceUsd} />
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="space-y-3">
          <H2 className="text-2xl text-white">
            {t({
              en: "Fractional investment summary",
              es: "Resumen de inversion fraccional",
              pt: "Resumo do investimento fracionado"
            })}
          </H2>
          <p className="text-sm text-slate-300">
            {t({ en: "Total NFT supply", es: "Supply total NFTs", pt: "Supply total de NFTs" })}: {property.investment.supplyTotal.toLocaleString("en-US")}
          </p>
          <p className="text-sm text-slate-300">
            {t({ en: "Minted/sold NFTs", es: "NFTs emitidos/vendidos", pt: "NFTs emitidos/vendidos" })}: {property.investment.mintedOrSold.toLocaleString("en-US")}
          </p>
          <p className="text-sm text-slate-300">
            {t({ en: "Price per NFT", es: "Precio por NFT", pt: "Preco por NFT" })}: ${property.investment.nftPriceUsd.toFixed(2)}
          </p>
          <p className="text-sm text-slate-300">
            {t({ en: "Estimated yearly ROI", es: "ROI anual estimado", pt: "ROI anual estimado" })}: {property.investment.annualRoiPct.toFixed(1)}%
          </p>
          <p className="text-sm text-slate-300">
            {t({ en: "Availability", es: "Disponibilidad", pt: "Disponibilidade" })}: {property.investment.availabilityLabel}
          </p>
        </Card>

        <Card className="space-y-3">
          <H2 className="text-2xl text-white">{t({ en: "Property information", es: "Informacion de la propiedad", pt: "Informacoes da propriedade" })}</H2>
          <p className="text-sm text-slate-300">{property.investmentNotes}</p>
          <p className="text-sm text-slate-300">
            {t({ en: "Detailed location", es: "Ubicacion detallada", pt: "Localizacao detalhada" })}: {property.detailedLocation}
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
            {property.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="space-y-3">
          <H2 className="text-2xl text-white">{t({ en: "Documents", es: "Documentos", pt: "Documentos" })}</H2>
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
          <H2 className="text-2xl text-white">{t({ en: "Blockchain info", es: "Blockchain info", pt: "Blockchain info" })}</H2>
          <p className="text-sm text-slate-300">Network: {property.blockchain.network}</p>
          <p className="break-all text-sm text-slate-300">Collection: {property.blockchain.collectionAddress}</p>
          <p className="break-all text-sm text-slate-300">Mint: {property.blockchain.assetMintAddress}</p>
          <a href={property.blockchain.explorerUrl} target="_blank" rel="noreferrer" className="text-sm text-cyan-300 hover:underline">
            {t({ en: "View on explorer", es: "Ver en explorer", pt: "Ver no explorer" })}
          </a>
          <p className="text-sm text-slate-300">
            {t({ en: "Last on-chain update", es: "Ultima actualizacion on-chain", pt: "Ultima atualizacao on-chain" })}:{" "}
            {formatDate(property.blockchain.lastOnchainUpdate, locale)}
          </p>
          {property.blockchain.syncStatus === "unavailable" ? (
            <p className="rounded-md bg-amber-500/15 p-2 text-xs text-amber-100">
              {t({
                en: "Blockchain data is not available yet for this asset.",
                es: "Datos blockchain no disponibles todavia para este activo.",
                pt: "Dados blockchain ainda nao disponiveis para este ativo."
              })}
            </p>
          ) : null}
        </Card>
      </section>
    </>
  );
}
