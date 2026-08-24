/**
 * @file apps/web/src/lib/pipelines/blob-storage-pipeline.ts
 * @description Layer 3: Domain / Pipelines - Avatar and document upload pipeline with validation.
 */

import { VercelBlobUploader, defaultBlobClient } from "../infrastructure/blob/vercel-blob-client";

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates and uploads an investor avatar image to Vercel Blob.
 */
export async function uploadInvestorAvatarPipeline(
  userId: string,
  file: File,
  uploader: VercelBlobUploader = defaultBlobClient
): Promise<UploadResult> {
  // Step 1: Validate MIME type
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return {
      success: false,
      error: "Formato no válido. Solo se permiten imágenes (PNG, JPEG, WEBP, GIF).",
    };
  }

  // Step 2: Validate file size constraint
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return {
      success: false,
      error: "La imagen excede el tamaño máximo permitido de 5 MB.",
    };
  }

  try {
    // Step 3: Extract buffer and determine unique destination pathname
    const arrayBuffer = await file.arrayBuffer();
    const extension = file.name.split(".").pop() || "png";
    const pathname = `avatars/${userId}-${Date.now()}.${extension}`;

    // Step 4: Upload via Vercel Blob uploader adapter
    const blob = await uploader.put(pathname, arrayBuffer, {
      access: "public",
      contentType: file.type,
    });

    return {
      success: true,
      url: blob.url,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al subir avatar a Vercel Blob.",
    };
  }
}
