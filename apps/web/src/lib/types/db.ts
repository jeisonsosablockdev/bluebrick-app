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

/**
 * Raw investment item structure parsed from Excel ingestion metadata or multi-investment payload.
 */
export interface RawClientInvestment {
  id_inversion?: string;
  nombre_proyecto?: string;
  project?: string;
  ciudad?: string;
  city?: string;
  monto_invertido?: string | number;
  roi_pct?: string | number;
  roi?: string | number;
  estado?: string;
  fecha_timing?: string;
}

/**
 * Metadata stored in clients.metadata JSONB field from Excel ingestion.
 */
export interface ClientMetadata {
  project?: string;
  city?: string;
  roi?: string | number;
  investorId?: string;
  allInvestments?: RawClientInvestment[];
  [key: string]: unknown;
}

/**
 * Database client record mapped from `clients` table.
 */
export interface DbClientRow {
  id: string;
  name: string;
  tax_id: string;
  email: string;
  phone?: string | null;
  contract_amount: string | number;
  status: string;
  metadata?: ClientMetadata | null;
  created_at?: string | Date;
}

