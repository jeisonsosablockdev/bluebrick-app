"use client";

import Image from "next/image";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/locale-provider";
import { H2, Lead } from "@/components/ui/typography";
import type { AppLocale } from "@/lib/i18n";
import { getHomeContent } from "@/app/data";

export type FeaturedPropertyCard = {
  id: string;
  title: string;
  locationLabel: string;
  annualRoiPct: number;
  image: string;
};

type PropertiesSectionProps = {
  properties: FeaturedPropertyCard[];
};

function formatRoi(locale: AppLocale, annualRoiPct: number): string {
  const normalizedLocale = locale === "es" ? "es-CO" : locale === "pt" ? "pt-BR" : "en-US";
  return `${new Intl.NumberFormat(normalizedLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(annualRoiPct)}% ROI`;
}

function parseFallbackRoi(roiLabel: string): number {
  const normalized = roiLabel.replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function PropertiesSection({ properties }: PropertiesSectionProps) {
  const { locale, t } = useI18n();
  const fallbackProperties = getHomeContent(locale).properties.slice(0, 3).map((property, index) => ({
    id: `fallback-${index}-${property.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    title: property.title,
    locationLabel: property.location,
    annualRoiPct: parseFallbackRoi(property.roi),
    image: property.image
  }));
  const effectiveProperties = properties.length > 0 ? properties : fallbackProperties;
  const usesFallback = properties.length === 0;

  return (
    <section className="py-12">
      <div className="mb-8 text-center">
        <H2 className="text-white">
          {t({ en: "Featured Properties", es: "Propiedades Destacadas", pt: "Imoveis em Destaque" })}
        </H2>
        <Lead className="mx-auto mt-2 max-w-xl">
          {t({
            en: "Discover active opportunities in high-demand locations.",
            es: "Descubre oportunidades activas en ubicaciones de alta demanda.",
            pt: "Descubra oportunidades ativas em localizacoes de alta demanda."
          })}
        </Lead>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {effectiveProperties.map((property) => (
          <Card key={property.id} className="landing-depth-card overflow-hidden p-0">
            <Image
              src={property.image}
              alt={property.title}
              width={600}
              height={360}
              className="h-44 w-full object-cover"
              sizes="(min-width: 1024px) 360px, (min-width: 768px) 33vw, 100vw"
            />
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-white">{property.title}</h3>
              </div>
              <p className="text-sm text-slate-400">{property.locationLabel}</p>
              <p className="text-sm font-semibold text-cyan-300">
                {t({ en: "Project metric", es: "Metrica del proyecto", pt: "Metrica do projeto" })}: {formatRoi(locale, property.annualRoiPct)}
              </p>
              {usesFallback ? (
                <p className="text-xs text-amber-200">
                  {t({
                    en: "Fallback data shown while marketplace records are unavailable.",
                    es: "Mostrando datos de respaldo mientras no hay registros del marketplace.",
                    pt: "Exibindo dados de fallback enquanto nao ha registros do marketplace."
                  })}
                </p>
              ) : null}
            </div>
          </Card>
        ))}
      </div>

      <p className="mx-auto mt-4 max-w-3xl text-center text-xs text-slate-400">
        {t({
          en: "Project metrics are informational references and may change according to partner updates and applicable documentation.",
          es: "Las metricas del proyecto son referenciales e informativas y pueden cambiar segun actualizaciones del partner y documentacion aplicable.",
          pt: "As metricas do projeto sao referenciais e informativas e podem mudar conforme atualizacoes do parceiro e documentacao aplicavel."
        })}
      </p>

      <div className="mt-6 text-center">
        <Link
          href="/marketplace"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradientPrimary px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:opacity-95"
        >
          {t({ en: "View marketplace", es: "Ver marketplace", pt: "Ver marketplace" })}
        </Link>
      </div>
    </section>
  );
}
