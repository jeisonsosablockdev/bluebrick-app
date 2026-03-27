import type { ReactElement } from "react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
  return (
    <Card className="space-y-3">
      <p className="text-sm font-semibold text-white">{t({ en: "Location", es: "Ubicacion", pt: "Localizacao" })}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input placeholder="country" value={form.country} onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))} />
        <Input placeholder="state" value={form.state} onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))} />
        <Input placeholder="city" value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} />
        <Input placeholder="address" value={form.address} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} />
        <Input placeholder="geoLat (opcional)" value={form.geoLat} onChange={(event) => setForm((prev) => ({ ...prev, geoLat: event.target.value }))} />
        <Input placeholder="geoLng (opcional)" value={form.geoLng} onChange={(event) => setForm((prev) => ({ ...prev, geoLng: event.target.value }))} />
      </div>
    </Card>
  );
}
