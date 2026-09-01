/**
 * ============================================================================
 * @file apps/web/src/features/ai-ingestion/domain/schemas/canonical-dashboard-schema.ts
 * @description Layer 3: Domain - Canonical Dashboard Workbook & Project Phase Schemas
 * ============================================================================
 * Purpose: Single-source-of-truth Zod data contracts for multi-sheet operational Excel
 * workbook ingestion (DASH-BOARD-Blue-Brick-Panel-Administracion.xlsx).
 * 
 * Invariants:
 *  - Sanitization against CSV/formula injection (=, +, -, @, \t, \r).
 *  - Strict validation of project phase states and numeric ranges (order 1..50).
 *  - Prototype pollution protection on arbitrary key-value mappings.
 *  - Pure domain layer: Zero external I/O, framework, or database (pg) dependencies.
 * 
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import { z } from "zod";
import { stripPrototypeProperties } from "./canonical-client-schema";

/**
 * Sanitizes input strings against CSV / Excel Formula Injection (DDE attacks).
 * If a string starts with dangerous characters (=, +, -, @, \t, \r), prefixes it with a single quote.
 * 
 * @param input - Raw cell string
 * @returns Sanitized string safe for Excel export and processing
 */
export function sanitizeFormulaInjection(input: string): string {
  // Step 1: Handle non-string or empty input
  if (typeof input !== "string" || input.length === 0) {
    return input;
  }

  // Step 2: Detect leading dangerous characters that trigger formula execution
  const dangerousChars = ["=", "+", "-", "@", "\t", "\r"];
  for (const char of dangerousChars) {
    if (input.startsWith(char)) {
      return `'${input}`;
    }
  }

  const trimmed = input.trim();
  for (const char of dangerousChars) {
    if (trimmed.startsWith(char)) {
      return `'${trimmed}`;
    }
  }

  return trimmed;
}

/**
 * Allowed status states for construction project phases.
 */
export const PROJECT_PHASE_STATUSES = [
  "Completada",
  "En curso",
  "Pendiente",
  "No aplica",
] as const;

/**
 * Type representing the lifecycle status of a project phase.
 */
export type ProjectPhaseStatus = (typeof PROJECT_PHASE_STATUSES)[number];

/**
 * Zod Schema for Canonical Project Phase Entity.
 * Represents an individual construction milestone (1 to 14+) for a property.
 */
export const CanonicalProjectPhaseSchema = z
  .object({
    idFase: z.string().min(1, "Phase ID is required").max(64).transform(sanitizeFormulaInjection),
    idInversion: z.string().min(1, "Project SKU / ID is required").max(64).transform(sanitizeFormulaInjection),
    orden: z.number().int().min(1, "Phase order must be at least 1").max(50, "Phase order exceeds allowable range"),
    nombreFase: z.string().min(1, "Phase name is required").max(255).transform(sanitizeFormulaInjection),
    estado: z.enum(PROJECT_PHASE_STATUSES),
    fechaInicio: z.string().nullable().optional(),
    fechaFin: z.string().nullable().optional(),
    imagenes: z.array(z.string().min(1)).default([]),
  })
  .strip();

/**
 * Inferred TypeScript type for Canonical Project Phase.
 */
export type CanonicalProjectPhase = z.infer<typeof CanonicalProjectPhaseSchema>;

/**
 * Zod Schema for Canonical Operational Project Entity (Proyectos tab).
 */
export const CanonicalDashboardProjectSchema = z
  .object({
    idInversion: z.string().min(1, "Project SKU is required").max(64).transform(sanitizeFormulaInjection),
    nombre: z.string().min(1, "Project name is required").max(255).transform(sanitizeFormulaInjection),
    ciudad: z.string().max(128).default("Tampa, FL").transform(sanitizeFormulaInjection),
    tipoProyecto: z.enum(["Residencial", "Comercial", "Industrial"]).default("Residencial"),
    duracionMeses: z.number().int().nonnegative().default(0),
    faseActual: z
      .string()
      .max(128)
      .nullable()
      .optional()
      .transform((val) => (val ? sanitizeFormulaInjection(val) : val)),
    avanceFasePct: z.number().min(0).max(100).default(0),
    driveUrl: z.string().nullable().optional(),
  })
  .strip();

/**
 * Inferred TypeScript type for Canonical Dashboard Project.
 */
export type CanonicalDashboardProject = z.infer<typeof CanonicalDashboardProjectSchema>;

/**
 * Zod Schema for Canonical Reinvestment Opportunity Entity (Oportunidades tab).
 */
export const CanonicalOpportunitySchema = z
  .object({
    id: z.string().max(64).optional(),
    titulo: z.string().min(1, "Title is required").max(255).transform(sanitizeFormulaInjection),
    ciudad: z.string().min(1, "City is required").max(128).transform(sanitizeFormulaInjection),
    roiProyectado: z.number().min(0).max(100),
    inversionMinima: z.number().positive(),
    diasRestantes: z.number().int().nonnegative().default(1),
    gradient: z.string().default("from-blue-600/30 via-indigo-600/20 to-transparent"),
  })
  .strip();

/**
 * Inferred TypeScript type for Canonical Reinvestment Opportunity.
 */
export type CanonicalOpportunity = z.infer<typeof CanonicalOpportunitySchema>;

/**
 * Zod Schema for Canonical Investor Entity (Inversionistas tab).
 */
