/**
 * ============================================================================
 * Layer 3: Domain - Video Tagger Port & Domain Errors
 * ============================================================================
 * Purpose: Defines the contract for generating semantic progress tags from video
 * context and enforcing video size/format boundaries.
 * Invariants:
 *  - Maximum video size limit: 250MB (262,144,000 bytes).
 *  - Allowed video MIME types: video/mp4, video/webm.
 *  - Pure domain representation, zero external SDK imports.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

/**
 * Maximum video file size allowed for direct ingestion (250 MB).
 */
export const MAX_VIDEO_SIZE_BYTES = 262144000;

/**
 * Supported video MIME types.
 */
export const SUPPORTED_VIDEO_MIME_TYPES = ['video/mp4', 'video/webm'] as const;
export type SupportedVideoMimeType = (typeof SUPPORTED_VIDEO_MIME_TYPES)[number];

/**
 * Domain error codes for video operations.
 */
export type VideoIngestionErrorCode =
  | 'VIDEO_EXCEEDS_SIZE_LIMIT'
  | 'UNSUPPORTED_VIDEO_FORMAT'
  | 'TAGGING_FAILED'
  | 'STORAGE_UPLOAD_ERROR';

/**
 * Domain Error for Video Ingestion operations.
 */
export class VideoIngestionDomainError extends Error {
  public readonly code: VideoIngestionErrorCode;
  public readonly retryable: boolean;
  public readonly originalError?: unknown;

  constructor(
    code: VideoIngestionErrorCode,
    message: string,
    retryable = false,
    originalError?: unknown
  ) {
    super(`[VideoIngestionDomainError:${code}] ${message}`);
    this.name = 'VideoIngestionDomainError';
    this.code = code;
    this.retryable = retryable;
    this.originalError = originalError;
    Object.setPrototypeOf(this, VideoIngestionDomainError.prototype);
  }
}

/**
 * Context parameters provided for semantic video tag generation.
 */
export interface VideoTaggingContext {
  readonly fileName: string;
  readonly folderPath: string;
  readonly projectTitle?: string;
}

/**
 * Tagging result from AI model.
 */
export interface VideoTaggingResult {
  readonly tags: readonly string[];
  readonly caption: string;
  readonly isFallback: boolean;
}

/**
 * Port interface for Video Semantic Tagging.
 */
export interface IVideoTaggerPort {
  /**
   * Generates progress tags and caption from video context and folder structure.
   * 
   * @param context - Video metadata context
   * @returns VideoTaggingResult with tags and caption
   */
  generateTags(context: VideoTaggingContext): Promise<VideoTaggingResult>;
}
