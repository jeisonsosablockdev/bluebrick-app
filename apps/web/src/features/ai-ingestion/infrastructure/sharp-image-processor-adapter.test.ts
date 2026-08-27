/**
 * ============================================================================
 * Layer 4: Infrastructure - Sharp Image Processor Adapter Test Suite
 * ============================================================================
 * Tests dimension gates, downscaling, aspect ratio categorization,
 * WebP conversion, and error boundaries.
 */

import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { SharpImageProcessorAdapter } from './sharp-image-processor-adapter';
import {
  evaluateImageQuality,
  classifyAspectRatio,
} from '../domain/policies/image-quality-policy';

describe('Image Quality Policy & Sharp Processor Adapter', () => {
  describe('evaluateImageQuality()', () => {
    it('rejects images smaller than 400px in either dimension', () => {
      const result = evaluateImageQuality(350, 600);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('below minimum required 400px');
    });

    it('preserves dimensions when longest side <= 2048px', () => {
      const result = evaluateImageQuality(1920, 1080);
      expect(result.isValid).toBe(true);
      expect(result.targetWidth).toBe(1920);
      expect(result.targetHeight).toBe(1080);
      expect(result.aspectRatio).toBe('16:9');
    });

    it('downscales proportionally when longest side > 2048px', () => {
      const result = evaluateImageQuality(4096, 2048);
      expect(result.isValid).toBe(true);
      expect(result.targetWidth).toBe(2048);
      expect(result.targetHeight).toBe(1024);
    });

    it('correctly classifies standard aspect ratios', () => {
      expect(classifyAspectRatio(1920, 1080)).toBe('16:9');
      expect(classifyAspectRatio(800, 600)).toBe('4:3');
      expect(classifyAspectRatio(1000, 1000)).toBe('1:1');
      expect(classifyAspectRatio(1000, 400)).toBe('CUSTOM');
    });
  });

  describe('SharpImageProcessorAdapter', () => {
    const adapter = new SharpImageProcessorAdapter();

    it('processes a valid JPEG image into optimized WebP', async () => {
      // Step 1: Create a synthetic 1920x1080 JPEG
      const inputBuffer = await sharp({
        create: {
          width: 1920,
          height: 1080,
          channels: 3,
          background: { r: 50, g: 120, b: 200 },
        },
      })
        .jpeg()
        .toBuffer();

      // Step 2: Process image through adapter
      const result = await adapter.processImage(inputBuffer);

      expect(result.format).toBe('image/webp');
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
      expect(result.aspectRatio).toBe('16:9');
      expect(result.data.byteLength).toBeGreaterThan(0);
    });

    it('rejects an image below the 400px quality gate with IMAGE_TOO_SMALL', async () => {
      const smallBuffer = await sharp({
        create: {
          width: 300,
          height: 300,
          channels: 3,
          background: { r: 255, g: 0, b: 0 },
        },
      })
        .jpeg()
        .toBuffer();

      await expect(adapter.processImage(smallBuffer)).rejects.toMatchObject({
        code: 'IMAGE_TOO_SMALL',
      });
    });

    it('downscales an oversized 3000x2000 image to <= 2048px', async () => {
      const largeBuffer = await sharp({
        create: {
          width: 3000,
          height: 2000,
          channels: 3,
          background: { r: 10, g: 20, b: 30 },
        },
      })
        .jpeg()
        .toBuffer();

      const result = await adapter.processImage(largeBuffer);

      expect(result.width).toBe(2048);
      expect(result.height).toBe(1365); // 2000 * (2048 / 3000) = 1365.33 -> 1365
      expect(result.format).toBe('image/webp');
    });

    it('throws CORRUPTED_IMAGE when passed an empty buffer', async () => {
      await expect(adapter.processImage(new Uint8Array(0))).rejects.toMatchObject({
        code: 'CORRUPTED_IMAGE',
      });
    });
  });
});
