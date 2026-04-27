import Link from "next/link";
import type { ReactElement } from "react";

import {
  AdminCollectionDetailEmptyState,
  AdminCollectionDetailSectionShell
} from "@/components/admin/admin-collection-detail-section-primitives";
import {
  buildAdminCollectionGoogleMapsEmbedUrl,
  buildAdminCollectionGoogleMapsUrl,
  buildAdminCollectionLocationLabel
} from "@/lib/admin/admin-collection-location-view";
import type { AdminCollectionContentRecord } from "@/lib/admin/collection-content-repository";
import { localize, type AppLocale } from "@/lib/i18n";

function AddressStack({
  locale,
  content
}: {
  locale: AppLocale;
  content: AdminCollectionContentRecord;
}): ReactElement {
  const locationLabel = buildAdminCollectionLocationLabel(content);
  const formattedAddress = content.googleMapsPlace?.formattedAddress ?? content.detailedLocation;
  const placeLabel = content.googleMapsPlace?.placeLabel ?? content.locationLabel;
  const cityCountry = [content.city, content.country].filter((value) => value.trim().length > 0).join(", ");

  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-black/10 p-4">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.18em] text-white/45">
          {localize(locale, { en: "Current address", es: "Direccion actual", pt: "Endereco atual" })}
        </p>
        <h4 className="text-base font-semibold text-white">
          {locationLabel ?? localize(locale, { en: "Location pending", es: "Ubicacion pendiente", pt: "Localizacao pendente" })}
        </h4>
      </div>
      <div className="space-y-2 text-sm leading-6 text-white/70">
        <p>{formattedAddress || placeLabel || locationLabel || cityCountry}</p>
        {cityCountry ? <p className="text-white/50">{cityCountry}</p> : null}
      </div>
    </div>
  );
}

function MapPreview({
  locale,
  content
}: {
  locale: AppLocale;
  content: AdminCollectionContentRecord;
}): ReactElement {
  const embedUrl = buildAdminCollectionGoogleMapsEmbedUrl(content);
  const outboundUrl = buildAdminCollectionGoogleMapsUrl(content);

  if (!embedUrl || !outboundUrl) {
    return (
      <AdminCollectionDetailEmptyState
        message={localize(locale, {
          en: "No location preview is available yet. The next slices will add autocomplete and reduced place persistence here.",
          es: "Aun no hay un preview de ubicacion disponible. Los siguientes slices agregaran autocomplete y persistencia reducida del place.",
          pt: "Ainda nao ha um preview de localizacao disponivel. Os proximos slices adicionarao autocomplete e persistencia reduzida do place."
        })}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/10">
      <div className="relative aspect-[16/10] w-full bg-black/20">
        <iframe
          className="h-full w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={embedUrl}
          title="Google Maps preview"
        />
        <Link
          className="absolute inset-0"
          href={outboundUrl}
          rel="noreferrer"
          target="_blank"
        >
          <span className="sr-only">
            {localize(locale, {
              en: "Open location in Google Maps",
              es: "Abrir ubicacion en Google Maps",
              pt: "Abrir localizacao no Google Maps"
            })}
          </span>
        </Link>
      </div>
    </div>
  );
}

export function AdminCollectionLocationShell({
  locale,
  content
}: {
  locale: AppLocale;
  content: AdminCollectionContentRecord;
}): ReactElement {
  const outboundUrl = buildAdminCollectionGoogleMapsUrl(content);

  return (
    <AdminCollectionDetailSectionShell
      aside={
        <span className="inline-flex min-h-9 items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/65">
          {localize(locale, { en: "Location preview", es: "Preview de ubicacion", pt: "Preview de localizacao" })}
        </span>
      }
      description={localize(locale, {
        en: "The location section now exposes the current address context, a visible map preview, and a direct outbound jump to Google Maps before the editor/autocomplete slices land.",
        es: "La seccion de ubicacion ahora expone el contexto actual de direccion, un preview visible del mapa y un salto directo a Google Maps antes de que lleguen los slices de editor/autocomplete.",
        pt: "A secao de localizacao agora expoe o contexto atual do endereco, um preview visivel do mapa e um salto direto para o Google Maps antes que os slices de editor/autocomplete cheguem."
      })}
      eyebrow={localize(locale, { en: "Location section", es: "Seccion de ubicacion", pt: "Secao de localizacao" })}
      title={localize(locale, { en: "Google Maps location", es: "Google Maps location", pt: "Google Maps location" })}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <AddressStack content={content} locale={locale} />
        <MapPreview content={content} locale={locale} />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/55">
          {localize(locale, {
            en: "Clicking the preview or CTA opens Google Maps in a separate tab, while the editor flow remains staged for the next slices.",
            es: "Hacer click en el preview o en el CTA abre Google Maps en otra pestana, mientras el flujo de edicion queda preparado para los siguientes slices.",
            pt: "Clicar no preview ou no CTA abre o Google Maps em outra aba, enquanto o fluxo de edicao permanece preparado para os proximos slices."
          })}
        </p>
        {outboundUrl ? (
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/85 transition-all hover:bg-white/15"
            href={outboundUrl}
            rel="noreferrer"
            target="_blank"
          >
            {localize(locale, {
              en: "Open in Google Maps",
              es: "Open in Google Maps",
              pt: "Open in Google Maps"
            })}
          </Link>
        ) : null}
      </div>
    </AdminCollectionDetailSectionShell>
  );
}
