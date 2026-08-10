"use client";

import { Card } from "@/components/ui/card";
import { H2 } from "@/components/ui/typography";
import { useI18n } from "@/components/i18n/locale-provider";
import { formatMarketplaceDetailDate } from "@/components/marketplace/property-detail-formatters";
import type { PropertyBlockchainInfo, PropertyDocument } from "@/lib/property-service";

type PropertyDetailDocumentsBlockchainCardsProps = {
  documents: PropertyDocument[];
  blockchain: PropertyBlockchainInfo;
};

export function PropertyDetailDocumentsBlockchainCards({
  documents,
  blockchain
}: PropertyDetailDocumentsBlockchainCardsProps) {
  const { locale, t } = useI18n();

  return (
    <>
      <Card className="marketplace-detail-card space-y-3">
        <H2 className="text-2xl text-white">{t({ en: "Documents", es: "Documentos", pt: "Documentos" })}</H2>
        <ul className="space-y-2">
          {documents.map((document) => (
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

      <Card className="marketplace-detail-card space-y-3">
        <H2 className="text-2xl text-white">{t({ en: "Blockchain info", es: "Blockchain info", pt: "Blockchain info" })}</H2>
        <p className="text-sm text-slate-300">Network: {blockchain.network}</p>
        <p className="break-all text-sm text-slate-300">Collection: {blockchain.collectionAddress}</p>
        <p className="break-all text-sm text-slate-300">Mint: {blockchain.assetMintAddress}</p>
        <a href={blockchain.explorerUrl} target="_blank" rel="noreferrer" className="text-sm text-cyan-300 hover:underline">
          {t({ en: "View on explorer", es: "Ver en explorer", pt: "Ver no explorer" })}
        </a>
        <p className="text-sm text-slate-300">
          {t({ en: "Last on-chain update", es: "Ultima actualizacion on-chain", pt: "Ultima atualizacao on-chain" })}:{" "}
          {formatMarketplaceDetailDate(blockchain.lastOnchainUpdate, locale)}
        </p>
        {blockchain.syncStatus === "unavailable" ? (
          <p className="marketplace-detail-alert marketplace-detail-alert-warning rounded-md p-2 text-xs text-amber-100">
            {t({
              en: "Blockchain data is not available yet for this asset.",
              es: "Datos blockchain no disponibles todavia para este activo.",
              pt: "Dados blockchain ainda nao disponiveis para este ativo."
            })}
          </p>
        ) : null}
      </Card>
    </>
  );
}
