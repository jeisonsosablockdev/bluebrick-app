import { redirect } from "next/navigation";

import { ProfileKycModule } from "@/components/dashboard/profile-kyc-module";
import { getAuthenticatedPublicKeyFromCookies } from "@/lib/auth";

function truncatePublicKey(publicKey: string): string {
  return `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
}

export default async function PerfilPage() {
  const authenticatedPublicKey = await getAuthenticatedPublicKeyFromCookies();

  if (!authenticatedPublicKey) {
    redirect("/");
  }

  return <ProfileKycModule wallet={truncatePublicKey(authenticatedPublicKey)} />;
}
