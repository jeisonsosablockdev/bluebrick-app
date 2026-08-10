import type { ReactElement } from "react";

import { Card } from "@/components/ui/card";

import type { SectionT } from "@/components/admin/asset-creation/sections/section-types";

type AssetCreationIntroSectionProps = {
  t: SectionT;
};

export function AssetCreationIntroSection({ t }: AssetCreationIntroSectionProps): ReactElement {
  return (
    <Card className="space-y-2">
      <h2 className="text-lg font-semibold text-white">{t({ en: "Create tokenizable asset", es: "Crear activo tokenizable", pt: "Criar ativo tokenizavel" })}</h2>
      <p className="text-sm text-white/75">
        {t({
          en: "Create the master asset record. Rule: one collection per asset, and mint cannot be enabled without a defined asset.",
          es: "Crea el registro maestro del activo. Regla: una coleccion por activo y no se habilita mint sin activo definido.",
          pt: "Crie o registro mestre do ativo. Regra: uma colecao por ativo, e o mint nao e habilitado sem ativo definido."
        })}
      </p>
    </Card>
  );
}
