import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ForbiddenView } from "@/components/forbidden-view";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAuthenticatedPublicKeyFromCookies } from "@/lib/auth";
import { getServerLocale } from "@/lib/i18n-server";
import { localize } from "@/lib/i18n";
import { getRoleForWallet } from "@/lib/rbac";
import { createPageMetadata } from "@/lib/seo";

type AdminLayoutProps = {
  children: ReactNode;
};

export const metadata: Metadata = createPageMetadata({
  title: "Admin",
  description: "Restricted operations console for administrator wallets.",
  path: "/admin",
  section: "admin",
  explicitNoIndex: true
});

function truncatePublicKey(publicKey: string): string {
  return `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const locale = await getServerLocale();
  const pubkey = await getAuthenticatedPublicKeyFromCookies();

  if (!pubkey || getRoleForWallet(pubkey) !== "admin") {
    return (
      <ForbiddenView
        description={localize(locale, {
          en: "This section is reserved for administrator wallets.",
          es: "Esta seccion esta reservada para wallets administradoras.",
          pt: "Esta secao e reservada para wallets administradoras."
        })}
      />
    );
  }

  return (
    <AdminShell
      authenticatedPublicKey={pubkey}
      walletLabel={`${localize(locale, { en: "Admin", es: "Admin", pt: "Admin" })} ${truncatePublicKey(pubkey)}`}
    >
      {children}
    </AdminShell>
  );
}
