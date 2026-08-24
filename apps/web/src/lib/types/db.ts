/**
 * @file apps/web/src/lib/types/db.ts
 * @description Layer 2: Application - Type definitions and interfaces for database entities.
 */

export interface DbUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  tier: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface DbProperty {
  id: string;
  name: string;
  city: string;
  type: "Residencial" | "Comercial" | "Industrial";
  targetAmount: number;
  roi: number;
  status: "activa" | "concluida" | "fondos_completados";
  timing: string;
  monthsLeft: number;
  gradient: string;
  createdAt?: Date;
}

export interface DbUserInvestment {
  id: string;
  userId: string;
  propertyId: string;
  investedAmount: number;
  investedAt: Date;
}

export interface DbReinvestmentOpportunity {
  id: string;
  title: string;
  city: string;
  projectedRoi: number;
  minInvestment: number;
  daysLeft: number;
  gradient: string;
  createdAt?: Date;
}

export interface PortfolioItem {
  id: string;
  propertyId: string;
  propertyName: string;
  city: string;
  propertyType: "Residencial" | "Comercial" | "Industrial";
  investedAmount: number;
  roi: number;
  status: "activa" | "concluida" | "fondos_completados";
  timing: string;
  monthsLeft: number;
  gradient: string;
}

export interface PortfolioSummary {
  userId: string;
  totalInvested: number;
  weightedRoi: number;
  activeCount: number;
  concludedCount: number;
  items: PortfolioItem[];
}
