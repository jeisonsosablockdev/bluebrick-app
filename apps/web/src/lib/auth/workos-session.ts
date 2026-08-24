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
 * Checks if WorkOS credentials are fully configured in the environment.
 */
function isWorkOsEnvironmentReady(): boolean {
  return Boolean(
    process.env.WORKOS_COOKIE_PASSWORD &&
    process.env.WORKOS_API_KEY &&
    process.env.WORKOS_CLIENT_ID
  );
}

/**
 * Retrieves the currently authenticated investor session, synchronizing JIT to database.
 * If WorkOS environment variables are not yet provided, gracefully returns the demo investor.
 */
export async function getAuthenticatedInvestor(
  userRepo: UserRepository = new UserRepository()
): Promise<DbUser> {
  // Step 1: Guard against missing WorkOS credentials in local development or demo mode
  if (!isWorkOsEnvironmentReady()) {
    return DEFAULT_DEMO_INVESTOR;
  }

  try {
    // Step 2: Query WorkOS session from Next.js request context
    const auth = await withAuth();

    if (auth?.user) {
      // Step 3: Synchronize WorkOS claims to Neon PostgreSQL
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

  // Step 4: Return default demo investor
  return DEFAULT_DEMO_INVESTOR;
}

export { getSignInUrl, getSignUpUrl, signOut };
