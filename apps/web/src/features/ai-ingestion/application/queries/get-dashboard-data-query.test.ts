/**
 * ============================================================================
 * Layer 2: Application - Dashboard Queries & DTO Sanitizer Test Suite
 * ============================================================================
 * Tests DTO projection, PII sanitization, currency formatting, focal positioning,
 * and sync audit summarization.
 */

import { describe, it, expect } from 'vitest';
import {
  toClientCardDto,
  toMediaCardDto,
  toSyncAuditSummaryDto,
} from './get-dashboard-data-query';
import {
  DbClient,
  DbMediaAsset,
  DbSyncRecord,
} from '../../domain/ports/repositories-port';

describe('Dashboard Queries & DTO Sanitization', () => {
  describe('toClientCardDto()', () => {
    it('sanitizes client entity and formats currency without leaking internal metadata', () => {
      const dbClient: DbClient = {
        id: 'client-123',
        name: 'Inversiones Los Andes S.A.S.',
        taxId: '900123456-8',
        email: 'andes@inversiones.co',
        phone: '+57 300 111 2233',
        contractAmount: '1500000000.00',
        status: 'PENDING',
        metadata: {
          internalSecret: 'sensitive-ocr-tokens',
          sourceFile: 'internal_contract.pdf',
        },
        createdAt: new Date('2026-08-25T14:30:00Z'),
        updatedAt: new Date('2026-08-25T14:35:00Z'),
      };

      const dto = toClientCardDto(dbClient);

      expect(dto.id).toBe('client-123');
      expect(dto.name).toBe('Inversiones Los Andes S.A.S.');
      expect(dto.taxId).toBe('900123456-8');
      expect(dto.formattedAmount).toContain('1.500.000.000');
      expect(dto.displayDate).toBe('2026-08-25');
      // Assert internal metadata is stripped from public DTO
      expect((dto as any).metadata).toBeUndefined();
    });

    it('handles clients with missing amounts and contact details gracefully', () => {
      const minimalClient: DbClient = {
        id: 'client-456',
        name: 'Cliente Sin Datos',
        taxId: null,
        email: null,
        phone: null,
        contractAmount: null,
        status: 'PENDING',
        metadata: {},
        createdAt: new Date('2026-08-25T12:00:00Z'),
        updatedAt: new Date('2026-08-25T12:00:00Z'),
      };

      const dto = toClientCardDto(minimalClient);

      expect(dto.formattedAmount).toBe('$0 COP');
      expect(dto.taxId).toBeNull();
      expect(dto.email).toBeNull();
    });
  });

  describe('toMediaCardDto()', () => {
    it('computes object-position style matching AI focal point', () => {
      const mediaAsset: DbMediaAsset = {
        id: 'media-789',
        projectId: 'proj-1',
        driveFileId: 'drive-f1',
        blobUrl: 'https://blob.vercel.com/fachada.webp',
        mediaType: 'IMAGE',
        focalX: 0.72,
        focalY: 0.28,
        aiTags: ['fachada', 'obra negra'],
        caption: 'Fachada frontal',
        createdAt: new Date('2026-08-25T10:00:00Z'),
      };

      const dto = toMediaCardDto(mediaAsset);

      expect(dto.objectPositionStyle).toBe('72% 28%');
      expect(dto.focalX).toBe(0.72);
      expect(dto.focalY).toBe(0.28);
      expect(dto.aiTags).toContain('fachada');
    });

    it('clamps out-of-range focal coordinates to [0, 1]', () => {
      const mediaAsset: DbMediaAsset = {
        id: 'media-000',
        projectId: 'proj-1',
        driveFileId: 'drive-f2',
        blobUrl: 'https://blob.vercel.com/piscina.webp',
        mediaType: 'IMAGE',
        focalX: 1.5, // Exceeds 1
        focalY: -0.4, // Below 0
        aiTags: [],
        caption: null,
        createdAt: new Date('2026-08-25T10:00:00Z'),
      };

      const dto = toMediaCardDto(mediaAsset);

      expect(dto.objectPositionStyle).toBe('100% 0%');
      expect(dto.focalX).toBe(1.0);
      expect(dto.focalY).toBe(0.0);
    });
  });

  describe('toSyncAuditSummaryDto()', () => {
    it('accurately identifies presence of validation errors', () => {
      const recordWithErrors: DbSyncRecord = {
        id: 'rec-1',
        fileId: 'file-1',
        folderPath: '/Proyectos/',
        sourceType: 'DOCUMENT',
        status: 'NEEDS_REVIEW',
        confidenceScore: 45.0,
        rawPayload: {},
        canonicalPayload: {},
        validationErrors: [{ issue: 'Invalid NIT checksum' }],
        createdAt: new Date(),
        updatedAt: new Date('2026-08-25T15:00:00Z'),
      };

      const dto = toSyncAuditSummaryDto(recordWithErrors);

      expect(dto.hasErrors).toBe(true);
      expect(dto.status).toBe('NEEDS_REVIEW');
      expect(dto.confidenceScore).toBe(45.0);
    });
  });
});
