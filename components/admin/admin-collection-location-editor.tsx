"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";

import {
  AdminCollectionDetailEmptyState,
  AdminCollectionDetailSectionShell
} from "@/components/admin/admin-collection-detail-section-primitives";
import {
  createAdminCollectionLocationSessionToken,
  fetchAdminCollectionLocationSuggestions,
  resolveAdminCollectionLocationPlace,
  AdminCollectionLocationClientError
} from "@/lib/admin/admin-collection-location-client";
import type { CollectionBootstrapGoogleMapsPlace } from "@/lib/admin/collection-bootstrap-mapper";
import type { AdminCollectionContentRecord } from "@/lib/admin/collection-content-repository";
import type { AdminCollectionLocationAutocompleteSuggestion } from "@/lib/admin/google-maps-places-service";
import {
  buildAdminCollectionGoogleMapsEmbedUrl,
  buildAdminCollectionGoogleMapsUrl,
  buildAdminCollectionLocationLabel
} from "@/lib/admin/admin-collection-location-view";
import { localize, type AppLocale } from "@/lib/i18n";

type SuggestionsState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; suggestions: AdminCollectionLocationAutocompleteSuggestion[] };

function buildPreviewContent(
  content: AdminCollectionContentRecord,
  selectedPlace: CollectionBootstrapGoogleMapsPlace | null
): AdminCollectionContentRecord {
  return {
    ...content,
    googleMapsPlace: selectedPlace ?? content.googleMapsPlace
  };
}

