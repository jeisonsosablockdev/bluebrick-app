import { redirect } from "next/navigation";

import { ProfileKycModule } from "@/components/dashboard/profile-kyc-module";
import { getAuthenticatedPublicKeyFromCookies } from "@/lib/auth";

export default async function PerfilPage() {
  const authenticatedPublicKey = await getAuthenticatedPublicKeyFromCookies();

  if (!authenticatedPublicKey) {
    redirect("/");
  }

  return <ProfileKycModule walletPublicKey={authenticatedPublicKey} />;
}
