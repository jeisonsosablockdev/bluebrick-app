"use client";

import { Card } from "@/components/ui/card";
import { H2 } from "@/components/ui/typography";
import { useI18n } from "@/components/i18n/locale-provider";
import { formatMarketplaceDetailLocation } from "@/components/marketplace/property-detail-formatters";
import type { PropertyDetail } from "@/lib/property-service";

type PropertyDetailPropertyInfoCardProps = {
  property: PropertyDetail;
};

export function PropertyDetailPropertyInfoCard({ property }: PropertyDetailPropertyInfoCardProps) {
  const { t } = useI18n();

  return (
    <Card className="space-y-3">
      <H2 className="text-2xl text-white">{t({ en: "Property information", es: "Informacion de la propiedad", pt: "Informacoes da propriedade" })}</H2>
      <p className="text-sm text-slate-300">{property.investmentNotes}</p>
      <p className="text-sm text-slate-300">
        {t({ en: "Detailed location", es: "Ubicacion detallada", pt: "Localizacao detalhada" })}: {formatMarketplaceDetailLocation(property.detailedLocation, property.postalCode)}
      </p>
      {property.postalCode ? (
        <p className="text-sm text-slate-300">
          {t({ en: "Postal code", es: "Codigo postal", pt: "Codigo postal" })}: {property.postalCode}
        </p>
      ) : null}
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
        {property.highlights.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Card>
  );
}
