import { redirect } from "next/navigation";
import { RouteTransition } from "@/components/motion/route-transition";
import { AuthLinkStatusBanner } from "@/components/dashboard/auth-link-status-banner";
import { AccountProfileSupportModule, ProfileKycModule } from "@/features/profile";
import { parseAuthLinkStatus } from "@/lib/auth-link-status";
import { resolveAppAuthContext } from "@/lib/app-auth";

type PerfilPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PerfilPage(props: PerfilPageProps) {
  const auth = await resolveAppAuthContext();
  const resolvedSearchParams = props.searchParams ? await props.searchParams : undefined;
  const authLinkStatusParam = resolvedSearchParams?.authLinkStatus;
  const authLinkStatus = parseAuthLinkStatus(typeof authLinkStatusParam === "string" ? authLinkStatusParam : null);

  if (!auth.accountAuthenticated) {
    redirect("/");
  }

  if (!auth.walletAuthenticated || !auth.walletPublicKey) {
    return (
      <RouteTransition className="space-y-4" routeKey={`account:${authLinkStatus ?? "none"}`}>
        <AuthLinkStatusBanner status={authLinkStatus} />
        <AccountProfileSupportModule email={auth.workosEmail} />
      </RouteTransition>
    );
  }

  return (
    <RouteTransition className="space-y-4" routeKey={`wallet:${auth.walletPublicKey}:${authLinkStatus ?? "none"}`}>
      <AuthLinkStatusBanner status={authLinkStatus} />
      <ProfileKycModule walletPublicKey={auth.walletPublicKey} />
    </RouteTransition>
  );
}
