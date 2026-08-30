/**
 * @file apps/web/src/lib/pipelines/blob-storage-pipeline.ts
 * @description Layer 3: Domain / Pipelines - Avatar and document upload pipeline with validation and blob cleanup.
 */

import { VercelBlobUploader, defaultBlobClient } from "../infrastructure/blob/vercel-blob-client";
import type { UserRepository } from "../infrastructure/db/repositories/user-repository";

export interface UploadAvatarOptions {
  oldAvatarUrl?: string | null;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Determines if a given URL originates from Vercel Blob storage.
 */
export function isVercelBlobUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.endsWith("blob.vercel-storage.com") ||
      parsed.hostname.includes("vercel-storage.com")
    );
  } catch {
    return false;
  }
}

/**
 * Validates and uploads an investor avatar image to Vercel Blob, pruning the obsolete blob if present.
 */
export async function uploadInvestorAvatarPipeline(
  userId: string,
  file: File,
  optionsOrUploader?: UploadAvatarOptions | VercelBlobUploader,
  uploaderOrUserRepo?: VercelBlobUploader | UserRepository,
  maybeUserRepo?: UserRepository
): Promise<UploadResult> {
  // Step 1: Normalize polymorphic parameters for backward compatibility
  let options: UploadAvatarOptions | undefined;
  let uploader: VercelBlobUploader = defaultBlobClient;
  let userRepo: UserRepository | undefined;

  if (optionsOrUploader && "put" in optionsOrUploader && typeof (optionsOrUploader as VercelBlobUploader).put === "function") {
    uploader = optionsOrUploader as VercelBlobUploader;
    if (uploaderOrUserRepo && "updateAvatarUrl" in uploaderOrUserRepo) {
      userRepo = uploaderOrUserRepo as UserRepository;
    }
  } else {
    options = optionsOrUploader as UploadAvatarOptions | undefined;
    if (uploaderOrUserRepo && "put" in uploaderOrUserRepo) {
      uploader = uploaderOrUserRepo as VercelBlobUploader;
    }
    userRepo = maybeUserRepo;
  }

  // Step 2: Validate MIME type
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return {
      success: false,
      error: "Formato no válido. Solo se permiten imágenes (PNG, JPEG, WEBP, GIF).",
    };
  }

  // Step 3: Validate file size constraint
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return {
      success: false,
      error: "La imagen excede el tamaño máximo permitido de 5 MB.",
    };
  }

  try {
    // Step 4: Extract buffer and determine unique destination pathname
    const arrayBuffer = await file.arrayBuffer();
    const extension = file.name.split(".").pop() || "png";
    const pathname = `avatars/${userId}-${Date.now()}.${extension}`;

    // Step 5: Upload new blob via Vercel Blob uploader adapter
    const blob = await uploader.put(pathname, arrayBuffer, {
      access: "public",
      contentType: file.type,
    });

    // Step 6: Prune obsolete old blob if it belongs to Vercel Blob storage
    if (options?.oldAvatarUrl && isVercelBlobUrl(options.oldAvatarUrl)) {
      try {
        await uploader.del(options.oldAvatarUrl);
      } catch (deleteError) {
        // Invariant: Non-fatal cleanup error should not abort successful avatar update
        console.warn("Failed to prune previous avatar blob:", deleteError);
      }
    }

    // Step 7: Persist updated avatar URL to database if repository is provided
    if (userRepo) {
      await userRepo.updateAvatarUrl(userId, blob.url);
    }

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
