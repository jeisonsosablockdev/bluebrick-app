/**
 * ============================================================================
 * Layer 2: Application - Video Ingestion Service Test Suite
 * ============================================================================
 * Tests size boundary enforcement (250MB limit), format whitelisting,
 * XML escaping, AI tagging, and blob streaming.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  VideoIngestionService,
} from './video-ingestion-service';
import {
  GeminiVideoTaggerAdapter,
  escapeXml,
} from '../../infrastructure/gemini-video-tagger-adapter';
import { IVideoTaggerPort } from '../../domain/ports/video-tagger-port';
import { IBlobStoragePort } from '../../domain/ports/blob-storage-port';

describe('Video Ingestion Service & Tagger Adapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('escapeXml()', () => {
    it('escapes XML/HTML markup to prevent prompt injection', () => {
      expect(escapeXml('<script>alert("xss")</script> & "test"')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &quot;test&quot;'
      );
      expect(escapeXml('')).toBe('');
    });
  });

  describe('GeminiVideoTaggerAdapter', () => {
    it('returns keyword fallback tags when API key is not set', async () => {
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      try {
        const adapter = new GeminiVideoTaggerAdapter({});
        const result = await adapter.generateTags({
          fileName: 'Recorrido_Dron_Cimentacion.mp4',
          folderPath: '/Proyectos/Torre_A/',
        });

        expect(result.isFallback).toBe(true);
        expect(result.tags).toContain('vista aerea');
        expect(result.tags).toContain('cimentacion');
      } finally {
        process.env.GEMINI_API_KEY = originalKey;
      }
    });

    it('parses valid AI tags and caption response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      tags: ['acabados', 'piscina', 'vista panoramica'],
                      caption: 'Avance de zona húmeda y piscina piso 15.',
                    }),
                  },
                ],
              },
            },
          ],
        }),
      }));

      const adapter = new GeminiVideoTaggerAdapter({ apiKey: 'mock-key' });
      const result = await adapter.generateTags({
        fileName: 'Piscina_Piso15.mp4',
        folderPath: '/Proyectos/Torre_A/',
      });

      expect(result.isFallback).toBe(false);
      expect(result.tags).toEqual(['acabados', 'piscina', 'vista panoramica']);
      expect(result.caption).toBe('Avance de zona húmeda y piscina piso 15.');
    });
  });

  describe('VideoIngestionService', () => {
    const mockTagger: IVideoTaggerPort = {
      generateTags: vi.fn().mockResolvedValue({
        tags: ['estructura', 'piso 4'],
        caption: 'Fundición losa piso 4.',
        isFallback: false,
      }),
    };

    const mockBlob: IBlobStoragePort = {
      uploadBlob: vi.fn().mockResolvedValue({
        url: 'https://public.blob.vercel-storage.com/video.mp4',
        pathname: 'projects/p1/video.mp4',
        contentType: 'video/mp4',
        sizeBytes: 1048576,
      }),
    };

    it('rejects video exceeding 250MB with VIDEO_EXCEEDS_SIZE_LIMIT', async () => {
      const service = new VideoIngestionService(mockTagger, mockBlob);

      await expect(
        service.ingestVideo({
          projectId: 'proj-1',
          driveFileId: 'drive-v1',
          fileName: 'GiganticVideo.mp4',
          mimeType: 'video/mp4',
          sizeBytes: 300 * 1024 * 1024, // 300MB
          folderPath: '/Proyectos/',
          videoData: new Uint8Array(10),
        })
      ).rejects.toMatchObject({
        code: 'VIDEO_EXCEEDS_SIZE_LIMIT',
      });
    });

    it('rejects unsupported video format with UNSUPPORTED_VIDEO_FORMAT', async () => {
      const service = new VideoIngestionService(mockTagger, mockBlob);

      await expect(
        service.ingestVideo({
          projectId: 'proj-1',
          driveFileId: 'drive-v1',
          fileName: 'Video.avi',
          mimeType: 'video/x-msvideo',
          sizeBytes: 10 * 1024 * 1024,
          folderPath: '/Proyectos/',
          videoData: new Uint8Array(10),
        })
      ).rejects.toMatchObject({
        code: 'UNSUPPORTED_VIDEO_FORMAT',
      });
    });

    it('successfully processes valid MP4 video and returns structured result', async () => {
      const service = new VideoIngestionService(mockTagger, mockBlob);

      const result = await service.ingestVideo({
        projectId: 'proj-1',
        driveFileId: 'drive-v1',
        fileName: 'Avance_Losa.mp4',
        mimeType: 'video/mp4',
        sizeBytes: 15 * 1024 * 1024,
        folderPath: '/Proyectos/Torre_B/',
        videoData: new Uint8Array(100),
      });

      expect(result.mediaType).toBe('VIDEO');
      expect(result.blobUrl).toBe('https://public.blob.vercel-storage.com/video.mp4');
      expect(result.aiTags).toContain('estructura');
      expect(result.caption).toBe('Fundición losa piso 4.');
      expect(mockBlob.uploadBlob).toHaveBeenCalledTimes(1);
    });
  });
});
