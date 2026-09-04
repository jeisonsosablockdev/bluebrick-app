/**
 * ============================================================================
 * Layer 2: Application - HITL Server Actions Test Suite
 * ============================================================================
 * Tests RBAC permission verification, Zod correction re-parsing,
 * idempotent state transitions, and rejection handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  approveSyncRecordAction,
  rejectSyncRecordAction,
} from './hitl-review-actions';
import { verifyHitlPermission } from '../../domain/policies/hitl-rbac-policy';
import { IIngestionRepositoryPort } from '../../domain/ports/repositories-port';

describe('HITL Review Server Actions & RBAC Gates', () => {
  let mockRepo: IIngestionRepositoryPort;

  beforeEach(() => {
    mockRepo = {
      upsertSyncRecord: vi.fn().mockResolvedValue({
        id: 'sync-1',
        fileId: 'file-abc',
        folderPath: '/Proyectos/',
        sourceType: 'DOCUMENT',
        status: 'PROCESSED',
        confidenceScore: 100.0,
        rawPayload: {},
        canonicalPayload: {},
        validationErrors: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      getSyncRecordByFileId: vi.fn(),
      listSyncRecordsByStatus: vi.fn(),
      upsertMediaAsset: vi.fn(),
      upsertClient: vi.fn().mockResolvedValue({
        id: 'client-1',
        name: 'Cliente Aprobado',
        taxId: '900123456-8',
        email: 'aprobado@test.com',
        phone: '+57 300 111 2222',
        contractAmount: '500000000.00',
        status: 'ACTIVE',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      withAdvisoryLock: vi.fn().mockImplementation((_, fn) => fn()),
    };
  });

  describe('verifyHitlPermission()', () => {
    it('grants access to ADMIN and COMPLIANCE roles only', () => {
      expect(verifyHitlPermission('ADMIN')).toBe(true);
      expect(verifyHitlPermission('COMPLIANCE')).toBe(true);
      expect(verifyHitlPermission('INVESTOR')).toBe(false);
      expect(verifyHitlPermission('USER')).toBe(false);
      expect(verifyHitlPermission('')).toBe(false);
    });
  });

  describe('approveSyncRecordAction()', () => {
    it('rejects action with UNAUTHORIZED_ROLE when user lacks admin permissions', async () => {
      const response = await approveSyncRecordAction(
        {
          fileId: 'file-123',
          userRole: 'INVESTOR',
        },
        mockRepo
      );

      expect(response.success).toBe(false);
      expect(response.errors).toContain('UNAUTHORIZED_ROLE');
      expect(mockRepo.upsertSyncRecord).not.toHaveBeenCalled();
    });

    it('rejects invalid fileId', async () => {
      const response = await approveSyncRecordAction(
        {
          fileId: '',
          userRole: 'ADMIN',
        },
        mockRepo
      );

      expect(response.success).toBe(false);
      expect(response.errors).toContain('INVALID_FILE_ID');
    });

    it('re-validates corrected client payload with Zod schema and catches errors', async () => {
      const response = await approveSyncRecordAction(
        {
          fileId: 'file-123',
          userRole: 'ADMIN',
          correctedClient: {
            name: '', // Invalid empty name
            email: 'not-an-email',
          },
        },
        mockRepo
      );

      expect(response.success).toBe(false);
      expect(response.message).toContain('Correction validation failed');
      expect(mockRepo.upsertClient).not.toHaveBeenCalled();
    });

    it('successfully approves valid record and updates repository', async () => {
      const response = await approveSyncRecordAction(
        {
          fileId: 'file-123',
          userRole: 'ADMIN',
          correctedClient: {
            name: 'Cliente Aprobado',
            taxId: '900123456-8',
            email: 'aprobado@test.com',
            phone: '+57 300 111 2222',
            contractAmount: '500000000.00',
            status: 'ACTIVE',
            metadata: {},
          },
        },
        mockRepo
      );

      expect(response.success).toBe(true);
      expect(response.message).toContain('PROCESSED');
      expect(mockRepo.upsertClient).toHaveBeenCalledTimes(1);
      expect(mockRepo.upsertSyncRecord).toHaveBeenCalledTimes(1);
    });
  });

  describe('rejectSyncRecordAction()', () => {
    it('rejects unauthorized user role', async () => {
      const response = await rejectSyncRecordAction(
        {
          fileId: 'file-123',
          userRole: 'INVESTOR',
          reason: 'Documento ilegible',
        },
        mockRepo
      );

      expect(response.success).toBe(false);
      expect(response.errors).toContain('UNAUTHORIZED_ROLE');
    });

    it('rejects reason shorter than 5 characters', async () => {
      const response = await rejectSyncRecordAction(
        {
          fileId: 'file-123',
          userRole: 'COMPLIANCE',
          reason: 'bad',
        },
        mockRepo
      );

      expect(response.success).toBe(false);
      expect(response.errors).toContain('INVALID_REASON');
    });

    it('successfully rejects record and marks as FAILED', async () => {
      const response = await rejectSyncRecordAction(
        {
          fileId: 'file-123',
          userRole: 'COMPLIANCE',
          reason: 'Documento con firma ilegible y tachaduras',
        },
        mockRepo
      );

      expect(response.success).toBe(true);
      expect(response.message).toContain('successfully rejected');
      expect(mockRepo.upsertSyncRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'FAILED',
          confidenceScore: 0.0,
        })
      );
    });
  });
});
