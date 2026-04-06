import type { ReactElement } from "react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { COUNTRIES } from "@/lib/countries";

import type { AssetForm } from "@/components/admin/asset-creation/types";
import type { SectionT } from "@/components/admin/asset-creation/sections/section-types";

type SetStateAction<T> = T | ((prev: T) => T);

type AssetLocationSectionProps = {
  t: SectionT;
  form: AssetForm;
  setForm: (value: SetStateAction<AssetForm>) => void;
};

export function AssetLocationSection({
  t,
  form,
  setForm
}: AssetLocationSectionProps): ReactElement {
  const selectedCountryInfo = COUNTRIES.find((c) => c.code === form.country || c.nameEn === form.country);

  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-semibold text-white">{t({ en: "Location", es: "Ubicacion", pt: "Localizacao" })}</p>
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
