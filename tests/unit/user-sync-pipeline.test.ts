/**
 * @file tests/unit/user-sync-pipeline.test.ts
 * @description Layer 3 & QA: Behavioral Unit Test Suite for WorkOS JIT User Synchronization Pipeline.
 * @spec BBC-6-SPEC-4
 */

import { describe, it, expect, vi } from "vitest";
import { syncWorkOsUserPipeline } from "@/lib/pipelines/user-sync-pipeline";
import type { UserRepository } from "@/lib/infrastructure/db/repositories/user-repository";

describe("SPEC-4: WorkOS User Sync Pipeline (@spec BBC-6-SPEC-4)", () => {
  it("should synchronize a WorkOS user payload into Neon PostgreSQL", async () => {
    // Arrange
    const mockUserPayload = {
      id: "user_01HXYZ123456789",
      email: "sofia.martinez@bluebrick.investments",
      firstName: "Sofía",
      lastName: "Martínez",
      profilePictureUrl: "https://workos.img/avatar.png",
    };

    const mockUpsertUser = vi.fn().mockResolvedValue({
      id: "user_01HXYZ123456789",
      email: "sofia.martinez@bluebrick.investments",
      firstName: "Sofía",
      lastName: "Martínez",
      avatarUrl: "https://workos.img/avatar.png",
      tier: "Inversionista Privado",
      createdAt: new Date(),
    });

    const mockRepo = {
      upsertUser: mockUpsertUser,
    } as unknown as UserRepository;

    // Act
    const syncedInvestor = await syncWorkOsUserPipeline(mockUserPayload, mockRepo);

    // Assert
    expect(syncedInvestor.id).toBe("user_01HXYZ123456789");
    expect(syncedInvestor.firstName).toBe("Sofía");
    expect(mockUpsertUser).toHaveBeenCalledWith({
      id: "user_01HXYZ123456789",
      email: "sofia.martinez@bluebrick.investments",
      firstName: "Sofía",
      lastName: "Martínez",
      avatarUrl: "https://workos.img/avatar.png",
      tier: "Inversionista Privado",
    });
  });

  it("should provide fallback default values for missing names", async () => {
    // Arrange
    const mockUserPayload = {
      id: "user_anonymous_999",
      email: "investor@example.com",
    };

    const mockUpsertUser = vi.fn().mockResolvedValue({
      id: "user_anonymous_999",
      email: "investor@example.com",
      firstName: "Inversionista",
      lastName: "BlueBrick",
      avatarUrl: null,
      tier: "Inversionista Privado",
      createdAt: new Date(),
    });

    const mockRepo = {
      upsertUser: mockUpsertUser,
    } as unknown as UserRepository;

    // Act
    const syncedInvestor = await syncWorkOsUserPipeline(mockUserPayload, mockRepo);

    // Assert
    expect(mockUpsertUser).toHaveBeenCalledWith({
      id: "user_anonymous_999",
      email: "investor@example.com",
      firstName: "Inversionista",
      lastName: "BlueBrick",
      avatarUrl: null,
      tier: "Inversionista Privado",
    });
    expect(syncedInvestor.firstName).toBe("Inversionista");
  });
});
