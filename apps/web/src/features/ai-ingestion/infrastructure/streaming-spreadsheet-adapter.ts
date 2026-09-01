/**
 * ============================================================================
 * Layer 4: Infrastructure - Streaming Spreadsheet Adapter
 * ============================================================================
 * Purpose: Parses XLSX / CSV workbooks, sanitizes cell values against formula
 * injections, and maps tabular data to canonical domain client entities.
 * Invariants:
 *  - Server-only execution.
 *  - Enforces safety limits: max 5,000 rows per sheet.
 *  - Sanitizes cell values to neutralize CSV/DDE attacks.
 *  - Conforms mapped rows to CanonicalClientSchema.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import 'server-only';
import * as XLSX from 'xlsx';
import {
  ISpreadsheetParserPort,
  ParsedSpreadsheetResult,
  ParsedWorksheet,
  MAX_SPREADSHEET_ROWS,
  MAX_SPREADSHEET_COLUMNS,
  SpreadsheetDomainError,
} from '../domain/ports/spreadsheet-parser-port';
import {
  CanonicalClient,
  CanonicalClientSchema,
} from '../domain/schemas/canonical-client-schema';
import {
  CanonicalDashboardWorkbook,
  CanonicalDashboardWorkbookSchema,
  CanonicalDashboardProject,
  CanonicalInvestor,
  CanonicalInvestment,
  CanonicalProjectPhase,
  CanonicalOpportunity,
  CanonicalReinvestmentTransaction,
  CanonicalInvestorSummary,
  ProjectPhaseStatus,
  PROJECT_PHASE_STATUSES,
} from '../domain/schemas/canonical-dashboard-schema';
import {
  sanitizeSpreadsheetCell,
  excelSerialToIsoDate,
} from '../domain/utils/excel-date-converter';

/**
 * Adapter implementing ISpreadsheetParserPort using SheetJS.
 */
export class StreamingSpreadsheetAdapter implements ISpreadsheetParserPort {
  /**
   * Parses an XLSX or CSV buffer into structured canonical entities.
   */
  public async parseSpreadsheet(
    buffer: Uint8Array | Buffer,
    filename: string
  ): Promise<ParsedSpreadsheetResult> {
    const rawBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

    if (!rawBuffer || rawBuffer.length === 0) {
      throw new SpreadsheetDomainError(
        'EMPTY_SPREADSHEET',
        'Spreadsheet file buffer is empty'
      );
    }

    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(rawBuffer, {
        type: 'buffer',
        cellDates: true,
        dense: true,
      });
    } catch (err) {
      throw new SpreadsheetDomainError(
        'CORRUPTED_FILE',
        `Failed to parse spreadsheet structure: ${(err as Error)?.message || 'Invalid format'}`,
        false,
        err
      );
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new SpreadsheetDomainError(
        'EMPTY_SPREADSHEET',
        'Spreadsheet contains no worksheets'
      );
    }

    const parsedSheets: ParsedWorksheet[] = [];
    let totalEntitiesExtracted = 0;