export function AdminCollectionLocationEditor({
  entryId,
  locale,
  content
}: {
  entryId: string;
  locale: AppLocale;
  content: AdminCollectionContentRecord;
}): ReactElement {
  const [query, setQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<CollectionBootstrapGoogleMapsPlace | null>(null);
  const [suggestionsState, setSuggestionsState] = useState<SuggestionsState>({ kind: "idle" });
  const [selectionMessage, setSelectionMessage] = useState<string>(
    localize(locale, {
      en: "Autocomplete selection stays local in this slice. Save/cancel will land in the next steps.",
      es: "La seleccion del autocomplete se mantiene local en este slice. Save/cancel llegara en los siguientes pasos.",
      pt: "A selecao do autocomplete permanece local neste slice. Save/cancel chegara nos proximos passos."
    })
  );
  const [sessionToken] = useState(() => createAdminCollectionLocationSessionToken());

  useEffect(() => {
    if (query.trim().length < 3) {
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      void fetchAdminCollectionLocationSuggestions({
        entryId,
        query,
        sessionToken
      })
        .then((suggestions) => {
          if (cancelled) {
            return;
          }

          setSuggestionsState({ kind: "ready", suggestions });
        })
        .catch((error) => {
          if (cancelled) {
            return;
          }

          setSuggestionsState({
            kind: "error",
            message: error instanceof AdminCollectionLocationClientError
              ? error.message
              : localize(locale, {
                  en: "Could not load Google Maps suggestions.",
                  es: "No se pudieron cargar sugerencias de Google Maps.",
                  pt: "Nao foi possivel carregar sugestoes do Google Maps."
                })
          });
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [entryId, locale, query, sessionToken]);

  const previewContent = buildPreviewContent(content, selectedPlace);
  const previewLabel = buildAdminCollectionLocationLabel(previewContent);
  const embedUrl = buildAdminCollectionGoogleMapsEmbedUrl(previewContent);
  const outboundUrl = buildAdminCollectionGoogleMapsUrl(previewContent);

  async function handleSelectSuggestion(suggestion: AdminCollectionLocationAutocompleteSuggestion): Promise<void> {
    setSelectionMessage(
      localize(locale, {
        en: "Resolving the selected place into the reduced payload.",
        es: "Resolviendo el place seleccionado hacia el payload reducido.",
        pt: "Resolvendo o place selecionado para o payload reduzido."
      })
    );

    try {
      const nextPlace = await resolveAdminCollectionLocationPlace({
        entryId,
        placeId: suggestion.placeId,
        sessionToken
      });

      setSelectedPlace(nextPlace);
      setQuery(suggestion.fullText);
      setSuggestionsState({ kind: "idle" });
      setSelectionMessage(
        localize(locale, {
          en: "Location selection resolved locally. The reduced payload is ready for the later save slice.",
          es: "La seleccion de ubicacion ya se resolvio localmente. El payload reducido esta listo para el slice de guardado posterior.",
          pt: "A selecao de localizacao foi resolvida localmente. O payload reduzido esta pronto para o slice posterior de salvamento."
        })
      );
    } catch (error) {
      setSelectionMessage(
        error instanceof AdminCollectionLocationClientError
          ? error.message
          : localize(locale, {
              en: "Could not resolve the selected Google Maps place.",
              es: "No se pudo resolver el place seleccionado de Google Maps.",
              pt: "Nao foi possivel resolver o place selecionado do Google Maps."
            })
      );
    }
  }

  return (
    <AdminCollectionDetailSectionShell
      aside={
        <span className="inline-flex min-h-9 items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/65">
          {localize(locale, { en: "Autocomplete live", es: "Autocomplete activo", pt: "Autocomplete ativo" })}
        </span>
      }
      description={localize(locale, {
        en: "The location section now supports address lookup and local place selection without leaving the editor. Persistence remains isolated for the next slice.",
        es: "La seccion de ubicacion ahora soporta busqueda de direccion y seleccion local del place sin salir del editor. La persistencia queda aislada para el siguiente slice.",
        pt: "A secao de localizacao agora suporta busca de endereco e selecao local do place sem sair do editor. A persistencia permanece isolada para o proximo slice."
      })}
      eyebrow={localize(locale, { en: "Editable section", es: "Seccion editable", pt: "Secao editavel" })}
      title={localize(locale, { en: "Google Maps location", es: "Google Maps location", pt: "Google Maps location" })}
    >
      <div className="space-y-4">
        <label className="space-y-3">
          <span className="text-sm font-medium text-white/80">
            {localize(locale, { en: "Search address", es: "Buscar direccion", pt: "Buscar endereco" })}
          </span>
          <input
            className="min-h-11 w-full rounded-2xl border border-white/12 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/45 focus:ring-2 focus:ring-sky-300/20"
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              if (nextQuery.trim().length < 3) {
                setSuggestionsState({ kind: "idle" });
              } else {
                setSuggestionsState({ kind: "loading" });
              }
              setSelectionMessage(
                localize(locale, {
                  en: "Autocomplete selection stays local in this slice. Save/cancel will land in the next steps.",
                  es: "La seleccion del autocomplete se mantiene local en este slice. Save/cancel llegara en los siguientes pasos.",
                  pt: "A selecao do autocomplete permanece local neste slice. Save/cancel chegara nos proximos passos."
                })
              );
            }}
            placeholder={localize(locale, {
              en: "Search for a building, address, or place",
              es: "Busca un edificio, direccion o lugar",
              pt: "Busque um predio, endereco ou lugar"
            })}
            value={query}
          />
        </label>

        {suggestionsState.kind === "loading" ? (
          <p className="text-sm text-sky-100">
            {localize(locale, { en: "Loading Google Maps suggestions...", es: "Cargando sugerencias de Google Maps...", pt: "Carregando sugestoes do Google Maps..." })}
          </p>
        ) : null}

        {suggestionsState.kind === "error" ? (
          <p className="text-sm text-rose-100">{suggestionsState.message}</p>
        ) : null}

        {suggestionsState.kind === "ready" ? (
          suggestionsState.suggestions.length > 0 ? (
            <div className="grid gap-3">
              {suggestionsState.suggestions.map((suggestion) => (
                <button
                  key={suggestion.placeId}
                  className="rounded-2xl border border-white/10 bg-black/10 p-4 text-left transition hover:border-sky-300/35 hover:bg-black/20"
                  onClick={() => {
                    void handleSelectSuggestion(suggestion);
                  }}
                  type="button"
                >
                  <p className="text-sm font-semibold text-white">{suggestion.primaryText}</p>
                  <p className="text-sm text-white/60">{suggestion.secondaryText ?? suggestion.fullText}</p>
                </button>
              ))}
            </div>
          ) : (
            <AdminCollectionDetailEmptyState
              message={localize(locale, {
                en: "No Google Maps suggestions matched this query yet.",
                es: "Aun no hay sugerencias de Google Maps para esta busqueda.",
                pt: "Ainda nao ha sugestoes do Google Maps para esta busca."
              })}
            />
          )
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="space-y-3 rounded-3xl border border-white/10 bg-black/10 p-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                {localize(locale, { en: "Selection preview", es: "Preview de seleccion", pt: "Preview da selecao" })}
              </p>
              <h4 className="text-base font-semibold text-white">
                {previewLabel ?? localize(locale, { en: "Location pending", es: "Ubicacion pendiente", pt: "Localizacao pendente" })}
              </h4>
            </div>
            <p className="text-sm leading-6 text-white/65">
              {(selectedPlace ?? content.googleMapsPlace)?.formattedAddress ?? content.detailedLocation}
            </p>
            <p aria-live="polite" className="text-sm text-white/55">
              {selectionMessage}
            </p>
            {outboundUrl ? (
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/85 transition-all hover:bg-white/15"
                href={outboundUrl}
                rel="noreferrer"
                target="_blank"
              >
                {localize(locale, { en: "Open in Google Maps", es: "Open in Google Maps", pt: "Open in Google Maps" })}
              </Link>
            ) : null}
          </div>

          {embedUrl ? (
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/10">
              <div className="aspect-[16/10] w-full">
                <iframe
                  className="h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={embedUrl}
                  title="Google Maps preview"
                />
              </div>
            </div>
          ) : (
            <AdminCollectionDetailEmptyState
              message={localize(locale, {
                en: "Map preview will appear once the section has either a reduced place payload or enough address context.",
                es: "El preview del mapa aparecera cuando la seccion tenga un payload reducido o suficiente contexto de direccion.",
                pt: "O preview do mapa aparecera quando a secao tiver um payload reduzido ou contexto suficiente de endereco."
              })}
            />
          )}
        </div>
      </div>
    </AdminCollectionDetailSectionShell>
  );
}
