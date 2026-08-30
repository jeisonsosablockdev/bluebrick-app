/**
 * @file apps/web/src/app/auth/logout/route.ts
 * @description Layer 2: Application - WorkOS AuthKit Sign-out Route Handler.
 * Clears session cookies locally and redirects back to the landing page.
 */

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function GET(): Promise<void> {
  // Step 1: Access Next.js cookie store
  const cookieStore = await cookies();

  // Step 2: Delete session and auth-related cookies
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

  // Step 3: Redirect to home page
  redirect("/");
}
