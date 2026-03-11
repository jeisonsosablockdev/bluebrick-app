import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { ProtectedShell } from "@/components/dashboard/protected-shell";
import { getAuthenticatedPublicKeyFromCookies } from "@/lib/auth";

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const authenticatedPublicKey = await getAuthenticatedPublicKeyFromCookies();

  if (!authenticatedPublicKey) {
    redirect("/");
  }

  return <ProtectedShell authenticatedPublicKey={authenticatedPublicKey}>{children}</ProtectedShell>;
}
