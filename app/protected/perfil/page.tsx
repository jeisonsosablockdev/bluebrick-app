import { redirect } from "next/navigation";

import { AuthLinkStatusBanner } from "@/components/dashboard/auth-link-status-banner";
import { AccountProfileSupportModule } from "@/components/dashboard/account-profile-support-module";
import { ProfileKycModule } from "@/components/dashboard/profile-kyc-module";
import { resolveAppAuthContext } from "@/lib/app-auth";

type PerfilPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PerfilPage(props: PerfilPageProps) {
  const auth = await resolveAppAuthContext();
  const resolvedSearchParams = props?.searchParams ? await props.searchParams : undefined;
  const authLinkStatusParam = resolvedSearchParams?.authLinkStatus;
  const authLinkStatus = typeof authLinkStatusParam === "string" ? authLinkStatusParam : null;

  if (!auth.accountAuthenticated) {
    redirect("/");
  }

  if (!auth.walletAuthenticated || !auth.walletPublicKey) {
    return (
      <div className="space-y-4">
        <AuthLinkStatusBanner status={authLinkStatus} />
        <AccountProfileSupportModule email={auth.workosEmail} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AuthLinkStatusBanner status={authLinkStatus} />
      <ProfileKycModule walletPublicKey={auth.walletPublicKey} />
    </div>
  );
}
