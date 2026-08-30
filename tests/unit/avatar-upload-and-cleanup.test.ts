/**
 * @file tests/unit/avatar-upload-and-cleanup.test.ts
 * @description Comprehensive TDD Unit & Integration Test Suite for BBC-11
 * (User Avatar Upload, Vercel Blob Lifecycle & Obsolete Blob Cleanup).
 * @spec BBC-11
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  uploadInvestorAvatarPipeline,
  isVercelBlobUrl,
  type UploadAvatarOptions,
} from "@/lib/pipelines/blob-storage-pipeline";
import {
  VercelBlobClient,
  type VercelBlobUploader,
} from "@/lib/infrastructure/blob/vercel-blob-client";
import { UserRepository } from "@/lib/infrastructure/db/repositories/user-repository";
import type { DatabaseExecutor } from "@/lib/infrastructure/db/neon-client";
import * as vercelBlobSdk from "@vercel/blob";

// Mock @vercel/blob SDK functions
vi.mock("@vercel/blob", () => ({
  put: vi.fn(),
  del: vi.fn(),
}));

describe("BBC-11: User Avatar Upload and Old Blob Cleanup Pipeline (@spec BBC-11)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Domain Helper: isVercelBlobUrl (@spec BBC-11-DOMAIN-HELPER)", () => {
    it("should return true for valid Vercel Blob storage URLs", () => {
      // Arrange & Act & Assert
      expect(isVercelBlobUrl("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/avatars/user_1-171000.png")).toBe(true);
      expect(isVercelBlobUrl("https://public.blob.vercel-storage.com/avatars/user_2.jpg")).toBe(true);
      expect(isVercelBlobUrl("https://blob.vercel-storage.com/avatars/avatar.webp")).toBe(true);
    });

    it("should return false for third-party OAuth, null, empty or invalid URLs", () => {
      // Arrange & Act & Assert
      expect(isVercelBlobUrl(null)).toBe(false);
      expect(isVercelBlobUrl(undefined)).toBe(false);
      expect(isVercelBlobUrl("")).toBe(false);
      expect(isVercelBlobUrl("https://lh3.googleusercontent.com/a/ACg8ocI123")).toBe(false);
      expect(isVercelBlobUrl("https://avatars.githubusercontent.com/u/123456")).toBe(false);
      expect(isVercelBlobUrl("https://my-custom-s3.amazonaws.com/image.png")).toBe(false);
    });
  });

  describe("2. Layer 4 Infrastructure: VercelBlobClient Adapter (@spec BBC-11-INFRA-BLOB)", () => {
    it("should call @vercel/blob put() with pathname, body, and options", async () => {
      // Arrange
      const mockPutResult: vercelBlobSdk.PutBlobResult = {
        url: "https://public.blob.vercel-storage.com/avatars/user_1.png",
        downloadUrl: "https://public.blob.vercel-storage.com/avatars/user_1.png?download=1",
        pathname: "avatars/user_1.png",
        contentType: "image/png",
        contentDisposition: "inline",
        etag: "etag_123",
      };
      vi.mocked(vercelBlobSdk.put).mockResolvedValue(mockPutResult);

      const client = new VercelBlobClient();
      const buffer = new ArrayBuffer(8);

      // Act
      const result = await client.put("avatars/user_1.png", buffer, {
        access: "public",
        contentType: "image/png",
      });

      // Assert
      expect(vercelBlobSdk.put).toHaveBeenCalledWith(
        "avatars/user_1.png",
        buffer,
        { access: "public", contentType: "image/png" }
      );
      expect(result.url).toBe(mockPutResult.url);
    });

    it("should call @vercel/blob del() with single or multiple URLs", async () => {
      // Arrange
      vi.mocked(vercelBlobSdk.del).mockResolvedValue(undefined);
      const client = new VercelBlobClient();
      const targetUrl = "https://public.blob.vercel-storage.com/avatars/old_avatar.png";

      // Act
      await client.del(targetUrl);

      // Assert
      expect(vercelBlobSdk.del).toHaveBeenCalledWith(targetUrl);
    });
  });

  describe("3. Layer 4 Infrastructure: UserRepository.updateAvatarUrl (@spec BBC-11-INFRA-DB)", () => {
    it("should execute parameterized UPDATE query to persist avatar_url", async () => {
      // Arrange
      const mockDb: DatabaseExecutor = {
        query: vi.fn().mockResolvedValue({
          rows: [
            {
              id: "user_sofia_martinez",
              email: "sofia@bluebrick.investments",
              first_name: "Sofía",
              last_name: "Martínez",
              avatar_url: "https://public.blob.vercel-storage.com/avatars/new_sofia.png",
              tier: "Inversionista Privado",
              created_at: new Date("2021-01-01"),
              updated_at: new Date(),
            },
          ],
        }),
      };

      const userRepo = new UserRepository(mockDb);

      // Act
      const user = await userRepo.updateAvatarUrl(
        "user_sofia_martinez",
        "https://public.blob.vercel-storage.com/avatars/new_sofia.png"
      );

      // Assert
      expect(mockDb.query).toHaveBeenCalledTimes(1);
      const [sql, params] = vi.mocked(mockDb.query).mock.calls[0];
      expect(sql).toContain("UPDATE users");
      expect(sql).toContain("avatar_url = $2");
      expect(params).toEqual([
        "user_sofia_martinez",
        "https://public.blob.vercel-storage.com/avatars/new_sofia.png",
      ]);
      expect(user).not.toBeNull();
      expect(user?.avatarUrl).toBe("https://public.blob.vercel-storage.com/avatars/new_sofia.png");
    });

    it("should return null if user does not exist in database", async () => {
      // Arrange
      const mockDb: DatabaseExecutor = {
        query: vi.fn().mockResolvedValue({ rows: [] }),
      };
      const userRepo = new UserRepository(mockDb);

      // Act
      const result = await userRepo.updateAvatarUrl("non_existent_user", "https://avatar.png");

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("4. Layer 3 Domain Pipeline: uploadInvestorAvatarPipeline (@spec BBC-11-PIPELINE)", () => {
    let mockUploader: VercelBlobUploader;
    let mockUserRepo: UserRepository;

    beforeEach(() => {
      mockUploader = {
        put: vi.fn().mockResolvedValue({
          url: "https://public.blob.vercel-storage.com/avatars/user_sofia-171000.png",
          downloadUrl: "https://public.blob.vercel-storage.com/avatars/user_sofia-171000.png?download=1",
          pathname: "avatars/user_sofia-171000.png",
          contentType: "image/png",
          contentDisposition: "inline",
          etag: "etag_123",
        }),
        del: vi.fn().mockResolvedValue(undefined),
      };

      const mockDb: DatabaseExecutor = {
        query: vi.fn().mockResolvedValue({
          rows: [
            {
              id: "user_sofia",
              email: "sofia@bluebrick.investments",
              first_name: "Sofía",
              last_name: "Martínez",
              avatar_url: "https://public.blob.vercel-storage.com/avatars/user_sofia-171000.png",
              tier: "Inversionista Privado",
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        }),
      };
      mockUserRepo = new UserRepository(mockDb);
    });

    it("should reject invalid file types (e.g. text/plain, application/pdf)", async () => {
      // Arrange
      const invalidFile = new File(["dummy content"], "document.pdf", { type: "application/pdf" });

      // Act
      const result = await uploadInvestorAvatarPipeline("user_sofia", invalidFile, {}, mockUploader, mockUserRepo);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("Formato no válido");
      expect(mockUploader.put).not.toHaveBeenCalled();
    });

    it("should reject files exceeding 5 MB limit", async () => {
      // Arrange: Create a mock 6 MB file
      const largeContent = new Uint8Array(6 * 1024 * 1024);
      const oversizedFile = new File([largeContent], "huge.png", { type: "image/png" });

      // Act
      const result = await uploadInvestorAvatarPipeline("user_sofia", oversizedFile, {}, mockUploader, mockUserRepo);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("5 MB");
      expect(mockUploader.put).not.toHaveBeenCalled();
    });

    it("should successfully upload valid image and update user repository", async () => {
      // Arrange
      const validFile = new File(["valid image content"], "avatar.png", { type: "image/png" });

      // Act
      const result = await uploadInvestorAvatarPipeline(
        "user_sofia",
        validFile,
        {},
        mockUploader,
        mockUserRepo
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.url).toBe("https://public.blob.vercel-storage.com/avatars/user_sofia-171000.png");
      expect(mockUploader.put).toHaveBeenCalledTimes(1);
    });

    it("should automatically delete old avatar blob when oldAvatarUrl is from Vercel Blob (@spec BBC-11-CLEANUP)", async () => {
      // Arrange
      const validFile = new File(["new photo"], "new_avatar.jpg", { type: "image/jpeg" });
      const oldVercelBlobUrl = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/avatars/user_sofia-old.jpg";

      const options: UploadAvatarOptions = {
        oldAvatarUrl: oldVercelBlobUrl,
      };

      // Act
      const result = await uploadInvestorAvatarPipeline(
        "user_sofia",
        validFile,
        options,
        mockUploader,
        mockUserRepo
      );

      // Assert
      expect(result.success).toBe(true);
      expect(mockUploader.put).toHaveBeenCalledTimes(1);
      expect(mockUploader.del).toHaveBeenCalledTimes(1);
      expect(mockUploader.del).toHaveBeenCalledWith(oldVercelBlobUrl);
    });

    it("should NOT delete old avatar if oldAvatarUrl is from external OAuth provider (@spec BBC-11-EXTERNAL-IGNORE)", async () => {
      // Arrange
      const validFile = new File(["new photo"], "new_avatar.jpg", { type: "image/jpeg" });
      const externalGoogleAvatarUrl = "https://lh3.googleusercontent.com/a/ACg8ocI123456=s96-c";

      const options: UploadAvatarOptions = {
        oldAvatarUrl: externalGoogleAvatarUrl,
      };

      // Act
      const result = await uploadInvestorAvatarPipeline(
        "user_sofia",
        validFile,
        options,
        mockUploader,
        mockUserRepo
      );

      // Assert
      expect(result.success).toBe(true);
      expect(mockUploader.put).toHaveBeenCalledTimes(1);
      expect(mockUploader.del).not.toHaveBeenCalled();
    });

    it("should complete upload successfully even if deleting old blob throws an error (@spec BBC-11-RESILIENCE)", async () => {
      // Arrange
      const validFile = new File(["new photo"], "new_avatar.jpg", { type: "image/jpeg" });
      const oldVercelBlobUrl = "https://public.blob.vercel-storage.com/avatars/already-deleted.jpg";

      vi.mocked(mockUploader.del).mockRejectedValue(new Error("Blob not found"));

      const options: UploadAvatarOptions = {
        oldAvatarUrl: oldVercelBlobUrl,
      };

      // Act
      const result = await uploadInvestorAvatarPipeline(
        "user_sofia",
        validFile,
        options,
        mockUploader,
        mockUserRepo
      );

      // Assert: The new upload succeeded despite non-fatal cleanup failure
      expect(result.success).toBe(true);
      expect(result.url).toBe("https://public.blob.vercel-storage.com/avatars/user_sofia-171000.png");
    });
  });
});
