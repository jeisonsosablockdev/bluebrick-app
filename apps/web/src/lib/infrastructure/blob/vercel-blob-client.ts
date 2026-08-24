/**
 * @file apps/web/src/lib/infrastructure/blob/vercel-blob-client.ts
 * @description Layer 4: Infrastructure - Vercel Blob client adapter.
 */

import { put, type PutBlobResult } from "@vercel/blob";

export interface VercelBlobUploader {
  put(
    pathname: string,
    body: string | ArrayBuffer | Blob | Buffer,
    options?: { access: "public"; contentType?: string }
  ): Promise<PutBlobResult>;
}

export class VercelBlobClient implements VercelBlobUploader {
  /**
   * Uploads raw file body to Vercel Blob storage.
   */
  async put(
    pathname: string,
    body: string | ArrayBuffer | Blob | Buffer,
    options?: { access: "public"; contentType?: string }
  ): Promise<PutBlobResult> {
    // Step 1: Delegate directly to official @vercel/blob put function
    return put(pathname, body, {
      access: options?.access || "public",
      contentType: options?.contentType,
    });
  }
}

export const defaultBlobClient = new VercelBlobClient();
