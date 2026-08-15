"use client";

import Image from "next/image";
import { useState } from "react";

import { Card } from "@/components/ui/card";
import { H2 } from "@/components/ui/typography";
import { useI18n } from "@/components/i18n/locale-provider";
import type { CollectionBootstrapImageItem } from "@/lib/admin/collection-bootstrap-mapper";
import type { PropertyDetail } from "@/lib/property-service";

type PropertyDetailMediaSectionProps = {
  property: PropertyDetail;
};

type MediaGroupKey = "gallery" | "property";

type MediaGroup = {
  key: MediaGroupKey;
  label: string;
  images: CollectionBootstrapImageItem[];
};

function uniqueImages(images: CollectionBootstrapImageItem[]): CollectionBootstrapImageItem[] {
  const seenUrls = new Set<string>();

  return images.filter((image) => {
    const key = image.url.trim();
    if (!key || seenUrls.has(key)) {
      return false;
    }

    seenUrls.add(key);
    return true;
  });
}

function resolveActiveIndex(index: number | undefined, imageCount: number): number {
  if (typeof index !== "number" || index < 0 || index >= imageCount) {
    return 0;
  }

  return index;
}

export function PropertyDetailMediaSection({ property }: PropertyDetailMediaSectionProps) {
  const { t } = useI18n();
  const [activeImageByGroup, setActiveImageByGroup] = useState<Partial<Record<MediaGroupKey, number>>>({});
  const mediaGroups: MediaGroup[] = [
    {
      key: "gallery",
      label: t({ en: "Gallery", es: "Galeria", pt: "Galeria" }),
      images: uniqueImages(property.galleryImages)
    },
    {
      key: "property",
      label: t({ en: "Property", es: "Propiedad", pt: "Propriedade" }),
      images: uniqueImages(property.propertyImages)
    }
  ];
  const groups = mediaGroups.filter((group) => group.images.length > 0);

  if (groups.length === 0) {
    return null;
  }

  function formatImageCount(imageCount: number): string {
    return imageCount === 1
      ? t({ en: "1 image", es: "1 imagen", pt: "1 imagem" })
      : `${imageCount} ${t({ en: "images", es: "imagenes", pt: "imagens" })}`;
  }

  function updateActiveImage(groupKey: MediaGroupKey, imageCount: number, step: number): void {
    setActiveImageByGroup((current) => {
      const currentIndex = resolveActiveIndex(current[groupKey], imageCount);
      const nextIndex = (currentIndex + step + imageCount) % imageCount;

      return {
        ...current,
        [groupKey]: nextIndex
      };
    });
  }

  return (
    <Card className="marketplace-detail-card space-y-6">
      <H2 className="text-2xl text-white">{t({ en: "Project media", es: "Imagenes del proyecto", pt: "Midia do projeto" })}</H2>

      {groups.map((group) => {
        const activeIndex = resolveActiveIndex(activeImageByGroup[group.key], group.images.length);
        const activeImage = group.images[activeIndex];
        const hasMultipleImages = group.images.length > 1;

        return (
          <section
            aria-label={`${group.label} project media`}
            aria-roledescription="carousel"
            className="space-y-3"
            data-testid={`project-media-carousel-${group.key}`}
            key={group.key}
            role="region"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">{group.label}</p>
                <p className="text-sm text-slate-400">{formatImageCount(group.images.length)}</p>
              </div>

              {hasMultipleImages ? (
                <p aria-live="polite" className="marketplace-detail-inset rounded-full px-3 py-1 text-xs font-semibold text-slate-200">
                  {activeIndex + 1} / {group.images.length}
                </p>
              ) : null}
            </div>

            <figure className="marketplace-detail-media-frame overflow-hidden rounded-3xl">
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
                <Image
                  alt={activeImage.alt || activeImage.title || property.title}
                  className="object-cover"
                  fill
                  sizes="(min-width: 1024px) 960px, 100vw"
                  src={activeImage.url}
                />

                {hasMultipleImages ? (
                  <div className="absolute inset-x-3 top-1/2 flex -translate-y-1/2 items-center justify-between">
                    <button
                      type="button"
                      aria-label={t({
                        en: `Previous ${group.label} image`,
                        es: `Imagen anterior de ${group.label}`,
                        pt: `Imagem anterior de ${group.label}`
                      })}
                      className="marketplace-detail-round-button min-h-11 min-w-11 cursor-pointer rounded-full px-3 text-lg font-semibold text-white"
                      onClick={() => updateActiveImage(group.key, group.images.length, -1)}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      aria-label={t({
                        en: `Next ${group.label} image`,
                        es: `Siguiente imagen de ${group.label}`,
                        pt: `Proxima imagem de ${group.label}`
                      })}
                      className="marketplace-detail-round-button min-h-11 min-w-11 cursor-pointer rounded-full px-3 text-lg font-semibold text-white"
                      onClick={() => updateActiveImage(group.key, group.images.length, 1)}
                    >
                      ›
                    </button>
                  </div>
                ) : null}
              </div>

              <figcaption className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs text-slate-300">
                <span>{activeImage.title}</span>
                {hasMultipleImages ? (
                  <span className="text-slate-500">{t({ en: "Use controls to browse", es: "Usa los controles para navegar", pt: "Use os controles para navegar" })}</span>
                ) : null}
              </figcaption>
            </figure>
          </section>
        );
      })}
    </Card>
  );
}
