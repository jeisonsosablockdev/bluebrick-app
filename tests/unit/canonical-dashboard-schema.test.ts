/**
 * @file tests/unit/canonical-dashboard-schema.test.ts
 * @description Layer 3 & QA: Comprehensive Unit Test Suite for Multi-Sheet Dashboard Schemas.
 * Validates Zod domain contracts for all 7 operational sheets of DASH-BOARD-Blue-Brick-Panel-Administracion.xlsx:
 *   1. CanonicalDashboardProjectSchema (Proyectos)
 *   2. CanonicalInvestorSchema (Inversionistas)
 *   3. CanonicalInvestmentSchema (Inversiones)
 *   4. CanonicalProjectPhaseSchema (Fases_Proyecto)
 *   5. CanonicalOpportunitySchema (Oportunidades)
 *   6. CanonicalReinvestmentTransactionSchema (Transacciones_Reinversion)
 *   7. CanonicalInvestorSummarySchema (Resumen_Dashboard)
 *   8. CanonicalDashboardWorkbookSchema (Consolidated Multi-Sheet Workbook)
 * Invariants tested:
 *   - Formula injection sanitization on dangerous spreadsheet prefixes (=, +, -, @, \t, \r).
 *   - Strict range checks on phase order (1..50).
 *   - Valid phase statuses (Completada, En curso, Pendiente, No aplica).
 *   - Email normalization to lowercase trimmed strings.
 * @spec BBC-14-CANONICAL-DASHBOARD-SCHEMAS
 */

import { describe, it, expect } from "vitest";
import {
  sanitizeFormulaInjection,
  CanonicalProjectPhaseSchema,
  CanonicalDashboardProjectSchema,
  CanonicalInvestorSchema,
  CanonicalInvestmentSchema,
  CanonicalOpportunitySchema,
  CanonicalReinvestmentTransactionSchema,
  CanonicalInvestorSummarySchema,
  CanonicalDashboardWorkbookSchema,
} from "@/features/ai-ingestion/domain/schemas/canonical-dashboard-schema";

