import type { ReactNode } from "react";

import { ForbiddenView } from "@/components/forbidden-view";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAuthenticatedPublicKeyFromCookies } from "@/lib/auth";
import { getRoleForWallet } from "@/lib/rbac";

type AdminLayoutProps = {
  children: ReactNode;
};

function truncatePublicKey(publicKey: string): string {
  return `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const pubkey = await getAuthenticatedPublicKeyFromCookies();

  if (!pubkey || getRoleForWallet(pubkey) !== "admin") {
    return <ForbiddenView description="This section is reserved for administrator wallets." />;
  }

  return <AdminShell walletLabel={`Admin ${truncatePublicKey(pubkey)}`}>{children}</AdminShell>;
}
