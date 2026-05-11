import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";

import { Card } from "@/components/ui/card";
import { formatAdminDate } from "@/components/admin/admin-collection-view-format";
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
    <li className="overflow-hidden rounded-2xl border border-white/10 bg-black/10">
      <div className="relative aspect-[16/9] border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.2),transparent_50%),linear-gradient(165deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]">
        {collection.coverImageUrl ? (
          <Image
            alt={localize(locale, {
              en: `${collection.title} cover`,
              es: `Caratula de ${collection.title}`,
              pt: `Capa de ${collection.title}`
            })}
            className="h-full w-full object-cover"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            src={collection.coverImageUrl}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/70">
            {localize(locale, {
              en: "Cover pending from on-chain metadata",
              es: "Caratula pendiente desde metadata on-chain",
              pt: "Capa pendente da metadata on-chain"
            })}
          </div>
        )}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <span
            className={`inline-flex min-h-9 items-center rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-sm ${getValidationBadgeClass(collection.validationState)}`}
          >
            {getValidationLabel(locale, collection.validationState)}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="space-y-1">
          <p className="text-base font-semibold text-white">{collection.title}</p>
          <p className="text-xs text-white/60">{getUnavailableLocationLabel(locale)}</p>
          <p className="text-xs text-white/50">
            {localize(locale, { en: "Updated", es: "Actualizada", pt: "Atualizada" })}:{" "}
            {formatAdminDate(locale, collection.updatedAt)}
          </p>
        </div>

        <div className="grid gap-2 text-xs text-white/70">
          <p className="break-all rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <span className="text-white/45">
              {localize(locale, { en: "Collection", es: "Coleccion", pt: "Colecao" })}:
            </span>{" "}
            {collection.collectionAddress}
          </p>
          <p className="break-all rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <span className="text-white/45">
              {localize(locale, { en: "Candy machine", es: "Candy machine", pt: "Candy machine" })}:
            </span>{" "}
            {collection.candyMachineAddress}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.14em] text-white/45">
            {localize(locale, { en: "Editable sections", es: "Secciones editables", pt: "Secoes editaveis" })}
          </p>
          {collection.editableSections.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {collection.editableSections.map((section) => (
                <EditableSectionPill key={`${collection.entryId}-${section}`} locale={locale} section={section} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/60">{getEditableSectionsSummary(locale, collection.editableSections)}</p>
          )}
        </div>

        <CollectionCardAction canManage={canManage} entryId={collection.entryId} locale={locale} />
      </div>
    </li>
  );
}

export function AdminCollectionsCardGrid({
  locale,
  state
}: CollectionCardGridProps): ReactElement {
  return (
    <div className="space-y-4">
      {state.healthQueueHref ? (
        <Card className="space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">
            {localize(locale, { en: "Health queue", es: "Cola health", pt: "Fila health" })}
          </p>
          <h3 className="text-sm font-semibold text-white">
            {localize(locale, {
              en: `${state.summary.reviewRequired} collection ${state.summary.reviewRequired === 1 ? "requires" : "require"} review`,
              es: `${state.summary.reviewRequired} coleccion${state.summary.reviewRequired === 1 ? "" : "es"} requiere${state.summary.reviewRequired === 1 ? "" : "n"} revision`,
              pt: `${state.summary.reviewRequired} colecao${state.summary.reviewRequired === 1 ? "" : "es"} requer${state.summary.reviewRequired === 1 ? "" : "em"} revisao`
            })}
          </h3>
          <p className="text-sm text-white/70">
            {localize(locale, {
              en: "Degraded rows now live in the dedicated health queue so the main collections workspace stays focused on ready-to-edit projects.",
              es: "Las filas degradadas ahora viven en la cola dedicada de health para que el workspace principal de colecciones permanezca enfocado en proyectos listos para editar.",
              pt: "As linhas degradadas agora vivem na fila dedicada de health para que o workspace principal de colecoes permaneça focado em projetos prontos para editar."
            })}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white/85 transition-all hover:bg-white/15"
              href={state.healthQueueHref}
            >
              {localize(locale, {
                en: "Open health queue",
                es: "Abrir cola health",
                pt: "Abrir fila health"
              })}
            </Link>
          </div>
        </Card>
      ) : null}

      <Card className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">
            {localize(locale, { en: "Collections dashboard", es: "Dashboard de colecciones", pt: "Dashboard de colecoes" })}
          </p>
          <h3 className="text-sm font-semibold text-white">
            {localize(locale, { en: "Owned projects workspace", es: "Workspace de proyectos propios", pt: "Workspace de projetos proprios" })}
          </h3>
          <p className="text-sm text-white/70">
            {localize(locale, {
              en: "Each card mirrors the approved read-model contract and highlights readiness for editing without changing ownership rules.",
              es: "Cada card refleja el contrato aprobado del read-model y destaca readiness de edicion sin cambiar reglas de ownership.",
              pt: "Cada card espelha o contrato aprovado do read-model e destaca readiness de edicao sem mudar regras de ownership."
            })}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryTile label={localize(locale, { en: "Total", es: "Total", pt: "Total" })} value={String(state.summary.total)} />
          <SummaryTile label={localize(locale, { en: "Ready", es: "Listas", pt: "Prontas" })} value={String(state.summary.linked)} />
          <SummaryTile label={localize(locale, { en: "Review", es: "Revision", pt: "Revisao" })} value={String(state.summary.reviewRequired)} />
        </div>
      </Card>

      <Card className="space-y-3">
        <h3 className="text-sm font-semibold text-white">
          {localize(locale, { en: "Collection cards", es: "Cards de colecciones", pt: "Cards de colecoes" })}
        </h3>
        {state.collections.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {state.collections.map((collection) => (
              <CollectionCard key={collection.entryId} collection={collection} locale={locale} />
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            {localize(locale, {
              en: "No ready collections remain in the editable workspace. Review the health queue to inspect degraded rows.",
              es: "No quedan colecciones listas en el workspace editable. Revisa la cola health para inspeccionar filas degradadas.",
              pt: "Nao restam colecoes prontas no workspace editavel. Revise a fila health para inspecionar linhas degradadas."
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