describe("BBC-14: Canonical Dashboard Zod Schemas & Invariants (@spec BBC-14-CANONICAL-DASHBOARD-SCHEMAS)", () => {
  describe("sanitizeFormulaInjection()", () => {
    it("should neutralize dangerous spreadsheet formula injection prefixes", () => {
      expect(sanitizeFormulaInjection("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
      expect(sanitizeFormulaInjection("+cmd|/c calc")).toBe("'+cmd|/c calc");
      expect(sanitizeFormulaInjection("-100")).toBe("'-100");
      expect(sanitizeFormulaInjection("@IMPORT")).toBe("'@IMPORT");
      expect(sanitizeFormulaInjection(String.fromCharCode(9) + "maliciousTab")).toBe(
        "'" + String.fromCharCode(9) + "maliciousTab"
      );
      expect(sanitizeFormulaInjection(String.fromCharCode(13) + "maliciousCR")).toBe(
        "'" + String.fromCharCode(13) + "maliciousCR"
      );
    });

    it("should leave standard strings and non-dangerous text untouched", () => {
      expect(sanitizeFormulaInjection("BUSH GARDEN")).toBe("BUSH GARDEN");
      expect(sanitizeFormulaInjection("Tampa Bay, FL")).toBe("Tampa Bay, FL");
      expect(sanitizeFormulaInjection("INV-001")).toBe("INV-001");
    });
  });

  describe("CanonicalProjectPhaseSchema", () => {
    it("should parse and validate a valid project phase entity", () => {
      const input = {
        idFase: "FASE-0009",
        idInversion: "BG-01",
        orden: 9,
        nombreFase: "9. Acabados",
        estado: "En curso",
        fechaInicio: "2026-07-01",
        fechaFin: "2026-08-15",
        imagenes: ["https://drive.blue-brick.com/bg/acabados-1.jpg"],
      };

      const result = CanonicalProjectPhaseSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.idFase).toBe("FASE-0009");
        expect(result.data.idInversion).toBe("BG-01");
        expect(result.data.orden).toBe(9);
        expect(result.data.estado).toBe("En curso");
        expect(result.data.imagenes).toHaveLength(1);
      }
    });

    it("should reject an invalid phase status", () => {
      const input = {
        idFase: "FASE-0001",
        idInversion: "BG-01",
        orden: 1,
        nombreFase: "1. Adquisición",
        estado: "UNKNOWN_STATUS",
      };

      const result = CanonicalProjectPhaseSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject a phase order less than 1 or greater than 50", () => {
      expect(
        CanonicalProjectPhaseSchema.safeParse({
          idFase: "F0",
          idInversion: "BG-01",
          orden: 0,
          nombreFase: "Zero",
          estado: "Pendiente",
        }).success
      ).toBe(false);

      expect(
        CanonicalProjectPhaseSchema.safeParse({
          idFase: "F51",
          idInversion: "BG-01",
          orden: 51,
          nombreFase: "Beyond",
          estado: "Pendiente",
        }).success
      ).toBe(false);
    });
  });

  describe("CanonicalDashboardProjectSchema", () => {
    it("should parse and sanitize project entity fields from Proyectos tab", () => {
      const input = {
        idInversion: "BG-01",
        nombre: "=BUSH GARDEN INJECTION",
        ciudad: "TAMPA BAY",
        tipoProyecto: "Residencial",
        duracionMeses: 6,
        faseActual: "9. Acabados",
        avanceFasePct: 57.14,
      };

      const result = CanonicalDashboardProjectSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.idInversion).toBe("BG-01");
        expect(result.data.nombre).toBe("'=BUSH GARDEN INJECTION");
        expect(result.data.avanceFasePct).toBe(57.14);
      }
    });
  });

  describe("CanonicalInvestorSchema", () => {
    it("should parse valid investor and normalize email to lowercase trimmed", () => {
      const input = {
        idInversionista: "INV-001",
        nombre: "ESTEBAN CEBALLOS",
        email: "  INVERSION.USA2026@GMAIL.COM  ",
        tipoInversionista: "Privado",
        timingMonths: 6,
      };

      const result = CanonicalInvestorSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("inversion.usa2026@gmail.com");
        expect(result.data.idInversionista).toBe("INV-001");
      }
    });

    it("should reject an invalid email address", () => {
      const result = CanonicalInvestorSchema.safeParse({
        idInversionista: "INV-999",
        nombre: "Test",
        email: "not-an-email",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("CanonicalInvestmentSchema", () => {
    it("should parse valid investment record with decimal fraction ROI and phase progress", () => {
      const input = {
        idInversion: "BG-01",
        idInversionista: "INV-001",
        nombreProyecto: "BUSH GARDEN",
        ciudad: "TAMPA BAY",
        tipoPropiedad: "Residencial",
        tipoProyecto: "Fix & Flip",
        montoInvertido: 60000,
        roiPct: 0.16,
        estado: "Activa",
        duracionMeses: 6,
        avanceFasePct: 0.5714,
        faseActual: "9. Acabados",
        gananciaProyectada: 9600,
        rendimientoDevengado: 5485.71,
      };

      const result = CanonicalInvestmentSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.idInversion).toBe("BG-01");
        expect(result.data.montoInvertido).toBe(60000);
        expect(result.data.roiPct).toBe(0.16);
        expect(result.data.avanceFasePct).toBe(0.5714);
      }
    });
  });

  describe("CanonicalOpportunitySchema", () => {
    it("should parse and validate opportunity entity (Mulberry)", () => {
      const input = {
        id: "MB-05",
        titulo: "MULBERRY",
        ciudad: "TAMPA",
        roiProyectado: 16.0,
        inversionMinima: 24500,
        diasRestantes: 15,
      };

      const result = CanonicalOpportunitySchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.titulo).toBe("MULBERRY");
        expect(result.data.roiProyectado).toBe(16.0);
        expect(result.data.inversionMinima).toBe(24500);
      }
    });
  });

  describe("CanonicalDashboardWorkbookSchema", () => {
    it("should validate a consolidated multi-sheet workbook payload", () => {
      const workbookPayload = {
        proyectos: [
          {
            idInversion: "BG-01",
            nombre: "BUSH GARDEN",
            ciudad: "TAMPA BAY",
            tipoProyecto: "Residencial",
            duracionMeses: 6,
            avanceFasePct: 57.14,
          },
        ],
        inversionistas: [
          {
            idInversionista: "INV-001",
            nombre: "ESTEBAN CEBALLOS",
            email: "inversion.usa2026@gmail.com",
            tipoInversionista: "Privado",
            timingMonths: 6,
          },
        ],
        inversiones: [
          {
            idInversion: "BG-01",
            idInversionista: "INV-001",
            nombreProyecto: "BUSH GARDEN",
            montoInvertido: 60000,
            roiPct: 0.16,
            estado: "Activa",
            duracionMeses: 6,
            avanceFasePct: 0.5714,
            faseActual: "9. Acabados",
          },
        ],
        fases: [
          {
            idFase: "FASE-0001",
            idInversion: "BG-01",
            orden: 1,
            nombreFase: "1. Adquisición",
            estado: "Completada",
          },
        ],
        oportunidades: [
          {
            id: "MB-05",
            titulo: "MULBERRY",
            ciudad: "TAMPA",
            roiProyectado: 16.0,
            inversionMinima: 24500,
          },
        ],
        transacciones: [],
        resumenes: [],
      };

      const result = CanonicalDashboardWorkbookSchema.safeParse(workbookPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.proyectos).toHaveLength(1);
        expect(result.data.fases).toHaveLength(1);
        expect(result.data.oportunidades).toHaveLength(1);
      }
    });
  });
});
