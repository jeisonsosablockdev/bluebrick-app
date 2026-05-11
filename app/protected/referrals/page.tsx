import { redirect } from "next/navigation";

import { ReferralProgramModule } from "@/components/dashboard/referral-program-module";
import { getAuthenticatedPublicKeyFromCookies } from "@/lib/auth";

export default async function ReferralsPage() {
  const authenticatedPublicKey = await getAuthenticatedPublicKeyFromCookies();

  if (!authenticatedPublicKey) {
    redirect("/protected");
  }

  return <ReferralProgramModule />;
}
