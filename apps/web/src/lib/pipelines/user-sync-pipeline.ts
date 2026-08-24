/**
 * @file apps/web/src/lib/pipelines/user-sync-pipeline.ts
 * @description Layer 3: Domain / Pipelines - Just-In-Time (JIT) user profile synchronization pipeline.
 * Synchronizes WorkOS authenticated identity claims into Neon PostgreSQL database.
 */

import { UserRepository } from "@/lib/infrastructure/db/repositories/user-repository";
import type { DbUser } from "@/lib/types/db";

export interface WorkOsUserPayload {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profilePictureUrl?: string | null;
}

/**
 * Synchronizes WorkOS user claims into the local Neon PostgreSQL database.
 *
 * @param payload - Authenticated user payload from WorkOS.
 * @param repo - Database user persistence repository instance.
 * @returns Synchronized database investor record.
 */
export async function syncWorkOsUserPipeline(
  payload: WorkOsUserPayload,
  repo: UserRepository = new UserRepository()
): Promise<DbUser> {
  // Step 1: Normalize user name and avatar claims with sensible fallbacks
  const firstName = payload.firstName?.trim() || "Inversionista";
  const lastName = payload.lastName?.trim() || "BlueBrick";
  const avatarUrl = payload.profilePictureUrl || null;

  // Step 2: Persist user into Neon PostgreSQL via UPSERT
  return repo.upsertUser({
    id: payload.id,
    email: payload.email,
    firstName,
    lastName,
    avatarUrl,
    tier: "Inversionista Privada",
  });
}
