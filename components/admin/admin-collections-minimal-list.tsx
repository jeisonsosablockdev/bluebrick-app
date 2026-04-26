import type { ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";

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

function getLocationLabel(locale: AppLocale): string {
  return localize(locale, {
    en: "Location unavailable",
    es: "Ubicacion no disponible",
    pt: "Localizacao indisponivel"
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

function StateActionLink({
  href,
  children,
  variant = "primary"
}: {
  href: string;
  children: string;
  variant?: "primary" | "outline";
}): ReactElement {
  const variantClass = variant === "primary"
    ? "bg-gradientPrimary text-white shadow-glow hover:opacity-95"
    : "border border-white/25 text-white hover:bg-white/10";

  return (
    <a
      className={`inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-all sm:w-auto ${variantClass}`}
      href={href}
    >
      {children}
    </a>
  );
}

function StatePanel({
  eyebrow,
  title,
  description,
  tone,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  tone: "empty" | "error";
  children: ReactElement;
}): ReactElement {
  const orbClass = tone === "error"
    ? "border-rose-300/30 bg-rose-400/10 text-rose-100"
    : "border-sky-300/30 bg-sky-400/10 text-sky-100";

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-0 md:grid-cols-[0.9fr_1.1fr]">
        <div className="relative min-h-48 border-b border-white/10 bg-[radial-gradient(circle_at_35%_25%,rgba(56,189,248,0.18),transparent_35%),linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5 md:border-b-0 md:border-r">
          <div className="absolute inset-x-5 bottom-5 top-5 rounded-[2rem] border border-white/10 bg-black/10" />
          <div className={`relative flex h-full min-h-36 items-center justify-center rounded-[2rem] border text-center ${orbClass}`}>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/50">{eyebrow}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{tone === "error" ? "!" : "0"}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-5 p-5 sm:p-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">{eyebrow}</p>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <p className="max-w-2xl text-sm leading-6 text-white/70">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </Card>
  );
}

function EditableSectionPill({
  locale,
  section
}: {
  locale: AppLocale;
  section: string;
}): ReactElement {
  const label = section === "propertyInformation"
    ? localize(locale, { en: "Property info", es: "Info de propiedad", pt: "Info da propriedade" })
    : section === "summary"
      ? localize(locale, { en: "Summary", es: "Resumen", pt: "Resumo" })
      : section === "gallery"
        ? localize(locale, { en: "Gallery", es: "Galeria", pt: "Galeria" })
        : section === "documents"
          ? localize(locale, { en: "Documents", es: "Documentos", pt: "Documentos" })
          : section;

  return (
    <span className="inline-flex min-h-8 items-center rounded-full border border-white/15 bg-white/5 px-3 text-xs font-medium text-white/80">
      {label}
    </span>
  );
}

function SuccessCardAction({
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

export function AdminCollectionsMinimalList({
  locale,
  state
}: AdminCollectionsMinimalListProps): ReactElement {
  if (state.kind === "error") {
    return (
      <div aria-live="assertive">
        <StatePanel
          eyebrow={localize(locale, { en: "Degraded state", es: "Estado degradado", pt: "Estado degradado" })}
          title={localize(locale, {
            en: "Collections workspace unavailable",
            es: "Workspace de colecciones no disponible",
            pt: "Workspace de colecoes indisponivel"
          })}
          description={localize(locale, {
            en: "The server-side collection contract did not return a usable response. No client state is trusted here, so retry after the admin session or API is healthy.",
            es: "El contrato server-side de colecciones no devolvio una respuesta usable. Aqui no se confia en estado del cliente, asi que reintenta cuando la sesion admin o la API esten saludables.",
            pt: "O contrato server-side de colecoes nao retornou uma resposta utilizavel. Nenhum estado do cliente e confiado aqui, entao tente novamente quando a sessao admin ou a API estiverem saudaveis."
          })}
          tone="error"
        >
          <div className="space-y-4">
            <p className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">
              {state.message}
            </p>
            <StateActionLink href="/admin/collections" variant="outline">
              {localize(locale, { en: "Retry loading", es: "Reintentar carga", pt: "Tentar novamente" })}
            </StateActionLink>
          </div>
        </StatePanel>
      </div>
    );
  }

  if (state.kind === "empty") {
    return (
      <div aria-live="polite">
        <StatePanel
          eyebrow={localize(locale, { en: "Empty state", es: "Estado vacio", pt: "Estado vazio" })}
          title={localize(locale, {
            en: "No owned collections found",
            es: "No se encontraron colecciones propias",
            pt: "Nenhuma colecao propria encontrada"
          })}
          description={localize(locale, {
            en: "Deploy or link a collection before this workspace can expose editable content. Once a collection is owned and indexed, it will appear here with its snapshot and edit readiness.",
            es: "Despliega o vincula una coleccion antes de que este workspace pueda exponer contenido editable. Cuando una coleccion este owned e indexada, aparecera aqui con su snapshot y readiness de edicion.",
            pt: "Implante ou vincule uma colecao antes que este workspace exponha conteudo editavel. Quando uma colecao estiver owned e indexada, aparecera aqui com seu snapshot e readiness de edicao."
          })}
          tone="empty"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <StateActionLink href="/admin/assets/new">
              {localize(locale, { en: "Start a collection", es: "Crear coleccion", pt: "Criar colecao" })}
            </StateActionLink>
            <StateActionLink href="/admin/mint" variant="outline">
              {localize(locale, { en: "Review mint tools", es: "Revisar herramientas mint", pt: "Revisar ferramentas mint" })}
            </StateActionLink>
          </div>
        </StatePanel>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">
            {localize(locale, {
              en: "Collections dashboard",
              es: "Dashboard de colecciones",
              pt: "Dashboard de colecoes"
            })}
          </p>
          <h3 className="text-sm font-semibold text-white">
            {localize(locale, {
              en: "Owned projects workspace",
              es: "Workspace de proyectos propios",
              pt: "Workspace de projetos proprios"
            })}
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
            en: "Collection cards",
            es: "Cards de colecciones",
            pt: "Cards de colecoes"
          })}
        </h3>
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {state.collections.map((collection) => (
            <li key={collection.entryId} className="overflow-hidden rounded-2xl border border-white/10 bg-black/10">
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
                  <p className="text-xs text-white/60">{getLocationLabel(locale)}</p>
                  <p className="text-xs text-white/50">
                    {localize(locale, { en: "Updated", es: "Actualizada", pt: "Atualizada" })}:{" "}
                    {formatDate(locale, collection.updatedAt)}
                  </p>
                </div>

                <div className="grid gap-2 text-xs text-white/70">
                  <p className="break-all rounded-xl border border-white/10 bg-white/5 px-3 py-2">
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
                  <p className="break-all rounded-xl border border-white/10 bg-white/5 px-3 py-2">
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
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.14em] text-white/45">
                    {localize(locale, {
                      en: "Editable sections",
                      es: "Secciones editables",
                      pt: "Secoes editaveis"
                    })}
                  </p>
                  {collection.editableSections.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {collection.editableSections.map((section) => (
                        <EditableSectionPill key={`${collection.entryId}-${section}`} locale={locale} section={section} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/60">{getEditableSectionsLabel(locale, collection.editableSections)}</p>
                  )}
                </div>

                <SuccessCardAction
                  canManage={collection.validationState === "linked"}
                  entryId={collection.entryId}
                  locale={locale}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
