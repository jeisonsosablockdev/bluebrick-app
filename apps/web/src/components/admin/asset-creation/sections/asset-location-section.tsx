"use client";

import type { ReactElement } from "react";
import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { COUNTRIES } from "@/lib/countries";
import {
  AdminCollectionLocationClientError,
  createAdminCollectionLocationSessionToken,
  fetchAdminAssetLocationSuggestions,
  resolveAdminAssetLocationPlace,
  type AdminCollectionLocationAutocompleteSuggestion
} from "@/lib/admin/admin-collection-location-client";

import type { AssetForm } from "@/components/admin/asset-creation/types";
import type { SectionT } from "@/components/admin/asset-creation/sections/section-types";

type SetStateAction<T> = T | ((prev: T) => T);

type AssetLocationSectionProps = {
  t: SectionT;
  form: AssetForm;
  setForm: (value: SetStateAction<AssetForm>) => void;
};

type SuggestionsState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; suggestions: AdminCollectionLocationAutocompleteSuggestion[] };

export function AssetLocationSection({
  t,
  form,
  setForm
}: AssetLocationSectionProps): ReactElement {
  const selectedCountryInfo = COUNTRIES.find((c) => c.code === form.country || c.nameEn === form.country);
  const [query, setQuery] = useState("");
  const [suggestionsState, setSuggestionsState] = useState<SuggestionsState>({ kind: "idle" });
  const [sessionToken] = useState(() => createAdminCollectionLocationSessionToken());

  useEffect(() => {
    if (query.trim().length < 3) {
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      void fetchAdminAssetLocationSuggestions({
        query,
        country: form.country,
        city: form.city,
        sessionToken
      })
        .then((suggestions) => {
          if (!cancelled) {
            setSuggestionsState({ kind: "ready", suggestions });
          }
        })
        .catch((error) => {
          if (cancelled) {
            return;
          }

          setSuggestionsState({
            kind: "error",
            message: error instanceof AdminCollectionLocationClientError
              ? error.message
              : t({
                  en: "Could not load Google Maps suggestions.",
                  es: "No se pudieron cargar sugerencias de Google Maps.",
                  pt: "Nao foi possivel carregar sugestoes de Google Maps."
                })
          });
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [form.city, form.country, query, sessionToken, t]);

  async function handleSelectSuggestion(suggestion: AdminCollectionLocationAutocompleteSuggestion): Promise<void> {
    setSuggestionsState({ kind: "loading" });

    try {
      const place = await resolveAdminAssetLocationPlace({
        placeId: suggestion.placeId,
        country: form.country,
        sessionToken
      });

      const fullAddress = place.formattedAddress || suggestion.fullText || place.placeLabel;

      setForm((prev) => ({
        ...prev,
        country: place.country ?? prev.country,
        state: place.stateProvince ?? prev.state,
        postalCode: place.postalCode ?? prev.postalCode,
        city: place.city ?? prev.city,
        address: place.addressLine ?? place.formattedAddress,
        geoLat: String(place.lat),
        geoLng: String(place.lng),
        googleMapsPlace: place
      }));
      setQuery(fullAddress);
      setSuggestionsState({ kind: "idle" });
    } catch (error) {
      setSuggestionsState({
        kind: "error",
        message: error instanceof AdminCollectionLocationClientError
          ? error.message
          : t({
              en: "Could not resolve the selected Google Maps place.",
              es: "No se pudo resolver el lugar seleccionado de Google Maps.",
              pt: "Nao foi possivel resolver o lugar selecionado do Google Maps."
            })
      });
    }
  }

  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-semibold text-white">{t({ en: "Location", es: "Ubicacion", pt: "Localizacao" })}</p>
      <div className="space-y-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-3">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">
            {t({ en: "Google Maps lookup", es: "Busqueda con Google Maps", pt: "Busca com Google Maps" })}
          </span>
          <Input
            placeholder={t({
              en: "Search an address or place, then select a suggestion",
              es: "Busca una direccion o lugar y selecciona una sugerencia",
              pt: "Busque um endereco ou lugar e selecione uma sugestao"
            })}
            value={query}
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              setSuggestionsState(nextQuery.trim().length < 3 ? { kind: "idle" } : { kind: "loading" });
            }}
          />
        </label>
        {suggestionsState.kind === "loading" ? (
          <p className="text-xs text-cyan-100">
            {t({ en: "Loading Google Maps suggestions...", es: "Cargando sugerencias de Google Maps...", pt: "Carregando sugestoes de Google Maps..." })}
          </p>
        ) : null}
        {suggestionsState.kind === "error" ? (
          <p className="text-xs text-rose-100">{suggestionsState.message}</p>
        ) : null}
        {suggestionsState.kind === "ready" ? (
          suggestionsState.suggestions.length > 0 ? (
            <div className="grid gap-2">
              {suggestionsState.suggestions.map((suggestion) => (
                <button
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left transition hover:border-cyan-300/40 hover:bg-black/30"
                  key={suggestion.placeId}
                  onClick={() => {
                    void handleSelectSuggestion(suggestion);
                  }}
                  type="button"
                >
                  <span className="block text-sm font-semibold text-white">{suggestion.primaryText}</span>
                  <span className="block text-xs text-white/60">{suggestion.secondaryText ?? suggestion.fullText}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/60">
              {t({ en: "No suggestions matched that search.", es: "No hubo sugerencias para esa busqueda.", pt: "Nenhuma sugestao para essa busca." })}
            </p>
          )
        ) : null}
        {form.googleMapsPlace ? (
          <p className="text-xs text-emerald-100">
            {t({ en: "Selected place", es: "Lugar seleccionado", pt: "Lugar selecionado" })}: {form.googleMapsPlace.formattedAddress}
          </p>
        ) : (
          <p className="text-xs text-white/55">
            {t({
              en: "Manual fields below remain available as a fallback; coordinates are hydrated from Google Maps when a place is selected.",
              es: "Los campos manuales de abajo siguen disponibles como fallback; las coordenadas se derivan de Google Maps al seleccionar un lugar.",
              pt: "Os campos manuais abaixo seguem disponiveis como fallback; as coordenadas vem do Google Maps ao selecionar um lugar."
            })}
          </p>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          className="flex h-10 w-full rounded-md border border-white/20 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 text-white"
          value={form.country}
          onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value, state: "" }))}
        >
          <option value="">{t({ en: "Select Country", es: "Seleccionar País", pt: "Selecionar País" })}</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {t({ en: c.nameEn, es: c.nameEs, pt: c.namePt })}
            </option>
          ))}
        </select>
        
        {(() => {
          if (selectedCountryInfo?.divisions && selectedCountryInfo.divisions.length > 0) {
            return (
              <select
                className="flex h-10 w-full rounded-md border border-white/20 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                value={form.state}
                onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))}
              >
                <option value="">
                  {selectedCountryInfo.divisionLabel ? t(selectedCountryInfo.divisionLabel) : t({ en: "Select State", es: "Seleccionar Estado", pt: "Selecionar Estado" })}
                </option>
                {selectedCountryInfo.divisions.map((d) => (
                  <option key={d.code} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            );
          }
          return (
            <Input 
              placeholder={t({ en: "State / Province", es: "Estado / Provincia", pt: "Estado / Província" })} 
              value={form.state} 
              onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))} 
            />
          );
        })()}

        <Input 
          placeholder={t({ en: "City", es: "Ciudad", pt: "Cidade" })} 
          value={form.city} 
          onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} 
        />
        <Input
          placeholder={t({ en: "Postal / ZIP code", es: "Codigo postal / ZIP", pt: "Codigo postal / ZIP" })}
          value={form.postalCode}
          onChange={(event) => setForm((prev) => ({ ...prev, postalCode: event.target.value }))}
        />
        <Input 
          placeholder={t({ en: "Address", es: "Dirección", pt: "Endereço" })} 
          value={form.address} 
          onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} 
        />
        <Input 
          placeholder={t({ en: "geoLat (optional)", es: "geoLat (opcional)", pt: "geoLat (opcional)" })} 
          value={form.geoLat} 
          onChange={(event) => setForm((prev) => ({ ...prev, geoLat: event.target.value }))} 
        />
        <Input 
          placeholder={t({ en: "geoLng (optional)", es: "geoLng (opcional)", pt: "geoLng (opcional)" })} 
          value={form.geoLng} 
          onChange={(event) => setForm((prev) => ({ ...prev, geoLng: event.target.value }))} 
        />
      </div>
    </Card>
  );
}
