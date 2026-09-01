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
  idInversion?: string;
  faseActual?: string;
  avanceFasePct?: number;
  driveUrl?: string;
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

/**
 * Construction or operational milestone phase of a real estate property.
 * Sourced from the operational Google Drive workbook (Fases_Proyecto tab).
 */
export interface ProjectPhase {
  id: string;
  projectId: string;
  order: number;
  name: string;
  status: "Completada" | "En curso" | "Pendiente" | "No aplica";
  startDate?: string | null;
  endDate?: string | null;
  images: string[];
}

/**
 * Direct relational database row mapped from `project_phases` table in PostgreSQL.
 */
export interface DbProjectPhaseRow {
  id: string;
  project_id: string;
  orden: number;
  nombre_fase: string;
  estado: "Completada" | "En curso" | "Pendiente" | "No aplica";
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  imagenes: string[];
  created_at?: string | Date;
  updated_at?: string | Date;
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
  currentPhase?: string;
  phaseProgressPct?: number;
  phases?: ProjectPhase[];
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
  avance_fase_pct?: number | string;
  fase_actual?: string;
  imagen_url?: string;
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

// ============================================================================
// Multi-Sheet Excel Dashboard Digestion Entities (DASH-BOARD Excel Mirror)
// ============================================================================

/**
 * Project entity mapped from Sheet 'Proyectos '.
 */
export interface DbDashboardProject {
  id_inversion: string; // SKU ej. 'BG-01'
  nombre: string;
  direccion?: string | null;
  tipo_proyecto: string;
  fecha_activacion?: string | Date | null;
  timing_months: number;
  drive_url?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Investor entity mapped from Sheet 'Inversionistas'.
 */
export interface DbDashboardInvestor {
  id_inversionista: string; // ej. 'INV-001'
  nombre: string;
  email: string;
  tipo_inversionista: string;
  fecha_ingreso?: string | Date | null;
  timing_months: number;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Individual investment record mapped from Sheet 'Inversiones'.
 */
export interface DbDashboardInvestment {
  id: string;
  id_inversion: string;
  id_inversionista: string | null;
  nombre_proyecto: string;
  ciudad: string;
  tipo_propiedad: string;
  tipo_proyecto: string;
  monto_invertido: number;
  roi_pct: number;
  estado: string;
  fecha_inicio?: string | Date | null;
  duracion_meses: number;
  rango_esperado?: string | null;
  fecha_timing?: string | Date | null;
  allocation_pct: number;
  imagen_url?: string | null;
  avance_fase_pct: number;
  fase_actual: string;
  ganancia_proyectada: number;
  rendimiento_devengado: number;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Phase milestone record mapped from Sheet 'Fases_Proyecto'.
 */
export interface DbDashboardProjectPhase {
  id: string;
  id_fase: string;
  id_inversion: string;
  orden: number;
  nombre_fase: string;
  estado: "Completada" | "En curso" | "Pendiente" | "No aplica";
  fecha_inicio?: string | Date | null;
  fecha_fin?: string | Date | null;
  imagen_url_1?: string | null;
  imagen_url_2?: string | null;
  imagen_url_3?: string | null;
  clave_en_curso?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Reinvestment opportunity mapped from Sheet 'Oportunidades'.
 */
export interface DbDashboardOpportunity {
  id_oportunidad: string;
  nombre_proyecto: string;
  ciudad: string;
  roi_estimado: number;
  ticket_minimo: number;
  activa: boolean;
  gradient: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Reinvestment transaction mapped from Sheet 'Transacciones_Reinversion'.
 */
export interface DbDashboardReinvestmentTransaction {
  id_transaccion: string;
  id_inversionista: string;
  id_oportunidad?: string | null;
  id_inversion_origen?: string | null;
  monto: number;
  fecha_solicitud: string | Date;
  estado: "Pendiente" | "Confirmada" | "Rechazada";
  fecha_confirmacion?: string | Date | null;
  id_inversion_generada?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Pre-aggregated summary mirror mapped from Sheet 'Resumen_Dashboard'.
 */
export interface DbDashboardInvestorSummary {
  id_inversionista: string;
  nombre: string;
  patrimonio_total_invertido: number;
  rendimiento_acumulado: number;
  capital_total_actual: number;
  roi_ponderado: number;
  num_activas: number;
  num_concluidas: number;
  capital_disponible_reinversion: number;
  ganancia_proyectada_total: number;
  updated_at?: Date;
}

