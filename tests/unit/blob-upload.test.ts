/**
 * @file tests/unit/blob-upload.test.ts
 * @description Layer 3 & QA: Behavioral Unit Test Suite for Vercel Blob Storage Pipeline.
 * @spec BBC-6-SPEC-3
 */

import { describe, it, expect, vi } from "vitest";
import { uploadInvestorAvatarPipeline } from "@/lib/pipelines/blob-storage-pipeline";
import type { VercelBlobUploader } from "@/lib/infrastructure/blob/vercel-blob-client";

describe("SPEC-3: Vercel Blob Avatar Upload Pipeline (@spec BBC-6-SPEC-3)", () => {
  it("should validate and upload image file returning blob public URL", async () => {
    // Arrange
    const mockUploader: VercelBlobUploader = {
      put: vi.fn().mockResolvedValue({
        url: "https://public.blob.vercel-storage.com/avatars/user_sofia_martinez-12345.png",
        pathname: "avatars/user_sofia_martinez-12345.png",
        contentType: "image/png",
      }),
    };

    const dummyBuffer = Buffer.from("fake-image-bytes");
    const dummyFile = {
      name: "avatar.png",
      type: "image/png",
      size: 1024 * 50, // 50 KB
      arrayBuffer: async () => dummyBuffer.buffer,
    };

    // Act
    const result = await uploadInvestorAvatarPipeline(
      "user_sofia_martinez",
      dummyFile as unknown as File,
      mockUploader
    );

    // Assert
    expect(result.success).toBe(true);
    expect(result.url).toBe("https://public.blob.vercel-storage.com/avatars/user_sofia_martinez-12345.png");
    expect(mockUploader.put).toHaveBeenCalledWith(
      expect.stringContaining("avatars/user_sofia_martinez"),
      expect.any(Object),
      expect.objectContaining({ access: "public" })
    );
  });

  it("should reject non-image file uploads", async () => {
    // Arrange
    const mockUploader: VercelBlobUploader = {
      put: vi.fn(),
    };

    const dummyFile = {
      name: "document.pdf",
      type: "application/pdf",
      size: 1024,
      arrayBuffer: async () => Buffer.from("pdf-bytes").buffer,
    };

    // Act
    const result = await uploadInvestorAvatarPipeline(
      "user_sofia_martinez",
      dummyFile as unknown as File,
      mockUploader
    );

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/solo se permiten imágenes/i);
    expect(mockUploader.put).not.toHaveBeenCalled();
  });
});
