import type { ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import type { CollectionBootstrapDocumentItem, CollectionBootstrapImageItem } from "@/lib/admin/collection-bootstrap-mapper";
import type { AdminCollectionContentRecord } from "@/lib/admin/collection-content-repository";
import type { AdminCollectionOwnership } from "@/lib/admin/collection-ownership";
import { localize, type AppLocale } from "@/lib/i18n";

type AdminCollectionDetailShellProps = {
  locale: AppLocale;
  ownership: AdminCollectionOwnership;
  content: AdminCollectionContentRecord;
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

function formatDocumentTag(locale: AppLocale, tag: CollectionBootstrapDocumentItem["tag"]): string {
  switch (tag) {
    case "brochure":
      return localize(locale, { en: "Brochure", es: "Brochure", pt: "Brochura" });
    case "legal":
      return localize(locale, { en: "Legal", es: "Legal", pt: "Legal" });
    case "financial":
      return localize(locale, { en: "Financial", es: "Financiero", pt: "Financeiro" });
    case "title-report":
      return localize(locale, { en: "Title report", es: "Title report", pt: "Title report" });
    case "appraisal":
      return localize(locale, { en: "Appraisal", es: "Avaluo", pt: "Avaliacao" });
    case "lease":
      return localize(locale, { en: "Lease", es: "Lease", pt: "Lease" });
    case "agreement":
      return localize(locale, { en: "Agreement", es: "Acuerdo", pt: "Acordo" });
    case "inspection":
      return localize(locale, { en: "Inspection", es: "Inspeccion", pt: "Inspecao" });
    case "tax":
      return localize(locale, { en: "Tax", es: "Impuestos", pt: "Impostos" });
    case "insurance":
      return localize(locale, { en: "Insurance", es: "Seguro", pt: "Seguro" });
    case "permit":
      return localize(locale, { en: "Permit", es: "Permiso", pt: "Permissao" });
    case "floor-plan":
      return localize(locale, { en: "Floor plan", es: "Plano", pt: "Planta" });
    default:
      return localize(locale, { en: "Other", es: "Otro", pt: "Outro" });
  }
}

function SectionShell({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactElement;
}): ReactElement {
  return (
    <Card className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-white/45">{eyebrow}</p>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="max-w-3xl text-sm leading-6 text-white/70">{description}</p>
          </div>
          <span className="inline-flex min-h-9 items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/65">
            {eyebrow}
          </span>
        </div>
      </div>
      {children}
    </Card>
  );
}

function MetaStat({
  label,
  value
}: {
  label: string;
  value: string;
}): ReactElement {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</p>
      <p className="mt-2 break-all text-sm text-white/85">{value}</p>
    </div>
  );
}

function EmptySectionState({
  message
}: {
  message: string;
}): ReactElement {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-4 text-sm text-white/60">
      {message}
    </div>
  );
}

function TextSectionContent({
  value,
  emptyMessage
}: {
  value: string | null;
  emptyMessage: string;
}): ReactElement {
  if (!value) {
    return <EmptySectionState message={emptyMessage} />;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm leading-7 text-white/85">
      {value}
    </div>
  );
}

