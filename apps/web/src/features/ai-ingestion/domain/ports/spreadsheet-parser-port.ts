/**
 * ============================================================================
 * Layer 3: Domain - Spreadsheet Parser Port & Domain Errors
 * ============================================================================
 * Purpose: Defines the contract for parsing tabular Excel (.xlsx, .xls) and CSV
 * spreadsheets into normalized canonical records with safety limits.
 * Invariants:
 *  - Safety limit: MAX_SPREADSHEET_ROWS = 5000, MAX_SPREADSHEET_COLUMNS = 100.
 *  - Output rows validated and sanitized against formula injection.
 *  - Pure domain representation, zero external SDK types in signatures.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import { CanonicalClient } from '../schemas/canonical-client-schema';

/**
 * Maximum row and column safety limits for serverless spreadsheet ingestion.
 */
export const MAX_SPREADSHEET_ROWS = 5000;
export const MAX_SPREADSHEET_COLUMNS = 100;

/**
 * Domain error codes for spreadsheet operations.
 */
export type SpreadsheetErrorCode =
  | 'EMPTY_SPREADSHEET'
  | 'MAX_ROWS_EXCEEDED'
  | 'CORRUPTED_FILE'
  | 'PARSING_FAILED';

/**
 * Domain Error for Spreadsheet operations.
 */
export class SpreadsheetDomainError extends Error {
  public readonly code: SpreadsheetErrorCode;
  public readonly retryable: boolean;
  public readonly originalError?: unknown;

  constructor(
    code: SpreadsheetErrorCode,
    message: string,
    retryable = false,
    originalError?: unknown
  ) {
    super(`[SpreadsheetDomainError:${code}] ${message}`);
    this.name = 'SpreadsheetDomainError';
    this.code = code;
    this.retryable = retryable;
    this.originalError = originalError;
    Object.setPrototypeOf(this, SpreadsheetDomainError.prototype);
  }
}

/**
 * Sheet representation with parsed and sanitized row entities.
 */
export interface ParsedWorksheet {
  readonly sheetName: string;
  readonly headers: readonly string[];
  readonly clients: readonly CanonicalClient[];
  readonly totalRows: number;
}

/**
 * Result payload from spreadsheet parsing.
 */
export interface ParsedSpreadsheetResult {
  readonly filename: string;
  readonly sheets: readonly ParsedWorksheet[];
  readonly totalEntitiesExtracted: number;
}

/**
 * Port interface for Spreadsheet Parsing.
 */
export interface ISpreadsheetParserPort {
  /**
   * Parses an XLSX or CSV buffer into structured canonical entities.
   * 
   * @param buffer - Raw binary spreadsheet buffer
   * @param filename - Source filename for format detection
   * @returns ParsedSpreadsheetResult
   */
  parseSpreadsheet(
    buffer: Uint8Array | Buffer,
    filename: string
  ): Promise<ParsedSpreadsheetResult>;
}
