/**
 * ============================================================================
 * Layer 1: Presentation - Zero-CLS Project Media Gallery Component
 * ============================================================================
 * Purpose: Renders responsive architectural image grids and video progress reels
 * with fixed aspect-ratio containers, AI focal point centering, and zero CLS.
 * Invariants:
 *  - Fixed CSS aspect ratios (aspect-video / aspect-square) ensuring CLS = 0.
 *  - Dynamic focal point object-position alignment.
 *  - Semantic HTML and WCAG AA accessibility compliance.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import React from 'react';
import Image from 'next/image';
import { MediaCardDto } from '../../application/queries/get-dashboard-data-query';

/**
 * Props for ProjectMediaGallery component.
 */
export interface ProjectMediaGalleryProps {
  readonly mediaItems: readonly MediaCardDto[];
  readonly projectTitle?: string;
  readonly className?: string;
}

/**
 * Responsive zero-CLS media gallery component.
 */
export function ProjectMediaGallery({
  mediaItems,
  projectTitle = 'Proyecto',
  className = '',
}: ProjectMediaGalleryProps) {
  // Step 1: Render empty state if no media assets are present
  if (!mediaItems || mediaItems.length === 0) {
    return (
      <section
        aria-label={`Galería de medios de ${projectTitle}`}
        className={`rounded-2xl border border-zinc-800 bg-zinc-950/40 p-8 text-center ${className}`}
      >
        <p className="text-sm text-zinc-500">
          No hay fotografías o videos sincronizados para este proyecto aún.
        </p>
      </section>
    );
  }

  // Step 2: Render responsive grid layout with zero-CLS fixed ratio containers
  return (
    <section
      aria-label={`Galería de medios de ${projectTitle}`}
      className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 ${className}`}
    >
      {mediaItems.map((item) => (
        <article
          key={item.id}
          className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/40 hover:shadow-emerald-950/20"
        >
          {/* Step 3: Fixed aspect-ratio container ensuring CLS = 0 */}
          <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
            {item.mediaType === 'IMAGE' ? (
              <Image
                src={item.blobUrl}
                alt={item.caption || `Fotografía de ${projectTitle}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                style={{ objectPosition: item.objectPositionStyle }}
                loading="lazy"
              />
            ) : (
              <video
                src={item.blobUrl}
                aria-label={item.caption || `Video de avance de obra: ${projectTitle}`}
                controls
                preload="metadata"
                className="h-full w-full object-cover"
              />
            )}

            {/* Media Type Badge */}
            <span className="absolute top-3 right-3 rounded-full bg-zinc-950/80 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-zinc-300 uppercase backdrop-blur-md">
              {item.mediaType}
            </span>
          </div>

          {/* Step 4: Caption & AI Tags Section */}
          <div className="flex flex-1 flex-col justify-between p-4">
            <p className="line-clamp-2 text-xs font-medium text-zinc-200">
              {item.caption}
            </p>

            {item.aiTags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Etiquetas de avance">
                {item.aiTags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-md bg-emerald-950/50 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-800/40"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
