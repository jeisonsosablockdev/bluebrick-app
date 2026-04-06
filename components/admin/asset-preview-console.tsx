"use client";

import Image from "next/image";
import type { ReactElement } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PublicationCheck = {
  label: {
    en: string;
    es: string;
    pt: string;
  };
  done: boolean;
  warning?: boolean;
};

const checks: PublicationCheck[] = [
  { label: { en: "type defined", es: "tipo definido", pt: "tipo definido" }, done: true },
  { label: { en: "name defined", es: "nombre definido", pt: "nome definido" }, done: true },
  { label: { en: "cover image uploaded", es: "cover image cargada", pt: "cover image carregada" }, done: true },
  { label: { en: "short and long description", es: "descripcion corta y larga", pt: "descricao curta e longa" }, done: true },
  { label: { en: "collection assigned", es: "coleccion asignada", pt: "colecao atribuida" }, done: true },
  { label: { en: "total Fractions defined", es: "total Fracciones definido", pt: "total Frações definido" }, done: true },
  {
    label: {
      en: "price per Fraction defined",
      es: "precio por Fracción definido",
      pt: "preco por Fração definido"
    },
    done: false,
    warning: true
  }
];

export function AssetPreviewConsole({ assetId }: { assetId: string }): ReactElement {
  const { t } = useI18n();
  const missingCritical = checks.filter((item) => !item.done && !item.warning);
  const warningItems = checks.filter((item) => item.warning);
  const publishBlocked = missingCritical.length > 0;

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold text-white">{t({ en: "Asset preview", es: "Previsualizacion de activo", pt: "Pre-visualizacao do ativo" })}</h2>
        <p className="text-sm text-white/75">AssetId: {assetId}</p>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr,340px]">
        <div className="space-y-4">
          <Card className="space-y-3">
            <p className="text-sm font-semibold text-white">{t({ en: "Marketplace card preview", es: "Preview Marketplace Card", pt: "Preview do card no marketplace" })}</p>
            <div className="max-w-md rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-white/10">
                <Image alt="Preview card" className="h-full w-full object-cover" height={360} src="/nft/vista-mar.svg" width={640} />
              </div>
              <p className="mt-2 text-sm font-semibold text-white">Vista Mar Cartagena</p>
              <p className="text-xs text-white/70">rental_property · Cartagena, CO</p>
              <p className="mt-1 text-sm text-white">$120 USDC / NFT · 5000 total</p>
            </div>
          </Card>

          <Card className="space-y-3">
            <p className="text-sm font-semibold text-white">{t({ en: "Detail page preview", es: "Preview Detail Page", pt: "Preview da pagina de detalhe" })}</p>
            <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
              <p className="font-semibold text-white">{t({ en: "Asset and mint summary", es: "Resumen del activo y mint", pt: "Resumo do ativo e mint" })}</p>
              <p className="text-white/75">{t({ en: "Main image", es: "Imagen principal", pt: "Imagem principal" })}: {t({ en: "uploaded", es: "cargada", pt: "carregada" })}</p>
              <p className="text-white/75">{t({ en: "Name", es: "Nombre", pt: "Nome" })}: Vista Mar Cartagena</p>
              <p className="text-white/75">{t({ en: "Type", es: "Tipo", pt: "Tipo" })}: {t({ en: "Rental property", es: "Propiedad en renta", pt: "Propriedade em renda" })}</p>
              <p className="text-white/75">{t({ en: "Location", es: "Ubicacion", pt: "Localizacao" })}: Cartagena, Colombia</p>
              <p className="text-white/75">{t({ en: "Price per Fraction", es: "Precio por Fracción", pt: "Preco por Fração" })}: $120</p>
              <p className="text-white/75">{t({ en: "Total Fractions", es: "Total Fracciones", pt: "Total Frações" })}: 5000 · {t({ en: "Available", es: "Disponibles", pt: "Disponiveis" })}: 5000</p>
              <p className="text-white/75">{t({ en: "Publication status", es: "Estado de publicacion", pt: "Status de publicacao" })}: draft</p>
              <p className="text-white/75">{t({ en: "Short description", es: "Descripcion breve", pt: "Descricao breve" })}: {t({ en: "asset oriented to monthly yield.", es: "activo orientado a renta mensual.", pt: "ativo orientado a renda mensal." })}</p>
            </div>
          </Card>

          <Card className="space-y-3">
            <p className="text-sm font-semibold text-white">{t({ en: "Fraction metadata preview", es: "Preview Fracción Metadata", pt: "Preview da metadata Fração" })}</p>
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3 text-xs text-white/80">
              <pre>{`{
  "name": "BRIDS Coastal #001",
  "symbol": "BCOA",
  "description": "Fraccion NFT de activo inmobiliario",
  "attributes": [
    { "trait_type": "city", "value": "Cartagena" },
    { "trait_type": "assetType", "value": "rental_property" }
  ]
}`}</pre>
            </div>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="space-y-2">
            <p className="text-sm font-semibold text-white">{t({ en: "Publication checklist", es: "Checklist de publicacion", pt: "Checklist de publicacao" })}</p>
            <ul className="space-y-2 text-sm">
              {checks.map((item) => (
                <li key={item.label.en} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                      item.done ? "bg-emerald-500/20 text-emerald-200" : item.warning ? "bg-amber-500/20 text-amber-200" : "bg-rose-500/20 text-rose-200"
                    }`}
                  >
                    {item.done ? "OK" : item.warning ? "!" : "X"}
                  </span>
                  <span className="text-white/85">{t(item.label)}</span>
                </li>
              ))}
            </ul>
          </Card>

          {warningItems.length > 0 && (
            <Card className="space-y-1 border-amber-400/30 bg-amber-500/5">
              <p className="text-sm font-semibold text-amber-100">{t({ en: "Warnings", es: "Warnings", pt: "Avisos" })}</p>
              <p className="text-sm text-amber-100">{t({ en: "Recommended pricing/metadata attributes are missing. Review before publishing.", es: "Faltan atributos recomendados de pricing/metadata. Revisa antes de publicar.", pt: "Faltam atributos recomendados de pricing/metadata. Revise antes de publicar." })}</p>
            </Card>
          )}

          {publishBlocked && (
            <Card className="space-y-1 border-rose-400/30 bg-rose-500/5">
              <p className="text-sm font-semibold text-rose-100">{t({ en: "Publication blocked", es: "Publicacion bloqueada", pt: "Publicacao bloqueada" })}</p>
              <p className="text-sm text-rose-100">{t({ en: "Critical fields are missing to publish the asset.", es: "Faltan campos criticos para publicar el activo.", pt: "Faltam campos criticos para publicar o ativo." })}</p>
            </Card>
          )}

          <Card className="space-y-2">
            <Button className="min-h-11 w-full" disabled={publishBlocked}>
              {t({ en: "Publish asset", es: "Publicar activo", pt: "Publicar ativo" })}
            </Button>
            <Button className="min-h-11 w-full" variant="outline">
              {t({ en: "Back to edit", es: "Volver a edicion", pt: "Voltar para edicao" })}
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
