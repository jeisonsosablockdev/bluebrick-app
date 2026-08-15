"use client";

import Image from "next/image";
import type { ReactElement } from "react";
import { useState } from "react";

import {
  AdminCollectionDetailEmptyState,
  AdminCollectionDetailSectionShell
} from "@/features/admin/presentation/admin-collection-detail-section-primitives";
import type { CollectionBootstrapImageItem } from "@/lib/admin/collection-bootstrap-mapper";
import type { AdminCollectionContentRecord } from "@/lib/admin/collection-content-repository";
import { localize, type AppLocale } from "@/lib/i18n";

type AdminCollectionGalleryGroupKey = "gallery" | "property";

export type AdminCollectionGalleryGroup = {
  key: AdminCollectionGalleryGroupKey;
  items: CollectionBootstrapImageItem[];
  count: number;
};

type AdminCollectionGalleryShellProps = {
  locale: AppLocale;
  content: AdminCollectionContentRecord;
};

export function buildAdminCollectionGalleryGroups(
  content: Pick<AdminCollectionContentRecord, "galleryImages" | "propertyImages">
): AdminCollectionGalleryGroup[] {
  return [
    {
      key: "gallery",
      items: content.galleryImages,
      count: content.galleryImages.length
    },
    {
      key: "property",
      items: content.propertyImages,
      count: content.propertyImages.length
    }
  ];
}

function resolveGalleryGroupLabel(locale: AppLocale, key: AdminCollectionGalleryGroupKey): string {
  if (key === "gallery") {
    return localize(locale, {
      en: "Marketplace gallery",
      es: "Galeria del marketplace",
      pt: "Galeria do marketplace"
    });
  }

  return localize(locale, {
    en: "Property imagery",
    es: "Imagenes de la propiedad",
    pt: "Imagens da propriedade"
  });
}

function resolveGalleryGroupDescription(locale: AppLocale, key: AdminCollectionGalleryGroupKey): string {
  if (key === "gallery") {
    return localize(locale, {
      en: "Commercial-facing imagery for the marketplace card and project storytelling stays in its own lane.",
      es: "Las imagenes comerciales para la card del marketplace y la narrativa del proyecto se mantienen en su propio carril.",
      pt: "As imagens comerciais para o card do marketplace e a narrativa do projeto permanecem em seu proprio trilho."
    });
  }

  return localize(locale, {
    en: "Property-specific visuals remain separate so operational imagery does not collapse into the sales gallery.",
    es: "Los visuales especificos de la propiedad siguen separados para que la evidencia operativa no se mezcle con la galeria comercial.",
    pt: "Os visuais especificos da propriedade permanecem separados para que a evidencia operacional nao se misture com a galeria comercial."
  });
}

function resolveGalleryActionCopy(locale: AppLocale, key: AdminCollectionGalleryGroupKey): {
  addLabel: string;
  replaceLabel: string;
  deleteLabel: string;
  note: string;
} {
  if (key === "gallery") {
    return {
      addLabel: localize(locale, { en: "Add gallery image", es: "Agregar imagen de galeria", pt: "Adicionar imagem da galeria" }),
      replaceLabel: localize(locale, { en: "Replace gallery image", es: "Reemplazar imagen de galeria", pt: "Substituir imagem da galeria" }),
      deleteLabel: localize(locale, { en: "Delete gallery image", es: "Eliminar imagen de galeria", pt: "Excluir imagem da galeria" }),
      note: localize(locale, {
        en: "Add, replace, and delete controls are reserved for media management and stay disabled on this page.",
        es: "Los controles de agregar, reemplazar y eliminar quedan reservados para gestion de media y permanecen desactivados en esta pagina.",
        pt: "Os controles de adicionar, substituir e excluir ficam reservados para gestao de midia e permanecem desativados nesta pagina."
      })
    };
  }

  return {
    addLabel: localize(locale, { en: "Add property image", es: "Agregar imagen de propiedad", pt: "Adicionar imagem da propriedade" }),
    replaceLabel: localize(locale, { en: "Replace property image", es: "Reemplazar imagen de propiedad", pt: "Substituir imagem da propriedade" }),
    deleteLabel: localize(locale, { en: "Delete property image", es: "Eliminar imagen de propiedad", pt: "Excluir imagem da propriedade" }),
    note: localize(locale, {
      en: "Operational media keeps its own disabled add, replace, and delete controls so review stays scoped to this tab.",
      es: "La media operativa conserva sus propios controles desactivados de agregar, reemplazar y eliminar para que la revision siga acotada a esta tab.",
      pt: "A midia operacional mantem seus proprios controles desativados de adicionar, substituir e excluir para que a revisao permaneca limitada a esta aba."
    })
  };
}

