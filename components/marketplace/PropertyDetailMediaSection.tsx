"use client";

import Image from "next/image";

import { Card } from "@/components/ui/card";
import { H2 } from "@/components/ui/typography";
import { useI18n } from "@/components/i18n/locale-provider";
import type { CollectionBootstrapImageItem } from "@/lib/admin/collection-bootstrap-mapper";
import type { PropertyDetail } from "@/lib/property-service";

type PropertyDetailMediaSectionProps = {
  property: PropertyDetail;
};

type MediaGroup = {
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

export function PropertyDetailMediaSection({ property }: PropertyDetailMediaSectionProps) {
  const { t } = useI18n();
  const groups: MediaGroup[] = [
    {
      label: t({ en: "Gallery", es: "Galeria", pt: "Galeria" }),
      images: uniqueImages(property.galleryImages)
    },
    {
      label: t({ en: "Property", es: "Propiedad", pt: "Propriedade" }),
      images: uniqueImages(property.propertyImages)
    }
  ].filter((group) => group.images.length > 0);

  if (groups.length === 0) {
    return null;
  }

  return (
    <Card className="space-y-5">
      <H2 className="text-2xl text-white">{t({ en: "Project media", es: "Imagenes del proyecto", pt: "Midia do projeto" })}</H2>
      {groups.map((group) => (
        <section className="space-y-3" key={group.label}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">{group.label}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.images.map((image) => (
              <figure className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70" key={image.id}>
                <Image
                  alt={image.alt || image.title || property.title}
                  className="h-44 w-full object-cover"
                  height={360}
                  src={image.url}
                  width={540}
                />
                <figcaption className="px-3 py-2 text-xs text-slate-300">{image.title}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
    </Card>
  );
}
