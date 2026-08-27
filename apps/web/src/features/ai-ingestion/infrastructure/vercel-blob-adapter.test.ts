/**
 * ============================================================================
 * Layer 4: Infrastructure - Vercel Blob Adapter Unit Test Suite
 * ============================================================================
 * Tests magic byte verification, XSS markup blocking, token validation,
 * path entropy generation, and error mapping.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  VercelBlobAdapter,
  detectMagicBytesMime,
} from './vercel-blob-adapter';
import * as vercelBlob from '@vercel/blob';

vi.mock('@vercel/blob', () => ({
  put: vi.fn(),
}));

describe('VercelBlobAdapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('detectMagicBytesMime()', () => {
    it('correctly identifies JPEG magic bytes', () => {
      const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      expect(detectMagicBytesMime(jpeg)).toBe('image/jpeg');
    });

    it('correctly identifies PNG magic bytes', () => {
      const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
      expect(detectMagicBytesMime(png)).toBe('image/png');
    });

    it('correctly identifies WEBP magic bytes', () => {
      const webp = Buffer.from('RIFF....WEBPVP8 ', 'binary');
      expect(detectMagicBytesMime(webp)).toBe('image/webp');
    });

    it('correctly identifies PDF magic bytes', () => {
      const pdf = Buffer.from('%PDF-1.7 header', 'utf-8');
      expect(detectMagicBytesMime(pdf)).toBe('application/pdf');
    });

    it('correctly identifies MP4 magic bytes', () => {
      const mp4 = new Uint8Array([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]);
      expect(detectMagicBytesMime(mp4)).toBe('video/mp4');
    });

    it('blocks disguised executable SVG and HTML markup (Stored XSS defense)', () => {
      const svgDisguised = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
      expect(detectMagicBytesMime(svgDisguised)).toBe('disallowed/executable-markup');

      const htmlDisguised = Buffer.from('<!DOCTYPE html><html><body>Injected</body></html>');
      expect(detectMagicBytesMime(htmlDisguised)).toBe('disallowed/executable-markup');
    });
  });

  describe('uploadBlob()', () => {
    it('throws BLOB_TOKEN_MISSING if no token is provided or configured in env', async () => {
      const originalEnv = process.env.BLOB_READ_WRITE_TOKEN;
      delete process.env.BLOB_READ_WRITE_TOKEN;

      try {
        const adapter = new VercelBlobAdapter({});
        const jpegData = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);

        await expect(
          adapter.uploadBlob({
            projectId: '123e4567-e89b-12d3-a456-426614174000',
            driveFileId: 'drive-file-1',
            filename: 'photo.jpg',
            contentType: 'image/jpeg',
            data: jpegData,
          })
        ).rejects.toMatchObject({
          code: 'BLOB_TOKEN_MISSING',
        });
      } finally {
        process.env.BLOB_READ_WRITE_TOKEN = originalEnv;
      }
    });

    it('rejects disguised SVG files with DISALLOWED_MIME_TYPE', async () => {
      const adapter = new VercelBlobAdapter({ token: 'mock-blob-token' });
      const maliciousSvg = Buffer.from('<svg><script>alert(1)</script></svg>');

      await expect(
        adapter.uploadBlob({
          projectId: '123e4567-e89b-12d3-a456-426614174000',
          driveFileId: 'drive-file-1',
          filename: 'photo.jpg', // Disguised extension
          contentType: 'image/jpeg',
          data: maliciousSvg,
        })
      ).rejects.toMatchObject({
        code: 'DISALLOWED_MIME_TYPE',
      });
    });

    it('uploads valid JPEG data and returns public URL with verified MIME type', async () => {
      vi.mocked(vercelBlob.put).mockResolvedValue({
        url: 'https://public.blob.vercel-storage.com/projects/p1/file-123.jpg',
        pathname: 'projects/p1/file-123.jpg',
        contentType: 'image/jpeg',
        contentDisposition: 'inline',
        downloadUrl: 'https://public.blob.vercel-storage.com/projects/p1/file-123.jpg',
        etag: 'mock-etag-123',
      });

      const adapter = new VercelBlobAdapter({ token: 'mock-blob-token' });
      const validJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);

      const result = await adapter.uploadBlob({
        projectId: 'proj-100',
        driveFileId: 'drive-999',
        filename: 'fachada.jpg',
        contentType: 'image/jpeg',
        data: validJpeg,
      });

      expect(result.url).toBe('https://public.blob.vercel-storage.com/projects/p1/file-123.jpg');
      expect(result.contentType).toBe('image/jpeg');
      expect(result.sizeBytes).toBe(validJpeg.byteLength);
      expect(vercelBlob.put).toHaveBeenCalledTimes(1);
    });
  });
});
