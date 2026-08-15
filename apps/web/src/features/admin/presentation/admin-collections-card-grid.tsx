import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";

import { Card } from "@/components/ui/card";
import { formatAdminDate } from "@/features/admin/presentation/admin-collection-view-format";
import type { AdminCollectionEditableSection, AdminCollectionValidationState } from "@/lib/admin/collections-read-model";
import type { AdminCollectionsPageState } from "@/lib/admin/collections-page-state";
import { localize, type AppLocale } from "@/lib/i18n";

type AdminCollectionsSuccessState = Extract<AdminCollectionsPageState, { kind: "success" }>;

type CollectionCardGridProps = {
  locale: AppLocale;
  state: AdminCollectionsSuccessState;
};

function SummaryTile({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}): ReactElement {
  return (
    <div className="rounded-xl border border-white/10 bg-black/10 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/55">{detail}</p>
    </div>
  );
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

function getEditableSectionLabel(locale: AppLocale, section: AdminCollectionEditableSection): string {
  switch (section) {
    case "propertyInformation":
      return localize(locale, { en: "Property info", es: "Info de propiedad", pt: "Info da propriedade" });
    case "summary":
      return localize(locale, { en: "Summary", es: "Resumen", pt: "Resumo" });
    case "gallery":
      return localize(locale, { en: "Gallery", es: "Galeria", pt: "Galeria" });
    case "documents":
      return localize(locale, { en: "Documents", es: "Documentos", pt: "Documentos" });
  }
}

function getEditableSectionsSummary(locale: AppLocale, sections: AdminCollectionEditableSection[]): string {
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

function getUnavailableLocationLabel(locale: AppLocale): string {
  return localize(locale, {
    en: "Location unavailable",
    es: "Ubicacion no disponible",
    pt: "Localizacao indisponivel"
  });
}

function EditableSectionPill({
  locale,
  section
}: {
  locale: AppLocale;
  section: AdminCollectionEditableSection;
}): ReactElement {
  return (
    <span className="inline-flex min-h-8 items-center rounded-full border border-white/15 bg-white/5 px-3 text-xs font-medium text-white/80">
      {getEditableSectionLabel(locale, section)}
    </span>
  );
}

function CollectionCardAction({
  locale,
  entryId,
  canManage
}: {
  locale: AppLocale;
  entryId: string;
  canManage: boolean;
}): ReactElement {
  if (canManage) {
    return (
      <Link
        className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white/85 transition-all hover:bg-white/15"
        href={`/admin/collections/${entryId}`}
      >
        {localize(locale, { en: "Manage project", es: "Gestionar proyecto", pt: "Gerenciar projeto" })}
      </Link>
    );
  }

  return (
    <button
      className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/45 transition-all"
      disabled
      title={localize(locale, {
        en: "This entry stays blocked here until the health/manual review flow is available.",
        es: "Esta entry queda bloqueada aqui hasta que exista el flujo de salud/revision manual.",
        pt: "Esta entrada permanece bloqueada aqui ate existir o fluxo de saude/revisao manual."
      })}
      type="button"
    >
      {localize(locale, { en: "Needs review", es: "Requiere revision", pt: "Requer revisao" })}
    </button>
  );
}

function CollectionCard({
  locale,
  collection
}: {
  locale: AppLocale;
  collection: AdminCollectionsSuccessState["collections"][number];
}): ReactElement {
  const canManage = collection.validationState === "linked";

  return (
    <li className="rounded-2xl border border-white/10 bg-black/10 p-3">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="grid gap-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center">
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.2),transparent_50%),linear-gradient(165deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]">
            {collection.coverImageUrl ? (
              <Image
                alt={localize(locale, {
                  en: `${collection.title} cover`,
                  es: `Caratula de ${collection.title}`,
                  pt: `Capa de ${collection.title}`
                })}
                className="h-full w-full object-cover"
                fill
                sizes="(max-width: 640px) 100vw, 144px"
                src={collection.coverImageUrl}
              />
            ) : (
              <div className="flex h-full items-center justify-center px-4 text-center text-xs text-white/70">
                {localize(locale, {
                  en: "Cover pending",
                  es: "Caratula pendiente",
                  pt: "Capa pendente"
                })}
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="min-w-0 text-base font-semibold text-white">{collection.title}</p>
              <span
                className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-xs font-medium ${getValidationBadgeClass(collection.validationState)}`}
              >
                {getValidationLabel(locale, collection.validationState)}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/55">
              <span>{getUnavailableLocationLabel(locale)}</span>
              <span>
                {localize(locale, { en: "Updated", es: "Actualizada", pt: "Atualizada" })}:{" "}
                {formatAdminDate(locale, collection.updatedAt)}
              </span>
            </div>
            <div className="grid gap-2 text-xs text-white/70 xl:grid-cols-2">
              <p className="min-w-0 break-all rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <span className="text-white/45">
                  {localize(locale, { en: "Collection", es: "Coleccion", pt: "Colecao" })}:
                </span>{" "}
                {collection.collectionAddress}
              </p>
              <p className="min-w-0 break-all rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <span className="text-white/45">
                  {localize(locale, { en: "Candy machine", es: "Candy machine", pt: "Candy machine" })}:
                </span>{" "}
                {collection.candyMachineAddress}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:w-56">
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {collection.editableSections.length > 0 ? (
              collection.editableSections.map((section) => (
                <EditableSectionPill key={`${collection.entryId}-${section}`} locale={locale} section={section} />
              ))
            ) : (
              <p className="text-xs text-white/60">{getEditableSectionsSummary(locale, collection.editableSections)}</p>
            )}
          </div>
          <CollectionCardAction canManage={canManage} entryId={collection.entryId} locale={locale} />
        </div>
      </div>
    </li>
  );
}

function HealthQueueInline({
  locale,
  state
}: {
  locale: AppLocale;
  state: AdminCollectionsSuccessState;
}): ReactElement | null {
  if (!state.healthQueueHref) {
    return null;
  }

  return (
    <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="space-y-1">
          <span
            className="inline-flex min-h-8 items-center rounded-full border border-amber-300/25 bg-black/10 px-3 py-1 text-xs font-medium text-amber-100"
          >
            {localize(locale, {
              en: `${state.summary.reviewRequired} needs review`,
              es: `${state.summary.reviewRequired} necesita revision`,
              pt: `${state.summary.reviewRequired} precisa revisao`
            })}
          </span>
          <p className="text-sm text-amber-50/75">
            {localize(locale, {
              en: "Review rows stay outside the editable list until health checks clear them.",
              es: "Las filas en revision quedan fuera de la lista editable hasta que health las libere.",
              pt: "Linhas em revisao ficam fora da lista editavel ate health libera-las."
            })}
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-amber-200/30 bg-black/10 px-5 py-2.5 text-sm font-semibold text-amber-50 transition-all hover:bg-black/20"
          href={state.healthQueueHref}
        >
          {localize(locale, {
            en: "Open health queue",
            es: "Abrir cola health",
            pt: "Abrir fila health"
          })}
        </Link>
      </div>
    </div>
  );
}

export function AdminCollectionsCardGrid({
  locale,
  state
}: CollectionCardGridProps): ReactElement {
  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">
              {localize(locale, { en: "Operations console", es: "Consola operacional", pt: "Console operacional" })}
            </p>
            <h3 className="text-lg font-semibold text-white">
              {localize(locale, { en: "Ready to edit", es: "Listas para editar", pt: "Prontas para editar" })}
            </h3>
            <p className="max-w-3xl text-sm leading-6 text-white/70">
              {localize(locale, {
                en: "Linked collections stay in the editable list. Rows that need review move to health without changing the server-side ownership rules.",
                es: "Las colecciones vinculadas quedan en la lista editable. Las filas que necesitan revision pasan a health sin cambiar reglas server-side de ownership.",
                pt: "Colecoes vinculadas ficam na lista editavel. Linhas que precisam revisao vao para health sem mudar regras server-side de ownership."
              })}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[25rem]">
            <SummaryTile
              detail={localize(locale, { en: "Owned rows", es: "Filas propias", pt: "Linhas proprias" })}
              label={localize(locale, { en: "Total", es: "Total", pt: "Total" })}
              value={String(state.summary.total)}
            />
            <SummaryTile
              detail={localize(locale, { en: "Editable", es: "Editables", pt: "Editaveis" })}
              label={localize(locale, { en: "Ready", es: "Listas", pt: "Prontas" })}
              value={String(state.summary.linked)}
            />
            <SummaryTile
              detail={localize(locale, { en: "In health", es: "En health", pt: "Em health" })}
              label={localize(locale, { en: "Review", es: "Revision", pt: "Revisao" })}
              value={String(state.summary.reviewRequired)}
            />
          </div>
        </div>

        <HealthQueueInline locale={locale} state={state} />

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">
            {localize(locale, { en: "Editable collections", es: "Colecciones editables", pt: "Colecoes editaveis" })}
          </p>
          {state.collections.length > 0 ? (
            <ul className="grid gap-3">
              {state.collections.map((collection) => (
                <CollectionCard key={collection.entryId} collection={collection} locale={locale} />
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              {localize(locale, {
                en: "No ready collections remain in the editable workspace. Review the health queue to inspect degraded rows.",
                es: "No quedan colecciones listas en el workspace editable. Revisa la cola health para inspeccionar filas degradadas.",
                pt: "Nao restam colecoes prontas no workspace editavel. Revise a fila health para inspecionar linhas degradadas."
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
