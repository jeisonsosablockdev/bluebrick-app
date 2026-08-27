/**
 * ============================================================================
 * Layer 3: Domain - NIT Modulo 11 Checksum Validator
 * ============================================================================
 * Purpose: Provides algorithmic validation of Colombian Tax IDs (NIT - Número de
 * Identificación Tributaria) using DIAN's Modulo 11 verification formula.
 * Invariants:
 *  - Deterministically catches OCR misreads (e.g. 'B' vs '8', 'O' vs '0').
 *  - Pure mathematical calculation, zero external dependencies.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

/**
 * Prime weights array for Modulo 11 calculation (DIAN standard).
 */
const NIT_WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71] as const;

/**
 * NIT validation result.
 */
export interface NitValidationResult {
  readonly isValid: boolean;
  readonly cleanedNit: string;
  readonly baseNumber: string;
  readonly calculatedCheckDigit: number;
  readonly providedCheckDigit: number | null;
  readonly formattedNit: string;
  readonly reason?: string;
}

/**
 * Validates a Colombian NIT using DIAN's Modulo 11 check digit formula.
 * 
 * @param rawNit - Raw NIT string (e.g. "900.123.456-7" or "9001234567")
 * @returns NitValidationResult
 */
export function validateNitChecksum(rawNit: string): NitValidationResult {
  // Step 1: Sanitize input and extract digits
  if (!rawNit || typeof rawNit !== 'string') {
    return {
      isValid: false,
      cleanedNit: '',
      baseNumber: '',
      calculatedCheckDigit: -1,
      providedCheckDigit: null,
      formattedNit: '',
      reason: 'Empty or invalid NIT string',
    };
  }

  const trimmed = rawNit.trim();
  let baseNumber = '';
  let providedCheckDigit: number | null = null;

  // Step 2: Separate base number from check digit if hyphen is present
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    baseNumber = parts[0].replace(/\D/g, '');
    const digitStr = parts[1].replace(/\D/g, '');
    providedCheckDigit = digitStr.length > 0 ? parseInt(digitStr.charAt(0), 10) : null;
  } else {
    const allDigits = trimmed.replace(/\D/g, '');
    if (allDigits.length > 1) {
      baseNumber = allDigits.slice(0, -1);
      providedCheckDigit = parseInt(allDigits.slice(-1), 10);
    } else {
      baseNumber = allDigits;
    }
  }

  if (baseNumber.length === 0 || baseNumber.length > 15) {
    return {
      isValid: false,
      cleanedNit: trimmed,
      baseNumber,
      calculatedCheckDigit: -1,
      providedCheckDigit,
      formattedNit: trimmed,
      reason: 'NIT base number must have between 1 and 15 digits',
    };
  }

  // Step 3: Compute weighted sum from right to left using DIAN weights
  let sum = 0;
  const len = baseNumber.length;
  for (let i = 0; i < len; i++) {
    const digit = parseInt(baseNumber.charAt(len - 1 - i), 10);
    sum += digit * NIT_WEIGHTS[i];
  }

  // Step 4: Compute Modulo 11 check digit
  const remainder = sum % 11;
  let calculatedCheckDigit: number;
  if (remainder === 0 || remainder === 1) {
    calculatedCheckDigit = remainder;
  } else {
    calculatedCheckDigit = 11 - remainder;
  }

  // Step 5: Check match
  const isValid = providedCheckDigit !== null ? providedCheckDigit === calculatedCheckDigit : true;

  const formattedNit = `${baseNumber}-${calculatedCheckDigit}`;

  return {
    isValid,
    cleanedNit: `${baseNumber}${providedCheckDigit !== null ? `-${providedCheckDigit}` : ''}`,
    baseNumber,
    calculatedCheckDigit,
    providedCheckDigit,
    formattedNit,
    reason: isValid ? undefined : `Check digit mismatch: expected ${calculatedCheckDigit}, received ${providedCheckDigit}`,
  };
}
