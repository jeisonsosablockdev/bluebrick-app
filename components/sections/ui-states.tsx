"use client";

import { useI18n } from "@/components/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { H2, Lead } from "@/components/ui/typography";

export function UiStatesSection() {
  const { t } = useI18n();

  return (
    <section className="py-12">
      <div className="mb-7 text-center">
        <H2 className="text-white">{t({ en: "UI States", es: "Estados de UI", pt: "Estados de UI" })}</H2>
        <Lead className="mx-auto mt-2 max-w-xl">
          {t({
            en: "Visual states ready to connect with real data.",
            es: "Visuales listos para integrar con datos reales mas adelante.",
            pt: "Estados visuais prontos para integrar com dados reais."
          })}
        </Lead>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="mb-3 text-sm font-semibold text-cyan-300">{t({ en: "Loading", es: "Cargando", pt: "Carregando" })}</p>
          <div className="space-y-2">
            <div className="h-4 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
            <div className="h-20 animate-pulse rounded bg-white/10" />
          </div>
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold text-cyan-300">{t({ en: "Empty", es: "Vacio", pt: "Vazio" })}</p>
          <div className="rounded-xl border border-dashed border-white/20 p-4 text-sm text-slate-300">
            {t({
              en: "There are no available items to show right now.",
              es: "No hay elementos disponibles para mostrar en este momento.",
              pt: "Nao ha itens disponiveis para mostrar neste momento."
            })}
          </div>
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold text-cyan-300">{t({ en: "Error", es: "Error", pt: "Erro" })}</p>
          <div className="rounded-xl border border-red-300/35 bg-red-500/10 p-4 text-sm text-red-200">
            {t({
              en: "An error occurred while loading data. Please try again later.",
              es: "Ocurrio un error al cargar datos. Intentalo de nuevo mas tarde.",
              pt: "Ocorreu um erro ao carregar os dados. Tente novamente mais tarde."
            })}
          </div>
        </Card>
      </div>
    </section>
  );
}
