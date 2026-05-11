import type { Metadata } from "next";

import { WalletModal } from "@/components/WalletModal";
import { TransparencyContent } from "@/app/transparencia/client";
import { getAuthenticatedPublicKeyFromCookies } from "@/lib/auth";
import { getRoleForWallet } from "@/lib/rbac";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Transparencia",
  description: "Transparency dashboard with verifiable public platform metrics.",
  path: "/transparencia",
  section: "transparency"
});

export default async function TransparencyPage() {
  const authenticatedPublicKey = await getAuthenticatedPublicKeyFromCookies();

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8 pb-0 md:pb-0">
        <WalletModal
          initialAuth={{
            authenticated: Boolean(authenticatedPublicKey),
            pubkey: authenticatedPublicKey,
            role: authenticatedPublicKey ? getRoleForWallet(authenticatedPublicKey) : undefined
          }}
        />
      </div>
      <TransparencyContent />
    </>
  );
}
