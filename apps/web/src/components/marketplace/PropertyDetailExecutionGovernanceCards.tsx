"use client";

import { Card } from "@/components/ui/card";
import { H2 } from "@/components/ui/typography";
import { useI18n } from "@/components/i18n/locale-provider";
import { formatMarketplaceDetailMonths } from "@/components/marketplace/property-detail-formatters";
import type { PropertyGovernance, PropertyProject } from "@/lib/property-service";

type PropertyDetailExecutionGovernanceCardsProps = {
  project: PropertyProject;
  governance: PropertyGovernance;
  investmentNotes: string;
};

export function PropertyDetailExecutionGovernanceCards({
  project,
  governance,
  investmentNotes
}: PropertyDetailExecutionGovernanceCardsProps) {
  const { locale, t } = useI18n();

  return (
    <>
      <Card className="marketplace-detail-card space-y-3">
        <H2 className="text-2xl text-white">{t({ en: "Execution and exit", es: "Ejecucion y salida", pt: "Execucao e saida" })}</H2>
        <div className="grid gap-2 text-sm text-slate-300">
          {project.stage ? <p>{t({ en: "Project stage", es: "Etapa del proyecto", pt: "Etapa do projeto" })}: {project.stage}</p> : null}
          {project.developerName ? <p>{t({ en: "Operator / developer", es: "Operador / desarrollador", pt: "Operador / desenvolvedor" })}: {project.developerName}</p> : null}
          {project.exitStrategy ? <p>{t({ en: "Exit strategy", es: "Estrategia de salida", pt: "Estrategia de saida" })}: {project.exitStrategy}</p> : null}
          <p>{t({ en: "Duration", es: "Duracion", pt: "Duracao" })}: {formatMarketplaceDetailMonths(project.durationMonths, locale)}</p>
        </div>
      </Card>

      <Card className="marketplace-detail-card space-y-3">
        <H2 className="text-2xl text-white">{t({ en: "Transparency and governance", es: "Transparencia y gobernanza", pt: "Transparencia e governanca" })}</H2>
        <p className="text-sm text-slate-300">
          {governance.riskNotes || investmentNotes}
        </p>
      </Card>
    </>
  );
}
