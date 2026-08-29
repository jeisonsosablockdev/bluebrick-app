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
}
