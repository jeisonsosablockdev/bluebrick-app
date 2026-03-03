import Link from "next/link";
import { redirect } from "next/navigation";

import { Card } from "@/components/ui/card";
import { getAuthenticatedPublicKeyFromCookies } from "@/lib/auth";

function truncatePublicKey(publicKey: string): string {
  return `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
}

export default async function ProtectedPage() {
  const authenticatedPublicKey = await getAuthenticatedPublicKeyFromCookies();

  if (!authenticatedPublicKey) {
    redirect("/");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <Card className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Authenticated Route</p>
        <h1 className="text-2xl font-semibold text-white">Protected Area</h1>
        <p className="text-sm text-white/80">Session verified server-side for wallet {truncatePublicKey(authenticatedPublicKey)}.</p>
        <Link href="/" className="text-sm text-cyan-300 hover:text-cyan-200">
          Return to home
        </Link>
      </Card>
    </main>
  );
}

