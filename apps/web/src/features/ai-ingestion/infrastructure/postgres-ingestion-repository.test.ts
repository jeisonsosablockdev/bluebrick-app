/**
 * ============================================================================
 * Layer 4: Infrastructure - PostgreSQL Ingestion Repository Test Suite
 * ============================================================================
 * Tests idempotent upserts, advisory locking, entity mapping, and error isolation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PostgresIngestionRepository } from './postgres-ingestion-repository';
import { DatabaseExecutor } from '../../../lib/infrastructure/db/neon-client';

describe('PostgreSQL Ingestion Repository Adapter', () => {
  let mockExecutor: DatabaseExecutor;
  let repository: PostgresIngestionRepository;

  beforeEach(() => {
    mockExecutor = {
      query: vi.fn(),
    };
    repository = new PostgresIngestionRepository(mockExecutor);
  });

  describe('upsertSyncRecord()', () => {
    it('executes parameterized upsert SQL and maps snake_case DB row to camelCase model', async () => {
      const mockDbRow = {
        id: '11111111-2222-3333-4444-555555555555',
        file_id: 'drive-file-123',
        folder_path: '/Proyectos/Torre_A/',
        source_type: 'SPREADSHEET',
        status: 'PROCESSED',
        confidence_score: 95.5,
        raw_payload: { raw: 'data' },
        canonical_payload: { canonical: 'data' },
        validation_errors: [],
        created_at: new Date('2026-08-25T10:00:00Z'),
        updated_at: new Date('2026-08-25T10:05:00Z'),
      };

      (mockExecutor.query as any).mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
      });

      const result = await repository.upsertSyncRecord({
        fileId: 'drive-file-123',
        folderPath: '/Proyectos/Torre_A/',
        sourceType: 'SPREADSHEET',
        status: 'PROCESSED',
        confidenceScore: 95.5,
        rawPayload: { raw: 'data' },
        canonicalPayload: { canonical: 'data' },
      });

      expect(mockExecutor.query).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('11111111-2222-3333-4444-555555555555');
      expect(result.fileId).toBe('drive-file-123');
      expect(result.confidenceScore).toBe(95.5);
      expect(result.status).toBe('PROCESSED');
    });
  });

  describe('getSyncRecordByFileId()', () => {
    it('returns null when record is not found', async () => {
      (mockExecutor.query as any).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const result = await repository.getSyncRecordByFileId('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('upsertMediaAsset()', () => {
    it('executes ON CONFLICT upsert and maps media asset correctly', async () => {
      const mockMediaRow = {
        id: '22222222-3333-4444-5555-666666666666',
        project_id: 'proj-99',
        drive_file_id: 'drive-img-1',
        blob_url: 'https://blob.vercel.com/img1.webp',
        media_type: 'IMAGE',
        focal_x: 0.65,
        focal_y: 0.35,
        ai_tags: ['fachada', 'piscina'],
        caption: 'Fachada principal',
        created_at: new Date('2026-08-25T10:00:00Z'),
      };

      (mockExecutor.query as any).mockResolvedValueOnce({
        rows: [mockMediaRow],
        rowCount: 1,
      });

      const result = await repository.upsertMediaAsset({
        projectId: 'proj-99',
        driveFileId: 'drive-img-1',
        blobUrl: 'https://blob.vercel.com/img1.webp',
        mediaType: 'IMAGE',
        focalX: 0.65,
        focalY: 0.35,
        aiTags: ['fachada', 'piscina'],
        caption: 'Fachada principal',
      });

      expect(result.blobUrl).toBe('https://blob.vercel.com/img1.webp');
      expect(result.focalX).toBe(0.65);
      expect(result.focalY).toBe(0.35);
      expect(result.aiTags).toEqual(['fachada', 'piscina']);
    });
  });

  describe('withAdvisoryLock()', () => {
    it('executes callback when advisory lock is acquired', async () => {
      (mockExecutor.query as any).mockResolvedValueOnce({
        rows: [{ locked: true }],
        rowCount: 1,
      });

      const callback = vi.fn().mockResolvedValue('success');
      const result = await repository.withAdvisoryLock('test_lock', callback);

      expect(result).toBe('success');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('throws LOCK_ACQUISITION_FAILED if lock is held by another worker', async () => {
      (mockExecutor.query as any).mockResolvedValueOnce({
        rows: [{ locked: false }],
        rowCount: 1,
      });

      const callback = vi.fn();
      await expect(
        repository.withAdvisoryLock('test_lock', callback)
      ).rejects.toMatchObject({
        code: 'LOCK_ACQUISITION_FAILED',
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
