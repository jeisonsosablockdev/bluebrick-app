import type { ReactElement } from "react";

import { Card } from "@/components/ui/card";
import type { AdminCollectionsPageState } from "@/lib/admin/collections-page-state";
import type { AdminCollectionValidationState } from "@/lib/admin/collections-read-model";
import { localize, type AppLocale } from "@/lib/i18n";

type AdminCollectionsMinimalListProps = {
  locale: AppLocale;
  state: AdminCollectionsPageState;
};

function formatDate(locale: AppLocale, value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(parsed);
}

function getValidationBadgeClass(validationState: AdminCollectionValidationState): string {
  switch (validationState) {
    case "linked":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
    case "missing_snapshot":
      return "border-amber-400/30 bg-amber-400/10 text-amber-200";
    case "inconsistent":
      return "border-rose-400/30 bg-rose-400/10 text-rose-200";
    default:
      return "border-white/15 bg-white/5 text-white/70";
  }
}

function getValidationLabel(locale: AppLocale, validationState: AdminCollectionValidationState): string {
  switch (validationState) {
    case "linked":
      return localize(locale, { en: "Ready", es: "Lista", pt: "Pronta" });
    case "missing_snapshot":
      return localize(locale, { en: "Missing snapshot", es: "Falta snapshot", pt: "Snapshot ausente" });
    case "inconsistent":
      return localize(locale, { en: "Needs review", es: "Requiere revision", pt: "Requer revisao" });
    case "orphaned":
      return localize(locale, { en: "Orphaned", es: "Huerfana", pt: "Orfa" });
    default:
      return validationState;
  }
}

function getEditableSectionsLabel(locale: AppLocale, sections: string[]): string {
  if (sections.length === 0) {
    return localize(locale, {
      en: "Not editable in this validation state.",
      es: "No editable en este estado de validacion.",
      pt: "Nao editavel neste estado de validacao."
    });
  }

  return localize(locale, {
    en: `Editable sections: ${sections.join(", ")}`,
    es: `Secciones editables: ${sections.join(", ")}`,
    pt: `Secoes editaveis: ${sections.join(", ")}`
  });
}

function SummaryTile({
  label,
  value
}: {
  label: string;
  value: string;
}): ReactElement {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

export function AdminCollectionsMinimalList({
  locale,
  state
}: AdminCollectionsMinimalListProps): ReactElement {
  if (state.kind === "error") {
    return (
      <Card className="space-y-2">
        <h3 className="text-sm font-semibold text-white">
          {localize(locale, {
            en: "Collections could not be loaded",
            es: "No se pudieron cargar las colecciones",
            pt: "Nao foi possivel carregar as colecoes"
          })}
        </h3>
        <p className="text-sm text-white/70">{state.message}</p>
      </Card>
    );
  }

  if (state.kind === "empty") {
    return (
      <Card className="space-y-2">
        <h3 className="text-sm font-semibold text-white">
          {localize(locale, {
            en: "No collections available yet",
            es: "Aun no hay colecciones disponibles",
            pt: "Ainda nao ha colecoes disponiveis"
          })}
        </h3>
        <p className="text-sm text-white/70">
          {localize(locale, {
            en: "This admin wallet does not have linked marketplace collections yet.",
            es: "Esta wallet admin todavia no tiene colecciones de marketplace vinculadas.",
            pt: "Esta wallet admin ainda nao possui colecoes de marketplace vinculadas."
          })}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-white">
            {localize(locale, {
              en: "Contract handoff",
              es: "Handoff del contrato",
              pt: "Handoff do contrato"
            })}
          </h3>
          <p className="text-sm text-white/70">
            {localize(locale, {
              en: "This slice keeps rendering intentionally simple and read-only so the later index UI can refine presentation without reopening the payload contract.",
              es: "Este slice mantiene el render simple y de solo lectura para que la UI final del index refine la presentacion sin reabrir el contrato del payload.",
              pt: "Este slice mantém o render simples e somente leitura para que a UI final do index refine a apresentacao sem reabrir o contrato do payload."
            })}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryTile
            label={localize(locale, { en: "Total", es: "Total", pt: "Total" })}
            value={String(state.summary.total)}
          />
          <SummaryTile
            label={localize(locale, { en: "Ready", es: "Listas", pt: "Prontas" })}
            value={String(state.summary.linked)}
          />
          <SummaryTile
            label={localize(locale, { en: "Review", es: "Revision", pt: "Revisao" })}
            value={String(state.summary.reviewRequired)}
          />
        </div>
      </Card>

      <Card className="space-y-3">
        <h3 className="text-sm font-semibold text-white">
          {localize(locale, {
            en: "Collections list",
            es: "Listado de colecciones",
            pt: "Lista de colecoes"
          })}
        </h3>
        <ul className="space-y-3">
          {state.collections.map((collection) => (
            <li key={collection.entryId} className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">{collection.title}</p>
                  <p className="text-xs text-white/55">
                    {localize(locale, { en: "Updated", es: "Actualizada", pt: "Atualizada" })}:{" "}
                    {formatDate(locale, collection.updatedAt)}
                  </p>
                </div>
                <span
                  className={`inline-flex min-h-11 items-center rounded-full border px-3 py-2 text-xs font-medium ${getValidationBadgeClass(collection.validationState)}`}
                >
                  {getValidationLabel(locale, collection.validationState)}
                </span>
              </div>

              <div className="mt-3 space-y-2 text-xs text-white/70">
                <p className="break-all">
                  <span className="text-white/45">
                    {localize(locale, {
                      en: "Collection",
                      es: "Coleccion",
                      pt: "Colecao"
                    })}
                    :
                  </span>{" "}
                  {collection.collectionAddress}
                </p>
                <p className="break-all">
                  <span className="text-white/45">
                    {localize(locale, {
                      en: "Candy machine",
                      es: "Candy machine",
                      pt: "Candy machine"
                    })}
                    :
                  </span>{" "}
                  {collection.candyMachineAddress}
                </p>
                <p>{getEditableSectionsLabel(locale, collection.editableSections)}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
