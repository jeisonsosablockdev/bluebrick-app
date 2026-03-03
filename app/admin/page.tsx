import { Card } from "@/components/ui/card";
import { ForbiddenView } from "@/components/forbidden-view";
import { getAuthenticatedPublicKeyFromCookies } from "@/lib/auth";
import { getRoleForWallet } from "@/lib/rbac";

function truncatePublicKey(publicKey: string): string {
  return `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
}

export default async function AdminPage() {
  const pubkey = await getAuthenticatedPublicKeyFromCookies();

  if (!pubkey || getRoleForWallet(pubkey) !== "admin") {
    return <ForbiddenView description="This section is reserved for administrator wallets." />;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <Card className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Admin Area</p>
        <h1 className="text-2xl font-semibold text-white">Admin Dashboard (WIP)</h1>
        <p className="text-sm text-white/80">Wallet {truncatePublicKey(pubkey)} is allowlisted as admin.</p>
      </Card>
    </main>
  );
}
