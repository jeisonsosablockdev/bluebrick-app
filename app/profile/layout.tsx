import type { ReactNode } from "react";
import { ProtectedShell } from "@/components/dashboard/protected-shell";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedShell
      authenticatedPublicKey="SQDS426qUB5hZahVkWgwySsLqyZaKnpBxZBP5tWYW45"
      authenticatedRole="user"
      accountAuthenticated={true}
      walletAuthenticated={true}
      federatedEmail="investor@brids.io"
    >
      {children}
    </ProtectedShell>
  );
}
