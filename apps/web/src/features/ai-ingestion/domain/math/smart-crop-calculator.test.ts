/**
 * ============================================================================
 * Layer 3: Domain - Smart Crop Math & Gemini Focal Point Test Suite
 * ============================================================================
 * Tests bounding box calculations, coordinate clamping, ratio fits,
 * and Gemini Vision adapter fallbacks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  clampCoordinate,
  calculateSmartCrop,
} from './smart-crop-calculator';
import { GeminiFocalPointAdapter } from '../../infrastructure/gemini-focal-point-adapter';

describe('Smart Crop Math & Focal Point Detection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('clampCoordinate()', () => {
    it('clamps numbers to the [0.0, 1.0] range', () => {
      expect(clampCoordinate(0.75)).toBe(0.75);
      expect(clampCoordinate(-0.5)).toBe(0.0);
      expect(clampCoordinate(1.8)).toBe(1.0);
      expect(clampCoordinate(NaN)).toBe(0.5);
      expect(clampCoordinate(Infinity)).toBe(0.5);
    });
  });

  describe('calculateSmartCrop()', () => {
    it('computes 16:9 crop on 1920x1080 spanning full image', () => {
      const box = calculateSmartCrop(1920, 1080, { x: 0.5, y: 0.5 }, 16 / 9);
      expect(box.x).toBe(0);
      expect(box.y).toBe(0);
      expect(box.width).toBe(1920);
      expect(box.height).toBe(1080);
    });

    it('computes 1:1 crop on 1920x1080 centered on focal point', () => {
      // 1:1 crop on 1920x1080 will have height = 1080 and width = 1080
      const box = calculateSmartCrop(1920, 1080, { x: 0.8, y: 0.5 }, 1.0);
      expect(box.width).toBe(1080);
      expect(box.height).toBe(1080);
      expect(box.y).toBe(0);
      // Focal point x = 0.8 * 1920 = 1536. Box centered at 1536 - 540 = 996.
      // Clamped within 0 and (1920 - 1080 = 840)
      expect(box.x).toBe(840);
    });

    it('never produces bounding boxes exceeding image dimensions', () => {
      const edgeCases = [
        { w: 800, h: 600, fx: 0.0, fy: 0.0, ratio: 16 / 9 },
        { w: 800, h: 600, fx: 1.0, fy: 1.0, ratio: 16 / 9 },
        { w: 1200, h: 1800, fx: 0.5, fy: 0.1, ratio: 4 / 3 },
      ];

      for (const tc of edgeCases) {
        const box = calculateSmartCrop(tc.w, tc.h, { x: tc.fx, y: tc.fy }, tc.ratio);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(tc.w);
        expect(box.y + box.height).toBeLessThanOrEqual(tc.h);
      }
    });
  });

  describe('GeminiFocalPointAdapter', () => {
    it('returns center fallback when API key is not configured', async () => {
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      try {
        const adapter = new GeminiFocalPointAdapter({});
        const dummyThumb = new Uint8Array([1, 2, 3, 4]);
        const result = await adapter.detectFocalPoint(dummyThumb);

        expect(result.isFallback).toBe(true);
        expect(result.focalPoint).toEqual({ x: 0.5, y: 0.5 });
      } finally {
        process.env.GEMINI_API_KEY = originalKey;
      }
    });

    it('parses valid AI focal response and clamps out-of-range coordinates', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      focalX: 1.4, // Out of bounds
                      focalY: 0.25,
                      description: 'Penthouse terrace',
                      confidence: 0.95,
                    }),
                  },
                ],
              },
            },
          ],
        }),
      }));

      const adapter = new GeminiFocalPointAdapter({ apiKey: 'mock-gemini-key' });
      const dummyThumb = new Uint8Array([1, 2, 3, 4]);
      const result = await adapter.detectFocalPoint(dummyThumb);

      expect(result.isFallback).toBe(false);
      expect(result.focalPoint.x).toBe(1.0); // Clamped from 1.4
      expect(result.focalPoint.y).toBe(0.25);
      expect(result.description).toBe('Penthouse terrace');
      expect(result.confidence).toBe(0.95);
    });
  });
});
