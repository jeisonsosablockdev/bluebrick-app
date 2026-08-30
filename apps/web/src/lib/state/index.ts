/**
 * @file apps/web/src/lib/state/index.ts
 * @description Layer 2: Application / State - Barrel entrypoint for client state management.
 * Declares domain state contracts, modal states, and client store types.
 */

/**
 * Common modal presentation state.
 */
export interface ModalState {
  isOpen: boolean;
  activeId?: string | null;
}

/**
 * Filter and pagination state contract for real estate portfolio listings.
 */
export interface PortfolioFilterState {
  propertyType?: string;
  sortBy?: "roi" | "amount" | "date";
  sortOrder?: "asc" | "desc";
}
