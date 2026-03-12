"use client";

import Image from "next/image";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PublicationCheck = {
  label: string;
  done: boolean;
  warning?: boolean;
};

const checks: PublicationCheck[] = [
  { label: "tipo definido", done: true },
  { label: "nombre definido", done: true },
  { label: "cover image cargada", done: true },
  { label: "descripcion corta y larga", done: true },
  { label: "coleccion asignada", done: true },
  { label: "total NFTs definido", done: true },
  { label: "precio por NFT definido", done: false, warning: true }
];

export function AssetPreviewConsole({ assetId }: { assetId: string }): ReactElement {
  const missingCritical = checks.filter((item) => !item.done && !item.warning);
  const warningItems = checks.filter((item) => item.warning);
  const publishBlocked = missingCritical.length > 0;

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Previsualizacion de activo</h2>
        <p className="text-sm text-white/75">AssetId: {assetId}</p>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr,340px]">
        <div className="space-y-4">
          <Card className="space-y-3">
            <p className="text-sm font-semibold text-white">Preview Marketplace Card</p>
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
            <p className="text-sm font-semibold text-white">Preview Detail Page</p>
            <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
              <p className="font-semibold text-white">Resumen del activo y mint</p>
              <p className="text-white/75">Imagen principal: cargada</p>
              <p className="text-white/75">Nombre: Vista Mar Cartagena</p>
              <p className="text-white/75">Tipo: Propiedad en renta</p>
              <p className="text-white/75">Ubicacion: Cartagena, Colombia</p>
              <p className="text-white/75">Precio por NFT: $120</p>
              <p className="text-white/75">Total NFTs: 5000 · Disponibles: 5000</p>
              <p className="text-white/75">Estado de publicacion: draft</p>
              <p className="text-white/75">Descripcion breve: activo orientado a renta mensual.</p>
            </div>
          </Card>

          <Card className="space-y-3">
            <p className="text-sm font-semibold text-white">Preview NFT Metadata</p>
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
            <p className="text-sm font-semibold text-white">Checklist de publicacion</p>
            <ul className="space-y-2 text-sm">
              {checks.map((item) => (
                <li key={item.label} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                      item.done ? "bg-emerald-500/20 text-emerald-200" : item.warning ? "bg-amber-500/20 text-amber-200" : "bg-rose-500/20 text-rose-200"
                    }`}
                  >
                    {item.done ? "OK" : item.warning ? "!" : "X"}
                  </span>
                  <span className="text-white/85">{item.label}</span>
                </li>
              ))}
            </ul>
          </Card>

          {warningItems.length > 0 && (
            <Card className="space-y-1 border-amber-400/30 bg-amber-500/5">
              <p className="text-sm font-semibold text-amber-100">Warnings</p>
              <p className="text-sm text-amber-100">Faltan atributos recomendados de pricing/metadata. Revisa antes de publicar.</p>
            </Card>
          )}

          {publishBlocked && (
            <Card className="space-y-1 border-rose-400/30 bg-rose-500/5">
              <p className="text-sm font-semibold text-rose-100">Publicacion bloqueada</p>
              <p className="text-sm text-rose-100">Faltan campos criticos para publicar el activo.</p>
            </Card>
          )}

          <Card className="space-y-2">
            <Button className="min-h-11 w-full" disabled={publishBlocked}>
              Publicar activo
            </Button>
            <Button className="min-h-11 w-full" variant="outline">
              Volver a edicion
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
