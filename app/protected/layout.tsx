import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ProtectedShell } from "@/components/dashboard/protected-shell";
import { getAuthenticatedPublicKeyFromCookies } from "@/lib/auth";
import { getRoleForWallet } from "@/lib/rbac";
import { createPageMetadata } from "@/lib/seo";

type ProtectedLayoutProps = {
  children: ReactNode;
};

export const metadata: Metadata = createPageMetadata({
  title: "Protected Area",
  description: "User dashboard and portfolio area restricted to authenticated wallets.",
  path: "/protected",
  section: "protected",
  explicitNoIndex: true
});

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const authenticatedPublicKey = await getAuthenticatedPublicKeyFromCookies();

  if (!authenticatedPublicKey) {
    redirect("/");
  }

  return (
    <ProtectedShell authenticatedPublicKey={authenticatedPublicKey} authenticatedRole={getRoleForWallet(authenticatedPublicKey)}>
      {children}
    </ProtectedShell>
  );
}
