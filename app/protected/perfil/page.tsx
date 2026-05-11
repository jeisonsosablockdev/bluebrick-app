import { redirect } from "next/navigation";

import { AccountProfileSupportModule } from "@/components/dashboard/account-profile-support-module";
import { ProfileKycModule } from "@/components/dashboard/profile-kyc-module";
import { resolveAppAuthContext } from "@/lib/app-auth";

export default async function PerfilPage() {
  const auth = await resolveAppAuthContext();

  if (!auth.accountAuthenticated) {
    redirect("/");
  }

  if (!auth.walletAuthenticated || !auth.walletPublicKey) {
    return <AccountProfileSupportModule email={auth.workosEmail} />;
  }

  return <ProfileKycModule walletPublicKey={auth.walletPublicKey} />;
}
