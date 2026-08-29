/**
 * ============================================================================
 * Layer 3: Domain - Canonical Schemas Unit Test Suite
 * ============================================================================
 * Tests data invariants, prototype pollution immunity, financial decimal precision,
 * strict property stripping, and HITL issue formatting.
 */

import { describe, it, expect } from 'vitest';
import {
  CanonicalClientSchema,
  stripPrototypeProperties,
} from './canonical-client-schema';
import { CanonicalProjectSchema } from './canonical-project-schema';
import { CanonicalMediaSchema } from './canonical-media-schema';
import {
  CanonicalSyncRecordSchema,
  formatZodIssuesForHitl,
} from './canonical-sync-record-schema';

describe('Domain: Canonical Schemas & Data Contracts', () => {
  describe('stripPrototypeProperties()', () => {
    it('removes __proto__, constructor, and prototype from objects', () => {
      const maliciousPayload = JSON.parse(
        '{"name": "Valid", "__proto__": {"polluted": true}, "nested": {"constructor": "exploit", "value": 42}}'
      );

      const cleaned = stripPrototypeProperties(maliciousPayload) as Record<string, unknown>;

      expect(cleaned.name).toBe('Valid');
      expect(Object.prototype.hasOwnProperty.call(cleaned, '__proto__')).toBe(false);
      expect((cleaned.nested as Record<string, unknown>).value).toBe(42);
      expect(Object.prototype.hasOwnProperty.call(cleaned.nested, 'constructor')).toBe(false);
    });

    it('handles arrays and primitives gracefully', () => {
      expect(stripPrototypeProperties(null)).toBeNull();
      expect(stripPrototypeProperties('hello')).toBe('hello');
      expect(stripPrototypeProperties(123)).toBe(123);
      expect(stripPrototypeProperties([1, 2, { name: 'Item' }])).toEqual([1, 2, { name: 'Item' }]);
    });
  });

  describe('CanonicalClientSchema', () => {
    it('accepts a valid complete client entity', () => {
      const validClient = {
        name: 'Inversiones Los Robles S.A.S.',
        taxId: '900.123.456-7',
        email: 'contacto@losrobles.co',
        phone: '+57 300 123 4567',
        contractAmount: '250000000.50',
        status: 'ACTIVE',
        metadata: { source: 'PDF_INGESTION' },
      };

      const result = CanonicalClientSchema.safeParse(validClient);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Inversiones Los Robles S.A.S.');
        expect(result.data.contractAmount).toBe('250000000.50');
        expect(result.data.status).toBe('ACTIVE');
      }
    });

    it('rejects invalid financial monetary formats', () => {
      const invalidAmounts = [
        '123.456', // >2 decimal places
        '-500',    // negative amount
        'NaN',
        'Infinity',
        '1,000.00', // comma formatted
        'abc',
      ];

      for (const amount of invalidAmounts) {
        const result = CanonicalClientSchema.safeParse({
          name: 'Test Client',
          contractAmount: amount,
        });
        expect(result.success).toBe(false);
      }
    });

    it('rejects invalid email formats', () => {
      const result = CanonicalClientSchema.safeParse({
        name: 'Test Client',
        email: 'invalid-email-string',
      });
      expect(result.success).toBe(false);
    });

    it('strips unknown hallucinated fields from input', () => {
      const payloadWithHallucinations = {
        name: 'Clean Client',
        hallucinatedField: 'AI invented this',
        secretInternalNote: 12345,
      };

      const parsed = CanonicalClientSchema.parse(payloadWithHallucinations) as Record<string, unknown>;
      expect(parsed.name).toBe('Clean Client');
      expect(parsed.hallucinatedField).toBeUndefined();
      expect(parsed.secretInternalNote).toBeUndefined();
    });
  });

  describe('CanonicalProjectSchema', () => {
    it('accepts valid project and validates slug regex', () => {
      const validProject = {
        name: 'Torre del Parque II',
        slug: 'torre-del-parque-ii',
        description: 'Proyecto residencial de alta plusvalía.',
        status: 'PLANNING',
      };

      const result = CanonicalProjectSchema.safeParse(validProject);
      expect(result.success).toBe(true);
    });

    it('rejects invalid slug characters (e.g. uppercase, spaces)', () => {
      const result = CanonicalProjectSchema.safeParse({
        name: 'Torre II',
        slug: 'Torre Invalid Slug!',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('CanonicalMediaSchema', () => {
    it('accepts valid image media with focal point coordinates', () => {
      const validMedia = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        blobUrl: 'https://public.blob.vercel-storage.com/projects/photo-123.webp',
        mediaType: 'IMAGE',
        caption: 'Fachada principal oriente',
        aiTags: ['fachada', 'exterior', 'atardecer'],
        focalPoint: { x: 0.75, y: 0.25 },
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
      };

      const result = CanonicalMediaSchema.safeParse(validMedia);
      expect(result.success).toBe(true);
    });

    it('rejects focal point coordinates outside [0.0, 1.0]', () => {
      const invalidMedia = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        blobUrl: 'https://public.blob.vercel-storage.com/photo.webp',
        mediaType: 'IMAGE',
        focalPoint: { x: 1.5, y: -0.2 },
      };

      const result = CanonicalMediaSchema.safeParse(invalidMedia);
      expect(result.success).toBe(false);
    });
  });

  describe('CanonicalSyncRecordSchema & formatZodIssuesForHitl()', () => {
    it('enforces confidence score range [0, 100]', () => {
      expect(CanonicalSyncRecordSchema.safeParse({
        driveFileId: 'drive-123',
        fileName: 'Contrato.pdf',
        confidenceScore: 95.5,
      }).success).toBe(true);

      expect(CanonicalSyncRecordSchema.safeParse({
        driveFileId: 'drive-123',
        fileName: 'Contrato.pdf',
        confidenceScore: 105, // > 100
      }).success).toBe(false);

      expect(CanonicalSyncRecordSchema.safeParse({
        driveFileId: 'drive-123',
        fileName: 'Contrato.pdf',
        confidenceScore: -5, // < 0
      }).success).toBe(false);
    });

    it('formats ZodIssues into clean HITL validation issue records', () => {
      const invalidClient = {
        name: '',
        email: 'not-an-email',
      };

      const result = CanonicalClientSchema.safeParse(invalidClient);
      expect(result.success).toBe(false);

      if (!result.success) {
        const hitlIssues = formatZodIssuesForHitl(result.error.issues);
        expect(hitlIssues.length).toBeGreaterThanOrEqual(2);
        expect(hitlIssues.some((i) => i.path === 'name')).toBe(true);
        expect(hitlIssues.some((i) => i.path === 'email')).toBe(true);
      }
    });
  });
});
