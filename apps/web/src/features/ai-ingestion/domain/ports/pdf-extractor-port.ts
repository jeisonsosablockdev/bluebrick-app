/**
 * ============================================================================
 * Layer 3: Domain - PDF Contract Extractor Port & Domain Errors
 * ============================================================================
 * Purpose: Defines the contract for parsing PDF legal contracts, extracting client
 * & financial entities, verifying encryption flags, and validating tax IDs.
 * Invariants:
 *  - Encrypted PDFs must be detected and rejected immediately.
 *  - Outputs structured CanonicalClient entity validated against Zod contracts.
 *  - Pure domain representation, zero external SDK imports.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import { CanonicalClient } from '../schemas/canonical-client-schema';
import { NitValidationResult } from '../validators/nit-validator';

/**
 * Domain error codes for PDF extraction.
 */
export type PdfExtractorErrorCode =
  | 'ENCRYPTED_PDF_REJECTED'
  | 'EXTRACTION_FAILED'
  | 'MALFORMED_PDF'
  | 'TIMEOUT'
  | 'API_KEY_MISSING';

/**
 * Domain Error for PDF Extraction operations.
 */
export class PdfExtractorDomainError extends Error {
  public readonly code: PdfExtractorErrorCode;
  public readonly retryable: boolean;
  public readonly originalError?: unknown;

  constructor(
    code: PdfExtractorErrorCode,
    message: string,
    retryable = false,
    originalError?: unknown
  ) {
    super(`[PdfExtractorDomainError:${code}] ${message}`);
    this.name = 'PdfExtractorDomainError';
    this.code = code;
    this.retryable = retryable;
    this.originalError = originalError;
    Object.setPrototypeOf(this, PdfExtractorDomainError.prototype);
  }
}

/**
 * Result payload from PDF contract extraction.
 */
export interface PdfContractExtractionResult {
  readonly extractedClient: CanonicalClient;
  readonly summary: string;
  readonly confidenceScore: number;
  readonly nitValidation?: NitValidationResult;
  readonly isEncrypted: boolean;
}

/**
 * Port interface for PDF Contract Extractor.
 */
export interface IPdfExtractorPort {
  /**
   * Parses a PDF contract buffer, checks for encryption, and extracts canonical client data.
   * 
   * @param pdfBuffer - Raw binary PDF buffer
   * @param filename - Source filename for contextual awareness
   * @returns PdfContractExtractionResult
   */
  extractContractData(
    pdfBuffer: Uint8Array | Buffer,
    filename: string
  ): Promise<PdfContractExtractionResult>;
}