export const CanonicalInvestorSchema = z
  .object({
    idInversionista: z.string().min(1, "Investor ID is required").max(64).transform(sanitizeFormulaInjection),
    nombre: z.string().min(1, "Investor name is required").max(255).transform(sanitizeFormulaInjection),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.string().email("Invalid investor email")),
    tipoInversionista: z.string().default("Privado").transform(sanitizeFormulaInjection),
    fechaIngreso: z.string().nullable().optional(),
    timingMonths: z.number().int().nonnegative().default(6),
  })
  .strip();

export type CanonicalInvestor = z.infer<typeof CanonicalInvestorSchema>;

/**
 * Zod Schema for Canonical Investment Entity (Inversiones tab).
 */
export const CanonicalInvestmentSchema = z
  .object({
    id: z.string().min(1).max(128).optional(),
    idInversion: z.string().min(1, "Project SKU / ID is required").max(64).transform(sanitizeFormulaInjection),
    idInversionista: z.string().max(64).nullable().optional().transform((val) => (val ? sanitizeFormulaInjection(val) : null)),
    nombreProyecto: z.string().min(1).max(255).transform(sanitizeFormulaInjection),
    ciudad: z.string().default("TAMPA BAY").transform(sanitizeFormulaInjection),
    tipoPropiedad: z.string().default("Residencial").transform(sanitizeFormulaInjection),
    tipoProyecto: z.string().default("Fix & Flip").transform(sanitizeFormulaInjection),
    montoInvertido: z.number().nonnegative().default(0),
    roiPct: z.number().min(0).max(1).default(0.15), // stored as decimal fraction e.g. 0.16
    estado: z.string().default("Activa").transform(sanitizeFormulaInjection),
    fechaInicio: z.string().nullable().optional(),
    duracionMeses: z.number().int().nonnegative().default(6),
    rangoEsperado: z.string().nullable().optional().transform((val) => (val ? sanitizeFormulaInjection(val) : null)),
    fechaTiming: z.string().nullable().optional(),
    allocationPct: z.number().min(0).max(1).default(1),
    imagenUrl: z.string().nullable().optional(),
    avanceFasePct: z.number().min(0).max(1).default(0), // stored as decimal fraction e.g. 0.5714
    faseActual: z.string().default("1. Adquisición").transform(sanitizeFormulaInjection),
    gananciaProyectada: z.number().default(0),
    rendimientoDevengado: z.number().default(0),
  })
  .strip();

export type CanonicalInvestment = z.infer<typeof CanonicalInvestmentSchema>;

/**
 * Zod Schema for Canonical Reinvestment Transaction (Transacciones_Reinversion tab).
 */
export const CanonicalReinvestmentTransactionSchema = z
  .object({
    idTransaccion: z.string().min(1).max(64).transform(sanitizeFormulaInjection),
    idInversionista: z.string().min(1).max(64).transform(sanitizeFormulaInjection),
    idOportunidad: z.string().max(64).nullable().optional().transform((val) => (val ? sanitizeFormulaInjection(val) : null)),
    idInversionOrigen: z.string().max(64).nullable().optional().transform((val) => (val ? sanitizeFormulaInjection(val) : null)),
    monto: z.number().nonnegative().default(0),
    fechaSolicitud: z.string().nullable().optional(),
    estado: z.enum(["Pendiente", "Confirmada", "Rechazada"]).default("Pendiente"),
    fechaConfirmacion: z.string().nullable().optional(),
    idInversionGenerada: z.string().max(64).nullable().optional().transform((val) => (val ? sanitizeFormulaInjection(val) : null)),
  })
  .strip();

export type CanonicalReinvestmentTransaction = z.infer<typeof CanonicalReinvestmentTransactionSchema>;

/**
 * Zod Schema for Canonical Investor Dashboard Summary (Resumen_Dashboard tab).
 */
export const CanonicalInvestorSummarySchema = z
  .object({
    idInversionista: z.string().min(1).max(64).transform(sanitizeFormulaInjection),
    nombre: z.string().min(1).max(255).transform(sanitizeFormulaInjection),
    patrimonioTotalInvertido: z.number().nonnegative().default(0),
    rendimientoAcumulado: z.number().default(0),
    capitalTotalActual: z.number().nonnegative().default(0),
    roiPonderado: z.number().min(0).max(1).default(0.15),
    numActivas: z.number().int().nonnegative().default(0),
    numConcluidas: z.number().int().nonnegative().default(0),
    capitalDisponibleReinversion: z.number().default(0),
    gananciaProyectadaTotal: z.number().default(0),
  })
  .strip();

export type CanonicalInvestorSummary = z.infer<typeof CanonicalInvestorSummarySchema>;

/**
 * Zod Schema for Canonical Multi-Sheet Dashboard Workbook.
 * Single structured bundle validating all tabs from DASH-BOARD-Blue-Brick-Panel-Administracion.xlsx.
 */
export const CanonicalDashboardWorkbookSchema = z
  .object({
    proyectos: z.array(CanonicalDashboardProjectSchema).default([]),
    inversionistas: z.array(CanonicalInvestorSchema).default([]),
    inversiones: z.array(CanonicalInvestmentSchema).default([]),
    fases: z.array(CanonicalProjectPhaseSchema).default([]),
    oportunidades: z.array(CanonicalOpportunitySchema).default([]),
    transacciones: z.array(CanonicalReinvestmentTransactionSchema).default([]),
    resumenes: z.array(CanonicalInvestorSummarySchema).default([]),
  })
  .strip();

/**
 * Inferred TypeScript type for Canonical Dashboard Workbook.
 */
export type CanonicalDashboardWorkbook = z.infer<typeof CanonicalDashboardWorkbookSchema>;

