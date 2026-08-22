/**
 * =========================================================================================
 * Layer 2: Application Layer — Admin Project Selector Application Hook & Resolvers
 * Module: use-admin-project-selector.ts
 *
 * Description:
 * Application logic for loading registered marketplace collections and resolving their
 * on-chain Notary PDA states into ready-to-consume ProjectDistributionCandidate models.
 *
 * Invariants:
 * - Fails safe to empty list or fallback states upon network/RPC degradation.
 * - Concurrently resolves on-chain PDA state for registered collections.
 * =========================================================================================
 */

import { useEffect, useState } from "react";

import {
  mapToProjectDistributionViewModel,
  type NotarySyncStatus,
  type ProjectDistributionCandidate,
  type RawMarketplaceCollection
} from "@/features/admin/domain/project-distribution-view-model";
import type { ProjectConfigPdaState } from "@/lib/solana-kit/pda/project-config-reader";

export type PdaStateResolver = (
  collectionAddress: string
) => Promise<{ state: ProjectConfigPdaState | null; syncStatus: NotarySyncStatus }>;

/**
 * Default PDA resolver calling the server route or solana reader.
 *
 * What: Resolves on-chain Notary PDA state for a given collection address.
 * How: Invokes fetch against the collection's date notary read model.
 */
export async function defaultPdaStateResolver(
  collectionAddress: string
): Promise<{ state: ProjectConfigPdaState | null; syncStatus: NotarySyncStatus }> {
  try {
    const res = await fetch(`/api/admin/collections/${collectionAddress}/date-change-request`);
    if (!res.ok) {
      return { state: null, syncStatus: "UNINITIALIZED" };
    }
    const data = await res.json();
    if (data.ok && data.onChainState) {
      return {
        state: data.onChainState,
        syncStatus: "SYNCHRONIZED"
      };
    }
    return { state: null, syncStatus: "UNINITIALIZED" };
  } catch {
    return { state: null, syncStatus: "RPC_ERROR" };
  }
}

/**
 * Resolves a list of raw marketplace collections into full ProjectDistributionCandidates.
 *
 * What: Asynchronously maps raw collections with on-chain PDA states.
 * How: Uses Promise.all to query PDA state for each collection concurrently.
 */
export async function resolveAdminProjectCandidates(
  collections: RawMarketplaceCollection[],
  pdaResolver: PdaStateResolver = defaultPdaStateResolver
): Promise<ProjectDistributionCandidate[]> {
  // Step 1: Guard against empty collection arrays
  if (!collections || collections.length === 0) {
    return [];
  }

  // Step 2: Concurrently resolve on-chain PDA status for each collection
  const resolvedCandidates = await Promise.all(
    collections.map(async (col) => {
      try {
        const { state, syncStatus } = await pdaResolver(col.collectionAddress);
        return mapToProjectDistributionViewModel(col, state, syncStatus);
      } catch {
        return mapToProjectDistributionViewModel(col, null, "RPC_ERROR");
      }
    })
  );

  return resolvedCandidates;
}

export type UseAdminProjectSelectorResult = {
  projects: ProjectDistributionCandidate[];
  selectedProject: ProjectDistributionCandidate | null;
  isLoading: boolean;
  error: string | null;
  selectProjectById: (id: string) => void;
};

/**
 * React hook to manage project selection in distribution creation modal.
 *
 * What: Fetches /api/admin/collections and manages active selected project state.
 * How: Initializes state, triggers candidate resolution, and provides selection handler.
 */
export function useAdminProjectSelector(
  initialCollectionAddress?: string,
  pdaResolver: PdaStateResolver = defaultPdaStateResolver
): UseAdminProjectSelectorResult {
  const [projects, setProjects] = useState<ProjectDistributionCandidate[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectDistributionCandidate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      setIsLoading(true);
      setError(null);

      try {
        // Step 1: Query admin collections endpoint
        const res = await fetch("/api/admin/collections");
        if (!res.ok) {
          throw new Error("Failed to load marketplace collections.");
        }

        const data = await res.json();
        const rawCollections: RawMarketplaceCollection[] = data.ok ? data.data || [] : [];

        // Step 2: Resolve candidate view models with on-chain PDA states
        const candidates = await resolveAdminProjectCandidates(rawCollections, pdaResolver);

        if (isMounted) {
          setProjects(candidates);

          // Step 3: Pick initial selected project
          if (candidates.length > 0) {
            const initial =
              candidates.find((c) => c.collectionAddress === initialCollectionAddress) || candidates[0];
            setSelectedProject(initial);
          }
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Error loading projects.";
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      isMounted = false;
    };
  }, [initialCollectionAddress, pdaResolver]);

  function selectProjectById(id: string) {
    const found = projects.find((p) => p.id === id);
    if (found) {
      setSelectedProject(found);
    }
  }

  return {
    projects,
    selectedProject,
    isLoading,
    error,
    selectProjectById
  };
}
