"use client";

/**
 * =========================================================================================
 * Layer 1: Presentation Layer — Project Selector Card Component
 * Component: ProjectSelectorCard
 *
 * Description:
 * Renders an interactive dropdown selector and a visual project preview card with
 * property thumbnail image, property code, collection address, and on-chain Notary status.
 *
 * Invariants:
 * - Sober, emoji-free aesthetic matching /profile overview cards.
 * - Handles image loading fallbacks safely without broken image icons.
 * - Displays cryptographic verification badge for on-chain Notary synchronization.
 * =========================================================================================
 */

import type { ReactElement } from "react";
import { useState } from "react";

import type { ProjectDistributionCandidate } from "@/features/admin/domain/project-distribution-view-model";

type ProjectSelectorCardProps = {
  projects: ProjectDistributionCandidate[];
  selectedProject: ProjectDistributionCandidate | null;
  isLoading: boolean;
  onSelectProject: (project: ProjectDistributionCandidate) => void;
};

const DEFAULT_PLACEHOLDER_IMAGE = "/images/placeholder-property.jpg";

/**
 * Renders a truncated Solana base58 address.
 */
function truncateAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function ProjectSelectorCard({
  projects,
  selectedProject,
  isLoading,
  onSelectProject
}: ProjectSelectorCardProps): ReactElement {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Step 1: Render loading state skeleton
  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-neutral-400">
        Cargando proyectos y estado notarial on-chain...
      </div>
    );
  }

  // Step 2: Render empty state fallback
  if (!projects || projects.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-neutral-400">
        No se encontraron proyectos disponibles en el marketplace.
      </div>
    );
  }

  const currentProject = selectedProject || projects[0];
  const activeImage = imageSrc || currentProject.coverImageUrl || DEFAULT_PLACEHOLDER_IMAGE;

  return (
    <div className="space-y-3">
      {/* Dropdown Selector */}
      <div>
        <label htmlFor="project-select" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-300">
          Seleccionar Proyecto del Marketplace
        </label>
        <select
          id="project-select"
          value={currentProject.id}
          onChange={(e) => {
            const found = projects.find((p) => p.id === e.target.value);
            if (found) {
              setImageSrc(null);
              onSelectProject(found);
            }
          }}
          className="w-full rounded-lg border border-white/15 bg-neutral-900/90 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {projects.map((proj) => (
            <option key={proj.id} value={proj.id} className="bg-neutral-900 text-white">
              {proj.title} ({proj.id})
            </option>
          ))}
        </select>
      </div>

      {/* Visual Preview Card */}
      <div className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-neutral-900/60 p-3.5 backdrop-blur-sm">
        {/* Thumbnail Image */}
        <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-neutral-800">
          <img
            src={activeImage}
            alt={currentProject.title}
            onError={() => setImageSrc(DEFAULT_PLACEHOLDER_IMAGE)}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Project Metadata Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="truncate text-sm font-semibold text-white">
              {currentProject.title}
            </h4>

            {/* On-Chain Notary PDA Status Badge */}
            {currentProject.syncStatus === "SYNCHRONIZED" ? (
              <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-emerald-400">
                Notarizado On-Chain (v{currentProject.notaryVersion})
              </span>
            ) : currentProject.syncStatus === "UNINITIALIZED" ? (
              <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-amber-400">
                Pendiente de Inicializar
              </span>
            ) : (
              <span className="shrink-0 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-rose-400">
                Error RPC On-Chain
              </span>
            )}
          </div>

          <p className="text-xs text-neutral-400">
            ID: <span className="font-mono text-neutral-300">{currentProject.id}</span>
          </p>

          <div className="mt-1 flex items-center gap-2 text-[11px] text-neutral-400">
            <span>Colección:</span>
            <span className="font-mono text-neutral-300" title={currentProject.collectionAddress}>
              {truncateAddress(currentProject.collectionAddress)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