function resolveGalleryEmptyMessage(locale: AppLocale, key: AdminCollectionGalleryGroupKey): string {
  if (key === "gallery") {
    return localize(locale, {
      en: "No marketplace gallery images are linked yet.",
      es: "Aun no hay imagenes vinculadas en la galeria del marketplace.",
      pt: "Ainda nao ha imagens vinculadas na galeria do marketplace."
    });
  }

  return localize(locale, {
    en: "No property imagery is linked yet.",
    es: "Aun no hay imagenes de propiedad vinculadas.",
    pt: "Ainda nao ha imagens da propriedade vinculadas."
  });
}

function GalleryTabButton({
  locale,
  group,
  active,
  onClick
}: {
  locale: AppLocale;
  group: AdminCollectionGalleryGroup;
  active: boolean;
  onClick: () => void;
}): ReactElement {
  const label = resolveGalleryGroupLabel(locale, group.key);

  return (
    <button
      aria-controls={`gallery-panel-${group.key}`}
      aria-selected={active}
      className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
        active
          ? "border-sky-300/35 bg-sky-400/10 text-white shadow-[0_0_0_1px_rgba(125,211,252,0.15)]"
          : "border-white/10 bg-black/10 text-white/70 hover:border-white/20 hover:bg-white/[0.04]"
      }`}
      id={`gallery-tab-${group.key}`}
      onClick={onClick}
      role="tab"
      type="button"
    >
      <span className="space-y-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-white/45">{resolveGalleryGroupDescription(locale, group.key)}</span>
      </span>
      <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 px-2 text-xs font-medium text-white/70">
        {group.count}
      </span>
    </button>
  );
}

function GalleryActionStrip({
  locale,
  groupKey
}: {
  locale: AppLocale;
  groupKey: AdminCollectionGalleryGroupKey;
}): ReactElement {
  const copy = resolveGalleryActionCopy(locale, groupKey);

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-black/10 p-4">
      <div className="flex flex-wrap gap-3">
        {[copy.addLabel, copy.replaceLabel, copy.deleteLabel].map((label) => (
          <button
            key={label}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/55 opacity-80"
            disabled
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-sm leading-6 text-white/60">{copy.note}</p>
    </div>
  );
}

function GalleryImageGrid({
  locale,
  groupKey,
  items
}: {
  locale: AppLocale;
  groupKey: AdminCollectionGalleryGroupKey;
  items: CollectionBootstrapImageItem[];
}): ReactElement {
  if (items.length === 0) {
    return <AdminCollectionDetailEmptyState message={resolveGalleryEmptyMessage(locale, groupKey)} />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-black/10">
          <div className="relative aspect-[4/3] bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_50%),linear-gradient(165deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]">
            <Image
              alt={item.alt}
              className="h-full w-full object-cover"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1536px) 50vw, 33vw"
              src={item.url}
            />
          </div>
          <div className="space-y-2 p-4">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex min-h-8 items-center rounded-full border border-white/15 bg-white/5 px-3 text-xs text-white/70">
                {localize(locale, { en: "Source", es: "Fuente", pt: "Fonte" })}: {item.source}
              </span>
              <span className="inline-flex min-h-8 items-center rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs text-white/45">
                {localize(locale, {
                  en: `Order ${item.displayOrder}`,
                  es: `Orden ${item.displayOrder}`,
                  pt: `Ordem ${item.displayOrder}`
                })}
              </span>
            </div>
            <p className="text-sm font-semibold text-white">{item.title}</p>
            <p className="text-xs text-white/50">{item.fileName}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminCollectionGalleryShell({
  locale,
  content
}: AdminCollectionGalleryShellProps): ReactElement {
  const groups = buildAdminCollectionGalleryGroups(content);
  const [activeGroupKey, setActiveGroupKey] = useState<AdminCollectionGalleryGroupKey>("gallery");
  const activeGroup = groups.find((group) => group.key === activeGroupKey) ?? groups[0];

  if (!activeGroup) {
    return (
      <AdminCollectionDetailSectionShell
        description={localize(locale, {
          en: "Gallery groups are not available yet.",
          es: "Los grupos de galeria aun no estan disponibles.",
          pt: "Os grupos de galeria ainda nao estao disponiveis."
        })}
        eyebrow={localize(locale, { en: "Gallery shell", es: "Shell de galeria", pt: "Shell da galeria" })}
        title={localize(locale, { en: "Project gallery", es: "Project gallery", pt: "Project gallery" })}
      >
        <AdminCollectionDetailEmptyState
          message={localize(locale, {
            en: "No gallery groups are available for this collection.",
            es: "No hay grupos de galeria disponibles para esta coleccion.",
            pt: "Nao ha grupos de galeria disponiveis para esta colecao."
          })}
        />
      </AdminCollectionDetailSectionShell>
    );
  }

  return (
    <AdminCollectionDetailSectionShell
      aside={
        <span className="inline-flex min-h-9 items-center rounded-full border border-sky-300/25 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-100">
          {localize(locale, { en: "Media reference", es: "Referencia de media", pt: "Referencia de midia" })}
        </span>
      }
      description={localize(locale, {
        en: "Gallery media has separate lanes for marketplace imagery and property evidence.",
        es: "La media de galeria tiene carriles separados para imagenes del marketplace y evidencia de la propiedad.",
        pt: "A midia da galeria tem trilhos separados para imagens do marketplace e evidencia da propriedade."
      })}
      eyebrow={localize(locale, { en: "Media reference", es: "Referencia de media", pt: "Referencia de midia" })}
      title={localize(locale, { en: "Project gallery", es: "Project gallery", pt: "Project gallery" })}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,24rem)_1fr]">
        <div className="space-y-4">
          <div aria-label={localize(locale, { en: "Gallery groups", es: "Grupos de galeria", pt: "Grupos da galeria" })} className="space-y-3" role="tablist">
            {groups.map((group) => (
              <GalleryTabButton
                key={group.key}
                active={group.key === activeGroup.key}
                group={group}
                locale={locale}
                onClick={() => {
                  setActiveGroupKey(group.key);
                }}
              />
            ))}
          </div>
          <GalleryActionStrip groupKey={activeGroup.key} locale={locale} />
        </div>

        <div
          aria-labelledby={`gallery-tab-${activeGroup.key}`}
          className="space-y-4"
          id={`gallery-panel-${activeGroup.key}`}
          role="tabpanel"
        >
          <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/10 p-4">
            <h4 className="text-sm font-semibold text-white">{resolveGalleryGroupLabel(locale, activeGroup.key)}</h4>
            <p className="text-sm leading-6 text-white/65">{resolveGalleryGroupDescription(locale, activeGroup.key)}</p>
          </div>
          <GalleryImageGrid groupKey={activeGroup.key} items={activeGroup.items} locale={locale} />
        </div>
      </div>
    </AdminCollectionDetailSectionShell>
  );
}
