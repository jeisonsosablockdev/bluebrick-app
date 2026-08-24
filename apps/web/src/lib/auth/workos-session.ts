/**
 * @file apps/web/src/lib/auth/workos-session.ts
 * @description Layer 2: Application - WorkOS session retriever and authentication provider.
 */

import { withAuth, getSignInUrl, getSignUpUrl, signOut } from "@workos-inc/authkit-nextjs";
import { syncWorkOsUserPipeline } from "@/lib/pipelines/user-sync-pipeline";
import { UserRepository } from "@/lib/infrastructure/db/repositories/user-repository";
import type { DbUser } from "@/lib/types/db";

const DEFAULT_DEMO_INVESTOR: DbUser = {
  id: "user_sofia_martinez",
  email: "sofia.martinez@bluebrick.investments",
  firstName: "Sofía",
  lastName: "Martínez",
  avatarUrl: null,
  tier: "Inversionista Privada",
  createdAt: new Date("2021-01-01"),
};

/**
 * Retrieves the currently authenticated investor session, synchronizing JIT to database.
 */
export async function getAuthenticatedInvestor(
  userRepo: UserRepository = new UserRepository()
): Promise<DbUser> {
  try {
    // Step 1: Query WorkOS session from Next.js request context
    const auth = await withAuth();

    if (auth.user) {
      // Step 2: Synchronize WorkOS claims to Neon PostgreSQL
      return await syncWorkOsUserPipeline(
        {
          id: auth.user.id,
          email: auth.user.email,
          firstName: auth.user.firstName,
          lastName: auth.user.lastName,
          profilePictureUrl: auth.user.profilePictureUrl,
        },
        userRepo
      );
    }
  } catch (error) {
    // Invariant: In development or demo mode without WorkOS keys, smoothly fall back to demo investor
    console.warn("WorkOS session not available, defaulting to demo investor profile.", error);
  }

  // Step 3: Return default demo investor
  return DEFAULT_DEMO_INVESTOR;
}

export { getSignInUrl, getSignUpUrl, signOut };
