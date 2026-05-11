import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ProtectedShell } from "@/components/dashboard/protected-shell";
import { resolveAppAuthContext } from "@/lib/app-auth";
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
  const auth = await resolveAppAuthContext();

  if (!auth.accountAuthenticated) {
    redirect("/");
  }

  return (
    <ProtectedShell
      authenticatedPublicKey={auth.walletPublicKey}
      authenticatedRole={auth.role}
      accountAuthenticated={auth.accountAuthenticated}
      federatedEmail={auth.workosEmail}
      walletAuthenticated={auth.walletAuthenticated}
    >
      {children}
    </ProtectedShell>
  );
}
