/**
 * ============================================================================
 * Layer 4: Infrastructure - Google Drive Changes Adapter Unit Test Suite
 * ============================================================================
 * Tests differential polling, 410 Gone recovery, composite hash generation,
 * pagination safety, and path sanitization.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IGoogleAuthProviderPort } from '../domain/ports/google-auth-port';
import { GoogleDriveChangesAdapter } from './google-drive-changes-adapter';
import { sanitizeDrivePath } from '../domain/models/sync-event-models';
import { DifferentialSyncService } from '../application/services/differential-sync-service';

describe('GoogleDriveChangesAdapter', () => {
  const mockAuth: IGoogleAuthProviderPort = {
    getAccessToken: vi.fn().mockResolvedValue({
      token: 'mock-access-token',
      tokenType: 'Bearer',
      expiresAtUtc: Date.now() + 3600000,
    }),
    invalidateCache: vi.fn(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('sanitizeDrivePath()', () => {
    it('neutralizes path traversal attempts and collapses redundant slashes', () => {
      expect(sanitizeDrivePath('../../etc/passwd')).toBe('/etc/passwd');
      expect(sanitizeDrivePath('/projects//tower-a/..//docs/')).toBe('/projects/tower-a/docs');
      expect(sanitizeDrivePath('')).toBe('/');
      expect(sanitizeDrivePath('folder/subfolder')).toBe('/folder/subfolder');
    });
  });

  describe('getStartPageToken()', () => {
    it('retrieves valid startPageToken from Google Drive API', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ startPageToken: 'token-12345' }),
      }));

      const adapter = new GoogleDriveChangesAdapter({
        authProvider: mockAuth,
        baseUrl: 'https://mock.drive.api',
      });

      const token = await adapter.getStartPageToken();
      expect(token).toBe('token-12345');
    });
  });

  describe('pollChanges()', () => {
    it('discovers changes and generates composite hash for Google Docs lacking md5Checksum', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          newStartPageToken: 'token-next',
          changes: [
            {
              fileId: 'doc-file-1',
              file: {
                id: 'doc-file-1',
                name: 'Contrato Fideicomiso.gdoc',
                mimeType: 'application/vnd.google-apps.document',
                trashed: false,
                modifiedTime: '2026-08-25T10:00:00.000Z',
                version: '3',
                // md5Checksum is deliberately undefined for Google Docs
              },
            },
            {
              fileId: 'pdf-file-2',
              file: {
                id: 'pdf-file-2',
                name: 'Plano.pdf',
                mimeType: 'application/pdf',
                trashed: false,
                md5Checksum: 'd41d8cd98f00b204e9800998ecf8427e',
                modifiedTime: '2026-08-25T11:00:00.000Z',
                size: '102400',
              },
            },
          ],
        }),
      }));

      const adapter = new GoogleDriveChangesAdapter({
        authProvider: mockAuth,
        baseUrl: 'https://mock.drive.api',
      });

      const result = await adapter.pollChanges('token-initial');
      expect(result.changes.length).toBe(2);
      expect(result.newPageToken).toBe('token-next');
      expect(result.tokenResetOccurred).toBe(false);

      // Verify Google Doc computed non-empty composite SHA-256 hash
      const docChange = result.changes.find((c) => c.fileId === 'doc-file-1');
      expect(docChange?.md5Checksum).toBeNull();
      expect(docChange?.compositeHash).toBeDefined();
      expect(docChange?.compositeHash.length).toBe(64); // SHA-256 hex length

      // Verify Binary PDF preserved original md5Checksum as compositeHash
      const pdfChange = result.changes.find((c) => c.fileId === 'pdf-file-2');
      expect(pdfChange?.md5Checksum).toBe('d41d8cd98f00b204e9800998ecf8427e');
      expect(pdfChange?.compositeHash).toBe('d41d8cd98f00b204e9800998ecf8427e');
    });

    it('recovers smoothly from HTTP 410 Gone by renewing startPageToken', async () => {
      const mockFetch = vi.fn()
        // First call fails with 410 Gone (expired token)
        .mockResolvedValueOnce({
          ok: false,
          status: 410,
          text: async () => 'Page token expired',
        })
        // Second call (recovery) succeeds in getStartPageToken
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ startPageToken: 'fresh-recovery-token' }),
        });

      vi.stubGlobal('fetch', mockFetch);

      const adapter = new GoogleDriveChangesAdapter({
        authProvider: mockAuth,
        baseUrl: 'https://mock.drive.api',
      });

      const result = await adapter.pollChanges('expired-token-999');
      expect(result.tokenResetOccurred).toBe(true);
      expect(result.newPageToken).toBe('fresh-recovery-token');
      expect(result.changes).toEqual([]);
    });

    it('maps HTTP 429 to retryable RATE_LIMITED error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded',
      }));

      const adapter = new GoogleDriveChangesAdapter({
        authProvider: mockAuth,
        baseUrl: 'https://mock.drive.api',
      });

      await expect(adapter.pollChanges('token-123')).rejects.toMatchObject({
        code: 'RATE_LIMITED',
        retryable: true,
      });
    });
  });

  describe('DifferentialSyncService', () => {
    it('filters out system files like .DS_Store and applies MIME filters', async () => {
      const mockPort = {
        getStartPageToken: vi.fn(),
        pollChanges: vi.fn().mockResolvedValue({
          changes: [
            {
              fileId: 'file-1',
              fileName: '.DS_Store',
              mimeType: 'application/octet-stream',
              isTrashed: false,
              md5Checksum: 'hash1',
              compositeHash: 'hash1',
              lastModifiedTime: '2026-08-25T00:00:00Z',
              sizeBytes: 6000,
              folderPath: '/',
            },
            {
              fileId: 'file-2',
              fileName: 'Contrato.pdf',
              mimeType: 'application/pdf',
              isTrashed: false,
              md5Checksum: 'hash2',
              compositeHash: 'hash2',
              lastModifiedTime: '2026-08-25T00:00:00Z',
              sizeBytes: 50000,
              folderPath: '/',
            },
          ],
          newPageToken: 'token-abc',
          tokenResetOccurred: false,
          totalPagesScanned: 1,
        }),
      };

      const service = new DifferentialSyncService(mockPort);
      const result = await service.executeSyncCycle('token-abc', {
        supportedMimeTypes: ['application/pdf'],
      });

      expect(result.changes.length).toBe(1);
      expect(result.changes[0].fileName).toBe('Contrato.pdf');
    });
  });
});
