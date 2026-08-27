/**
 * ============================================================================
 * Layer 4: Infrastructure - Gemini PDF Contract Extractor Adapter
 * ============================================================================
 * Purpose: Multimodal legal contract extraction using Gemini, pre-flight encryption
 * detection, NIT Modulo 11 validation, and CanonicalClient schema enforcement.
 * Invariants:
 *  - Server-only execution.
 *  - Rejects encrypted PDFs immediately with ENCRYPTED_PDF_REJECTED.
 *  - Enforces Modulo 11 DIAN checksum validation on extracted taxId.
 *  - Strictly conforms output to CanonicalClientSchema.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import 'server-only';
import {
  IPdfExtractorPort,
  PdfContractExtractionResult,
  PdfExtractorDomainError,
} from '../domain/ports/pdf-extractor-port';
import { CanonicalClientSchema } from '../domain/schemas/canonical-client-schema';
import { validateNitChecksum } from '../domain/validators/nit-validator';
import { escapeXml } from './gemini-video-tagger-adapter';

/**
 * Checks if a PDF buffer contains encryption dictionaries (/Encrypt).
 * 
 * @param buffer - Binary PDF buffer
 * @returns True if encrypted, false otherwise
 */
export function isPdfEncrypted(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 10) return false;
  // Scan binary contents for /Encrypt token
  const str = buffer.toString('binary');
  return str.includes('/Encrypt');
}

/**
 * Configuration options for GeminiPdfExtractorAdapter.
 */
export interface GeminiPdfExtractorConfig {
  readonly apiKey?: string;
  readonly model?: string;
  readonly timeoutMs?: number;
}

/**
 * Adapter implementing IPdfExtractorPort using Gemini multimodal PDF vision.
 */
export class GeminiPdfExtractorAdapter implements IPdfExtractorPort {
  private readonly apiKey?: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(config: GeminiPdfExtractorConfig = {}) {
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    this.model = config.model || 'gemini-2.5-flash';
    this.timeoutMs = config.timeoutMs ?? 10000;
  }

  /**
   * Parses a PDF contract buffer and extracts canonical client data.
   */
  public async extractContractData(
    pdfBuffer: Uint8Array | Buffer,
    filename: string
  ): Promise<PdfContractExtractionResult> {
    const rawBuffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);

    // Step 1: Pre-flight format validation
    if (!rawBuffer || rawBuffer.length < 4 || !rawBuffer.slice(0, 4).toString('utf-8').startsWith('%PDF')) {
      throw new PdfExtractorDomainError(
        'MALFORMED_PDF',
        'File is not a valid PDF document (missing %PDF header)'
      );
    }

    // Step 2: Pre-flight encryption check
    if (isPdfEncrypted(rawBuffer)) {
      throw new PdfExtractorDomainError(
        'ENCRYPTED_PDF_REJECTED',
        'PDF document is password-protected or encrypted and cannot be processed automatically'
      );
    }

    // Step 3: Check API key
    const activeKey = this.apiKey || process.env.GEMINI_API_KEY;
    if (!activeKey) {
      throw new PdfExtractorDomainError(
        'API_KEY_MISSING',
        'GEMINI_API_KEY environment variable is not configured'
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const base64Pdf = rawBuffer.toString('base64');
      const safeFilename = escapeXml(filename);

      const prompt = `You are a legal contract analysis assistant for real estate investments.
Analyze this legal contract / promise of sale document.
<document_context>
  <filename>${safeFilename}</filename>
</document_context>

Extract the following entities accurately:
- "name": Full legal name of the client / buyer / promitente comprador (string).
- "taxId": Tax identification number / NIT / Cédula (string, e.g. "900123456-7" or "1020304050").
- "email": Contact email address if found (string or null).
- "phone": Contact phone number if found (string or null).
- "contractAmount": Total contract value as a clean decimal string with no currency symbols or thousands separators (e.g. "350000000.00" or null).
- "summary": 1-2 sentence legal summary of the transaction (string).
- "confidenceScore": Overall extraction confidence percentage from 0 to 100 (number).

Return ONLY valid JSON matching this schema.`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${activeKey}`;

      // Step 4: Execute multimodal inference request
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: 'application/pdf',
                    data: base64Pdf,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new PdfExtractorDomainError(
          'EXTRACTION_FAILED',
          `Gemini API returned HTTP ${response.status}`,
          response.status >= 500
        );
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      };

      const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJsonText) {
        throw new PdfExtractorDomainError(
          'EXTRACTION_FAILED',
          'Empty response from legal extraction model'
        );
      }

      // Step 5: Parse JSON and validate against CanonicalClientSchema
      const parsed = JSON.parse(rawJsonText) as {
        name?: string;
        taxId?: string | null;
        email?: string | null;
        phone?: string | null;
        contractAmount?: string | null;
        summary?: string;
        confidenceScore?: number;
      };

      // Step 6: Validate Tax ID via DIAN Modulo 11 if present
      let nitValidation;
      if (parsed.taxId) {
        nitValidation = validateNitChecksum(parsed.taxId);
      }

      // Step 7: Parse canonical client
      const validatedClient = CanonicalClientSchema.parse({
        name: parsed.name || 'Cliente No Identificado',
        taxId: nitValidation?.isValid ? nitValidation.formattedNit : parsed.taxId || null,
        email: parsed.email || null,
        phone: parsed.phone || null,
        contractAmount: parsed.contractAmount || null,
        status: 'PENDING',
        metadata: {
          sourceFilename: filename,
          nitValidation,
        },
      });

      const confidenceScore = typeof parsed.confidenceScore === 'number'
        ? Math.min(Math.max(parsed.confidenceScore, 0), 100)
        : 80;

      return {
        extractedClient: validatedClient,
        summary: parsed.summary || `Contrato procesado para ${validatedClient.name}`,
        confidenceScore,
        nitValidation,
        isEncrypted: false,
      };
    } catch (err: unknown) {
      if (err instanceof PdfExtractorDomainError) {
        throw err;
      }
      throw new PdfExtractorDomainError(
        'EXTRACTION_FAILED',
        `PDF extraction error: ${(err as Error)?.message || 'Unknown error'}`,
        false,
        err
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
