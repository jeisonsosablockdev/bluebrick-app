import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ProtectedShell } from "@/features/profile/presentation/protected-shell";
import { WalletRuntimeProvider } from "@/components/wallet/wallet-runtime-provider";
import { resolveAppAuthContext } from "@/lib/app-auth";
import { createPageMetadata } from "@/lib/seo";

type ProfileLayoutProps = {
  children: ReactNode;
};

export const metadata: Metadata = createPageMetadata({
  title: "Protected Area",
  description: "User dashboard and portfolio area restricted to authenticated wallets.",
  path: "/profile",
  section: "profile",
  explicitNoIndex: true
});

export default async function ProfileLayout({ children }: ProfileLayoutProps) {
  const auth = await resolveAppAuthContext();

  if (!auth.accountAuthenticated) {
    redirect("/");
  }

  return (
    <WalletRuntimeProvider>
      <ProtectedShell
        authenticatedPublicKey={auth.walletPublicKey}
        authenticatedRole={auth.role}
        accountAuthenticated={auth.accountAuthenticated}
        federatedEmail={auth.workosEmail}
        walletAuthenticated={auth.walletAuthenticated}
      >
        {children}
      </ProtectedShell>
    </WalletRuntimeProvider>
  );
}
