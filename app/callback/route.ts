import { NextRequest, NextResponse } from "next/server";
import { handleAuth } from "@workos-inc/authkit-nextjs";

import { ensureFederatedAccount } from "@/lib/accounts/repository";
import { applyFederatedEmailPrefill } from "@/lib/compliance/profile-repository";
import { isWorkosConfigured } from "@/lib/workos/config";

const authHandler = handleAuth({
  returnPathname: "/profile",
  onSuccess: async ({ user }) => {
    const account = await ensureFederatedAccount({
      workosUserId: user.id,
      email: user.email,
      emailVerified: user.emailVerified
    });

    const primaryWalletPublicKey = account.account.primaryWalletPublicKey;
    if (primaryWalletPublicKey) {
      await applyFederatedEmailPrefill({
        walletPublicKey: primaryWalletPublicKey,
        email: user.email
      });
    }
  }
});

export async function GET(request: NextRequest): Promise<Response> {
  if (!isWorkosConfigured()) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return authHandler(request);
}
