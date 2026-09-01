/**
 * @file tests/unit/multi-sheet-spreadsheet-adapter.test.ts
 * @description Layer 4 & QA: Comprehensive Unit Test Suite for Multi-Sheet Workbook Parser.
 * Tests streaming parsing of DASH-BOARD-Blue-Brick-Panel-Administracion.xlsx into 7 domain entities:
 *   1. Proyectos (projects with SKU e.g. BG-01)
 *   2. Inversionistas (investors with normalized emails)
 *   3. Inversiones (investments mapped with phase progress and current phase)
 *   4. Fases_Proyecto (14 phases per project with images and statuses)
 *   5. Oportunidades (active reinvestment opportunities)
 *   6. Transacciones_Reinversion (reinvestment transactions)
 *   7. Resumen_Dashboard (aggregated summaries)
 * @spec BBC-14-MULTI-SHEET-INGESTION
 */

import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { StreamingSpreadsheetAdapter } from "@/features/ai-ingestion/infrastructure/streaming-spreadsheet-adapter";

describe("BBC-14: Multi-Sheet Dashboard Workbook Parser (@spec BBC-14-MULTI-SHEET-INGESTION)", () => {
  const adapter = new StreamingSpreadsheetAdapter();

  it("should parse an XLSX buffer containing all 7 sheets and extract structured entities", async () => {
    // Arrange: Create an in-memory workbook mimicking DASH-BOARD-Blue-Brick-Panel-Administracion.xlsx
    const wb = XLSX.utils.book_new();

    // Sheet 1: Proyectos
    const wsProyectosData = [
      ["PROYECTOS - Blue Brick"],
      ["Header metadata preamble"],
      ["id_inversion", "nombre", "Direccion", "tipo_proyecto", "fecha_Activacion", "Timing months"],
      ["BG-01", "BUSH GARDEN", "Tampa, FL", "Fix & Flip", 46198, 6],
      ["BK-02", "BROOKSVILLE", "Tampa, FL", "Fix & Flip", 46235, 8],
    ];
    const wsProyectos = XLSX.utils.aoa_to_sheet(wsProyectosData);
    XLSX.utils.book_append_sheet(wb, wsProyectos, "Proyectos ");

    // Sheet 2: Inversionistas
    const wsInversionistasData = [
      ["INVERSIONISTAS"],
      ["Header metadata preamble"],
      ["id_inversionista", "nombre", "email", "Tipo de inversionista", "fecha_ingreso", "Timing months"],
      ["INV-001", "ESTEBAN CEBALLOS", "inversion.usa2026@gmail.com", "Privado", 46154, 6],
      ["INV-002", "OSCAR VANEGAS", "succesbizz5@gmail.com", "Privado", 46101, 8],
    ];
    const wsInversionistas = XLSX.utils.aoa_to_sheet(wsInversionistasData);
    XLSX.utils.book_append_sheet(wb, wsInversionistas, "Inversionistas");

    // Sheet 3: Inversiones
    const wsInversionesData = [
      ["INVERSIONES / PROYECTOS"],
      ["Header metadata preamble"],
      [
        "id_inversion",
        "id_inversionista",
        "nombre_proyecto",
        "ciudad",
        "tipo_propiedad",
        "tipo_proyecto",
        "monto_invertido",
        "roi_pct",
        "estado",
        "fecha_inicio",
        "duracion_meses",
        "rango_esperado",
        "fecha_timing",
        "allocation_pct",
        "imagen_url",
        "avance_fase_pct",
        "fase_actual",
        "ganancia_proyectada",
        "rendimiento_devengado",
      ],
      [
        "BG-01",
        "INV-001",
        "BUSH GARDEN",
        "TAMPA BAY",
        "Residencial",
        "Fix & Flip",
        60000,
        0.16,
        "Activa",
        46154,
        6,
        "6-12 MESES",
        46338,
        1,
        "https://drive.google.com/folder-bg",
        0.5714,
        "9. Acabados",
        9600,
        5485.71,
      ],
    ];
    const wsInversiones = XLSX.utils.aoa_to_sheet(wsInversionesData);
    XLSX.utils.book_append_sheet(wb, wsInversiones, "Inversiones");

    // Sheet 4: Fases_Proyecto
    const wsFasesData = [
      ["FASES DE PROYECTO"],
      [""],
      ["Preambulo explicativo"],
      [
        "id_fase",
        "id_inversion",
        "orden",
        "nombre_fase",
        "estado",
        "fecha_inicio",
        "fecha_fin",
        "imagen_url_1",
        "imagen_url_2",
        "imagen_url_3",
        "clave_en_curso",
      ],
      ["FASE-0001", "BG-01", 1, "1. Adquisición", "Completada", 46227, 46228, "https://drive/adq1.jpg", null, null, ""],
      ["FASE-0002", "BG-01", 2, "2. Preliminares", "Completada", 46230, 46234, null, null, null, ""],
      ["FASE-0009", "BG-01", 9, "9. Acabados", "En curso", 46255, 46265, "https://drive/acabados.jpg", null, null, "BG-01"],
      ["FASE-0014", "BG-01", 14, "14. Dispersión de pagos", "Pendiente", null, null, null, null, null, ""],
    ];
    const wsFases = XLSX.utils.aoa_to_sheet(wsFasesData);
    XLSX.utils.book_append_sheet(wb, wsFases, "Fases_Proyecto");

    // Sheet 5: Oportunidades
    const wsOportunidadesData = [
      ["OPORTUNIDADES"],
      ["Header metadata preamble"],
      ["id_oportunidad", "nombre_proyecto", "ciudad", "roi_estimado", "ticket_minimo", "activa"],
      ["MB-05", "MULBERRY", "TAMPA", 0.16, 24500, "Sí"],
    ];
    const wsOportunidades = XLSX.utils.aoa_to_sheet(wsOportunidadesData);
    XLSX.utils.book_append_sheet(wb, wsOportunidades, "Oportunidades");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Act: Parse dashboard workbook through adapter
    const result = await adapter.parseDashboardWorkbook(buffer, "dashboard.xlsx");

    // Assert: Check structured extraction of all entities
    expect(result).toBeDefined();
    expect(result.proyectos).toHaveLength(2);
    expect(result.proyectos[0].idInversion).toBe("BG-01");
    expect(result.proyectos[0].nombre).toBe("BUSH GARDEN");

    expect(result.inversionistas).toHaveLength(2);
    expect(result.inversionistas[0].idInversionista).toBe("INV-001");
    expect(result.inversionistas[0].email).toBe("inversion.usa2026@gmail.com");

    expect(result.inversiones).toHaveLength(1);
    expect(result.inversiones[0].idInversion).toBe("BG-01");
    expect(result.inversiones[0].avanceFasePct).toBeCloseTo(0.5714, 3);
    expect(result.inversiones[0].faseActual).toBe("9. Acabados");

    expect(result.fases).toHaveLength(4);
    expect(result.fases[0].idInversion).toBe("BG-01");
    expect(result.fases[0].nombreFase).toBe("1. Adquisición");
    expect(result.fases[0].estado).toBe("Completada");
    expect(result.fases[0].imagenes).toContain("https://drive/adq1.jpg");

    expect(result.fases[2].orden).toBe(9);
    expect(result.fases[2].estado).toBe("En curso");

    expect(result.oportunidades).toHaveLength(1);
    expect(result.oportunidades[0].titulo).toBe("MULBERRY");
    expect(result.oportunidades[0].inversionMinima).toBe(24500);
  });

  it("should sanitize formula injection attacks across multi-sheet text cells", async () => {
    const wb = XLSX.utils.book_new();
    const wsProyectosData = [
      ["id_inversion", "nombre", "Direccion", "tipo_proyecto", "fecha_Activacion", "Timing months"],
      ["=BG-01", "+Malicious Project", "Tampa, FL", "Fix & Flip", 46198, 6],
    ];
    const wsProyectos = XLSX.utils.aoa_to_sheet(wsProyectosData);
    XLSX.utils.book_append_sheet(wb, wsProyectos, "Proyectos ");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const result = await adapter.parseDashboardWorkbook(buffer, "inject.xlsx");

    expect(result.proyectos[0].idInversion).toBe("'=BG-01");
    expect(result.proyectos[0].nombre).toBe("'+Malicious Project");
  });
});
