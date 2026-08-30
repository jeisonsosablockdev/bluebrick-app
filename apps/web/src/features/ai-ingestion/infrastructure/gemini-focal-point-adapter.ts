/**
 * ============================================================================
 * Layer 4: Infrastructure - Gemini Vision Focal Point Adapter
 * ============================================================================
 * Purpose: Analyzes architectural property image thumbnails (256x256) using
 * Gemini Vision to infer visual focal points with resilient 3s timeout fallbacks.
 * Invariants:
 *  - Server-only execution.
 *  - Output coordinates strictly clamped to [0.0, 1.0].
 *  - 3000ms timeout budget with automatic fallback to center (0.5, 0.5).
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import 'server-only';
import {
  IFocalPointDetectorPort,
  FocalPointDetectionResult,
} from '../domain/ports/focal-point-port';
import { clampCoordinate } from '../domain/math/smart-crop-calculator';

/**
 * Configuration options for GeminiFocalPointAdapter.
 */
export interface GeminiFocalPointConfig {
  readonly apiKey?: string;
  readonly model?: string;
  readonly defaultTimeoutMs?: number;
}

/**
 * Adapter implementing IFocalPointDetectorPort using Gemini Vision API.
 */
export class GeminiFocalPointAdapter implements IFocalPointDetectorPort {
  private readonly apiKey?: string;
  private readonly model: string;
  private readonly defaultTimeoutMs: number;

  constructor(config: GeminiFocalPointConfig = {}) {
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    this.model = config.model || 'gemini-2.5-flash';
    this.defaultTimeoutMs = config.defaultTimeoutMs ?? 3000;
  }

  /**
   * Predicts normalized focal point coordinates from a 256x256 image thumbnail.
   */
  public async detectFocalPoint(
    imageThumbnail: Uint8Array | Buffer,
    timeoutMs = this.defaultTimeoutMs
  ): Promise<FocalPointDetectionResult> {
    const rawBuffer = Buffer.isBuffer(imageThumbnail) ? imageThumbnail : Buffer.from(imageThumbnail);

    // Step 1: Check API key availability; fallback if not configured
    const activeKey = this.apiKey || process.env.GEMINI_API_KEY;
    if (!activeKey || rawBuffer.length === 0) {
      return this.createFallbackResult('Gemini API key missing or buffer empty');
    }

    // Step 2: Set up AbortController with timeout budget
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const base64Image = rawBuffer.toString('base64');
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${activeKey}`;

      // Step 3: Execute multimodal inference request
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Analyze this architectural/real estate image. Identify the primary visual focal point of interest (e.g. building facade, entrance, main feature). Return a JSON object with: focalX (number between 0.0 and 1.0 from left to right), focalY (number between 0.0 and 1.0 from top to bottom), description (short string), confidence (number 0.0 to 1.0). Return ONLY valid JSON.',
                },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        return this.createFallbackResult(`Gemini API returned HTTP ${response.status}`);
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      };

      const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJsonText) {
        return this.createFallbackResult('Empty response from vision model');
      }

      // Step 4: Parse and clamp coordinates safely
      const parsed = JSON.parse(rawJsonText) as {
        focalX?: number;
        focalY?: number;
        description?: string;
        confidence?: number;
      };

      const x = clampCoordinate(parsed.focalX ?? 0.5);
      const y = clampCoordinate(parsed.focalY ?? 0.5);
      const confidence = typeof parsed.confidence === 'number' ? Math.min(Math.max(parsed.confidence, 0.0), 1.0) : 0.85;

      return {
        focalPoint: { x, y },
        description: parsed.description || 'AI-detected focal point',
        isFallback: false,
        confidence,
      };
    } catch {
      // Step 5: Smooth fallback on network dropout or timeout abort
      return this.createFallbackResult('Timeout or network failure during vision inference');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Helper to construct a deterministic center fallback result.
   */
  private createFallbackResult(reason: string): FocalPointDetectionResult {
    return {
      focalPoint: { x: 0.5, y: 0.5 },
      description: `Default center crop (${reason})`,
      isFallback: true,
      confidence: 0.5,
    };
  }
}
