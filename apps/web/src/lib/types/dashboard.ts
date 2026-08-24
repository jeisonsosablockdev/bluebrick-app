/**
 * @file apps/web/src/lib/types/dashboard.ts
 * @description Layer 2: Application - Type definitions for Dashboard UI components and view-models.
 */

import type { PortfolioItem, DbReinvestmentOpportunity, DbUser } from "./db";

export interface DashboardViewModel {
  investor: DbUser;
  totalInvested: number;
  weightedRoi: number;
  activeCount: number;
  concludedCount: number;
  properties: PortfolioItem[];
  reinvestmentOpportunities: DbReinvestmentOpportunity[];
}

export interface TypeDistributionSlice {
  name: string;
  value: number;
  color: string;
  percentage: number;
}
