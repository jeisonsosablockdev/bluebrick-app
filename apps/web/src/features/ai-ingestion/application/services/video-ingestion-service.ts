/**
 * ============================================================================
 * Layer 2: Application - Video Ingestion Application Service
 * ============================================================================
 * Purpose: Orchestrates pre-flight size checks (max 250MB), MIME format whitelisting,
 * AI progress tagging, and direct blob streaming for architectural video assets.
 * Invariants:
 *  - Enforces MAX_VIDEO_SIZE_BYTES before reading data.
 *  - Whitelists only video/mp4 and video/webm.
 *  - Relies on Domain Ports (IVideoTaggerPort, IBlobStoragePort).
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import {
  IVideoTaggerPort,
  MAX_VIDEO_SIZE_BYTES,
  SUPPORTED_VIDEO_MIME_TYPES,
  VideoIngestionDomainError,
} from '../../domain/ports/video-tagger-port';
import { IBlobStoragePort } from '../../domain/ports/blob-storage-port';

/**
 * Parameters for ingesting a video asset.
 */
export interface IngestVideoParams {
  readonly projectId: string;
  readonly driveFileId: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly folderPath: string;
  readonly videoData: Uint8Array | Buffer;
}

/**
 * Result payload from video ingestion.
 */
export interface IngestedVideoResult {
  readonly blobUrl: string;
  readonly mediaType: 'VIDEO';
  readonly caption: string;
  readonly aiTags: readonly string[];
  readonly sizeBytes: number;
}

/**
 * Application service managing video ingestion.
 */
export class VideoIngestionService {
  private readonly taggerPort: IVideoTaggerPort;
  private readonly blobPort: IBlobStoragePort;

  constructor(taggerPort: IVideoTaggerPort, blobPort: IBlobStoragePort) {
    this.taggerPort = taggerPort;
    this.blobPort = blobPort;
  }

  /**
   * Validates size/format boundaries, generates AI tags, and uploads video to CDN.
   * 
   * @param params - Ingestion parameters
   * @returns IngestedVideoResult
   */
  public async ingestVideo(params: IngestVideoParams): Promise<IngestedVideoResult> {
    // Step 1: Pre-flight file size check (max 250MB)
    if (params.sizeBytes > MAX_VIDEO_SIZE_BYTES) {
      throw new VideoIngestionDomainError(
        'VIDEO_EXCEEDS_SIZE_LIMIT',
        `Video size (${(params.sizeBytes / (1024 * 1024)).toFixed(1)}MB) exceeds max allowed 250MB limit`
      );
    }

    // Step 2: Format whitelist check
    if (!SUPPORTED_VIDEO_MIME_TYPES.includes(params.mimeType as 'video/mp4' | 'video/webm')) {
      throw new VideoIngestionDomainError(
        'UNSUPPORTED_VIDEO_FORMAT',
        `Unsupported video format: ${params.mimeType}. Only MP4 and WebM are permitted.`
      );
    }

    // Step 3: Generate semantic AI tags and caption
    const taggingResult = await this.taggerPort.generateTags({
      fileName: params.fileName,
      folderPath: params.folderPath,
    });

    // Step 4: Stream upload to Edge Blob CDN
    const uploadResult = await this.blobPort.uploadBlob({
      projectId: params.projectId,
      driveFileId: params.driveFileId,
      filename: params.fileName,
      contentType: params.mimeType,
      data: params.videoData,
    });

    return {
      blobUrl: uploadResult.url,
      mediaType: 'VIDEO',
      caption: taggingResult.caption,
      aiTags: taggingResult.tags,
      sizeBytes: params.sizeBytes,
    };
  }
}