function ImageRail({
  locale,
  title,
  items,
  emptyMessage
}: {
  locale: AppLocale;
  title: string;
  items: CollectionBootstrapImageItem[];
  emptyMessage: string;
}): ReactElement {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <span className="text-xs text-white/45">
          {localize(locale, {
            en: `${items.length} items`,
            es: `${items.length} items`,
            pt: `${items.length} itens`
          })}
        </span>
      </div>
      {items.length === 0 ? (
        <EmptySectionState message={emptyMessage} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-black/10">
              <div className="relative aspect-[4/3] bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_50%),linear-gradient(165deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]">
                <Image
                  alt={item.alt}
                  className="h-full w-full object-cover"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  src={item.url}
                />
              </div>
              <div className="space-y-1 p-3">
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="text-xs text-white/45">
                  {localize(locale, { en: "Source", es: "Fuente", pt: "Fonte" })}: {item.source}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentsList({
  locale,
  items
}: {
  locale: AppLocale;
  items: CollectionBootstrapDocumentItem[];
}): ReactElement {
  if (items.length === 0) {
    return (
      <EmptySectionState
        message={localize(locale, {
          en: "No documents were linked yet. The editor slice will mount document controls here next.",
          es: "Aun no hay documentos vinculados. El siguiente slice montara aqui los controles de documentos.",
          pt: "Ainda nao ha documentos vinculados. O proximo slice montara aqui os controles de documentos."
        })}
      />
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/10 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex min-h-8 items-center rounded-full border border-white/15 bg-white/5 px-3 text-xs text-white/70">
                {formatDocumentTag(locale, item.tag)}
              </span>
              <span className="inline-flex min-h-8 items-center rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs text-white/45">
                {item.source}
              </span>
            </div>
            <p className="text-sm font-semibold text-white">{item.label}</p>
            <p className="text-sm text-white/65">{item.description || item.title}</p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/85 transition-all hover:bg-white/15"
            href={item.url}
            rel="noreferrer"
            target="_blank"
          >
            {localize(locale, { en: "Open document", es: "Abrir documento", pt: "Abrir documento" })}
          </Link>
        </div>
      ))}
    </div>
  );
}

export function AdminCollectionDetailShell({
  locale,
  ownership,
  content
}: AdminCollectionDetailShellProps): ReactElement {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-0">
        <div className="grid gap-0 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="border-b border-white/10 p-5 sm:p-6 xl:border-b-0 xl:border-r">
            <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-3">
                <div className="relative aspect-[16/10] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.2),transparent_50%),linear-gradient(165deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]">
                  {content.coverImageUrl ? (
                    <Image
                      alt={localize(locale, {
                        en: `${content.title} cover`,
                        es: `Caratula de ${content.title}`,
                        pt: `Capa de ${content.title}`
                      })}
                      className="h-full w-full object-cover"
                      fill
                      sizes="(max-width: 1024px) 100vw, 540px"
                      src={content.coverImageUrl}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/70">
                      {localize(locale, {
                        en: "Cover is sourced from on-chain metadata.",
                        es: "La caratula se obtiene desde metadata on-chain.",
                        pt: "A capa e obtida da metadata on-chain."
                      })}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex min-h-9 items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                    {localize(locale, { en: "Managed from Candy Machine", es: "Gestionado desde Candy Machine", pt: "Gerenciado pela Candy Machine" })}
                  </span>
                  <span className="inline-flex min-h-9 items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/65">
                    {localize(locale, { en: "Read-only cover", es: "Caratula read-only", pt: "Capa read-only" })}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                    {localize(locale, { en: "Collection detail shell", es: "Shell de detalle de coleccion", pt: "Shell de detalhe da colecao" })}
                  </p>
                  <h2 className="text-2xl font-semibold text-white sm:text-3xl">{content.title}</h2>
                  <p className="text-sm leading-6 text-white/70">
                    {localize(locale, {
                      en: "This shell separates immutable blockchain-derived cover and metadata from the editable sections that will mount in later slices.",
                      es: "Este shell separa la caratula y metadata inmutables derivadas de blockchain de las secciones editables que se montaran en slices posteriores.",
                      pt: "Este shell separa a capa e a metadata imutaveis derivadas do blockchain das secoes editaveis que serao montadas em slices posteriores."
                    })}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <MetaStat
                    label={localize(locale, { en: "Updated", es: "Actualizado", pt: "Atualizado" })}
                    value={formatDate(locale, content.updatedAt)}
                  />
                  <MetaStat
                    label={localize(locale, { en: "Snapshot", es: "Snapshot", pt: "Snapshot" })}
                    value={`${ownership.snapshotVerificationStatus} / ${ownership.snapshotMarketplaceHandoffStatus}`}
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                    {localize(locale, { en: "Mounting plan", es: "Plan de montaje", pt: "Plano de montagem" })}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      localize(locale, { en: "Summary editor", es: "Editor de resumen", pt: "Editor de resumo" }),
                      localize(locale, { en: "Property info editor", es: "Editor de property info", pt: "Editor de property info" }),
                      localize(locale, { en: "Gallery tabs", es: "Tabs de galeria", pt: "Tabs de galeria" }),
                      localize(locale, { en: "Documents editor", es: "Editor de documentos", pt: "Editor de documentos" })
                    ].map((label) => (
                      <span key={label} className="inline-flex min-h-8 items-center rounded-full border border-white/15 bg-white/5 px-3 text-xs text-white/70">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">
              {localize(locale, { en: "Read-only metadata", es: "Metadata read-only", pt: "Metadata read-only" })}
            </p>
            <MetaStat
              label={localize(locale, { en: "Collection", es: "Coleccion", pt: "Colecao" })}
              value={ownership.collectionAddress}
            />
            <MetaStat
              label={localize(locale, { en: "Candy machine", es: "Candy machine", pt: "Candy machine" })}
              value={ownership.candyMachineAddress}
            />
            <MetaStat
              label={localize(locale, { en: "Snapshot draft", es: "Snapshot draft", pt: "Snapshot draft" })}
              value={ownership.snapshotDraftId}
            />
          </div>
        </div>
      </Card>

      <SectionShell
        description={localize(locale, {
          en: "Long-form commercial narrative stays in its own module so the future summary editor can mount here without disturbing the page shell.",
          es: "La narrativa comercial larga vive en su propio modulo para que el futuro editor de resumen se monte aqui sin perturbar el shell.",
          pt: "A narrativa comercial longa vive em seu proprio modulo para que o futuro editor de resumo seja montado aqui sem perturbar o shell."
        })}
        eyebrow={localize(locale, { en: "Section scaffold", es: "Scaffold de seccion", pt: "Scaffold de secao" })}
        title={localize(locale, { en: "Fractional investment summary", es: "Fractional investment summary", pt: "Fractional investment summary" })}
      >
        <TextSectionContent
          emptyMessage={localize(locale, {
            en: "No summary content was persisted yet. The editor slice will mount save/cancel controls here next.",
            es: "Aun no se persistio contenido de resumen. El siguiente slice montara aqui los controles save/cancel.",
            pt: "Ainda nao foi persistido conteudo de resumo. O proximo slice montara aqui os controles save/cancel."
          })}
          value={content.fractionalInvestmentSummary}
        />
      </SectionShell>

      <SectionShell
        description={localize(locale, {
          en: "Property information stays isolated so the future text editor can reuse the same layout and status surface.",
          es: "La informacion de propiedad queda aislada para que el futuro editor de texto reutilice el mismo layout y superficie de estado.",
          pt: "A informacao da propriedade fica isolada para que o futuro editor de texto reutilize o mesmo layout e superficie de estado."
        })}
        eyebrow={localize(locale, { en: "Section scaffold", es: "Scaffold de seccion", pt: "Scaffold de secao" })}
        title={localize(locale, { en: "Property information", es: "Property information", pt: "Property information" })}
      >
        <TextSectionContent
          emptyMessage={localize(locale, {
            en: "No property information was persisted yet. This block is ready for the dedicated editor slice.",
            es: "Aun no se persistio property information. Este bloque ya esta listo para el slice del editor dedicado.",
            pt: "Ainda nao foi persistida a property information. Este bloco ja esta pronto para o slice do editor dedicado."
          })}
          value={content.propertyInformation}
        />
      </SectionShell>

      <SectionShell
        description={localize(locale, {
          en: "The gallery area stays split between marketplace gallery and property imagery, preserving the approved data model before upload/edit interactions arrive.",
          es: "La zona de galeria se mantiene separada entre marketplace gallery y property imagery, preservando el modelo aprobado antes de que lleguen las interacciones de upload/edicion.",
          pt: "A area de galeria permanece separada entre marketplace gallery e property imagery, preservando o modelo aprovado antes da chegada das interacoes de upload/edicao."
        })}
        eyebrow={localize(locale, { en: "Section scaffold", es: "Scaffold de seccion", pt: "Scaffold de secao" })}
        title={localize(locale, { en: "Project gallery", es: "Project gallery", pt: "Project gallery" })}
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <ImageRail
            emptyMessage={localize(locale, {
              en: "No gallery images are available yet.",
              es: "Aun no hay gallery images disponibles.",
              pt: "Ainda nao ha gallery images disponiveis."
            })}
            items={content.galleryImages}
            locale={locale}
            title={localize(locale, { en: "Gallery images", es: "Gallery images", pt: "Gallery images" })}
          />
          <ImageRail
            emptyMessage={localize(locale, {
              en: "No property images are available yet.",
              es: "Aun no hay property images disponibles.",
              pt: "Ainda nao ha property images disponiveis."
            })}
            items={content.propertyImages}
            locale={locale}
            title={localize(locale, { en: "Property images", es: "Property images", pt: "Property images" })}
          />
        </div>
      </SectionShell>

      <SectionShell
        description={localize(locale, {
          en: "Documents stay rendered in a stable read-only list so the later editor can focus on mutation flows instead of rebuilding layout and metadata presentation.",
          es: "Los documentos quedan renderizados en una lista read-only estable para que el editor posterior se enfoque en los flujos de mutacion y no en rehacer layout y metadata.",
          pt: "Os documentos permanecem renderizados em uma lista read-only estavel para que o editor posterior foque nos fluxos de mutacao e nao em reconstruir layout e metadata."
        })}
        eyebrow={localize(locale, { en: "Section scaffold", es: "Scaffold de seccion", pt: "Scaffold de secao" })}
        title={localize(locale, { en: "Documents", es: "Documents", pt: "Documents" })}
      >
        <DocumentsList items={content.documents} locale={locale} />
      </SectionShell>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradientPrimary px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:opacity-95"
          href="/admin/collections"
        >
          {localize(locale, { en: "Back to collections", es: "Volver a colecciones", pt: "Voltar para colecoes" })}
        </Link>
        <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-white/65">
          {localize(locale, {
            en: "Read-only shell complete. Editors mount in the next STORY-011-06 slices.",
            es: "Shell read-only completo. Los editores se montan en los siguientes slices de STORY-011-06.",
            pt: "Shell read-only completo. Os editores serao montados nos proximos slices da STORY-011-06."
          })}
        </span>
      </div>
    </div>
  );
}
