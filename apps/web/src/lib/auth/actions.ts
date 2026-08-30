/**
 * @file apps/web/src/lib/auth/actions.ts
 * @description Layer 2: Application - Server actions for WorkOS AuthKit authentication flows.
 * Handles server-side PKCE state generation for universal email login and session termination.
 */

"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSignInUrl } from "@workos-inc/authkit-nextjs";

/**
 * Initiates universal email / passwordless / SSO sign-in flow via WorkOS AuthKit.
 * Supports any email provider (Gmail, Outlook, corporate domains, SSO).
 */
export async function signInWithEmailAction(): Promise<void> {
  let authorizationUrl: string | null = null;

  try {
    // Step 1: Request PKCE-sealed universal AuthKit authorization URL
    authorizationUrl = await getSignInUrl();
  } catch (error) {
    console.warn("WorkOS universal sign-in redirect fallback:", error);
    redirect("/dashboard");
  }

  // Step 2: Redirect user directly to WorkOS universal authentication hosted UI
  if (authorizationUrl) {
    redirect(authorizationUrl);
  }

  redirect("/dashboard");
}

/**
 * Server action for terminating authenticated investor session.
 * Reliably removes WorkOS session and PKCE cookies locally and redirects back to the landing page.
 */
export async function signOutAction(): Promise<void> {
  // Step 1: Access Next.js cookies store
  const cookieStore = await cookies();

  // Step 2: Delete session cookie and any auth-related cookies
  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    if (
      cookie.name === "wos-session" ||
      cookie.name === "workos-access-token" ||
      cookie.name.startsWith("wos-pkce") ||
      cookie.name.includes("workos")
    ) {
      cookieStore.delete(cookie.name);
    }
  }
  cookieStore.delete("wos-session");
  cookieStore.delete("workos-access-token");

  // Step 3: Redirect user cleanly back to landing page
  redirect("/");
}