    // Step 1: Iterate over worksheets
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const rawRows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        raw: true,
        defval: null,
      }) as unknown[][];

      if (!rawRows || rawRows.length < 2) {
        // Less than 2 rows (header + at least 1 data row)
        continue;
      }

      // Step 2: Dynamically detect header row within first 10 rows (handles title/description preambles)
      let headerRowIndex = 0;
      let colMap = this.mapHeaderColumns(
        (rawRows[0] || []).slice(0, MAX_SPREADSHEET_COLUMNS).map((h) => String(sanitizeSpreadsheetCell(h) ?? '').trim())
      );
      let bestScore = Object.keys(colMap).length;

      for (let r = 1; r < Math.min(rawRows.length, 10); r++) {
        const candidateHeaders = (rawRows[r] || [])
          .slice(0, MAX_SPREADSHEET_COLUMNS)
          .map((h) => String(sanitizeSpreadsheetCell(h) ?? '').trim());
        const candidateMap = this.mapHeaderColumns(candidateHeaders);
        const score = Object.keys(candidateMap).length;
        if (score > bestScore) {
          bestScore = score;
          headerRowIndex = r;
          colMap = candidateMap;
        }
      }

      const rawHeaderRow = rawRows[headerRowIndex] || [];
      const headers = rawHeaderRow
        .slice(0, MAX_SPREADSHEET_COLUMNS)
        .map((h) => String(sanitizeSpreadsheetCell(h) ?? '').trim());

      // Step 3: Enforce row safety limits (max 5000 rows starting after detected header)
      const dataRows = rawRows.slice(headerRowIndex + 1, headerRowIndex + 1 + MAX_SPREADSHEET_ROWS);
      const extractedClients: CanonicalClient[] = [];

      for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
        const row = dataRows[rowIndex] || [];
        const client = this.parseClientRow(row, colMap, headers, filename, sheetName, headerRowIndex + rowIndex + 2);
        if (client) {
          extractedClients.push(client);
        }
      }

      parsedSheets.push({
        sheetName,
        headers,
        clients: extractedClients,
        totalRows: dataRows.length,
      });

      totalEntitiesExtracted += extractedClients.length;
    }

    return {
      filename,
      sheets: parsedSheets,
      totalEntitiesExtracted,
    };
  }

  /**
   * Maps column headers to client properties based on common Spanish/English keywords.
   */
  private mapHeaderColumns(headers: string[]): Record<string, number> {
    const colMap: Record<string, number> = {};

    headers.forEach((h, idx) => {
      const lower = h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      if (!('name' in colMap) && (lower.includes('nombre') || lower.includes('cliente') || lower.includes('razon social') || lower.includes('name'))) {
        colMap.name = idx;
      } else if (!('taxId' in colMap) && (lower.includes('nit') || lower.includes('cedula') || lower.includes('documento') || lower.includes('identificacion') || lower.includes('tax'))) {
        colMap.taxId = idx;
      } else if (!('email' in colMap) && (lower.includes('correo') || lower.includes('email') || lower.includes('e-mail'))) {
        colMap.email = idx;
      } else if (!('phone' in colMap) && (lower.includes('telefono') || lower.includes('celular') || lower.includes('tel') || lower.includes('phone'))) {
        colMap.phone = idx;
      } else if (!('contractAmount' in colMap) && (lower.includes('monto') || lower.includes('valor') || lower.includes('inversion') || lower.includes('amount') || lower.includes('precio'))) {
        colMap.contractAmount = idx;
      }
    });

    return colMap;
  }

  /**
   * Parses a single row into a CanonicalClient entity.
   */
  private parseClientRow(
    row: unknown[],
    colMap: Record<string, number>,
    headers: string[],
    filename: string,
    sheetName: string,
    rowNumber: number
  ): CanonicalClient | null {
    // Step 1: Extract and sanitize raw cell values
    const rawName = colMap.name !== undefined ? row[colMap.name] : null;
    if (!rawName) return null; // Client name is mandatory

    const sanitizedName = String(sanitizeSpreadsheetCell(rawName) ?? '').trim();
    if (!sanitizedName) return null;

    const rawTaxId = colMap.taxId !== undefined ? row[colMap.taxId] : null;
    const sanitizedTaxId = rawTaxId ? String(sanitizeSpreadsheetCell(rawTaxId) ?? '').trim() : null;

    const rawEmail = colMap.email !== undefined ? row[colMap.email] : null;
    const sanitizedEmail = rawEmail ? String(sanitizeSpreadsheetCell(rawEmail) ?? '').trim().toLowerCase() : null;

    const rawPhone = colMap.phone !== undefined ? row[colMap.phone] : null;
    const sanitizedPhone = rawPhone ? String(sanitizeSpreadsheetCell(rawPhone) ?? '').trim() : null;

    const rawAmount = colMap.contractAmount !== undefined ? row[colMap.contractAmount] : null;
    let formattedAmount: string | null = null;
    if (typeof rawAmount === 'number' && Number.isFinite(rawAmount) && rawAmount >= 0) {
      formattedAmount = rawAmount.toFixed(2);
    } else if (typeof rawAmount === 'string') {
      const cleanNum = rawAmount.replace(/[^0-9.]/g, '');
      if (cleanNum && !Number.isNaN(parseFloat(cleanNum))) {
        formattedAmount = parseFloat(cleanNum).toFixed(2);
      }
    }

    // Step 2: Build extra metadata record
    const rowMetadata: Record<string, unknown> = {
      sourceFile: filename,
      sheet: sheetName,
      row: rowNumber,
    };

    // Include other columns as metadata attributes
    headers.forEach((header, idx) => {
      if (!Object.values(colMap).includes(idx) && row[idx] !== null && row[idx] !== undefined) {
        const cellVal = sanitizeSpreadsheetCell(row[idx]);
        if (typeof cellVal === 'number' && header.toLowerCase().includes('fecha')) {
          rowMetadata[header] = excelSerialToIsoDate(cellVal) || cellVal;
        } else {
          rowMetadata[header] = cellVal;
        }
      }
    });

    // Step 3: Validate through CanonicalClientSchema
    const parseResult = CanonicalClientSchema.safeParse({
      name: sanitizedName,
      taxId: sanitizedTaxId || null,
      email: sanitizedEmail || null,
      phone: sanitizedPhone || null,
      contractAmount: formattedAmount || null,
      status: 'PENDING',
      metadata: rowMetadata,
    });

    if (parseResult.success) {
      return parseResult.data;
    }

    return null;
  }

  /**
   * Parses all operational sheets from DASH-BOARD-Blue-Brick-Panel-Administracion.xlsx
   * into a consolidated, typed, and sanitized CanonicalDashboardWorkbook domain payload.
   * 
   * @param buffer - Binary workbook buffer (XLSX)
   * @param filename - Source filename for auditing
   * @returns Validated CanonicalDashboardWorkbook
   */
  public async parseDashboardWorkbook(
    buffer: Uint8Array | Buffer,
    filename: string
  ): Promise<CanonicalDashboardWorkbook> {
    const rawBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

    // Step 1: Invariant - Buffer cannot be empty
    if (!rawBuffer || rawBuffer.length === 0) {
      throw new SpreadsheetDomainError('EMPTY_SPREADSHEET', 'Dashboard spreadsheet buffer is empty');
    }

    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(rawBuffer, {
        type: 'buffer',
        cellDates: true,
        dense: true,
      });
    } catch (err) {
      throw new SpreadsheetDomainError(
        'CORRUPTED_FILE',
        `Failed to parse dashboard workbook: ${(err as Error)?.message || 'Invalid format'}`,
        false,
        err
      );
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new SpreadsheetDomainError('EMPTY_SPREADSHEET', 'Dashboard spreadsheet contains no worksheets');
    }

    // Step 2: Parse Sheet 'Proyectos '
    const proyectos = this.parseProyectosSheet(workbook);

    // Step 3: Parse Sheet 'Inversionistas'
    const inversionistas = this.parseInversionistasSheet(workbook);

    // Step 4: Parse Sheet 'Inversiones'
    const inversiones = this.parseInversionesSheet(workbook);

    // Step 5: Parse Sheet 'Fases_Proyecto'
    const fases = this.parseFasesSheet(workbook);

    // Step 6: Parse Sheet 'Oportunidades'
    const oportunidades = this.parseOportunidadesSheet(workbook);

    // Step 7: Parse Sheet 'Transacciones_Reinversion'
    const transacciones = this.parseTransaccionesSheet(workbook);

    // Step 8: Parse Sheet 'Resumen_Dashboard'
    const resumenes = this.parseResumenSheet(workbook);

    // Step 9: Assemble and validate through CanonicalDashboardWorkbookSchema
    const unvalidated = {
      proyectos,
      inversionistas,
      inversiones,
      fases,
      oportunidades,
      transacciones,
      resumenes,
    };

    const parsed = CanonicalDashboardWorkbookSchema.parse(unvalidated);
    return parsed;
  }

  /**
   * Helper: Extracts rows from sheet matching a regular expression.
   */
  private getSheetRowsByName(workbook: XLSX.WorkBook, pattern: RegExp): unknown[][] | null {
    const sheetName = workbook.SheetNames.find((name) => pattern.test(name.trim()));
    if (!sheetName) return null;
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return null;
    return XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
      defval: null,
    }) as unknown[][];
  }

  /**
   * Helper: Finds header row index and sanitized lowercase headers within the first 10 rows.
   */
  private findHeaderRowInfo(rows: unknown[][]): { headerIndex: number; headers: string[] } {
    let headerIndex = 0;
    for (let r = 0; r < Math.min(rows.length, 10); r++) {
      const nonNulls = (rows[r] || []).filter((c) => c !== null && String(c).trim() !== '');
      if (nonNulls.length >= 3) {
        headerIndex = r;
        break;
      }
    }
    const headers = (rows[headerIndex] || []).map((h) =>
      String(sanitizeSpreadsheetCell(h) ?? '').trim().toLowerCase()
    );
    return { headerIndex, headers };
  }

  /**
   * Parses Sheet 'Proyectos ' into CanonicalDashboardProject array.
   */
  private parseProyectosSheet(workbook: XLSX.WorkBook): CanonicalDashboardProject[] {
    const rows = this.getSheetRowsByName(workbook, /^proyectos/i);
    if (!rows || rows.length < 2) return [];

    const { headerIndex, headers } = this.findHeaderRowInfo(rows);
    const colId = headers.findIndex((h) => h.includes('id_inversion') || h.includes('sku') || h.includes('id'));
    const colName = headers.findIndex((h) => h.includes('nombre') || h.includes('proyecto') || h.includes('name'));
    const colCity = headers.findIndex((h) => h.includes('ciudad') || h.includes('city') || h.includes('direccion'));
    const colTiming = headers.findIndex((h) => h.includes('timing') || h.includes('meses') || h.includes('duracion'));

    const projects: CanonicalDashboardProject[] = [];
    const dataRows = rows.slice(headerIndex + 1);

    for (const row of dataRows) {
      const rawId = colId !== -1 ? row[colId] : row[0];
      const rawName = colName !== -1 ? row[colName] : row[1];
      if (!rawId || !rawName) continue;

      const idInversion = String(sanitizeSpreadsheetCell(rawId) ?? '').trim();
      const nombre = String(sanitizeSpreadsheetCell(rawName) ?? '').trim();
      if (!idInversion || !nombre) continue;

      const rawCity = colCity !== -1 ? row[colCity] : 'Tampa, FL';
      const ciudad = String(sanitizeSpreadsheetCell(rawCity) ?? 'Tampa, FL').trim();
      const duracionMeses = colTiming !== -1 && typeof row[colTiming] === 'number' ? Number(row[colTiming]) : 6;

      projects.push({
        idInversion,
        nombre,
        ciudad,
        tipoProyecto: 'Residencial',
        duracionMeses,
        faseActual: '1. Adquisición',
        avanceFasePct: 0,
        driveUrl: null,
      });
    }

    return projects;
  }

  /**
   * Parses Sheet 'Inversionistas' into CanonicalInvestor array.
   */
  private parseInversionistasSheet(workbook: XLSX.WorkBook): CanonicalInvestor[] {
    const rows = this.getSheetRowsByName(workbook, /^inversionista/i);
    if (!rows || rows.length < 2) return [];

    const { headerIndex, headers } = this.findHeaderRowInfo(rows);
    const colId = headers.findIndex((h) => h.includes('id_inversionista') || h.includes('id'));
    const colName = headers.findIndex((h) => h.includes('nombre') || h.includes('inversionista') || h.includes('name'));
    const colEmail = headers.findIndex((h) => h.includes('email') || h.includes('correo'));
    const colTipo = headers.findIndex((h) => h.includes('tipo'));
    const colFecha = headers.findIndex((h) => h.includes('fecha'));
    const colTiming = headers.findIndex((h) => h.includes('timing'));

    const investors: CanonicalInvestor[] = [];
    const dataRows = rows.slice(headerIndex + 1);

    for (const row of dataRows) {
      const rawId = colId !== -1 ? row[colId] : null;
      const rawEmail = colEmail !== -1 ? row[colEmail] : null;
      if (!rawId || !rawEmail) continue;

      const idInversionista = String(sanitizeSpreadsheetCell(rawId) ?? '').trim();
      const rawName = colName !== -1 ? row[colName] : 'Inversionista';
      const nombre = String(sanitizeSpreadsheetCell(rawName) ?? 'Inversionista').trim();
      const cleanEmail = String(sanitizeSpreadsheetCell(rawEmail) ?? '').trim().toLowerCase();
      if (!cleanEmail.includes('@')) continue;

      const tipoInversionista = colTipo !== -1 && row[colTipo] ? String(sanitizeSpreadsheetCell(row[colTipo])) : 'Privado';
      const fechaIngreso = colFecha !== -1 && typeof row[colFecha] === 'number' ? excelSerialToIsoDate(row[colFecha]) : null;
      const timingMonths = colTiming !== -1 && typeof row[colTiming] === 'number' ? Number(row[colTiming]) : 6;

      investors.push({
        idInversionista,
        nombre,
        email: cleanEmail,
        tipoInversionista,
        fechaIngreso,
        timingMonths,
      });
    }

    return investors;
  }

  /**
   * Parses Sheet 'Inversiones' into CanonicalInvestment array.
   */
  private parseInversionesSheet(workbook: XLSX.WorkBook): CanonicalInvestment[] {
    const rows = this.getSheetRowsByName(workbook, /^inversione/i);
    if (!rows || rows.length < 2) return [];

    const { headerIndex, headers } = this.findHeaderRowInfo(rows);
    const colInv = headers.findIndex((h) => h.includes('id_inversion'));
    const colInvestor = headers.findIndex((h) => h.includes('id_inversionista'));
    const colName = headers.findIndex((h) => h.includes('nombre_proyecto') || h.includes('proyecto'));
    const colCity = headers.findIndex((h) => h.includes('ciudad') || h.includes('city'));
    const colMonto = headers.findIndex((h) => h.includes('monto') || h.includes('monto_invertido'));
    const colRoi = headers.findIndex((h) => h.includes('roi'));
    const colEstado = headers.findIndex((h) => h.includes('estado'));
    const colTiming = headers.findIndex((h) => h.includes('fecha_timing'));
    const colAvance = headers.findIndex((h) => h.includes('avance_fase_pct'));
    const colFase = headers.findIndex((h) => h.includes('fase_actual'));
    const colImg = headers.findIndex((h) => h.includes('imagen_url'));
    const colGanancia = headers.findIndex((h) => h.includes('ganancia'));
    const colRendimiento = headers.findIndex((h) => h.includes('rendimiento'));

    const investments: CanonicalInvestment[] = [];
    const dataRows = rows.slice(headerIndex + 1);

    for (let idx = 0; idx < dataRows.length; idx++) {
      const row = dataRows[idx] || [];
      const rawId = colInv !== -1 ? row[colInv] : null;
      if (!rawId) continue;

      const idInversion = String(sanitizeSpreadsheetCell(rawId) ?? '').trim();
      const idInversionista = colInvestor !== -1 && row[colInvestor] ? String(sanitizeSpreadsheetCell(row[colInvestor])).trim() : null;
      const nombreProyecto = colName !== -1 && row[colName] ? String(sanitizeSpreadsheetCell(row[colName])).trim() : 'Inversión Inmobiliaria';
      const ciudad = colCity !== -1 && row[colCity] ? String(sanitizeSpreadsheetCell(row[colCity])).trim() : 'TAMPA BAY';
      const montoInvertido = colMonto !== -1 && typeof row[colMonto] === 'number' ? Number(row[colMonto]) : 0;
      
      let roiPct = 0.15;
      if (colRoi !== -1 && typeof row[colRoi] === 'number') {
        roiPct = row[colRoi] > 1 ? Number((row[colRoi] / 100).toFixed(4)) : Number(row[colRoi]);
      }

      const estado = colEstado !== -1 && row[colEstado] ? String(sanitizeSpreadsheetCell(row[colEstado])).trim() : 'Activa';
      const avanceFasePct = colAvance !== -1 && typeof row[colAvance] === 'number' ? Number(row[colAvance]) : 0;
      const faseActual = colFase !== -1 && row[colFase] ? String(sanitizeSpreadsheetCell(row[colFase])).trim() : '1. Adquisición';
      const imagenUrl = colImg !== -1 && row[colImg] ? String(row[colImg]).trim() : null;
      const gananciaProyectada = colGanancia !== -1 && typeof row[colGanancia] === 'number' ? Number(row[colGanancia]) : 0;
      const rendimientoDevengado = colRendimiento !== -1 && typeof row[colRendimiento] === 'number' ? Number(row[colRendimiento]) : 0;
      const fechaTiming = colTiming !== -1 && typeof row[colTiming] === 'number' ? excelSerialToIsoDate(row[colTiming]) : null;

      investments.push({
        id: `INV_${idInversion}_${idInversionista || idx}`,
        idInversion,
        idInversionista,
        nombreProyecto,
        ciudad,
        tipoPropiedad: 'Residencial',
        tipoProyecto: 'Fix & Flip',
        montoInvertido,
        roiPct,
        estado,
        duracionMeses: 6,
        rangoEsperado: '6-12 MESES',
        fechaTiming,
        allocationPct: 1,
        imagenUrl,
        avanceFasePct,
        faseActual,
        gananciaProyectada,
        rendimientoDevengado,
      });
    }

    return investments;
  }

  /**
   * Parses Sheet 'Fases_Proyecto' into CanonicalProjectPhase array.
   */
  private parseFasesSheet(workbook: XLSX.WorkBook): CanonicalProjectPhase[] {
    const rows = this.getSheetRowsByName(workbook, /^fases/i);
    if (!rows || rows.length < 2) return [];

    const { headerIndex, headers } = this.findHeaderRowInfo(rows);
    const colFaseId = headers.findIndex((h) => h === 'id_fase' || h.includes('id_fase'));
    const colInvId = headers.findIndex((h) => h === 'id_inversion' || h.includes('id_inversion'));
    const colOrden = headers.findIndex((h) => h.includes('orden'));
    const colNombre = headers.findIndex(
      (h) => h === 'nombre_fase' || h.includes('nombre_fase') || (h.includes('nombre') && !h.includes('id'))
    );
    const colEstado = headers.findIndex((h) => h.includes('estado'));
    const colStart = headers.findIndex((h) => h.includes('fecha_inicio'));
    const colEnd = headers.findIndex((h) => h.includes('fecha_fin'));
    const colImg1 = headers.findIndex((h) => h.includes('imagen_url_1'));
    const colImg2 = headers.findIndex((h) => h.includes('imagen_url_2'));
    const colImg3 = headers.findIndex((h) => h.includes('imagen_url_3'));

    const phases: CanonicalProjectPhase[] = [];
    const dataRows = rows.slice(headerIndex + 1);

    for (const row of dataRows) {
      const rawFaseId = colFaseId !== -1 ? row[colFaseId] : null;
      const rawInvId = colInvId !== -1 ? row[colInvId] : null;
      if (!rawFaseId || !rawInvId) continue;

      const idFase = String(sanitizeSpreadsheetCell(rawFaseId) ?? '').trim();
      const idInversion = String(sanitizeSpreadsheetCell(rawInvId) ?? '').trim();
      if (!idFase || !idInversion || !idFase.startsWith('FASE-')) continue;

      const rawOrden = colOrden !== -1 && typeof row[colOrden] === 'number' ? Number(row[colOrden]) : 1;
      const orden = Math.max(1, Math.min(50, rawOrden));

      const rawNombre = colNombre !== -1 ? row[colNombre] : `Fase ${orden}`;
      const nombreFase = String(sanitizeSpreadsheetCell(rawNombre) ?? `Fase ${orden}`).trim();

      const rawEstado = colEstado !== -1 && row[colEstado] ? String(sanitizeSpreadsheetCell(row[colEstado])).trim() : 'Pendiente';
      const estado: ProjectPhaseStatus = (PROJECT_PHASE_STATUSES as readonly string[]).includes(rawEstado)
        ? (rawEstado as ProjectPhaseStatus)
        : 'Pendiente';

      const fechaInicio = colStart !== -1 && typeof row[colStart] === 'number' ? excelSerialToIsoDate(row[colStart]) : null;
      const fechaFin = colEnd !== -1 && typeof row[colEnd] === 'number' ? excelSerialToIsoDate(row[colEnd]) : null;

      const rawImgs = [
        colImg1 !== -1 ? row[colImg1] : null,
        colImg2 !== -1 ? row[colImg2] : null,
        colImg3 !== -1 ? row[colImg3] : null,
      ];
      const imagenes = rawImgs
        .filter((img): img is string => typeof img === 'string' && img.trim().length > 0)
        .map((img) => img.trim());

      phases.push({
        idFase,
        idInversion,
        orden,
        nombreFase,
        estado,
        fechaInicio,
        fechaFin,
        imagenes,
      });
    }

    return phases;
  }

  /**
   * Parses Sheet 'Oportunidades' into CanonicalOpportunity array.
   */
  private parseOportunidadesSheet(workbook: XLSX.WorkBook): CanonicalOpportunity[] {
    const rows = this.getSheetRowsByName(workbook, /^oportunidad/i);
    if (!rows || rows.length < 2) return [];

    const { headerIndex, headers } = this.findHeaderRowInfo(rows);
    const colId = headers.findIndex((h) => h.includes('id_oportunidad') || h.includes('id'));
    const colName = headers.findIndex((h) => h.includes('nombre_proyecto') || h.includes('proyecto') || h.includes('title'));
    const colCity = headers.findIndex((h) => h.includes('ciudad') || h.includes('city'));
    const colRoi = headers.findIndex((h) => h.includes('roi'));
    const colTicket = headers.findIndex((h) => h.includes('ticket') || h.includes('minimo') || h.includes('monto'));

    const opportunities: CanonicalOpportunity[] = [];
    const dataRows = rows.slice(headerIndex + 1);

    for (const row of dataRows) {
      const rawId = colId !== -1 ? row[colId] : null;
      const rawName = colName !== -1 ? row[colName] : null;
      if (!rawId || !rawName) continue;

      const id = String(sanitizeSpreadsheetCell(rawId) ?? '').trim();
      const titulo = String(sanitizeSpreadsheetCell(rawName) ?? '').trim();
      if (!id || !titulo) continue;

      const rawCity = colCity !== -1 && row[colCity] ? row[colCity] : 'TAMPA';
      const ciudad = String(sanitizeSpreadsheetCell(rawCity) ?? 'TAMPA').trim();

      let roiProyectado = 16.0;
      if (colRoi !== -1 && typeof row[colRoi] === 'number') {
        roiProyectado = row[colRoi] <= 1 ? Number((row[colRoi] * 100).toFixed(1)) : Number(row[colRoi].toFixed(1));
      }

      const inversionMinima = colTicket !== -1 && typeof row[colTicket] === 'number' ? Number(row[colTicket]) : 25000;

      opportunities.push({
        id,
        titulo,
        ciudad,
        roiProyectado,
        inversionMinima,
        diasRestantes: 15,
        gradient: 'linear-gradient(135deg,#16223B 0%,#1F0E14 100%)',
      });
    }

    return opportunities;
  }

  /**
   * Parses Sheet 'Transacciones_Reinversion' into CanonicalReinvestmentTransaction array.
   */
  private parseTransaccionesSheet(workbook: XLSX.WorkBook): CanonicalReinvestmentTransaction[] {
    const rows = this.getSheetRowsByName(workbook, /^transaccion/i);
    if (!rows || rows.length < 2) return [];

    const { headerIndex, headers } = this.findHeaderRowInfo(rows);
    const colTrxId = headers.findIndex((h) => h.includes('id_transaccion') || h.includes('id'));
    const colInvId = headers.findIndex((h) => h.includes('id_inversionista'));
    const colOppId = headers.findIndex((h) => h.includes('id_oportunidad'));
    const colMonto = headers.findIndex((h) => h.includes('monto'));
    const colFecha = headers.findIndex((h) => h.includes('fecha_solicitud') || h.includes('fecha'));
    const colEstado = headers.findIndex((h) => h.includes('estado'));

    const transactions: CanonicalReinvestmentTransaction[] = [];
    const dataRows = rows.slice(headerIndex + 1);

    for (const row of dataRows) {
      const rawTrx = colTrxId !== -1 ? row[colTrxId] : null;
      const rawInv = colInvId !== -1 ? row[colInvId] : null;
      if (!rawTrx || !rawInv) continue;

      const idTransaccion = String(sanitizeSpreadsheetCell(rawTrx) ?? '').trim();
      const idInversionista = String(sanitizeSpreadsheetCell(rawInv) ?? '').trim();
      if (!idTransaccion || !idInversionista) continue;

      const idOportunidad = colOppId !== -1 && row[colOppId] ? String(sanitizeSpreadsheetCell(row[colOppId])).trim() : null;
      const monto = colMonto !== -1 && typeof row[colMonto] === 'number' ? Number(row[colMonto]) : 0;
      const fechaSolicitud = colFecha !== -1 && typeof row[colFecha] === 'number' ? excelSerialToIsoDate(row[colFecha]) : null;

      const rawEstado = colEstado !== -1 && row[colEstado] ? String(sanitizeSpreadsheetCell(row[colEstado])).trim() : 'Pendiente';
      const estado = (['Pendiente', 'Confirmada', 'Rechazada'] as const).includes(rawEstado as any)
        ? (rawEstado as 'Pendiente' | 'Confirmada' | 'Rechazada')
        : 'Pendiente';

      transactions.push({
        idTransaccion,
        idInversionista,
        idOportunidad,
        idInversionOrigen: null,
        monto,
        fechaSolicitud,
        estado,
        fechaConfirmacion: null,
        idInversionGenerada: null,
      });
    }

    return transactions;
  }

  /**
   * Parses Sheet 'Resumen_Dashboard' into CanonicalInvestorSummary array.
   */
  private parseResumenSheet(workbook: XLSX.WorkBook): CanonicalInvestorSummary[] {
    const rows = this.getSheetRowsByName(workbook, /^resumen/i);
    if (!rows || rows.length < 2) return [];

    const { headerIndex, headers } = this.findHeaderRowInfo(rows);
    const colId = headers.findIndex((h) => h.includes('id_inversionista') || h.includes('id'));
    const colName = headers.findIndex((h) => h.includes('nombre') || h.includes('name'));
    const colPatrimonio = headers.findIndex((h) => h.includes('patrimonio'));
    const colRendimiento = headers.findIndex((h) => h.includes('rendimiento'));
    const colCapital = headers.findIndex((h) => h.includes('capital_total'));
    const colRoi = headers.findIndex((h) => h.includes('roi'));
    const colActivas = headers.findIndex((h) => h.includes('num_activas'));
    const colConcluidas = headers.findIndex((h) => h.includes('num_concluidas'));
    const colDisponible = headers.findIndex((h) => h.includes('disponible'));
    const colGanancia = headers.findIndex((h) => h.includes('ganancia'));

    const summaries: CanonicalInvestorSummary[] = [];
    const dataRows = rows.slice(headerIndex + 1);

    for (const row of dataRows) {
      const rawId = colId !== -1 ? row[colId] : null;
      if (!rawId) continue;

      const idInversionista = String(sanitizeSpreadsheetCell(rawId) ?? '').trim();
      if (!idInversionista || !idInversionista.startsWith('INV-')) continue;

      const rawName = colName !== -1 ? row[colName] : 'Inversionista';
      const nombre = String(sanitizeSpreadsheetCell(rawName) ?? 'Inversionista').trim();

      const patrimonioTotalInvertido = colPatrimonio !== -1 && typeof row[colPatrimonio] === 'number' ? Number(row[colPatrimonio]) : 0;
      const rendimientoAcumulado = colRendimiento !== -1 && typeof row[colRendimiento] === 'number' ? Number(row[colRendimiento]) : 0;
      const capitalTotalActual = colCapital !== -1 && typeof row[colCapital] === 'number' ? Number(row[colCapital]) : 0;
      const roiPonderado = colRoi !== -1 && typeof row[colRoi] === 'number' ? Number(row[colRoi]) : 0.15;
      const numActivas = colActivas !== -1 && typeof row[colActivas] === 'number' ? Number(row[colActivas]) : 0;
      const numConcluidas = colConcluidas !== -1 && typeof row[colConcluidas] === 'number' ? Number(row[colConcluidas]) : 0;
      const capitalDisponibleReinversion = colDisponible !== -1 && typeof row[colDisponible] === 'number' ? Number(row[colDisponible]) : 0;
      const gananciaProyectadaTotal = colGanancia !== -1 && typeof row[colGanancia] === 'number' ? Number(row[colGanancia]) : 0;

      summaries.push({
        idInversionista,
        nombre,
        patrimonioTotalInvertido,
        rendimientoAcumulado,
        capitalTotalActual,
        roiPonderado,
        numActivas,
        numConcluidas,
        capitalDisponibleReinversion,
        gananciaProyectadaTotal,
      });
    }

    return summaries;
  }
}

