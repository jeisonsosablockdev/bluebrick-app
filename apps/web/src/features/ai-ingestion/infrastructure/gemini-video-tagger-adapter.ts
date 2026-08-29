/**
 * ============================================================================
 * Layer 4: Infrastructure - Gemini Video Tagger Adapter
 * ============================================================================
 * Purpose: Generates architectural progress tags (e.g. cimentación, acabados, dron)
 * from file context and folder paths using Gemini with XML delimiter sanitization.
 * Invariants:
 *  - Server-only execution.
 *  - XML-escaped prompt boundaries (<file_context>) preventing prompt injections.
 *  - Resilient fallback tags if AI inference times out or fails.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import 'server-only';
import {
  IVideoTaggerPort,
  VideoTaggingContext,
  VideoTaggingResult,
} from '../domain/ports/video-tagger-port';

/**
 * Configuration options for GeminiVideoTaggerAdapter.
 */
export interface GeminiVideoTaggerConfig {
  readonly apiKey?: string;
  readonly model?: string;
  readonly timeoutMs?: number;
}

/**
 * Escapes XML/HTML sensitive characters in filenames and paths.
 * 
 * @param str - Unescaped raw string
 * @returns Safe XML-escaped string
 */
export function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Adapter implementing IVideoTaggerPort using Gemini API.
 */
export class GeminiVideoTaggerAdapter implements IVideoTaggerPort {
  private readonly apiKey?: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(config: GeminiVideoTaggerConfig = {}) {
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    this.model = config.model || 'gemini-2.5-flash';
    this.timeoutMs = config.timeoutMs ?? 4000;
  }

  /**
   * Generates progress tags and caption from video context and folder structure.
   */
  public async generateTags(context: VideoTaggingContext): Promise<VideoTaggingResult> {
    const activeKey = this.apiKey || process.env.GEMINI_API_KEY;
    if (!activeKey) {
      return this.createFallbackResult(context, 'Gemini API key not configured');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      // Step 1: Sanitize context strings using XML escaping
      const safeFilename = escapeXml(context.fileName);
      const safeFolderPath = escapeXml(context.folderPath);
      const safeProject = escapeXml(context.projectTitle || 'Proyecto Inmobiliario');

      const prompt = `Analyze this video file metadata for an architectural/real estate construction project.
<file_context>
  <project>${safeProject}</project>
  <folder_path>${safeFolderPath}</folder_path>
  <filename>${safeFilename}</filename>
</file_context>

Generate 3-6 relevant Spanish progress/status tags (e.g. "cimentacion", "obra negra", "acabados", "recorrido dron", "fachada") and a short 1-sentence caption in Spanish.
Return ONLY valid JSON matching this schema:
{
  "tags": ["tag1", "tag2", "tag3"],
  "caption": "Short descriptive sentence."
}`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${activeKey}`;

      // Step 2: Request structured tag inference
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        return this.createFallbackResult(context, `HTTP ${response.status}`);
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
        return this.createFallbackResult(context, 'Empty AI response');
      }

      const parsed = JSON.parse(rawJsonText) as {
        tags?: string[];
        caption?: string;
      };

      const safeTags = Array.isArray(parsed.tags)
        ? parsed.tags.map((t) => t.toLowerCase().trim()).filter(Boolean)
        : ['avance de obra', 'video'];

      return {
        tags: safeTags.length > 0 ? safeTags : ['avance de obra'],
        caption: parsed.caption || `Video de avance: ${context.fileName}`,
        isFallback: false,
      };
    } catch {
      return this.createFallbackResult(context, 'Timeout or network failure');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Generates deterministic fallback tags from filename keywords.
   */
  private createFallbackResult(context: VideoTaggingContext, reason: string): VideoTaggingResult {
    const defaultTags = ['avance de obra', 'video'];
    const lowerName = context.fileName.toLowerCase();

    if (lowerName.includes('dron') || lowerName.includes('drone')) defaultTags.push('vista aerea');
    if (lowerName.includes('ciment') || lowerName.includes('excav')) defaultTags.push('cimentacion');
    if (lowerName.includes('acabad') || lowerName.includes('pint')) defaultTags.push('acabados');
    if (lowerName.includes('estruct')) defaultTags.push('estructura');

    return {
      tags: Array.from(new Set(defaultTags)),
      caption: `Video de avance de obra: ${context.fileName} (${reason})`,
      isFallback: true,
    };
  }
}
