/**
 * ============================================================================
 * Layer 3: Domain - Spreadsheet Utilities, Dates & Formula Neutralizer
 * ============================================================================
 * Purpose: Provides pure domain functions to convert Excel serial date numbers to
 * ISO-8601 strings and neutralize CSV / DDE formula injection vulnerabilities.
 * Invariants:
 *  - Formula Injection: Prepends single quote (') to cells starting with =, +, -, @, \t, \r.
 *  - Formula Errors: Coerces error strings (#REF!, #DIV/0!, #N/A, #VALUE!, #NAME?) to null.
 *  - Pure domain calculations, zero external framework dependencies.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

/**
 * Known Excel error token strings to coerce to null.
 */
const EXCEL_FORMULA_ERRORS = new Set([
  '#REF!',
  '#DIV/0!',
  '#N/A',
  '#VALUE!',
  '#NAME?',
  '#NULL!',
  '#NUM!',
]);

/**
 * Converts an Excel serial date number (e.g. 44562 for 2022-01-01) to an ISO YYYY-MM-DD string.
 * Accounts for the 1900 leap-year epoch offset.
 * 
 * @param serial - Positive numeric serial date
 * @returns ISO date string (YYYY-MM-DD) or null if invalid
 */
export function excelSerialToIsoDate(serial: number): string | null {
  // Step 1: Validate input is a positive finite number
  if (typeof serial !== 'number' || Number.isNaN(serial) || !Number.isFinite(serial) || serial <= 0) {
    return null;
  }

  // Step 2: Excel epoch is Dec 30, 1899 (day 25569 before Unix epoch Jan 1 1970)
  const utcDays = Math.floor(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

/**
 * Sanitizes a spreadsheet cell value to prevent CSV / Dynamic Data Exchange (DDE) formula injections.
 * 
 * @param val - Raw cell value of unknown type
 * @returns Safe sanitized cell value
 */
export function sanitizeSpreadsheetCell(val: unknown): unknown {
  // Step 1: Handle null, undefined, and non-strings
  if (val === null || val === undefined) {
    return null;
  }

  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : null;
  }

  if (typeof val !== 'string') {
    return val;
  }

  // Step 2: Neutralize raw whitespace-based formula injection prefixes (\t, \r)
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  for (const prefix of dangerousPrefixes) {
    if (val.startsWith(prefix)) {
      return `'${val}`;
    }
  }

  const trimmed = val.trim();

  // Step 3: Coerce formula error literals to null
  if (EXCEL_FORMULA_ERRORS.has(trimmed.toUpperCase())) {
    return null;
  }

  // Step 4: Neutralize formula injection on trimmed string
  for (const prefix of dangerousPrefixes) {
    if (trimmed.startsWith(prefix)) {
      return `'${trimmed}`;
    }
  }

  return trimmed;
}
