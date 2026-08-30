/**
 * ============================================================================
 * Layer 4: Infrastructure - Gemini PDF Extractor Adapter Test Suite
 * ============================================================================
 * Tests NIT Modulo 11 checksum calculation, PDF encryption detection,
 * error boundaries, and multimodal canonical extraction.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GeminiPdfExtractorAdapter,
  isPdfEncrypted,
} from './gemini-pdf-extractor-adapter';
import { validateNitChecksum } from '../domain/validators/nit-validator';

describe('PDF Contract Extractor & NIT Validator', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateNitChecksum()', () => {
    it('validates a correct Colombian NIT (890900943-1)', () => {
      const result = validateNitChecksum('890900943-1');
      expect(result.isValid).toBe(true);
      expect(result.calculatedCheckDigit).toBe(1);
      expect(result.providedCheckDigit).toBe(1);
      expect(result.formattedNit).toBe('890900943-1');
    });

    it('validates 900123456-8 and formats correctly', () => {
      const result = validateNitChecksum('900.123.456-8');
      expect(result.isValid).toBe(true);
      expect(result.calculatedCheckDigit).toBe(8);
      expect(result.formattedNit).toBe('900123456-8');
    });

    it('flags check digit mismatch on invalid NIT (890900943-9)', () => {
      const result = validateNitChecksum('890900943-9');
      expect(result.isValid).toBe(false);
      expect(result.calculatedCheckDigit).toBe(1);
      expect(result.providedCheckDigit).toBe(9);
      expect(result.reason).toContain('Check digit mismatch');
    });
  });

  describe('isPdfEncrypted()', () => {
    it('detects /Encrypt marker in binary PDF header', () => {
      const encryptedPdf = Buffer.from('%PDF-1.7 ... /Encrypt 12 0 R ... %%EOF');
      expect(isPdfEncrypted(encryptedPdf)).toBe(true);
    });

    it('returns false for unencrypted PDF', () => {
      const cleanPdf = Buffer.from('%PDF-1.7 ... /Root 1 0 R ... %%EOF');
      expect(isPdfEncrypted(cleanPdf)).toBe(false);
    });
  });

  describe('GeminiPdfExtractorAdapter', () => {
    it('throws MALFORMED_PDF if file does not start with %PDF', async () => {
      const adapter = new GeminiPdfExtractorAdapter({ apiKey: 'mock-key' });
      const notAPdf = Buffer.from('This is a text file, not a PDF');

      await expect(
        adapter.extractContractData(notAPdf, 'document.txt')
      ).rejects.toMatchObject({
        code: 'MALFORMED_PDF',
      });
    });

    it('throws ENCRYPTED_PDF_REJECTED if PDF is password-protected', async () => {
      const adapter = new GeminiPdfExtractorAdapter({ apiKey: 'mock-key' });
      const encryptedPdf = Buffer.from('%PDF-1.4\n/Encrypt 5 0 R\ntrailer<<>>\n%%EOF');

      await expect(
        adapter.extractContractData(encryptedPdf, 'locked_contract.pdf')
      ).rejects.toMatchObject({
        code: 'ENCRYPTED_PDF_REJECTED',
      });
    });

    it('throws API_KEY_MISSING if no Gemini API key is configured', async () => {
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      try {
        const adapter = new GeminiPdfExtractorAdapter({});
        const validPdf = Buffer.from('%PDF-1.7\n1 0 obj<<>>endobj\n%%EOF');

        await expect(
          adapter.extractContractData(validPdf, 'contract.pdf')
        ).rejects.toMatchObject({
          code: 'API_KEY_MISSING',
        });
      } finally {
        process.env.GEMINI_API_KEY = originalKey;
      }
    });

    it('parses valid contract and conforms output to CanonicalClientSchema', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      name: 'Inversiones Bogotá S.A.S.',
                      taxId: '890900943-1',
                      email: 'legal@bogotainv.com',
                      phone: '+57 310 999 8877',
                      contractAmount: '450000000.00',
                      summary: 'Promesa de compraventa apartamento 1204 Torre Norte.',
                      confidenceScore: 94,
                    }),
                  },
                ],
              },
            },
          ],
        }),
      }));

      const adapter = new GeminiPdfExtractorAdapter({ apiKey: 'mock-key' });
      const validPdf = Buffer.from('%PDF-1.7\n1 0 obj<<>>endobj\n%%EOF');

      const result = await adapter.extractContractData(validPdf, 'promesa_compraventa.pdf');

      expect(result.isEncrypted).toBe(false);
      expect(result.extractedClient.name).toBe('Inversiones Bogotá S.A.S.');
      expect(result.extractedClient.taxId).toBe('890900943-1');
      expect(result.extractedClient.contractAmount).toBe('450000000.00');
      expect(result.extractedClient.email).toBe('legal@bogotainv.com');
      expect(result.confidenceScore).toBe(94);
      expect(result.nitValidation?.isValid).toBe(true);
    });
  });
});
