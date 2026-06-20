"use client";

import { Card } from "@/components/ui/card";
import { H2 } from "@/components/ui/typography";
import { useI18n } from "@/components/i18n/locale-provider";
import {
  buildAdminCollectionGoogleMapsEmbedUrl,
  buildAdminCollectionGoogleMapsUrl,
  buildAdminCollectionLocationLabel
} from "@/lib/admin/admin-collection-location-view";
import type { PropertyDetail } from "@/lib/property-service";

type PropertyDetailGoogleMapsCardProps = {
  property: PropertyDetail;
};

function resolvePublicGoogleMapsEmbedApiKey(): string | null {
  const embedApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY?.trim();
  if (embedApiKey) {
    return embedApiKey;
  }

  const publicApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  return publicApiKey || null;
}

function buildPropertyLocationContent(property: PropertyDetail) {
  return {
    city: property.city,
    country: property.country,
    postalCode: property.postalCode,
    locationLabel: property.locationLabel,
    detailedLocation: property.detailedLocation,
    googleMapsPlace: property.googleMapsPlace ?? null
  };
}

export function PropertyDetailGoogleMapsCard({ property }: PropertyDetailGoogleMapsCardProps) {
  const { t } = useI18n();
  const locationContent = buildPropertyLocationContent(property);
  const locationLabel = buildAdminCollectionLocationLabel(locationContent);
  const googleMapsUrl = buildAdminCollectionGoogleMapsUrl(locationContent);
  const googleMapsEmbedApiKey = resolvePublicGoogleMapsEmbedApiKey();
  const googleMapsEmbedUrl = googleMapsEmbedApiKey
    ? buildAdminCollectionGoogleMapsEmbedUrl(locationContent, { apiKey: googleMapsEmbedApiKey })
    : null;

  return (
    <Card className="marketplace-detail-card space-y-3">
      <H2 className="text-2xl text-white">{t({ en: "Google Maps location", es: "Ubicacion en Google Maps", pt: "Localizacao no Google Maps" })}</H2>
      <p className="text-sm text-slate-300">{locationLabel ?? property.locationLabel}</p>
      {googleMapsEmbedUrl ? (
        <div className="marketplace-detail-media-frame overflow-hidden rounded-2xl">
          <div className="aspect-[16/10] w-full">
            <iframe
              className="h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={googleMapsEmbedUrl}
              title="Google Maps preview"
            />
          </div>
        </div>
      ) : (
        <p className="marketplace-detail-alert marketplace-detail-alert-warning rounded-2xl p-3 text-sm text-amber-100">
          {t({
            en: "Embedded preview is unavailable in this environment. Use the Google Maps link to inspect the location.",
            es: "El preview embebido no esta disponible en este entorno. Usa el enlace de Google Maps para revisar la ubicacion.",
            pt: "O preview embutido nao esta disponivel neste ambiente. Use o link do Google Maps para revisar a localizacao."
          })}
        </p>
      )}
      {googleMapsUrl ? (
        <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="marketplace-brand-pill inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white/85">
          {t({ en: "Open in Google Maps", es: "Open in Google Maps", pt: "Open in Google Maps" })}
        </a>
      ) : null}
    </Card>
  );
}
